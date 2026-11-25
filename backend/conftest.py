import pytest

import api
import init_db
import matches
import room_state
import sockets


@pytest.fixture(scope='session', autouse=True)
def _create_schema():
    assert init_db.main() == 0, 'init_db.main() failed, schema was not created'


@pytest.fixture(autouse=True)
def fake_sio(monkeypatch):
    sent = []

    async def emit(event, data=None, room=None, to=None, skip_sid=None):
        sent.append({'event': event, 'data': data, 'room': room, 'to': to})

    async def noop(*args, **kwargs):
        return None

    monkeypatch.setattr(sockets.sio, 'emit', emit)
    monkeypatch.setattr(sockets.sio, 'enter_room', noop)
    monkeypatch.setattr(sockets.sio, 'leave_room', noop)
    monkeypatch.setattr(matches, 'save_match', lambda *a: sent.append({'event': 'saved_match'}))
    room_state.rooms.clear()
    sockets.room_limiter.reset()
    api.stats_limiter.reset()
    yield sent
    room_state.rooms.clear()
