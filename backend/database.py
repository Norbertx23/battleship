import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://battleship_user:Qwer123@#$@localhost:5432/battleship_db"
)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine,autoflush=False,autocommit=False)
Base = declarative_base()