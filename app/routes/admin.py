from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_role
from app.models import Shift, User, UserRole
from app.schemas import AdminCreateUserRequest, ShiftCreateRequest, ShiftPublic, UserPublic
from app.security import hash_password


router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/users", response_model=UserPublic, dependencies=[Depends(require_role(UserRole.admin))])
def create_user(payload: AdminCreateUserRequest, db: Session = Depends(get_db)):
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
        role=payload.role,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return UserPublic.model_validate(u, from_attributes=True)


@router.post("/shifts", response_model=ShiftPublic, dependencies=[Depends(require_role(UserRole.admin))])
def create_shift(payload: ShiftCreateRequest, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role != UserRole.pos:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shifts are only for POS users")

    s = Shift(
        user_id=payload.user_id,
        name=payload.name,
        start_time=payload.start_time,
        end_time=payload.end_time,
        days_mask=payload.days_mask,
        timezone=payload.timezone,
        is_active=payload.is_active,
    )
    db.add(s)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Shift already exists for this user/name")
    db.refresh(s)
    return ShiftPublic.model_validate(s, from_attributes=True)


@router.get("/users", response_model=list[UserPublic], dependencies=[Depends(require_role(UserRole.admin))])
def list_users(db: Session = Depends(get_db)):
    stmt = select(User).order_by(User.id.asc())
    users = db.execute(stmt).scalars().all()
    return [UserPublic.model_validate(u, from_attributes=True) for u in users]


@router.get("/shifts", response_model=list[ShiftPublic], dependencies=[Depends(require_role(UserRole.admin))])
def list_shifts(user_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(Shift).order_by(Shift.id.asc())
    if user_id is not None:
        stmt = stmt.where(Shift.user_id == user_id)
    shifts = db.execute(stmt).scalars().all()
    return [ShiftPublic.model_validate(s, from_attributes=True) for s in shifts]
