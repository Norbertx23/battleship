import socketio

from api import fastapi_app
from logging_setup import setup_logging
from sockets import sio

setup_logging()

app = socketio.ASGIApp(sio, fastapi_app)
