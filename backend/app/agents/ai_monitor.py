"""AIMonitoringAgent (Agent 13) + VisibilityTracking (Agent 14).

Sweeps every active prompt across every monitored engine, records what each
engine answered and whether the brand surfaced, then aggregates the run into
measured per-engine visibility + Share of AI Voice.

This is the Phase 2 differentiator: it replaces the on-page *derived proxy*
with *measured* visibility. Live where keys exist, deterministically simulated
(and labeled) otherwise.

MVP runs the sweep inline (FastAPI BackgroundTask). At scale this moves to a
Celery task fanning engine probes out concurrently — the persistence contract
(MonitoringRun + VisibilityCheck rows) is identical.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..config import settings
from ..models import MonitoringRun, Project, Scan, VisibilityCheck
from ..services import answer_analysis, engines, visibility_agg

log = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _latest_aeo_score(project: Project) -> float:
    for scan in project.scans:  # ordered created_at desc
        if scan.status == "completed" and scan.overall_score is not None:
            return scan.overall_score
    return 0.0


def run_monitoring(db: Session, run: MonitoringRun, project: Project) -> MonitoringRun:
    run.status = "running"
    db.commit()

    try:
        prompts = [p for p in project.prompts if p.active]
        if not prompts:
            raise RuntimeError("No active prompts to monitor — add or suggest prompts first.")

        engine_list = run.engines or settings.monitored_engines
        brand = project.name
        domain = project.domain
        aeo_score = _latest_aeo_score(project)

        check_dicts: list[dict] = []
        has_live = False

        for prompt in prompts:
            for engine in engine_list:
                ans = engines.probe(engine, prompt.text, brand, aeo_score)
                if ans.mode == "live":
                    has_live = True
                    analysis = answer_analysis.analyze_live(ans, brand, domain)
                else:
                    analysis = ans.analysis or engines.AnswerAnalysis()

                check = VisibilityCheck(
                    run_id=run.id, prompt_id=prompt.id, prompt_text=prompt.text,
                    engine=engine, mode=ans.mode, model=ans.model,
                    answer_text=ans.answer_text,
                    brand_mentioned=analysis.brand_mentioned, rank=analysis.rank,
                    cited=analysis.cited, competitors=analysis.competitors,
                    citations=ans.citations,
                )
                db.add(check)
                check_dicts.append({
                    "engine": engine, "brand_mentioned": analysis.brand_mentioned,
                    "rank": analysis.rank, "cited": analysis.cited,
                    "competitors": analysis.competitors, "mode": ans.mode,
                })

        summary = visibility_agg.aggregate(check_dicts)
        summary["aeo_score"] = aeo_score  # anchor for the "improve AEO → visibility" story

        run.checks_total = len(check_dicts)
        run.has_live = has_live
        run.summary = summary
        run.status = "completed"
        run.completed_at = _now()
        db.commit()
        log.info("Monitoring run %s: %d checks, overall_measured=%.1f",
                 run.id, len(check_dicts), summary["overall_measured"])

    except Exception as e:
        log.exception("Monitoring run %s failed", run.id)
        run.status = "failed"
        run.error = str(e)
        run.completed_at = _now()
        db.commit()

    db.refresh(run)
    return run
