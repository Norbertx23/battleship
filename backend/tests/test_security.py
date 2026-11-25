import asyncio

from fastapi.testclient import TestClient

import api
from helpers import create_room, events
import room_state
import settings
import sockets
import validation


def test_socket_przyjmuje_tylko_znane_originy():
    origins = sockets.sio.eio.cors_allowed_origins
    assert origins != '*'
    assert 'https://battleship.swistak.fun' in origins
    assert 'https://evil.example' not in origins


def test_lista_originow_z_zmiennej_srodowiskowej():
    assert settings.parse_origins('https://a.example, http://localhost:3000 ,') == ['https://a.example', 'http://localhost:3000']
    assert settings.parse_origins(None) == settings.DEFAULT_ORIGINS


def test_limit_rozmiaru_wiadomosci_socketu():
    assert sockets.sio.eio.max_http_buffer_size <= 64 * 1024


def test_dokumentacja_api_jest_wylaczona():
    client = TestClient(api.fastapi_app)
    for path in ('/docs', '/redoc', '/openapi.json'):
        assert client.get(path).status_code == 404


def test_zdarzenia_z_niepoprawnym_ladunkiem_nie_wywracaja_serwera(fake_sio):
    async def scenario():
        for handler in (sockets.create_room, sockets.join_room, sockets.place_ships, sockets.fire_shot, sockets.play_again, sockets.leave_room):
            await handler('x', 'nie-slownik')
            await handler('x', None)
        assert events(fake_sio, 'error', to='x')

    asyncio.run(scenario())


def test_kod_pokoju_innego_typu_niz_tekst_jest_odrzucany(fake_sio):
    async def scenario():
        await sockets.join_room('y', {'room_id': ['A'], 'nick': 'G'})
        assert events(fake_sio, 'error', to='y')[0]['data']['code'] == 'room_not_found_or_full'

    asyncio.run(scenario())


def test_kod_pokoju_innego_typu_w_pozostalych_zdarzeniach_nie_rzuca_wyjatku(fake_sio):
    async def scenario():
        for handler in (sockets.place_ships, sockets.fire_shot, sockets.play_again, sockets.leave_room):
            await handler('x', {'room_id': ['A'], 'x': 0, 'y': 0, 'ships': []})
            await handler('x', {'room_id': {'a': 1}})

    asyncio.run(scenario())


def test_nick_jest_normalizowany():
    assert validation.clean_nick('  Ala   ma\nkota ') == 'Ala ma kota'
    assert validation.clean_nick('ＡＢＣ') == 'ABC'


def test_nick_ze_znakami_sterujacymi_lub_niewidocznymi_jest_odrzucany():
    for bad in ('​', 'a​b', 'a‮b', 'a\x00b', '...', '   ', 'x' * 31, 'x' * 500, 123, None):
        assert validation.clean_nick(bad) is None, repr(bad)


def test_drugi_gracz_nie_moze_miec_tego_samego_nicka(fake_sio):
    async def scenario():
        room_id, _ = await create_room(fake_sio)
        await sockets.join_room('guest1', {'room_id': room_id, 'nick': ' host '})
        assert events(fake_sio, 'error', to='guest1')[0]['data']['code'] == 'nickname_taken'
        assert 'guest1' not in room_state.rooms[room_id]['players']

    asyncio.run(scenario())


def test_kody_pokoi_sa_unikalne_i_czytelne(monkeypatch):
    picks = iter('AAAAAA' + 'BBBBBB')
    monkeypatch.setattr(room_state.secrets, 'choice', lambda _: next(picks))
    room_state.rooms['AAAAAA'] = {}
    try:
        assert room_state.new_room_code() == 'BBBBBB'
    finally:
        room_state.rooms.pop('AAAAAA', None)
    assert not set('0O1I') & set(settings.ROOM_CODE_ALPHABET)


def test_dodatkowe_pola_statkow_nie_trafiaja_do_przeciwnika(fake_sio):
    async def scenario():
        room_id, _ = await create_room(fake_sio, cfg={'1': 1})
        await sockets.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        ship = {'size': 1, 'x': 0, 'y': 0, 'vertical': False, 'payload': '<img src=x onerror=alert(1)>'}
        await sockets.place_ships('host1', {'room_id': room_id, 'ships': [ship]})
        assert room_state.rooms[room_id]['boards']['host1'] == [{'size': 1, 'x': 0, 'y': 0, 'vertical': False}]

    asyncio.run(scenario())


def test_wyszukiwarka_traktuje_znaki_wieloznaczne_doslownie():
    assert validation.escape_like('50%_a\\') == '50\\%\\_a\\\\'
    client = TestClient(api.fastapi_app)
    assert client.get('/stats/recent-matches', params={'search': 'x' * 51}).status_code == 422


def test_statystyki_gracza_maja_limit_dlugosci_nicka():
    client = TestClient(api.fastapi_app)
    assert client.get('/stats/player/' + 'x' * 31).status_code == 422
