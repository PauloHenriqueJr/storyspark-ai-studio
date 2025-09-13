import os
from sqlalchemy.orm import Session
from db import models


def get_setting(db: Session, key: str, default: str = "") -> str:
    try:
        s = db.query(models.Settings).filter_by(key=key).first()
        if s and s.value:
            return s.value
    except Exception:
        pass
    return os.getenv(key, default)

