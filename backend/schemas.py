from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MatchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    player1_nick: str
    player2_nick: str
    winner_nick: str
    played_at: datetime


class TopPlayer(BaseModel):
    nick: str
    wins: int


class MatchListResponse(BaseModel):
    items: list[MatchResult]
    total: int


class PlayerStats(BaseModel):
    nick: str
    total_games: int
    wins: int
    losses: int
    win_rate: float
