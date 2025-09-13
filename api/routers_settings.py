from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from db import models
from .deps import get_db
from .schemas import SettingRead, SettingUpdate


router = APIRouter(prefix="/settings", tags=["settings"]) 


@router.get("", response_model=List[SettingRead])
def list_settings(db: Session = Depends(get_db)):
    settings = db.query(models.Settings).all()
    return [{"key": s.key, "value": s.value} for s in settings]


@router.put("/{key}", response_model=SettingRead)
def set_setting(key: str, payload: SettingUpdate, db: Session = Depends(get_db)):
    s = db.query(models.Settings).filter_by(key=key).first()
    if s:
        s.value = payload.value
    else:
        s = models.Settings(key=key, value=payload.value)
        db.add(s)
    db.commit()
    return {"key": key, "value": s.value}

