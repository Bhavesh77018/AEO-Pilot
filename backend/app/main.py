"""FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.routes import router
from .config import settings
from .db import init_db
from .llm import get_provider
from .middleware.security import BotBlockMiddleware, SecurityHeadersMiddleware

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MVP convenience: ensure tables exist on boot. Alembic owns prod schema.
    init_db()
    yield


# Hide interactive docs + OpenAPI schema from normal users in production.
_is_prod = settings.app_env.lower() in ("production", "prod")

app = FastAPI(
    title="AEO Pilot API",
    version="0.1.0",
    description="Make your startup discoverable by AI. Answer Engine Optimization platform.",
    lifespan=lifespan,
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
)

# ── Middleware stack (applied bottom-up; security headers wrap everything) ──
# 1. Security headers — added to every response.
app.add_middleware(SecurityHeadersMiddleware)

# 2. Bot blocking + body-size cap — rejects bad requests before routing.
app.add_middleware(BotBlockMiddleware)

# 3. CORS — restrict to configured origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,  # set CORS_ORIGINS in prod
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    allow_credentials=True,
)

app.include_router(router)


@app.get("/health")
def health(request: Request):
    """Internal health check — restricted to private IPs in production."""
    if _is_prod:
        # Allow only loopback and RFC-1918 private ranges.
        client_ip = (
            request.headers.get("x-forwarded-for", "").split(",")[0].strip()
            or (request.client.host if request.client else "")
        )
        _private = ("127.", "10.", "172.16.", "172.17.", "172.18.", "172.19.",
                    "172.20.", "172.21.", "172.22.", "172.23.", "172.24.",
                    "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
                    "172.30.", "172.31.", "192.168.", "::1", "localhost")
        if not any(client_ip.startswith(p) for p in _private):
            return JSONResponse({"detail": "Not found"}, status_code=404)

    provider = get_provider()
    return {
        "status": "ok",
        "env": settings.app_env,
        # Never expose which LLM provider or key is configured.
        "llm_available": provider.available,
        "note": "LLM is optional; scoring runs on heuristics without a key.",
    }
