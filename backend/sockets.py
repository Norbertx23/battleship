import asyncio
import logging
import random

import socketio

import game_manager as gm
import matches
from rate_limit import RateLimiter, client_ip
from room_state import (
    cancel_pending,
    find_token_owner,
    migrate_sid,
    new_room_code,
    new_token,
    purge_player,
    resume_phase,
    room_from,
    rooms,
)
from settings import (
    ALLOWED_ORIGINS,
    GRACE_PERIOD,
    LIMIT_WINDOW,
    LOBBY_GRACE_PERIOD,
    MAX_MESSAGE_BYTES,
    RATE_LIMITED_MESSAGE,
    ROOM_LIMIT,
)
from validation import clean_nick, same_nick

logger = logging.getLogger(__name__)

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=ALLOWED_ORIGINS,
    max_http_buffer_size=MAX_MESSAGE_BYTES,
)

room_limiter = RateLimiter(ROOM_LIMIT, LIMIT_WINDOW)
sid_ips = {}


def payload(data):
    return data if isinstance(data, dict) else {}


async def send_error(sid, code, message):
    await sio.emit('error', {'code': code, 'message': message}, to=sid)


async def room_rate_ok(sid):
    if room_limiter.hit(sid_ips.get(sid, sid)):
        return True
    logger.warning('Rate limit hit for sid %s', sid)
    await send_error(sid, 'rate_limited', RATE_LIMITED_MESSAGE)
    return False


async def fail_join(sid, code, message, is_rejoin):
    event = 'rejoin_failed' if is_rejoin else 'error'
    await sio.emit(event, {'code': code, 'message': message}, to=sid)


async def announce_forfeit(room_id, winner_sid, leaver_nick, leaver_ships):
    await sio.emit('game_over', {'winner': winner_sid, 'enemy_ships': leaver_ships}, room=room_id)
    await sio.emit('player_disconnected', {
        'code': 'opponent_forfeit',
        'nick': leaver_nick,
        'message': f'Opponent {leaver_nick} abandoned the mission. You WIN!',
        'forfeit': True,
    }, room=room_id)


async def announce_player_left(room_id, leaver_nick):
    await sio.emit('player_disconnected', {
        'code': 'player_left',
        'nick': leaver_nick,
        'message': f'Player {leaver_nick} left the room.',
    }, room=room_id)


async def handle_leave(sid, room_id):
    room_data = rooms.get(room_id)
    if not room_data or sid not in room_data['players']:
        return

    leaving_nick = room_data['players'][sid]
    leaving_ships = room_data.get('boards', {}).get(sid, [])
    purge_player(room_data, sid)
    logger.info('Player %s left room %s', sid, room_id)

    if room_data.get('pending') and room_data.get('status') == 'playing':
        cancel_pending(room_data)
        del rooms[room_id]
        logger.info('Room %s closed: both players gone', room_id)
        return

    if not room_data['players']:
        del rooms[room_id]
        logger.info('Room %s closed: empty', room_id)
        return

    remaining_sid = next(iter(room_data['players']))
    remaining_nick = room_data['players'][remaining_sid]
    status = room_data.get('status')

    if status == 'finished':
        room_data['play_again'] = set()
        await sio.emit('player_disconnected', {'message': '', 'silent': True, 'opponent_left': True}, room=room_id)
    elif status == 'playing':
        room_data['status'] = 'finished'
        matches.save_match(remaining_nick, leaving_nick, remaining_nick)
        await announce_forfeit(room_id, remaining_sid, leaving_nick, leaving_ships)
    else:
        await announce_player_left(room_id, leaving_nick)


