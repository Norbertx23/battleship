import secrets

from settings import ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH

rooms = {}


def new_room_code():
    while True:
        code = ''.join(secrets.choice(ROOM_CODE_ALPHABET) for _ in range(ROOM_CODE_LENGTH))
        if code not in rooms:
            return code


def new_token():
    return secrets.token_hex(16)


def room_from(data):
    room_id = data.get('room_id')
    if not isinstance(room_id, str):
        return None, None
    return room_id, rooms.get(room_id)


def cancel_pending(room_data):
    for info in room_data.get('pending', {}).values():
        task = info.get('task')
        if task:
            task.cancel()
    room_data['pending'] = {}


def migrate_sid(room_data, old_sid, new_sid):
    if old_sid == new_sid:
        return
    for key in ('players', 'boards', 'shots', 'tokens'):
        section = room_data.get(key, {})
        if old_sid in section:
            section[new_sid] = section.pop(old_sid)
    if 'ready' in room_data:
        room_data['ready'] = [new_sid if s == old_sid else s for s in room_data['ready']]
    if room_data.get('turn') == old_sid:
        room_data['turn'] = new_sid
    if room_data.get('host') == old_sid:
        room_data['host'] = new_sid


def purge_player(room_data, sid):
    room_data['players'].pop(sid, None)
    room_data.get('boards', {}).pop(sid, None)
    room_data.get('shots', {}).pop(sid, None)
    room_data.get('tokens', {}).pop(sid, None)
    if 'ready' in room_data:
        room_data['ready'] = [s for s in room_data['ready'] if s != sid]


def find_token_owner(room_data, token, allow_active):
    if not token or room_data.get('status') == 'finished':
        return None
    pending = room_data.get('pending', {})
    for owner, owner_token in room_data.get('tokens', {}).items():
        if not isinstance(owner_token, str) or not isinstance(token, str):
            continue
        if not secrets.compare_digest(owner_token.encode(), token.encode()):
            continue
        if owner in pending or (allow_active and owner in room_data['players']):
            return owner
    return None


def resume_phase(room_data, sid):
    if room_data.get('status') == 'playing':
        return 'battle'
    if len(room_data['players']) < 2:
        return 'lobby'
    return 'waiting' if sid in room_data.get('ready', []) else 'placement'
