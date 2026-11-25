import sockets

SHIP = {'x': 0, 'y': 0, 'size': 1, 'vertical': False}


def events(sent, name, to=None):
    return [e for e in sent if e['event'] == name and (to is None or e['to'] == to)]


def config():
    return {'4': 1, '3': 2, '2': 2, '1': 4}


async def create_room(sent, sid='host1', nick='Host', cfg=None):
    await sockets.create_room(sid, {'nick': nick, 'config': cfg or config()})
    session = events(sent, 'session', to=sid)[-1]['data']
    return session['room_id'], session['token']


async def start_battle(sent):
    room_id, _ = await create_room(sent, cfg={'1': 1})
    await sockets.join_room('guest1', {'room_id': room_id, 'nick': 'Guest'})
    await sockets.place_ships('host1', {'room_id': room_id, 'ships': [SHIP]})
    await sockets.place_ships('guest1', {'room_id': room_id, 'ships': [SHIP]})
    return room_id
