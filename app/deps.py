from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import Client

from app.config import settings
from app.db import get_db, get_auth_client

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_now_utc() -> datetime:
    return datetime.utcnow()

def get_current_user(db: Client = Depends(get_db), auth_client: Client = Depends(get_auth_client), token: str = Depends(oauth2_scheme)) -> dict:
    try:
        user_response = auth_client.auth.get_user(token)
        user_id = user_response.user.id
    except Exception as e:
        print(f"DEBUG: Token validation failed: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")
    
    if not user_id:
        print("DEBUG: Token subject missing")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    try:
        uid = str(UUID(str(user_id)))
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    response = db.table("profiles").select("*").eq("id", uid).execute()
    if not response.data:
        # Auto-repair: Create profile if it doesn't exist but user is authenticated
        user_metadata = user_response.user.user_metadata or {}
        new_profile = {
            "id": uid,
            "name": user_metadata.get("name", user_response.user.email.split('@')[0]),
            "role": "admin" if not admin_exists(db) else "staff"
        }
        print(f"DEBUG: Auto-creating missing profile for {uid}")
        insert_res = db.table("profiles").insert(new_profile).execute()
        if not insert_res.data:
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found and auto-repair failed")
        return insert_res.data[0]
        
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
