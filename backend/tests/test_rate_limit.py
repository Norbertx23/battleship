import asyncio

import pytest
from fastapi.testclient import TestClient

import main
from rate_limit import RateLimiter, client_ip
from test_reconnect import events, fake_sio  # noqa: F401


class FakeClock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def test_limiter_przepuszcza_do_limitu_i_blokuje_nadmiar():
    clock = FakeClock()
    limiter = RateLimiter(limit=3, window=60, clock=clock)
    assert [limiter.hit('a') for _ in range(4)] == [True, True, True, False]


def test_limiter_liczy_osobno_dla_kazdego_klucza():
    limiter = RateLimiter(limit=1, window=60, clock=FakeClock())
    assert limiter.hit('a') is True
    assert limiter.hit('b') is True
    assert limiter.hit('a') is False


def test_limiter_odblokowuje_po_uplywie_okna_i_podaje_czas_oczekiwania():
    clock = FakeClock()
    limiter = RateLimiter(limit=1, window=60, clock=clock)
    limiter.hit('a')
    assert limiter.hit('a') is False
    assert limiter.retry_after('a') == 60
    clock.now += 61
    assert limiter.hit('a') is True


def test_client_ip_preferuje_naglowek_cloudflare():
    assert client_ip({'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '5.6.7.8'}, '10.0.0.1') == '1.2.3.4'
    assert client_ip({'x-forwarded-for': '5.6.7.8, 10.0.0.2'}, '10.0.0.1') == '5.6.7.8'
    assert client_ip({}, '10.0.0.1') == '10.0.0.1'


@pytest.fixture
def fresh_limits():
    main.stats_limiter.reset()
    main.room_limiter.reset()
    yield
    main.stats_limiter.reset()
    main.room_limiter.reset()


def test_statystyki_po_przekroczeniu_limitu_zwracaja_429_z_kodem(fresh_limits):
    client = TestClient(main.fastapi_app)
    headers = {'cf-connecting-ip': '9.9.9.9'}
    for _ in range(main.STATS_LIMIT):
        assert client.get('/stats/top-players', headers=headers).status_code == 200
    res = client.get('/stats/top-players', headers=headers)
    assert res.status_code == 429
    assert res.json()['code'] == 'rate_limited'
    assert int(res.headers['retry-after']) > 0
    assert client.get('/stats/top-players', headers={'cf-connecting-ip': '8.8.8.8'}).status_code == 200


def test_healthz_nie_jest_limitowany(fresh_limits):
    client = TestClient(main.fastapi_app)
    for _ in range(main.STATS_LIMIT + 5):
        assert client.get('/healthz').status_code == 200


def test_zbyt_wiele_pokoi_z_jednego_ip_daje_kod_rate_limited(fake_sio, fresh_limits):
    async def scenario():
        for i in range(main.ROOM_LIMIT + 1):
            sid = f's{i}'
            await main.connect(sid, {'HTTP_CF_CONNECTING_IP': '7.7.7.7', 'REMOTE_ADDR': '10.0.0.1'})
            await main.create_room(sid, {'nick': 'Host', 'config': {'1': 1}})
        last = f's{main.ROOM_LIMIT}'
        err = events(fake_sio, 'error', to=last)
        assert err and err[0]['data']['code'] == 'rate_limited'
        assert len(events(fake_sio, 'session')) == main.ROOM_LIMIT

    asyncio.run(scenario())
