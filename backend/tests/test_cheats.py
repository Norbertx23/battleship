import asyncio

import main
from test_reconnect import create_room, events, fake_sio  # noqa: F401

SHIP = {'x': 0, 'y': 0, 'size': 1, 'vertical': False}


async def start_battle(sent):
    room_id, _ = await create_room(sent, cfg={'1': 1})
    await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
    await main.place_ships('host1', {'room_id': room_id, 'ships': [SHIP]})
    await main.place_ships('guest1', {'room_id': room_id, 'ships': [SHIP]})
    return room_id


def test_obcy_nie_moze_rozstawic_floty_w_cudzym_pokoju(fake_sio):
    async def scenario():
        room_id, _ = await create_room(fake_sio, cfg={'1': 1})
        await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        await main.place_ships('intruz', {'room_id': room_id, 'ships': [SHIP]})

        room = main.rooms[room_id]
        assert 'intruz' not in room['boards']
        assert room['ready'] == []

    asyncio.run(scenario())


def test_pusta_flota_jest_odrzucana(fake_sio):
    async def scenario():
        room_id, _ = await create_room(fake_sio, cfg={'1': 1})
        await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        await main.place_ships('host1', {'room_id': room_id, 'ships': []})

        assert events(fake_sio, 'error', to='host1')
        assert main.rooms[room_id]['ready'] == []

    asyncio.run(scenario())


def test_flota_niezgodna_z_konfiguracja_jest_odrzucana(fake_sio):
    async def scenario():
        room_id, _ = await create_room(fake_sio)
        await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        await main.place_ships('host1', {'room_id': room_id, 'ships': [SHIP]})

        assert events(fake_sio, 'error', to='host1')
        assert main.rooms[room_id]['ready'] == []

    asyncio.run(scenario())


def test_nie_mozna_przestawic_floty_w_trakcie_bitwy(fake_sio):
    async def scenario():
        room_id = await start_battle(fake_sio)
        moved = {'x': 9, 'y': 9, 'size': 1, 'vertical': False}
        await main.place_ships('host1', {'room_id': room_id, 'ships': [moved]})

        assert main.rooms[room_id]['boards']['host1'] == [SHIP]

    asyncio.run(scenario())


def test_strzaly_po_koncu_gry_nie_zapisuja_kolejnych_wygranych(fake_sio):
    async def scenario():
        room_id = await start_battle(fake_sio)
        shooter = main.rooms[room_id]['turn']
        await main.fire_shot(shooter, {'room_id': room_id, 'x': 0, 'y': 0})
        assert len(events(fake_sio, 'saved_match')) == 1

        for _ in range(3):
            await main.fire_shot(shooter, {'room_id': room_id, 'x': 0, 'y': 0})
        assert len(events(fake_sio, 'saved_match')) == 1

    asyncio.run(scenario())


def test_ponowny_strzal_w_to_samo_pole_jest_ignorowany(fake_sio):
    async def scenario():
        room_id, _ = await create_room(fake_sio, cfg={'2': 1})
        await main.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
        ship = {'x': 0, 'y': 0, 'size': 2, 'vertical': False}
        await main.place_ships('host1', {'room_id': room_id, 'ships': [ship]})
        await main.place_ships('guest1', {'room_id': room_id, 'ships': [ship]})
        shooter = main.rooms[room_id]['turn']

        await main.fire_shot(shooter, {'room_id': room_id, 'x': 0, 'y': 0})
        await main.fire_shot(shooter, {'room_id': room_id, 'x': 0, 'y': 0})

        assert len(main.rooms[room_id]['shots'][shooter]) == 1

    asyncio.run(scenario())


def test_strzal_poza_plansza_jest_ignorowany(fake_sio):
    async def scenario():
        room_id = await start_battle(fake_sio)
        shooter = main.rooms[room_id]['turn']
        await main.fire_shot(shooter, {'room_id': room_id, 'x': 10, 'y': -1})

        assert main.rooms[room_id]['shots'][shooter] == []
        assert not events(fake_sio, 'shot_result')

    asyncio.run(scenario())


def test_niepoprawna_konfiguracja_nie_tworzy_pokoju(fake_sio):
    async def scenario():
        for cfg in ({}, {'1': 0}, {'9': 1}, {'1': 99}, {'1': '1'}, None):
            await main.create_room('host1', {'nick': 'Host', 'config': cfg})
        assert not main.rooms
        assert len(events(fake_sio, 'error', to='host1')) == 6

    asyncio.run(scenario())


def test_za_dlugi_nick_jest_odrzucany(fake_sio):
    async def scenario():
        await main.create_room('host1', {'nick': 'x' * 31, 'config': {'1': 1}})
        assert not main.rooms
        assert events(fake_sio, 'error', to='host1')

    asyncio.run(scenario())
