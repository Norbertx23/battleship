import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
load_dotenv()

from urllib.parse import quote_plus

db_password = os.getenv("DB_PASSWORD")
db_user = os.getenv("DB_USER")


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{quote_plus(db_user)}:{quote_plus(db_password)}@localhost:5432/battleship_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine,autoflush=False,autocommit=False)
Base = declarative_base()