async def do_forfeit(room_id, leaver_sid, leaver_nick):
    room_data = rooms.get(room_id)
    if not room_data:
        return
    room_data['players'].pop(leaver_sid, None)

    remaining = list(room_data['players'])
    if not remaining:
        cancel_pending(room_data)
        rooms.pop(room_id, None)
        logger.info('Room %s closed: empty after forfeit', room_id)
        return

    pending = room_data.get('pending', {})
    if all(s in pending for s in remaining):
        cancel_pending(room_data)
        rooms.pop(room_id, None)
        logger.info('Room %s closed: both players abandoned, no winner', room_id)
        return

    remaining_sid = remaining[0]
    remaining_nick = room_data['players'][remaining_sid]
    room_data['status'] = 'finished'
    matches.save_match(remaining_nick, leaver_nick, remaining_nick)
    await announce_forfeit(room_id, remaining_sid, leaver_nick, room_data['boards'].get(leaver_sid, []))


async def do_lobby_leave(room_id, leaver_sid, leaver_nick):
    room_data = rooms.get(room_id)
    if not room_data:
        return
    purge_player(room_data, leaver_sid)

    remaining = list(room_data['players'])
    pending = room_data.get('pending', {})
    if not remaining or all(s in pending for s in remaining):
        cancel_pending(room_data)
        rooms.pop(room_id, None)
        logger.info('Room %s closed: nobody left in lobby', room_id)
        return

    await announce_player_left(room_id, leaver_nick)


async def grace_timeout(room_id, leaver_sid, leaver_nick, period):
    try:
        await asyncio.sleep(period)
    except asyncio.CancelledError:
        return
    room_data = rooms.get(room_id)
    if not room_data:
        return
    pending = room_data.get('pending', {})
    if leaver_sid not in pending:
        return
    del pending[leaver_sid]
    if room_data.get('status') == 'playing':
        logger.info('Grace period expired for %s in room %s: forfeit', leaver_sid, room_id)
        await do_forfeit(room_id, leaver_sid, leaver_nick)
    else:
        logger.info('Grace period expired for %s in room %s: left lobby', leaver_sid, room_id)
        await do_lobby_leave(room_id, leaver_sid, leaver_nick)


async def start_grace(sid, room_id):
    room_data = rooms[room_id]
    pending = room_data.setdefault('pending', {})
    if sid in pending:
        return
    nick = room_data['players'].get(sid, 'Opponent')
    token = room_data.get('tokens', {}).get(sid)
    period = GRACE_PERIOD if room_data.get('status') == 'playing' else LOBBY_GRACE_PERIOD
    task = asyncio.create_task(grace_timeout(room_id, sid, nick, period))
    pending[sid] = {'old_sid': sid, 'nick': nick, 'task': task, 'token': token}
    logger.info('Player %s dropped from room %s, %ss to rejoin', sid, room_id, period)
    await sio.emit('opponent_disconnected', {'nick': nick, 'grace': period}, room=room_id, skip_sid=sid)


async def do_rejoin(new_sid, room_id, old_sid):
    room_data = rooms[room_id]
    info = room_data.get('pending', {}).pop(old_sid, None)
    was_pending = info is not None
    if was_pending and info.get('task'):
        info['task'].cancel()

    nick = info['nick'] if was_pending else room_data['players'].get(old_sid, 'Player')
    if old_sid != new_sid:
        await sio.leave_room(old_sid, room_id)
    migrate_sid(room_data, old_sid, new_sid)
    await sio.enter_room(new_sid, room_id)

    opponent_sid = next((s for s in room_data['players'] if s != new_sid), None)
    my_ships = room_data.get('boards', {}).get(new_sid, [])
    my_shots = room_data.get('shots', {}).get(new_sid, [])
    enemy_shots = room_data.get('shots', {}).get(opponent_sid, []) if opponent_sid else []
    opponent_ships = room_data.get('boards', {}).get(opponent_sid, []) if opponent_sid else []
    sunk_sizes = [s['size'] for s in gm.get_sunk_ships(opponent_ships, my_shots)]

    logger.info('Player %s rejoined room %s as %s', old_sid, room_id, new_sid)

    await sio.emit('game_resumed', {
        'room_id': room_id,
        'config': room_data['config'],
        'nick': nick,
        'phase': resume_phase(room_data, new_sid),
        'players': list(room_data['players'].values()),
        'my_ships': my_ships,
        'my_shots': my_shots,
        'enemy_shots': enemy_shots,
        'my_turn': room_data.get('turn') == new_sid,
        'enemy_sunk_sizes': sunk_sizes,
    }, to=new_sid)
    if was_pending:
        await sio.emit('opponent_reconnected', {'nick': nick}, room=room_id, skip_sid=new_sid)


