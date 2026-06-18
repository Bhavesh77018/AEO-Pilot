"""Scan orchestrator.

Runs the agent pipeline for a single scan and persists every step:

    WebsiteAuditor (crawl) ──▶ AEOAnalyzer (score + LLM enrich) ──▶ persist

Each step is recorded as an AgentRun row, giving us the observability spine
that the full multi-agent system will rely on.

This sequential pipeline is intentionally the *seam* where LangGraph slots
in: today the edges are a straight line; as we add the Competitor, Entity
Graph, Citation, Publishing and AI-Monitoring agents, this becomes a real
graph (conditional edges, fan-out, retries). The persistence contract
(AgentRun rows + Scan aggregate) stays identical, so swapping the executor
for a LangGraph `StateGraph` is a localized change — callers don't move.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models import AgentRun, PageSnapshot, Recommendation, Scan
from . import aeo_analyzer, crawler

log = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def run_scan(db: Session, scan: Scan, domain: str) -> Scan:
    """Execute the full pipeline for `scan`, committing results."""
    scan.status = "running"
    db.commit()

    try:
        # ── Step 1: WebsiteAuditor ────────────────────────────────────
        ar = _start(db, scan, "WebsiteAuditor")
        crawl_result = crawler.crawl(domain)
        _finish(db, ar, {"pages": len(crawl_result.pages),
                         "robots_txt": crawl_result.robots_txt,
                         "sitemap_xml": crawl_result.sitemap_xml})

        for p in crawl_result.pages:
            db.add(PageSnapshot(
                scan_id=scan.id, url=p.url, status_code=p.status_code,
                title=p.title, meta_description=p.meta_description,
                word_count=p.word_count, h1_count=p.h1_count,
                schema_types=p.schema_types, has_faq=p.has_faq,
            ))

        # ── Step 2: AEOAnalyzer (scoring + optional LLM) ──────────────
        ar = _start(db, scan, "AEOAnalyzer")
        result = aeo_analyzer.analyze(crawl_result)
        _finish(db, ar, {"overall_score": result.overall_score,
                         "llm_recs": sum(1 for r in result.recommendations if r["source"] == "llm")})

        for r in result.recommendations:
            db.add(Recommendation(scan_id=scan.id, **r))

        # ── Aggregate onto the Scan ───────────────────────────────────
        scan.pages_crawled = result.signals["pages_crawled"]
        scan.overall_score = result.overall_score
        scan.category_scores = result.category_scores
        scan.visibility = result.visibility
        scan.signals = result.signals
        scan.status = "completed"
        scan.completed_at = _now()
        db.commit()
        log.info("Scan %s completed: %.1f", scan.id, result.overall_score)

    except Exception as e:  # mark failed, surface the error to the API
        log.exception("Scan %s failed", scan.id)
        scan.status = "failed"
        scan.error = str(e)
        scan.completed_at = _now()
        db.commit()

    db.refresh(scan)
    return scan


def _start(db: Session, scan: Scan, agent: str) -> AgentRun:
    ar = AgentRun(scan_id=scan.id, agent=agent, status="running")
    db.add(ar)
    db.commit()
    db.refresh(ar)
    return ar


def _finish(db: Session, ar: AgentRun, output: dict) -> None:
    ar.status = "completed"
    ar.output = output
    ar.finished_at = _now()
    db.commit()
