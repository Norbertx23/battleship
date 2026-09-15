import asyncio

import pytest

import main


@pytest.fixture(autouse=True)
def fake_sio(monkeypatch):
    sent = []

    async def emit(event, data=None, room=None, to=None, skip_sid=None):
        sent.append({'event': event, 'data': data, 'room': room, 'to': to})

    async def noop(*args, **kwargs):
        return None

    monkeypatch.setattr(main.sio, 'emit', emit)
    monkeypatch.setattr(main.sio, 'enter_room', noop)
    monkeypatch.setattr(main.sio, 'leave_room', noop)
    monkeypatch.setattr(main, 'save_match_to_db', lambda *a: sent.append({'event': 'saved_match'}))
    main.rooms.clear()
    yield sent
    main.rooms.clear()


def events(sent, name, to=None):
    return [e for e in sent if e['event'] == name and (to is None or e['to'] == to)]


def config():
    return {'4': 1, '3': 2, '2': 2, '1': 4}


async def create_room(sent, sid='host1', nick='Host'):
    await main.create_room(sid, {'nick': nick, 'config': config()})
    session = events(sent, 'session', to=sid)[-1]['data']
    return session['room_id'], session['token']


def test_host_w_tle_nie_usuwa_pokoju_i_gosc_moze_dolaczyc(fake_sio):
    async def scenario():
        room_id, _ = await create_room(fake_sio)
        await main.disconnect('host1')
        assert room_id in main.rooms

        await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        assert not events(fake_sio, 'error', to='guest1')
        assert events(fake_sio, 'game_start')
        main.cancel_pending(main.rooms[room_id])

    asyncio.run(scenario())


def test_host_wraca_z_tokenem_do_rozstawiania(fake_sio):
    async def scenario():
        room_id, token = await create_room(fake_sio)
        await main.disconnect('host1')
        await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})

        await main.join_room('host2', {'room_id': room_id, 'nick': 'Host', 'token': token, 'rejoin': True})

        room = main.rooms[room_id]
        assert set(room['players']) == {'host2', 'guest1'}
        assert not room['pending']
        resumed = events(fake_sio, 'game_resumed', to='host2')[-1]['data']
        assert resumed['phase'] == 'placement'

    asyncio.run(scenario())


def test_samotny_host_wraca_do_poczekalni(fake_sio):
    async def scenario():
        room_id, token = await create_room(fake_sio)
        await main.disconnect('host1')

        await main.join_room('host2', {'room_id': room_id, 'nick': 'Host', 'token': token, 'rejoin': True})

        assert list(main.rooms[room_id]['players']) == ['host2']
        resumed = events(fake_sio, 'game_resumed', to='host2')[-1]['data']
        assert resumed['phase'] == 'lobby'

    asyncio.run(scenario())


def test_powrot_z_tokenem_zanim_serwer_zauwazy_rozlaczenie(fake_sio):
    async def scenario():
        room_id, token = await create_room(fake_sio)

        await main.join_room('host2', {'room_id': room_id, 'nick': 'Host', 'token': token, 'rejoin': True})
        assert list(main.rooms[room_id]['players']) == ['host2']
        assert not events(fake_sio, 'game_start')

        await main.disconnect('host1')
        assert list(main.rooms[room_id]['players']) == ['host2']
        assert not main.rooms[room_id]['pending']

    asyncio.run(scenario())


def test_po_rozstawieniu_host_wraca_w_fazie_oczekiwania(fake_sio):
    async def scenario():
        room_id, token = await create_room(fake_sio)
        await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        await main.place_ships('host1', {'room_id': room_id, 'ships': [{'x': 0, 'y': 0, 'size': 1, 'vertical': False}]})
        await main.disconnect('host1')

        await main.join_room('host2', {'room_id': room_id, 'nick': 'Host', 'token': token, 'rejoin': True})

        resumed = events(fake_sio, 'game_resumed', to='host2')[-1]['data']
        assert resumed['phase'] == 'waiting'
        assert resumed['my_ships'] == [{'x': 0, 'y': 0, 'size': 1, 'vertical': False}]

    asyncio.run(scenario())


def test_wygasniecie_czasu_w_poczekalni_usuwa_pokoj_bez_zapisu_meczu(fake_sio, monkeypatch):
    monkeypatch.setattr(main, 'LOBBY_GRACE_PERIOD', 0)

    async def scenario():
        room_id, _ = await create_room(fake_sio)
        await main.disconnect('host1')
        await asyncio.sleep(0.05)
        assert room_id not in main.rooms
        assert not events(fake_sio, 'saved_match')

    asyncio.run(scenario())


def test_wygasniecie_czasu_przy_rozstawianiu_informuje_goscia(fake_sio, monkeypatch):
    monkeypatch.setattr(main, 'LOBBY_GRACE_PERIOD', 0)

    async def scenario():
        room_id, _ = await create_room(fake_sio)
        await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        await main.disconnect('host1')
        await asyncio.sleep(0.05)

        room = main.rooms[room_id]
        assert list(room['players']) == ['guest1']
        assert events(fake_sio, 'player_disconnected')
        assert not events(fake_sio, 'saved_match')
        assert not events(fake_sio, 'game_over')

    asyncio.run(scenario())


def test_nieudany_automatyczny_powrot_wysyla_rejoin_failed(fake_sio):
    async def scenario():
        await main.join_room('host2', {'room_id': 'ABCDEF', 'nick': 'Host', 'token': 'x', 'rejoin': True})
        assert events(fake_sio, 'rejoin_failed', to='host2')
        assert not events(fake_sio, 'error', to='host2')

    asyncio.run(scenario())


def test_rozlaczenie_w_trakcie_bitwy_nadal_konczy_sie_walkowerem(fake_sio, monkeypatch):
    monkeypatch.setattr(main, 'GRACE_PERIOD', 0)

    async def scenario():
        room_id, _ = await create_room(fake_sio)
        await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        ships = [{'x': 0, 'y': 0, 'size': 1, 'vertical': False}]
        await main.place_ships('host1', {'room_id': room_id, 'ships': ships})
        await main.place_ships('guest1', {'room_id': room_id, 'ships': ships})
        await main.disconnect('host1')
        await asyncio.sleep(0.05)

        assert events(fake_sio, 'game_over')
        assert events(fake_sio, 'saved_match')

    asyncio.run(scenario())


def test_reczne_dolaczenie_nie_przejmuje_aktywnej_sesji(fake_sio):
    async def scenario():
        room_id, token = await create_room(fake_sio)

        await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest', 'token': token})

        room = main.rooms[room_id]
        assert set(room['players']) == {'host1', 'guest1'}
        assert not events(fake_sio, 'game_resumed')
        assert events(fake_sio, 'game_start')

    asyncio.run(scenario())
