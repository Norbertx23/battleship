from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas
from database import engine, SessionLocal
app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Battleship API"}

@app.get("/stats/recent-matches", response_model=list[schemas.MatchResult])
def get_recent_matches(page: int = 1, limit: int = 5, db: Session = Depends(get_db)):
    skip = (page - 1) * limit
    return db.query(models.MatchHistory).order_by(models.MatchHistory.played_at.desc()).offset(skip).limit(limit).all()

@app.post("/game/save", status_code=201)
def save_game_result(game_data: schemas.GameResultCreate, db: Session = Depends(get_db)):
    new_match = models.MatchHistory(
        player1_nick=game_data.player1_nick,
        player2_nick=game_data.player2_nick,
        winner_nick=game_data.winner_nick
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    return {"message": "Game saved", "id": new_match.id}

@app.get("/stats/top-players", response_model=list[schemas.TopPlayer])
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

@app.get("/stats/player/{nick}", response_model=schemas.PlayerStats)
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

