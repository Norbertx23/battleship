import math
import time
from collections import defaultdict, deque

MAX_KEYS = 10000


class RateLimiter:
    def __init__(self, limit, window, clock=time.monotonic):
        self.limit = limit
        self.window = window
        self.clock = clock
        self.hits = defaultdict(deque)

    def _expire(self, key, now):
        q = self.hits[key]
        while q and now - q[0] >= self.window:
            q.popleft()
        return q

    def _prune(self, now):
        for key in list(self.hits):
            if not self._expire(key, now):
                del self.hits[key]

    def hit(self, key):
        now = self.clock()
        if len(self.hits) > MAX_KEYS:
            self._prune(now)
        q = self._expire(key, now)
        if len(q) >= self.limit:
            return False
        q.append(now)
        return True

    def retry_after(self, key):
        now = self.clock()
        q = self._expire(key, now)
        if len(q) < self.limit:
            return 0
        return max(1, math.ceil(self.window - (now - q[0])))

    def reset(self):
        self.hits.clear()


def client_ip(headers, fallback):
    cf = headers.get('cf-connecting-ip')
    if cf:
        return cf.strip()
    forwarded = headers.get('x-forwarded-for')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return fallback
