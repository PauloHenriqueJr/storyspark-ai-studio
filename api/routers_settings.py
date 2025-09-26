from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from db import models
from .deps import get_db
from .schemas import SettingRead, SettingUpdate
from .utils_settings import get_setting
import requests
import json


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


@router.delete("/{key}", status_code=204)
def delete_setting(key: str, db: Session = Depends(get_db)):
    s = db.query(models.Settings).filter_by(key=key).first()
    if not s:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Setting not found")
    db.delete(s)
    db.commit()
    return None


# Integration testing endpoints
@router.get("/integrations/test-connection")
def test_integration_connection(integration: str, db: Session = Depends(get_db)):
    """Test connection with saved settings for an integration"""
    integration_configs = {
        "openrouter": {
            "api_key": get_setting(db, "OPENROUTER_API_KEY", ""),
            "test_url": "https://openrouter.ai/api/v1/auth/key",
            "headers": lambda key: {"Authorization": f"Bearer {key}"}
        },
        "gemini": {
            "api_key": get_setting(db, "GEMINI_API_KEY", ""),
            "test_url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}",
            "method": "POST",
            "body": {"contents": [{"parts": [{"text": "Hello"}]}]}
        },
        "serper": {
            "api_key": get_setting(db, "SERPER_API_KEY", ""),
            "test_url": "https://google.serper.dev/search",
            "method": "POST",
            "headers": lambda key: {"X-API-KEY": key, "Content-Type": "application/json"},
            "body": {"q": "test"}
        }
    }

    if integration not in integration_configs:
        raise HTTPException(status_code=400, detail=f"Integration '{integration}' not supported for testing")

    config = integration_configs[integration]
    api_key = config["api_key"]

    if not api_key:
        raise HTTPException(status_code=400, detail="API key not configured")

    try:
        headers = {}
        if callable(config.get("headers")):
            headers = config["headers"](api_key)
        else:
            headers = config.get("headers", {})

        # Replace {key} placeholder in URL
        url = config["test_url"].replace("{key}", api_key)

        response = requests.request(
            method=config.get("method", "GET"),
            url=url,
            headers=headers,
            json=config.get("body"),
            timeout=10
        )

        if response.status_code in [200, 201]:
            return {
                "status": "success",
                "message": f"✅ {integration.title()} API connection successful"
            }
        else:
            return {
                "status": "error",
                "message": f"❌ {integration.title()} API returned status {response.status_code}: {response.text}"
            }

    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "message": f"❌ {integration.title()} API request timed out"
        }
    except requests.exceptions.ConnectionError:
        return {
            "status": "error",
            "message": f"❌ {integration.title()} API connection failed"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"❌ {integration.title()} API test failed: {str(e)}"
        }


@router.post("/integrations/test-connection-with-values")
def test_integration_connection_with_values(
    values: Dict[str, str],
    integration: str,
    db: Session = Depends(get_db)
):
    """Test connection with provided values for an integration"""
    integration_configs = {
        "openrouter": {
            "test_url": "https://openrouter.ai/api/v1/auth/key",
            "headers": lambda key: {"Authorization": f"Bearer {key}"}
        },
        "gemini": {
            "test_url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}",
            "method": "POST",
            "body": {"contents": [{"parts": [{"text": "Hello"}]}]}
        },
        "serper": {
            "test_url": "https://google.serper.dev/search",
            "method": "POST",
            "headers": lambda key: {"X-API-KEY": key, "Content-Type": "application/json"},
            "body": {"q": "test"}
        }
    }

    if integration not in integration_configs:
        raise HTTPException(status_code=400, detail=f"Integration '{integration}' not supported for testing")

    config = integration_configs[integration]

    # Get API key from values
    api_key = values.get("OPENROUTER_API_KEY") or values.get("GEMINI_API_KEY") or values.get("SERPER_API_KEY")

    if not api_key:
        raise HTTPException(status_code=400, detail="API key not provided in values")

    try:
        headers = {}
        if callable(config.get("headers")):
            headers = config["headers"](api_key)
        else:
            headers = config.get("headers", {})

        # Replace {key} placeholder in URL
        url = config["test_url"].replace("{key}", api_key)

        response = requests.request(
            method=config.get("method", "GET"),
            url=url,
            headers=headers,
            json=config.get("body"),
            timeout=10
        )

        if response.status_code in [200, 201]:
            return {
                "status": "success",
                "message": f"✅ {integration.title()} API connection successful"
            }
        else:
            return {
                "status": "error",
                "message": f"❌ {integration.title()} API returned status {response.status_code}: {response.text}"
            }

    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "message": f"❌ {integration.title()} API request timed out"
        }
    except requests.exceptions.ConnectionError:
        return {
            "status": "error",
            "message": f"❌ {integration.title()} API connection failed"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"❌ {integration.title()} API test failed: {str(e)}"
        }

