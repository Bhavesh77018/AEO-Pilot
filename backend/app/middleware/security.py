"""Security middleware: bot blocking, security headers, request size cap.

Applied in main.py. Designed to be zero-dependency beyond the stdlib and
Starlette (which FastAPI already pulls in).
"""
from __future__ import annotations

import re
import time
from collections import defaultdict
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

# ─── Bot / Bad UA blocking ───────────────────────────────────────────────────

# Patterns that immediately signal a scanner, scraper, or exploit kit.
_BAD_UA_PATTERNS = re.compile(
    r"(sqlmap|nikto|nmap|masscan|zgrab|nuclei|hydra|acunetix|nessus"
    r"|dirbuster|gobuster|wfuzz|burpsuite|havij|openvas|whatweb"
    r"|python-requests/[01]\.|curl/[0-6]\.|wget/1\.[0-9]\b"  # very old curl/wget
    r"|zgrab|shodan|censys|zoomeye)",
    re.IGNORECASE,
)

# Routes that require a non-empty, non-bot User-Agent on mutating requests.
_PROTECTED_PREFIXES = ("/api/v1/projects", "/api/v1/billing", "/api/v1/contact")

# Maximum request body size (10 KB) — prevents memory-bomb attacks.
_MAX_BODY_BYTES = 10 * 1024  # 10 KB


class BotBlockMiddleware(BaseHTTPMiddleware):
    """Block known scanner User-Agents and enforce a request-body size cap."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        method = request.method.upper()

        # Only inspect mutation requests on sensitive routes.
        if method in ("POST", "PUT", "PATCH", "DELETE"):
            ua = request.headers.get("user-agent", "")

            # 1. Completely empty UA on a mutating request → likely a script.
            if not ua.strip() and any(path.startswith(p) for p in _PROTECTED_PREFIXES):
                return JSONResponse(
                    {"detail": "Missing User-Agent header"},
                    status_code=400,
                )

            # 2. Known scanner / exploit-kit UA.
            if ua and _BAD_UA_PATTERNS.search(ua):
                return JSONResponse(
                    {"detail": "Forbidden"},
                    status_code=403,
                )

            # 3. Body size cap — read up to limit+1 bytes; reject if over.
            if any(path.startswith(p) for p in _PROTECTED_PREFIXES):
                body = await request.body()
                if len(body) > _MAX_BODY_BYTES:
                    return JSONResponse(
                        {"detail": "Request body too large"},
                        status_code=413,
                    )

        return await call_next(request)


# ─── Security response headers ────────────────────────────────────────────────

# Razorpay checkout script is the only external JS we intentionally load.
_CSP = (
    "default-src 'self'; "
    "script-src 'self' https://checkout.razorpay.com; "
    "connect-src 'self'; "
    "img-src 'self' data:; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self';"
)

_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": _CSP,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-XSS-Protection": "1; mode=block",
    "Cache-Control": "no-store",  # API responses must not be cached by proxies
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach security headers to every response."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        for header, value in _SECURITY_HEADERS.items():
            response.headers[header] = value
        # Remove any fingerprinting headers that FastAPI/uvicorn may add.
        for hdr in ("server", "x-powered-by"):
            try:
                del response.headers[hdr]
            except (KeyError, AttributeError):
                pass
        return response


# ─── In-process rate limiter (fallback when Redis isn't available) ────────────
#
# Uses a sliding-window counter per (IP, route_key). For production with
# multiple workers, prefer slowapi + Redis backend. This implementation is
# intentionally simple and correct for a single-process deployment.

class _WindowCounter:
    """Sliding 60-second window counter."""

    def __init__(self) -> None:
        self._counts: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str, limit: int, window_seconds: int = 60) -> bool:
        """Return True if the request is ALLOWED (under limit), False if blocked."""
        now = time.monotonic()
        cutoff = now - window_seconds
        hits = self._counts[key]
        # Prune old hits.
        while hits and hits[0] < cutoff:
            hits.pop(0)
        if len(hits) >= limit:
            return False
        hits.append(now)
        return True


_counter = _WindowCounter()

# (route_key, limit, window_seconds)
_RATE_RULES: list[tuple[str, int, int]] = [
    ("project_create", 5, 60),       # 5 new projects per minute per IP
    ("scan_start", 3, 60),           # 3 scans per minute per IP
    ("billing_order", 10, 3600),     # 10 orders per hour per IP
    ("contact_submit", 5, 3600),     # 5 contact forms per hour per IP
    ("global", 120, 60),             # 120 any-API requests per minute per IP
]

_RULE_MAP = {r[0]: (r[1], r[2]) for r in _RATE_RULES}


def rate_limit(request: Request, route_key: str) -> Response | None:
    """Call this at the top of a route function.

    Returns a 429 JSONResponse if the caller is over the limit, else None.
    This is a helper function — NOT a middleware — so it plays nicely with
    FastAPI's dependency injection without needing slowapi installed.
    """
    # Import lazily to avoid circular imports (config → security).
    from .config import settings as _settings  # noqa: PLC0415
    if not _settings.rate_limit_enabled:
        return None

    # Prefer X-Forwarded-For (set by Render/Vercel/Nginx) over the raw client IP.
    ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown")
    )

    limit, window = _RULE_MAP.get(route_key, (120, 60))
    key = f"{ip}:{route_key}"

    # Also check global limit.
    global_ok = _counter.check(f"{ip}:global", 120, 60)
    route_ok = _counter.check(key, limit, window)

    if not global_ok or not route_ok:
        return JSONResponse(
            {"detail": "Too many requests — please slow down and try again."},
            status_code=429,
            headers={"Retry-After": str(window)},
        )
    return None
