"""Celery worker scaffold.

The MVP runs scans inline (FastAPI BackgroundTasks). This module is the
drop-in async path: point the API's scan trigger at `enqueue_scan.delay(...)`
instead of a BackgroundTask once scans get heavy (deep crawls, real LLM
visibility probing, competitor sweeps).

Start a worker with:
    celery -A app.worker.celery_app worker --loglevel=info
"""
from __future__ import annotations

from celery import Celery

from .config import settings
from .db import SessionLocal
from .models import Scan

celery_app = Celery("aeo", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(task_track_started=True, task_time_limit=600)


@celery_app.task(name="aeo.run_scan", bind=True, max_retries=2)
def enqueue_scan(self, scan_id: str, domain: str) -> dict:
    from .agents.orchestrator import run_scan  # local import avoids circulars

    db = SessionLocal()
    try:
        scan = db.get(Scan, scan_id)
        if not scan:
            return {"error": "scan not found", "scan_id": scan_id}
        scan = run_scan(db, scan, domain)
        return {"scan_id": scan_id, "status": scan.status, "score": scan.overall_score}
    finally:
        db.close()
