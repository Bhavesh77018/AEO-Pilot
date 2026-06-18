"""Razorpay billing — order creation + payment verification.

Amounts are AUTHORITATIVE here (never trust the client). Prices are in INR;
Razorpay works in the smallest unit (paise), so ₹3,999 -> 399900.

When keys aren't configured, `enabled` is False and the API tells the frontend
to keep plan CTAs as plain links — the app keeps working with no billing.
"""
from __future__ import annotations

import hashlib
import hmac

from ..config import settings

CURRENCY = "INR"

# plan -> { period -> rupees }. Source of truth for what we charge.
PLAN_PRICES_INR: dict[str, dict[str, int]] = {
    "growth": {"monthly": 3999, "annual": 3199},
    "agency": {"monthly": 15999, "annual": 12999},
}
# starter is free; enterprise is sales-led — neither goes through checkout.


def is_enabled() -> bool:
    return settings.razorpay_enabled


def amount_paise(plan: str, period: str) -> int:
    try:
        rupees = PLAN_PRICES_INR[plan][period]
    except KeyError:
        raise ValueError(f"No checkout price for plan={plan!r} period={period!r}")
    return rupees * 100


def _client():
    import razorpay  # imported lazily so the app boots without the key

    client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
    return client


def create_order(amount: int, receipt: str, notes: dict | None = None) -> dict:
    """Create a Razorpay order. Returns the order dict (contains `id`)."""
    client = _client()
    return client.order.create(
        {
            "amount": amount,
            "currency": CURRENCY,
            "receipt": receipt,
            "notes": notes or {},
            "payment_capture": 1,
        }
    )


def verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify the Razorpay payment signature: HMAC_SHA256(order_id|payment_id)."""
    if not settings.razorpay_key_secret:
        return False
    expected = hmac.new(
        settings.razorpay_key_secret.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
