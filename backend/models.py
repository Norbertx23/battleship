from sqlalchemy import Column, Integer, String, DateTime
from database import Base
import datetime

class MatchHistory(Base):
    __tablename__ = "match_history"

    id = Column(Integer, primary_key=True, index=True)
    player1_nick = Column(String, index=True)
    player2_nick = Column(String, index=True)
    winner_nick = Column(String, index=True)
    played_at = Column(DateTime, default=datetime.datetime.utcnow)
