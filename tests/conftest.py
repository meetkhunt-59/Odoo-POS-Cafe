from __future__ import annotations

from datetime import datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

import app.db as db
from app.deps import get_auth_service, get_now_utc
from app.main import create_app
from app.security import create_access_token
from app.supabase_auth import SupabaseSession


@pytest.fixture()
def fixed_now_utc() -> datetime:
    # Deterministic "current time" for login/shift checks.
    return datetime(2026, 1, 1, 12, 0, 0)


@pytest.fixture()
def client(fixed_now_utc: datetime):
    db.init_engine("sqlite+pysqlite:///:memory:")
    db.Base.metadata.create_all(bind=db.engine)

    class FakeAuthService:
        def __init__(self):
            self._users: dict[str, dict] = {}

        def sign_up(self, *, email: str, password: str, name: str) -> SupabaseSession:
            if email in self._users:
                raise ValueError("User already exists")
            user_id = str(uuid4())
            self._users[email] = {"id": user_id, "password": password, "name": name}
            return SupabaseSession(user_id=user_id)

        def sign_in(self, *, email: str, password: str) -> SupabaseSession:
            u = self._users.get(email)
            if not u or u["password"] != password:
                raise ValueError("Invalid credentials")
            token = create_access_token(subject=u["id"])
            return SupabaseSession(
                user_id=u["id"],
                access_token=token,
                refresh_token="test-refresh",
                token_type="bearer",
                expires_in=3600,
            )

        def admin_create_user(self, *, email: str, password: str, name: str) -> str:
            if email in self._users:
                raise ValueError("User already exists")
            user_id = str(uuid4())
            self._users[email] = {"id": user_id, "password": password, "name": name}
            return user_id

    fake_auth = FakeAuthService()

    app = create_app()
    app.dependency_overrides[get_now_utc] = lambda: fixed_now_utc
    app.dependency_overrides[get_auth_service] = lambda: fake_auth

    with TestClient(app) as c:
        yield c
