from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.deps import admin_exists, get_current_user, get_now_utc
from app.models import User, UserRole
from app.schemas import SignupRequest, TokenResponse, UserPublic
from app.security import create_access_token, hash_password, verify_password
from app.shift_rules import is_user_in_any_active_shift


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserPublic)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """
    If no admin exists yet: creates the first admin without auth.
    Otherwise: requires an admin token and creates a new admin.
    """
    if admin_exists(db):
        # Require admin for any further signups
        # (kept here to keep UX simple: /auth/signup works only for admins after bootstrap)
        # Note: this is intentionally not using FastAPI dependency injection ordering.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Signup disabled; use admin create-user")

    clauses = [User.username == payload.username]
    if payload.email:
        clauses.append(User.email == payload.email)
    stmt = select(User).where(or_(*clauses))
    if db.execute(stmt).scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    u = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.admin,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return UserPublic.model_validate(u, from_attributes=True)


@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    now_utc: datetime = Depends(get_now_utc),
    db: Session = Depends(get_db),
):
    stmt = (
        select(User)
        .options(selectinload(User.shifts))
        .where(or_(User.username == form.username, User.email == form.username))
        .limit(1)
    )
    user = db.execute(stmt).scalar_one_or_none()
    if not user or not user.is_active or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if user.role == UserRole.pos:
        if not is_user_in_any_active_shift(user.shifts, now_utc=now_utc):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="POS login blocked: not in an active shift",
            )

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserPublic)
def me(current: User = Depends(get_current_user)):
    return UserPublic.model_validate(current, from_attributes=True)
