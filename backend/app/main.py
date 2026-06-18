"""FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .config import settings
from .db import init_db
from .llm import get_provider

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MVP convenience: ensure tables exist on boot. Alembic owns prod schema.
    init_db()
    yield


app = FastAPI(
    title="AEO Pilot API",
    version="0.1.0",
    description="Make your startup discoverable by AI. Answer Engine Optimization platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health():
    provider = get_provider()
    return {
        "status": "ok",
        "env": settings.app_env,
        "llm_provider": settings.llm_provider,
        "llm_available": provider.available,
        "note": "LLM is optional; scoring runs on heuristics without a key.",
    }
