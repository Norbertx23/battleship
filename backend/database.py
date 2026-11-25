import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()


def database_url():
    url = os.getenv('DATABASE_URL')
    if url:
        return url
    user = os.getenv('POSTGRES_USER')
    password = os.getenv('POSTGRES_PASSWORD')
    name = os.getenv('POSTGRES_DB')
    host = os.getenv('DB_HOST', 'localhost')
    port = os.getenv('DB_PORT', '5432')
    if not all([user, password, name]):
        raise RuntimeError('Missing database configuration: set DATABASE_URL or POSTGRES_USER, POSTGRES_PASSWORD and POSTGRES_DB.')
    return f'postgresql://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{name}'


engine = create_engine(database_url())
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