@sio.event
async def connect(sid, environ):
    headers = {
        'cf-connecting-ip': environ.get('HTTP_CF_CONNECTING_IP'),
        'x-forwarded-for': environ.get('HTTP_X_FORWARDED_FOR'),
    }
    sid_ips[sid] = client_ip(headers, environ.get('REMOTE_ADDR', sid))
    logger.debug('Client connected: %s', sid)


@sio.event
async def disconnect(sid):
    logger.debug('Client disconnected: %s', sid)
    sid_ips.pop(sid, None)
    for room_id, room_data in list(rooms.items()):
        if sid not in room_data['players']:
            continue
        pending = room_data.get('pending', {})
        if room_data.get('status') == 'finished' or sid in pending:
            await handle_leave(sid, room_id)
            continue

        others = [s for s in room_data['players'] if s != sid]
        if others and all(s in pending for s in others):
            cancel_pending(room_data)
            rooms.pop(room_id, None)
            logger.info('Room %s closed: both players dropped, no winner', room_id)
        else:
            await start_grace(sid, room_id)


@sio.event
async def create_room(sid, data):
    data = payload(data)
    if not await room_rate_ok(sid):
        return
    nick = clean_nick(data.get('nick'))
    if not nick:
        await send_error(sid, 'invalid_nickname', 'Invalid nickname.')
        return
    if not gm.validate_config(data.get('config')):
        await send_error(sid, 'invalid_fleet_config', 'Invalid fleet configuration.')
        return

    room_id = new_room_code()
    token = new_token()
    rooms[room_id] = {
        'host': sid,
        'players': {sid: nick},
        'config': data['config'],
        'status': 'waiting',
        'boards': {},
        'shots': {sid: []},
        'ready': [],
        'pending': {},
        'tokens': {sid: token},
    }
    await sio.enter_room(sid, room_id)
    await sio.emit('session', {'room_id': room_id, 'token': token}, to=sid)
    await sio.emit('room_created', {'room_id': room_id}, to=sid)
    logger.info('Room %s created by %s', room_id, sid)


@sio.event
async def join_room(sid, data):
    data = payload(data)
    if not await room_rate_ok(sid):
        return
    room_id, room = room_from(data)
    is_rejoin = bool(data.get('rejoin'))

    if not room:
        await fail_join(sid, 'room_not_found_or_full', 'Room does not exist or is full', is_rejoin)
        return

    owner = find_token_owner(room, data.get('token'), allow_active=is_rejoin)
    if owner:
        await do_rejoin(sid, room_id, owner)
        return

    if is_rejoin:
        await fail_join(sid, 'session_expired', 'Cannot reconnect: session expired.', True)
        return

    if room.get('pending') and room.get('status') == 'playing':
        await send_error(sid, 'session_other_device', 'Cannot reconnect: this session belongs to another device.')
        return

    if room.get('status', 'waiting') != 'waiting' or len(room['players']) >= 2:
        await send_error(sid, 'room_not_found_or_full', 'Room does not exist or is full')
        return

    nick = clean_nick(data.get('nick'))
    if not nick:
        await send_error(sid, 'invalid_nickname', 'Invalid nickname.')
        return
    if any(same_nick(nick, other) for other in room['players'].values()):
        await send_error(sid, 'nickname_taken', 'This nickname is already taken in this room.')
        return

    token = new_token()
    room['players'][sid] = nick
    room.setdefault('shots', {})[sid] = []
    room.setdefault('tokens', {})[sid] = token
    await sio.enter_room(sid, room_id)

    await sio.emit('session', {'room_id': room_id, 'token': token}, to=sid)
    await sio.emit('game_start', {'config': room['config'], 'players': list(room['players'].values())}, room=room_id)
    logger.info('Player %s joined room %s', sid, room_id)


