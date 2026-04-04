from __future__ import annotations

from datetime import datetime

import pytest
from fastapi.testclient import TestClient

import app.db as db
from app.deps import get_now_utc
from app.main import create_app


@pytest.fixture()
def fixed_now_utc() -> datetime:
    # Deterministic "current time" for login/shift checks.
    return datetime(2026, 1, 1, 12, 0, 0)


@pytest.fixture()
def client(fixed_now_utc: datetime):
    db.init_engine("sqlite+pysqlite:///:memory:")
    db.Base.metadata.create_all(bind=db.engine)

    app = create_app()
    app.dependency_overrides[get_now_utc] = lambda: fixed_now_utc

    with TestClient(app) as c:
        yield c

