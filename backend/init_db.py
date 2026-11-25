import logging
import sys

from sqlalchemy import inspect, text

from database import Base, engine
from models import MatchHistory
from logging_setup import setup_logging

ADVISORY_LOCK_ID = 918273645
TABLES = [MatchHistory.__table__]

logger = logging.getLogger('init_db')


def main() -> int:
    setup_logging()
    try:
        with engine.begin() as conn:
            if conn.dialect.name == 'postgresql':
                logger.info('Waiting for advisory lock %s', ADVISORY_LOCK_ID)
                conn.execute(text('SELECT pg_advisory_xact_lock(:lock_id)'), {'lock_id': ADVISORY_LOCK_ID})
                logger.info('Advisory lock acquired')

            before = set(inspect(conn).get_table_names())
            Base.metadata.create_all(bind=conn, tables=TABLES)
            after = set(inspect(conn).get_table_names())

        created = sorted(after - before)
        if created:
            logger.info('Created %d tables: %s', len(created), ', '.join(created))
        else:
            logger.info('Schema up to date, %d existing tables: %s', len(after), ', '.join(sorted(after)))
        return 0
    except Exception:
        logger.exception('Database initialization failed')
        return 1


if __name__ == '__main__':
    sys.exit(main())
