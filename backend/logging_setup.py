import logging

from settings import LOG_LEVEL

LOG_FORMAT = '%(asctime)s %(levelname)s %(name)s: %(message)s'


def setup_logging(level=LOG_LEVEL):
    logging.basicConfig(level=level, format=LOG_FORMAT)
