import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
load_dotenv()

from urllib.parse import quote_plus

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    db_password = os.getenv("DB_PASSWORD", "postgres")
    db_user = os.getenv("DB_USER", "postgres")
    db_name = os.getenv("DB_NAME", "battleship_db")
    db_host = os.getenv("DB_HOST", "localhost")
    DATABASE_URL = f"postgresql://{quote_plus(db_user)}:{quote_plus(db_password)}@{db_host}:5432/{db_name}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine,autoflush=False,autocommit=False)
Base = declarative_base()