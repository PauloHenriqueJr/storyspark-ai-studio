from typing import Generator
from sqlalchemy.orm import Session
from db.database import SessionLocal
import os


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_stripe_key():
    return os.getenv("STRIPE_SECRET_KEY")

