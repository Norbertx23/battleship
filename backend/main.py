import random

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas
from database import engine, SessionLocal
import socketio
import uuid
from sqlalchemy import or_
import game_manager as gm


sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
fastapi_app = FastAPI()

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app = socketio.ASGIApp(sio, fastapi_app)

rooms = {}

@sio.event
async def connect(sid, environ):
    print("connect ", sid)

async def handle_leave(sid, room_id):
    if room_id in rooms:
        room_data = rooms[room_id]
        if sid in room_data['players']:
            leaving_nick = room_data['players'][sid]
            del room_data['players'][sid]
            print(f"Player {sid} ({leaving_nick}) left room {room_id}")
            
            if len(room_data['players']) == 0:
                del rooms[room_id]
                print(f"Room {room_id} deleted (empty)")
            else:
                remaining_sid = list(room_data['players'].keys())[0]
                remaining_nick = room_data['players'][remaining_sid]
                
                current_status = room_data.get('status')
                has_placed_ships = len(room_data.get('ready', [])) > 0
                
                if current_status == 'finished':
                    await sio.emit('player_disconnected', {'message': '', 'silent': True}, room=room_id)
                elif current_status == 'playing' or (current_status == 'waiting' and has_placed_ships):
                    room_data['status'] = 'finished'
                    save_match_to_db(remaining_nick, leaving_nick, remaining_nick)
                    await sio.emit('game_over', {'winner': remaining_sid}, room=room_id)
                    await sio.emit('player_disconnected', {'message': f'Opponent {leaving_nick} abandoned the mission. You WIN!', 'forfeit': True}, room=room_id)
                else:
                    await sio.emit('player_disconnected', {'message': f'Opponent {leaving_nick} left the room.'}, room=room_id)

@sio.event
async def leave_room(sid, data):
    room_id = data.get('room_id')
    await handle_leave(sid, room_id)

@sio.event
async def disconnect(sid):
    print("disconnect ", sid)
    for room_id, room_data in list(rooms.items()):
        if sid in room_data['players']:
             await handle_leave(sid, room_id)

@sio.event
async def create_room(sid, data):
    room_id = str(uuid.uuid4())[:6].upper()

    rooms[room_id] = {
        'host': sid,
        'players': {sid: data['nick']},
        'config': data['config'],
        'status': 'waiting',
        'boards': {},
        'shots': {sid: []},
        'ready': []
    }
    await sio.enter_room(sid, room_id)
    await sio.emit('room_created', {'room_id' : room_id}, to=sid)
    print(f"Pokój {room_id} stworzony przez {data['nick']}")

@sio.event
async def join_room(sid, data):
    room_id = data['room_id']
    if room_id in rooms and len(rooms[room_id]['players']) < 2:
        rooms[room_id]['players'][sid] = data['nick']
        if 'shots' not in rooms[room_id]:
            rooms[room_id]['shots'] = {}
        rooms[room_id]['shots'][sid] = []
        await sio.enter_room(sid, room_id)

        await sio.emit('game_start', {'config' : rooms[room_id]['config'], 'players' : list(rooms[room_id]['players'].values())}, room=room_id)
        print(f"{sid} dołączył do {room_id}")

    else:
        await sio.emit('error', {'message' : 'Room does not exist or is full'}, to=sid)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@sio.event
async def place_ships(sid, data):
    room_id = data['room_id']
    ships = data['ships']

    if room_id in rooms:
        room = rooms[room_id]

        if not gm.validate_ships(ships):
            print(f"Validation failed for {sid} with ships: {ships}")
            await sio.emit('error', {'message': 'Invalid ship placement!'}, to=sid)
            return

        room['boards'][sid] = ships

        if sid not in room['ready']:
            room['ready'].append(sid)

        if len(room['ready']) == 2:
            room['status'] = 'playing'
            first_turn = random.choice(list(room['players'].keys()))
            room['turn'] = first_turn
            await sio.emit('battle_start', {'turn': first_turn}, room=room_id)


