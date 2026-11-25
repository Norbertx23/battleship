from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from database import Base


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class MatchHistory(Base):
    __tablename__ = 'match_history'

    id = Column(Integer, primary_key=True, index=True)
    player1_nick = Column(String, index=True)
    player2_nick = Column(String, index=True)
    winner_nick = Column(String, index=True)
    played_at = Column(DateTime, default=utc_now)
