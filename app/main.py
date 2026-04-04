from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.db as db
from app.routes import admin, auth


def create_app() -> FastAPI:
    app = FastAPI(title="POS Cafe Backend", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def _create_tables() -> None:
        db.Base.metadata.create_all(bind=db.engine)

    app.include_router(auth.router)
    app.include_router(admin.router)
    return app


app = create_app()
