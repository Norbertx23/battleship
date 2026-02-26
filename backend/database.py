import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
load_dotenv()

from urllib.parse import quote_plus

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    db_user = os.getenv("POSTGRES_USER")
    db_password = os.getenv("POSTGRES_PASSWORD")
    db_name = os.getenv("POSTGRES_DB")
    db_host = os.getenv("DB_HOST", "localhost")
    if not all([db_user, db_password, db_name]):
        raise ImportError("Błąd: Brak wymaganych zmiennych POSTGRES_ w pliku .env!")
    DATABASE_URL = f"postgresql://{quote_plus(db_user)}:{quote_plus(db_password)}@{db_host}:5432/{db_name}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine,autoflush=False,autocommit=False)
Base = declarative_base()