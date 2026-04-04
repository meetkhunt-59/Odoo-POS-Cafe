from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.db import get_db
from app.deps import require_role
from app.schemas import AdminCreateUserRequest, ProfilePublic

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/users", response_model=ProfilePublic, dependencies=[Depends(require_role("admin"))])
def create_user(
    payload: AdminCreateUserRequest,
    db: Client = Depends(get_db),
):
    try:
        user_resp = db.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {"name": payload.name}
        })
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    if not user_resp.user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supabase did not return user id")

    res = db.table("profiles").insert({"id": str(user_resp.user.id), "name": payload.name, "role": payload.role}).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists")
    return ProfilePublic(**res.data[0])

@router.get("/users", response_model=list[ProfilePublic], dependencies=[Depends(require_role("admin"))])
def list_users(db: Client = Depends(get_db)):
    res = db.table("profiles").select("*").order("created_at").execute()
    return [ProfilePublic(**p) for p in res.data]
