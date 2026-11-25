import asyncio

from helpers import create_room, events, start_battle
import sockets


def test_pusty_nick_daje_kod_invalid_nickname(fake_sio):
    async def scenario():
        await sockets.create_room('host1', {'nick': '', 'config': {'1': 1}})
        err = events(fake_sio, 'error', to='host1')[0]['data']
        assert err['code'] == 'invalid_nickname'
        assert err['message']

    asyncio.run(scenario())


def test_zla_flota_daje_kod_invalid_fleet_config(fake_sio):
    async def scenario():
        await sockets.create_room('host1', {'nick': 'Host', 'config': {}})
        assert events(fake_sio, 'error', to='host1')[0]['data']['code'] == 'invalid_fleet_config'

    asyncio.run(scenario())


def test_nieistniejacy_pokoj_daje_kod_room_not_found_or_full(fake_sio):
    async def scenario():
        await sockets.join_room('g', {'room_id': 'XXXXXX', 'nick': 'G'})
        assert events(fake_sio, 'error', to='g')[0]['data']['code'] == 'room_not_found_or_full'

    asyncio.run(scenario())


def test_zle_rozstawienie_daje_kod_invalid_ship_placement(fake_sio):
    async def scenario():
        room_id, _ = await create_room(fake_sio, cfg={'1': 1})
        await sockets.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        await sockets.place_ships('host1', {'room_id': room_id, 'ships': []})
        assert events(fake_sio, 'error', to='host1')[0]['data']['code'] == 'invalid_ship_placement'

    asyncio.run(scenario())


def test_walkower_ma_kod_i_nick(fake_sio):
    async def scenario():
        room_id = await start_battle(fake_sio)
        await sockets.handle_leave('host1', room_id)
        data = events(fake_sio, 'player_disconnected')[-1]['data']
        assert data['code'] == 'opponent_forfeit'
        assert data['nick'] == 'Host'
        assert data['forfeit'] is True

    asyncio.run(scenario())


def test_wyjscie_z_poczekalni_ma_kod_player_left(fake_sio):
    async def scenario():
        room_id, _ = await create_room(fake_sio, cfg={'1': 1})
        await sockets.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        await sockets.handle_leave('guest1', room_id)
        data = events(fake_sio, 'player_disconnected')[-1]['data']
        assert data['code'] == 'player_left'
        assert data['nick'] == 'Guest'

    asyncio.run(scenario())
