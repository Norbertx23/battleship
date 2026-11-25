import os

DEFAULT_ORIGINS = ['https://battleship.swistak.fun', 'http://localhost:3000', 'http://localhost:5173']
MAX_MESSAGE_BYTES = 64 * 1024

GRACE_PERIOD = 60
LOBBY_GRACE_PERIOD = 180

MAX_NICK_LENGTH = 30
MAX_SEARCH_LENGTH = 50
ROOM_CODE_LENGTH = 6
ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

STATS_LIMIT = 60
ROOM_LIMIT = 10
LIMIT_WINDOW = 60
RATE_LIMITED_MESSAGE = 'Too many requests. Try again in a moment.'

LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()


def parse_origins(raw):
    if not raw:
        return DEFAULT_ORIGINS
    return [o.strip() for o in raw.split(',') if o.strip()]


ALLOWED_ORIGINS = parse_origins(os.getenv('ALLOWED_ORIGINS'))
