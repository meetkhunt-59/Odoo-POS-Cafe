from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import Client

from app.config import settings
from app.db import get_db
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_now_utc() -> datetime:
    return datetime.utcnow()

def get_current_user(db: Client = Depends(get_db), token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    try:
        uid = str(UUID(str(user_id)))
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    response = db.table("profiles").select("*").eq("id", uid).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return response.data[0]

def require_role(*roles: str):
    def _dep(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return _dep

def admin_exists(db: Client) -> bool:
    response = db.table("profiles").select("id").eq("role", "admin").limit(1).execute()
    return len(response.data) > 0
