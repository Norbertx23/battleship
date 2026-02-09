from pydantic import BaseModel
from datetime import datetime

class MatchResult(BaseModel):
    player1_nick: str
    player2_nick: str
    winner_nick: str
    played_at: datetime

    class Config:
        from_attributes = True

class TopPlayer(BaseModel):
    nick: str
    wins: int

class GameResultCreate(BaseModel):
    player1_nick: str
    player2_nick: str
    winner_nick: str

class PlayerStats(BaseModel):
    nick: str
    total_games: int
    wins: int
    losses: int
    win_rate: float