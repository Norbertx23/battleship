import logging

import models
from database import SessionLocal

logger = logging.getLogger(__name__)


def save_match(winner_nick, player1_nick, player2_nick):
    db = SessionLocal()
    try:
        db.add(models.MatchHistory(player1_nick=player1_nick, player2_nick=player2_nick, winner_nick=winner_nick))
        db.commit()
        logger.info('Match saved')
    except Exception:
        db.rollback()
        logger.exception('Failed to save match')
    finally:
        db.close()
