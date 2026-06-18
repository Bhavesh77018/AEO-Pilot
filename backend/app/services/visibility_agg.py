"""Aggregate per-prompt/per-engine checks into measured visibility metrics.

Pure function over plain dicts (testable without the DB). Each check dict has:
  engine, brand_mentioned (bool), rank (int|None), cited (bool),
  competitors (list[str]), mode ("live"|"simulated").

Outputs the *measured* per-engine visibility that replaces the on-page derived
proxy once a project has been monitored, plus Share of AI Voice.
"""
from __future__ import annotations


def _round(x: float) -> float:
    return round(x, 1)


def _rank_quality(rank: int | None) -> float:
    """rank 1 → 1.0, rank 10+ → 0.1, absent → 0.0."""
    if not rank:
        return 0.0
    r = max(1, min(10, rank))
    return (11 - r) / 10.0


def aggregate(checks: list[dict]) -> dict:
    if not checks:
        return {
            "measured_visibility": {}, "overall_measured": 0.0,
            "mention_rate": 0.0, "citation_rate": 0.0, "share_of_voice": None,
            "avg_rank": None, "engine_detail": {}, "mode_counts": {},
        }

    by_engine: dict[str, list[dict]] = {}
    for c in checks:
        by_engine.setdefault(c["engine"], []).append(c)

    measured: dict[str, float] = {}
    detail: dict[str, dict] = {}
    for engine, items in by_engine.items():
        total = len(items)
        mentioned = [i for i in items if i.get("brand_mentioned")]
        mentions = len(mentioned)
        mention_rate = mentions / total
        ranks = [i["rank"] for i in mentioned if i.get("rank")]
        rank_q = sum(_rank_quality(r) for r in ranks) / mentions if mentions else 0.0
        citations = sum(1 for i in items if i.get("cited"))

        measured[engine] = _round(100 * (0.6 * mention_rate + 0.4 * rank_q))
        detail[engine] = {
            "mention_rate": _round(100 * mention_rate),
            "citation_rate": _round(100 * citations / total),
            "avg_rank": _round(sum(ranks) / len(ranks)) if ranks else None,
            "mentions": mentions,
            "total": total,
        }

    overall = _round(sum(measured.values()) / len(measured)) if measured else 0.0

    total_checks = len(checks)
    brand_mentions = sum(1 for c in checks if c.get("brand_mentioned"))
    competitor_mentions = sum(len(c.get("competitors") or []) for c in checks)
    citations_total = sum(1 for c in checks if c.get("cited"))
    all_ranks = [c["rank"] for c in checks if c.get("brand_mentioned") and c.get("rank")]

    # Share of Voice is only meaningful with competitor signal. Simulated runs
    # carry none (we don't fabricate competitor names), so report null rather
    # than a misleading 100%. Real answers / the Competitor agent populate it.
    denom = brand_mentions + competitor_mentions
    sov = _round(100 * brand_mentions / denom) if competitor_mentions > 0 else None

    mode_counts: dict[str, int] = {}
    for c in checks:
        mode_counts[c.get("mode", "simulated")] = mode_counts.get(c.get("mode", "simulated"), 0) + 1

    return {
        "measured_visibility": measured,
        "overall_measured": overall,
        "mention_rate": _round(100 * brand_mentions / total_checks),
        "citation_rate": _round(100 * citations_total / total_checks),
        "share_of_voice": sov,
        "avg_rank": _round(sum(all_ranks) / len(all_ranks)) if all_ranks else None,
        "engine_detail": detail,
        "mode_counts": mode_counts,
    }
