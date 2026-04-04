from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = None
SessionLocal = None


def init_engine(database_url: str | None = None) -> None:
    global engine, SessionLocal

    url = database_url or settings.database_url

    connect_args: dict = {}
    engine_kwargs: dict = {}

    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        # In-memory SQLite needs a static pool so all sessions share the same DB.
        if ":memory:" in url:
            engine_kwargs["poolclass"] = StaticPool

    engine = create_engine(url, connect_args=connect_args, **engine_kwargs)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Session:
    if SessionLocal is None:
        raise RuntimeError("Database engine not initialized")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


init_engine()
