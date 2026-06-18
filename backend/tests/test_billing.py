"""Tests for the Razorpay billing service (amounts + signature verification)."""
import hashlib
import hmac

import pytest

from app.config import settings
from app.services import billing


def test_amount_paise_known_plans():
    assert billing.amount_paise("growth", "monthly") == 3999 * 100
    assert billing.amount_paise("growth", "annual") == 3199 * 100
    assert billing.amount_paise("agency", "monthly") == 15999 * 100


def test_amount_paise_unknown_raises():
    with pytest.raises(ValueError):
        billing.amount_paise("starter", "monthly")  # free plan, no checkout
    with pytest.raises(ValueError):
        billing.amount_paise("growth", "weekly")


def test_verify_signature_roundtrip(monkeypatch):
    monkeypatch.setattr(settings, "razorpay_key_secret", "secret_test_123")
    order_id, payment_id = "order_ABC", "pay_XYZ"
    good = hmac.new(
        b"secret_test_123", f"{order_id}|{payment_id}".encode(), hashlib.sha256
    ).hexdigest()

    assert billing.verify_signature(order_id, payment_id, good) is True
    assert billing.verify_signature(order_id, payment_id, "deadbeef") is False


def test_verify_signature_no_secret(monkeypatch):
    monkeypatch.setattr(settings, "razorpay_key_secret", None)
    assert billing.verify_signature("o", "p", "sig") is False


def test_enabled_reflects_keys(monkeypatch):
    monkeypatch.setattr(settings, "razorpay_key_id", None)
    monkeypatch.setattr(settings, "razorpay_key_secret", None)
    assert billing.is_enabled() is False
    monkeypatch.setattr(settings, "razorpay_key_id", "rzp_test_x")
    monkeypatch.setattr(settings, "razorpay_key_secret", "sec")
    assert billing.is_enabled() is True
