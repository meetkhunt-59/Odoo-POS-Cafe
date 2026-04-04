from __future__ import annotations

from datetime import datetime, time

from pydantic import BaseModel, Field
from pydantic import model_validator

from app.models import UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    id: int
    username: str
    email: str | None
    role: UserRole
    is_active: bool
    created_at: datetime


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: str | None = Field(default=None, max_length=320)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class AdminCreateUserRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: str | None = Field(default=None, max_length=320)
    password: str = Field(min_length=6, max_length=128)
    role: UserRole


class ShiftCreateRequest(BaseModel):
    user_id: int
    name: str = Field(min_length=1, max_length=64)
    start_time: time
    end_time: time
    # Either set `days_mask` directly (Mon=1<<0 .. Sun=1<<6) or provide `days` (0=Mon .. 6=Sun).
    days_mask: int = Field(default=(1 << 7) - 1, ge=0)
    days: list[int] | None = Field(default=None, description="0=Mon .. 6=Sun")
    timezone: str | None = Field(default=None, max_length=64)
    is_active: bool = True

    @model_validator(mode="after")
    def _normalize_days(self):
        if self.days is None:
            return self
        mask = 0
        for d in self.days:
            if d < 0 or d > 6:
                raise ValueError("days must be between 0 (Mon) and 6 (Sun)")
            mask |= 1 << d
        self.days_mask = mask
        return self


class ShiftPublic(BaseModel):
    id: int
    user_id: int
    name: str
    start_time: time
    end_time: time
    days_mask: int
    timezone: str | None
    is_active: bool
