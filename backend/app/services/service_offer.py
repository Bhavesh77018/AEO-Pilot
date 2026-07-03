"""Done-For-You service offer (monetization).

Turns a scan's weaknesses into a premium, managed-service pitch: "our AEO
experts will repair every issue and build your brand's authority across the
answer engines — for a price." The worse the score, the bigger (and costlier)
the recommended engagement, plus an a-la-carte price per individual fix.

Pricing is intentionally premium (this is a high-touch B2B service) and clearly
labeled indicative. Pure function over the scan's score + recommendations so it
is fully testable.
"""
from __future__ import annotations

CURRENCY = "USD"

# Tier catalog, most → least intensive. Chosen by current AEO score.
_TIERS = [
    {
        "key": "overhaul", "name": "Complete Website Correction & AI Optimization",
        "badge": "Flagship", "max_score": 35,
        "price_one_time": 1999, "price_monthly": 399, "timeline_weeks": 8,
        "summary": "A full website overhaul to make your content correctly readable by answer engines. We fix all structural errors, build proper schema, and optimize your entire entity graph.",
        "guarantee": "Significant improvement in AI readability and scan score within 60 days.",
    },
    {
        "key": "builder", "name": "Targeted Correction & Enhancement",
        "badge": "Most popular", "max_score": 60,
        "price_one_time": 999, "price_monthly": 199, "timeline_weeks": 4,
        "summary": "We fix the critical errors holding back your website. Includes schema correction, targeted entity strengthening, and resolving high-severity visibility issues.",
        "guarantee": "Targeted score lift across your weakest categories within 30 days.",
    },
    {
        "key": "accelerator", "name": "Visibility Tune-Up",
        "badge": "Best value", "max_score": 80,
        "price_one_time": 499, "price_monthly": 99, "timeline_weeks": 2,
        "summary": "Your site is mostly correct, but needs a tune-up to ensure continuous AI visibility. We resolve remaining warnings and reinforce your digital presence.",
        "guarantee": "Improved indexing and answer engine mentions in 30 days.",
    },
    {
        "key": "maintenance", "name": "Regular Scan & Monitoring",
        "badge": "Retainer", "max_score": 101,
        "price_one_time": 199, "price_monthly": 49, "timeline_weeks": 1,
        "summary": "Continuous monitoring and regular scans to ensure your website remains correctly optimized as AI models evolve.",
        "guarantee": "Immediate alerts if your visibility drops or new errors are detected.",
    },
]


def _pick_tier(score: float) -> dict:
    for tier in _TIERS:
        if score < tier["max_score"]:
            return tier
    return _TIERS[-1]


def _project_score(score: float, recs: list) -> float:
    """Believable projected score after the engagement implements the fixes."""
    total_lift = sum(int(getattr(r, "impact", 0) or 0) for r in recs)
    realized = min(100 - score, total_lift * 0.8)
    return round(min(95.0, score + realized), 1)


def _alacarte_price(impact: int, severity: str) -> int:
    base = max(100, impact * 100)
    if severity == "high":
        base = int(base * 1.4)
    elif severity == "medium":
        base = int(base * 1.15)
    # round to a clean $50
    return int(round(base / 50.0) * 50)


def _eta_days(severity: str) -> int:
    return {"high": 10, "medium": 7}.get(severity, 4)


def build_offer(overall_score: float | None, category_scores: dict | None,
                recommendations: list) -> dict:
    score = float(overall_score or 0.0)
    recs = list(recommendations or [])
    tier = _pick_tier(score)
    projected = _project_score(score, recs)

    # Deliverables: lead with the high-severity findings, phrased as done-for-you.
    ranked = sorted(recs, key=lambda r: (getattr(r, "severity", "") != "high",
                                         -int(getattr(r, "impact", 0) or 0)))
    deliverables = [f"We implement: {getattr(r, 'title', '')}" for r in ranked[:6]]
    if not deliverables:
        deliverables = ["Full AEO audit and implementation roadmap",
                        "Schema, entity, and knowledge-hub build-out"]

    a_la_carte = [
        {
            "title": getattr(r, "title", ""),
            "category": getattr(r, "category", ""),
            "severity": getattr(r, "severity", "low"),
            "price": _alacarte_price(int(getattr(r, "impact", 0) or 0), getattr(r, "severity", "low")),
            "currency": CURRENCY,
            "eta_days": _eta_days(getattr(r, "severity", "low")),
        }
        for r in ranked[:6]
    ]

    recommended = {
        "tier": tier["key"], "name": tier["name"], "badge": tier["badge"],
        "summary": tier["summary"], "guarantee": tier["guarantee"],
        "price_one_time": tier["price_one_time"], "price_monthly": tier["price_monthly"],
        "currency": CURRENCY, "timeline_weeks": tier["timeline_weeks"],
        "current_score": round(score, 1), "projected_score": projected,
        "est_lift": round(projected - score, 1),
        "deliverables": deliverables,
    }

    all_packages = [
        {k: t[k] for k in ("key", "name", "badge", "price_one_time",
                           "price_monthly", "timeline_weeks", "summary")}
        for t in _TIERS
    ]

    return {
        "headline": "Need help making your website AI-ready?",
        "subhead": "Our experts can correct structural errors, build proper schema, and optimize your entity graph to ensure AI models read and cite your brand correctly.",
        "risk": "Unresolved errors prevent answer engines from trusting and citing your website in their responses.",
        "recommended_package": recommended,
        "all_packages": all_packages,
        "a_la_carte": a_la_carte,
        "cta": "Book a strategy call",
        "cta_secondary": "See what's included",
        "disclaimer": "Indicative pricing for a managed engagement. Final scope "
                      "and quote confirmed on your strategy call.",
    }
