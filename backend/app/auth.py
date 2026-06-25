"""Per-user auth: resolve the Supabase access token to a user.

The frontend sends the user's Supabase access token as `Authorization: Bearer
<token>`. We verify it by asking Supabase (`GET /auth/v1/user`) — no JWT secret
needed, just the public URL + anon key. Results are cached briefly to avoid a
round-trip on every request.

Soft by design: a missing/invalid token resolves to None (anonymous) rather than
raising, so endpoints can decide what to do (e.g. return an empty list). When
Supabase isn't configured (local dev), auth is disabled and everything is open.
"""
from __future__ import annotations

import time

import httpx
from fastapi import Header

from .config import settings

# token -> (user_dict, expires_at)
_cache: dict[str, tuple[dict, float]] = {}
_TTL = 60.0


def _verify(token: str) -> dict | None:
    now = time.time()
    hit = _cache.get(token)
    if hit and hit[1] > now:
        return hit[0]
    try:
        with httpx.Client(timeout=8) as client:
            r = client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}", "apikey": settings.supabase_anon_key},
            )
        if r.status_code == 200:
            u = r.json()
            user = {"id": u.get("id"), "email": u.get("email")}
            if user["id"]:
                _cache[token] = (user, now + _TTL)
                # opportunistic cleanup
                if len(_cache) > 500:
                    for k in [k for k, v in _cache.items() if v[1] <= now]:
                        _cache.pop(k, None)
                return user
    except Exception:
        pass
    return None


def get_current_user(authorization: str | None = Header(default=None)) -> dict | None:
    """FastAPI dependency → {"id", "email"} or None (anonymous / dev)."""
    if not settings.auth_enabled:
        return None
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    return _verify(authorization.split(" ", 1)[1].strip())
