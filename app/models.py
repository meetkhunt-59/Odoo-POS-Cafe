from __future__ import annotations

import enum
from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    pos = "pos"
    kitchen = "kitchen"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(320), unique=True, index=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    shifts: Mapped[list["Shift"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Shift(Base):
    """
    days_mask: bitmask of allowed start-days for the shift (Mon=1<<0 .. Sun=1<<6).
    Overnight shifts (end_time <= start_time) run into the next day.
    """

    __tablename__ = "shifts"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_shift_user_name"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(64))
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    days_mask: Mapped[int] = mapped_column(Integer, default=(1 << 7) - 1)  # all days
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped[User] = relationship(back_populates="shifts")

