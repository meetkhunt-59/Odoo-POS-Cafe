from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.db as db
from app.config import settings
from app.routes import admin, auth, backend, terminal

def create_app() -> FastAPI:
    app = FastAPI(title="POS Cafe Backend", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    pass

    app.include_router(auth.router)
    app.include_router(admin.router)
    app.include_router(backend.router)
    app.include_router(terminal.router)
    return app


app = create_app()
