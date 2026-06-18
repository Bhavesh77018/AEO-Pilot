"""Tests for the Done-For-You service offer (monetization)."""
from types import SimpleNamespace

from app.services.service_offer import build_offer


def _rec(title, severity, impact, category="schema_coverage"):
    return SimpleNamespace(title=title, severity=severity, impact=impact, category=category)


def test_low_score_gets_flagship_tier():
    recs = [_rec("Add Organization JSON-LD", "high", 18)]
    offer = build_offer(11.4, {}, recs)
    assert offer["recommended_package"]["tier"] == "overhaul"
    assert offer["recommended_package"]["price_one_time"] == 12000


def test_mid_score_gets_builder_tier():
    offer = build_offer(45.6, {}, [_rec("FAQ schema", "high", 16)])
    assert offer["recommended_package"]["tier"] == "builder"


def test_high_score_gets_maintenance():
    offer = build_offer(88.0, {}, [])
    assert offer["recommended_package"]["tier"] == "maintenance"


def test_projected_score_beats_current_and_is_capped():
    recs = [_rec("a", "high", 40), _rec("b", "high", 40), _rec("c", "high", 40)]
    offer = build_offer(20.0, {}, recs)
    pkg = offer["recommended_package"]
    assert pkg["projected_score"] > pkg["current_score"]
    assert pkg["projected_score"] <= 95.0
    assert pkg["est_lift"] > 0


def test_alacarte_prices_scale_with_impact_and_severity():
    offer = build_offer(40.0, {}, [
        _rec("big high", "high", 18),
        _rec("small low", "low", 2),
    ])
    prices = {i["title"]: i["price"] for i in offer["a_la_carte"]}
    assert prices["big high"] > prices["small low"]
    assert all(p % 50 == 0 for p in prices.values())  # clean rounding


def test_offer_has_all_four_packages_and_cta():
    offer = build_offer(50.0, {}, [])
    assert len(offer["all_packages"]) == 4
    assert offer["cta"]
    assert "disclaimer" in offer
