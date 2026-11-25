import unicodedata

from settings import MAX_NICK_LENGTH


def clean_nick(nick):
    if not isinstance(nick, str) or len(nick) > MAX_NICK_LENGTH * 4:
        return None
    nick = ' '.join(unicodedata.normalize('NFKC', nick).split())
    if not nick or len(nick) > MAX_NICK_LENGTH:
        return None
    if any(unicodedata.category(ch).startswith('C') for ch in nick):
        return None
    if not any(ch.isalnum() for ch in nick):
        return None
    return nick


def same_nick(a, b):
    return a.casefold() == b.casefold()


def escape_like(value):
    return value.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