@sio.event
async def place_ships(sid, data):
    data = payload(data)
    room_id, room = room_from(data)
    ships = data.get('ships')

    if not room or sid not in room['players'] or room.get('status') != 'waiting' or len(room['players']) != 2:
        return
    if not gm.validate_fleet(ships, room['config']):
        logger.info('Rejected ship placement from %s in room %s', sid, room_id)
        await send_error(sid, 'invalid_ship_placement', 'Invalid ship placement!')
        return

    room['boards'][sid] = gm.normalize_fleet(ships)
    if sid not in room['ready']:
        room['ready'].append(sid)

    if len(room['ready']) == 2:
        room['status'] = 'playing'
        room['turn'] = random.choice(list(room['players']))
        await sio.emit('battle_start', {'turn': room['turn']}, room=room_id)
        logger.info('Battle started in room %s', room_id)


@sio.event
async def fire_shot(sid, data):
    data = payload(data)
    room_id, room = room_from(data)
    x, y = data.get('x'), data.get('y')

    if not room or room.get('status') != 'playing' or room.get('pending') or room['turn'] != sid:
        return
    if not gm.is_valid_shot(room['shots'][sid], x, y):
        return

    opponent_sid = next(p for p in room['players'] if p != sid)
    opponent_ships = room['boards'].get(opponent_sid, [])
    result = gm.check_hit(opponent_ships, x, y)
    room['shots'][sid].append({'x': x, 'y': y, 'result': result})

    next_turn = sid if result == 'hit' else opponent_sid
    room['turn'] = next_turn

    sunk_sizes = []
    if result == 'hit':
        sunk_sizes = [s['size'] for s in gm.get_sunk_ships(opponent_ships, room['shots'][sid])]

    await sio.emit('shot_result', {
        'x': x, 'y': y,
        'result': result,
        'sunk_sizes': sunk_sizes,
        'shooter': sid,
        'next_turn': next_turn,
    }, room=room_id)

    if result == 'hit' and gm.check_win(opponent_ships, room['shots'][sid]):
        await finish_battle(room_id, room, sid)


async def finish_battle(room_id, room, winner_sid):
    room['status'] = 'finished'
    players = list(room['players'])
    for p_sid in players:
        enemy_sid = next((s for s in players if s != p_sid), None)
        enemy_ships = room['boards'].get(enemy_sid, []) if enemy_sid else []
        await sio.emit('game_over', {'winner': winner_sid, 'enemy_ships': enemy_ships}, to=p_sid)

    p1_nick, p2_nick = (room['players'][s] for s in players[:2])
    matches.save_match(room['players'][winner_sid], p1_nick, p2_nick)
    logger.info('Battle finished in room %s', room_id)


@sio.event
async def play_again(sid, data):
    room_id, room = room_from(payload(data))
    if not room or room.get('status') != 'finished' or sid not in room['players']:
        return
    if len(room['players']) < 2:
        await send_error(sid, 'opponent_left', 'Opponent left the room.')
        return

    votes = room.setdefault('play_again', set())
    votes.add(sid)

    if len(votes) < 2:
        await sio.emit('play_again_pending', {}, room=room_id, skip_sid=sid)
        return

    gm.reset_room_state(room)
    await sio.emit('game_start', {
        'config': room['config'],
        'players': list(room['players'].values()),
    }, room=room_id)
    logger.info('Rematch started in room %s', room_id)


@sio.event
async def leave_room(sid, data):
    room_id, room = room_from(payload(data))
    if room:
        await handle_leave(sid, room_id)
