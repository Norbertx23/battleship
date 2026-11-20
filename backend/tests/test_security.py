import asyncio

from fastapi.testclient import TestClient

import main
from test_reconnect import events, fake_sio  # noqa: F401


def test_socket_przyjmuje_tylko_znane_originy():
    origins = main.sio.eio.cors_allowed_origins
    assert origins != '*'
    assert 'https://battleship.swistak.fun' in origins
    assert 'https://evil.example' not in origins


def test_lista_originow_z_zmiennej_srodowiskowej():
    assert main.parse_origins('https://a.example, http://localhost:3000 ,') == ['https://a.example', 'http://localhost:3000']
    assert main.parse_origins(None) == main.DEFAULT_ORIGINS


def test_limit_rozmiaru_wiadomosci_socketu():
    assert main.sio.eio.max_http_buffer_size <= 64 * 1024


def test_dokumentacja_api_jest_wylaczona():
    client = TestClient(main.fastapi_app)
    for path in ('/docs', '/redoc', '/openapi.json'):
        assert client.get(path).status_code == 404


def test_zdarzenia_z_niepoprawnym_ladunkiem_nie_wywracaja_serwera(fake_sio):
    async def scenario():
        for handler in (main.create_room, main.join_room, main.place_ships, main.fire_shot, main.play_again, main.leave_room):
            await handler('x', 'nie-slownik')
            await handler('x', None)
        assert events(fake_sio, 'error', to='x')

    asyncio.run(scenario())


def test_kod_pokoju_innego_typu_niz_tekst_jest_odrzucany(fake_sio):
    async def scenario():
        await main.join_room('y', {'room_id': ['A'], 'nick': 'G'})
        assert events(fake_sio, 'error', to='y')[0]['data']['code'] == 'room_not_found_or_full'

    asyncio.run(scenario())