def save_match_to_db(winner_nick, player1_nick, player2_nick):
    db = SessionLocal()
    try:
        new_match = models.MatchHistory(
            player1_nick=player1_nick,
            player2_nick=player2_nick,
            winner_nick=winner_nick
        )
        db.add(new_match)
        db.commit()
        print(f"Match saved: {winner_nick} won against {player2_nick if winner_nick == player1_nick else player1_nick}")
    except Exception as e:
        print(f"Error saving match: {e}")
    finally:
        db.close()

@sio.event
async def fire_shot(sid, data):
    print(f"SHOT FIRED by {sid}: {data}")

    room_id = data['room_id']
    x,y = data['x'], data['y']
    if room_id in rooms:
        room = rooms[room_id]

        if room['turn'] != sid:
            return

        opponent_sid = [p for p in room['players'] if p != sid][0]
        opponent_ships = room['boards'].get(opponent_sid, [])

        result = gm.check_hit(opponent_ships,x, y)

        room['shots'][sid].append({'x': x, 'y': y, 'result': result})

        next_turn = sid if result == 'hit' else opponent_sid
        room['turn'] = next_turn

        sunk_sizes = []
        if result == 'hit':
             sunk_ships = gm.get_sunk_ships(opponent_ships, room['shots'][sid])
             sunk_sizes = [s['size'] for s in sunk_ships]

        await sio.emit('shot_result', {
            'x': x, 'y': y,
            'result': result,
            'sunk_sizes': sunk_sizes,
            'shooter': sid,
            'next_turn': next_turn
        }, room=room_id)

        if result == 'hit':
             if gm.check_win(opponent_ships, room['shots'][sid]):
                 await sio.emit('game_over', {'winner': sid}, room=room_id)
                 room['status'] = 'finished'
                 
                 # Save game result
                 p1_sid = list(room['players'].keys())[0]
                 p2_sid = list(room['players'].keys())[1]
                 winner_nick = room['players'][sid]
                 p1_nick = room['players'][p1_sid]
                 p2_nick = room['players'][p2_sid]
                 
                 save_match_to_db(winner_nick, p1_nick, p2_nick)
                 return
@fastapi_app.get("/")
def read_root():
    return {"message": "Battleship API"}


@fastapi_app.get("/stats/recent-matches", response_model=schemas.MatchListResponse)
def get_recent_matches(page: int = 1, limit: int = 5, search: str = "", db: Session = Depends(get_db)):
    skip = (page - 1) * limit
    
    query = db.query(models.MatchHistory)
    
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                models.MatchHistory.winner_nick.ilike(search_fmt),
                models.MatchHistory.player1_nick.ilike(search_fmt),
                models.MatchHistory.player2_nick.ilike(search_fmt)
            )
        )
    
    total = query.count()
    items = query.order_by(models.MatchHistory.played_at.desc()).offset(skip).limit(limit).all()
    
    return {"items": items, "total": total}



@fastapi_app.get("/stats/top-players", response_model=list[schemas.TopPlayer])
def get_top_players(limit: int = 10, db: Session = Depends(get_db)):
    results = db.query(
        models.MatchHistory.winner_nick.label("nick"),
        func.count(models.MatchHistory.winner_nick).label("wins")
    ).group_by(
        models.MatchHistory.winner_nick
    ).order_by(
        func.count(models.MatchHistory.winner_nick).desc()
    ).limit(limit).all()
    
    return results

@fastapi_app.get("/stats/player/{nick}", response_model=schemas.PlayerStats)
def get_player_stats(nick: str, db: Session = Depends(get_db)):
    from sqlalchemy import or_
    
    wins = db.query(models.MatchHistory).filter(models.MatchHistory.winner_nick == nick).count()
    
    total_games = db.query(models.MatchHistory).filter(
        or_(
            models.MatchHistory.player1_nick == nick,
            models.MatchHistory.player2_nick == nick
        )
    ).count()
    
    losses = total_games - wins
    win_rate = (wins / total_games * 100) if total_games > 0 else 0.0
    
    return {
        "nick": nick,
        "total_games": total_games,
        "wins": wins,
        "losses": losses,
        "win_rate": round(win_rate, 2)
    }

