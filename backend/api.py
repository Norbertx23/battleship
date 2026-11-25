import logging

from fastapi import Depends, FastAPI, Path, Query
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_, text
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db
from rate_limit import RateLimiter, client_ip
from settings import LIMIT_WINDOW, MAX_NICK_LENGTH, MAX_SEARCH_LENGTH, RATE_LIMITED_MESSAGE, STATS_LIMIT
from validation import escape_like

logger = logging.getLogger(__name__)

fastapi_app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
stats_limiter = RateLimiter(STATS_LIMIT, LIMIT_WINDOW)


@fastapi_app.middleware('http')
async def limit_stats(request, call_next):
    if request.url.path.startswith('/stats'):
        ip = client_ip(request.headers, request.client.host if request.client else 'unknown')
        if not stats_limiter.hit(ip):
            logger.warning('Stats rate limit hit for %s', ip)
            return JSONResponse(
                status_code=429,
                content={'code': 'rate_limited', 'message': RATE_LIMITED_MESSAGE},
                headers={'Retry-After': str(stats_limiter.retry_after(ip))},
            )
    return await call_next(request)


@fastapi_app.get('/')
def read_root():
    return {'message': 'Battleship API'}


@fastapi_app.get('/healthz')
def healthz():
    try:
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        return {'status': 'ok', 'database': 'ok'}
    except Exception:
        logger.exception('Health check failed: database unreachable')
        return JSONResponse(status_code=503, content={'status': 'error', 'database': 'unreachable'})


@fastapi_app.get('/stats/recent-matches', response_model=schemas.MatchListResponse)
def get_recent_matches(
    page: int = Query(1, ge=1, le=10_000),
    limit: int = Query(5, ge=1, le=50),
    search: str = Query('', max_length=MAX_SEARCH_LENGTH),
    db: Session = Depends(get_db),
):
    query = db.query(models.MatchHistory)

    search = search.strip()
    if search:
        pattern = f'%{escape_like(search)}%'
        query = query.filter(or_(
            models.MatchHistory.winner_nick.ilike(pattern, escape='\\'),
            models.MatchHistory.player1_nick.ilike(pattern, escape='\\'),
            models.MatchHistory.player2_nick.ilike(pattern, escape='\\'),
        ))

    total = query.count()
    items = query.order_by(models.MatchHistory.played_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {'items': items, 'total': total}


@fastapi_app.get('/stats/top-players', response_model=list[schemas.TopPlayer])
def get_top_players(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    wins = func.count(models.MatchHistory.winner_nick)
    return (
        db.query(models.MatchHistory.winner_nick.label('nick'), wins.label('wins'))
        .group_by(models.MatchHistory.winner_nick)
        .order_by(wins.desc())
        .limit(limit)
        .all()
    )


@fastapi_app.get('/stats/player/{nick}', response_model=schemas.PlayerStats)
def get_player_stats(nick: str = Path(..., min_length=1, max_length=MAX_NICK_LENGTH), db: Session = Depends(get_db)):
    wins = db.query(models.MatchHistory).filter(models.MatchHistory.winner_nick == nick).count()
    total_games = db.query(models.MatchHistory).filter(or_(
        models.MatchHistory.player1_nick == nick,
        models.MatchHistory.player2_nick == nick,
    )).count()
    win_rate = (wins / total_games * 100) if total_games else 0.0
    return {
        'nick': nick,
        'total_games': total_games,
        'wins': wins,
        'losses': total_games - wins,
        'win_rate': round(win_rate, 2),
    }
