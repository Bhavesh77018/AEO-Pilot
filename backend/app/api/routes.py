"""REST API routes: projects + scans.

MVP runs scans inline via FastAPI BackgroundTasks (no Redis hop required).
The Celery path is scaffolded in app/worker.py for when scans get heavier.
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..agents.ai_monitor import run_monitoring
from ..agents.orchestrator import run_scan
from ..config import settings
from ..db import SessionLocal, get_db
from ..models import MonitoringRun, PageSnapshot, Project, Prompt, Scan, Subscription
from ..schemas import (
    BillingConfig,
    MonitoringRunDetail,
    MonitoringRunSummary,
    OrderCreate,
    OrderOut,
    PaymentResult,
    PaymentVerify,
    ProjectCreate,
    ProjectOut,
    PromptCreate,
    PromptOut,
    PromptSuggestion,
    ScanDetail,
    ScanSummary,
)
from ..services import billing, prompt_suggester, service_offer

router = APIRouter(prefix="/api/v1")


# ── Projects ──────────────────────────────────────────────────────────
@router.post("/projects", response_model=ProjectOut, status_code=201)
def create_project(body: ProjectCreate, db: Session = Depends(get_db)):
    domain = body.domain.strip().replace("https://", "").replace("http://", "").strip("/")
    if not domain or "." not in domain:
        raise HTTPException(422, "Provide a valid domain, e.g. stripe.com")
    project = Project(name=body.name or domain, domain=domain)
    db.add(project)
    db.commit()
    db.refresh(project)
    return _project_out(project)


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    projects = db.scalars(select(Project).order_by(Project.created_at.desc())).all()
    return [_project_out(p) for p in projects]


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return _project_out(project)


# ── Scans ─────────────────────────────────────────────────────────────
@router.post("/projects/{project_id}/scans", response_model=ScanSummary, status_code=202)
def start_scan(
    project_id: str,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    scan = Scan(project_id=project.id, status="pending")
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # Run inline in a background task with its own DB session.
    background.add_task(_run_scan_task, scan.id, project.domain)
    return scan


def _run_scan_task(scan_id: str, domain: str) -> None:
    db = SessionLocal()
    try:
        scan = db.get(Scan, scan_id)
        if scan:
            run_scan(db, scan, domain)
    finally:
        db.close()


@router.get("/projects/{project_id}/scans", response_model=list[ScanSummary])
def list_scans(project_id: str, db: Session = Depends(get_db)):
    scans = db.scalars(
        select(Scan).where(Scan.project_id == project_id).order_by(Scan.created_at.desc())
    ).all()
    return scans


@router.get("/scans/{scan_id}", response_model=ScanDetail)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Scan not found")
    # Attach the Done-For-You service offer (computed fresh from findings).
    if scan.status == "completed":
        scan.service_offer = service_offer.build_offer(
            scan.overall_score, scan.category_scores, scan.recommendations
        )
    return scan


# ── Phase 2: prompts ──────────────────────────────────────────────────
@router.get("/projects/{project_id}/prompts", response_model=list[PromptOut])
def list_prompts(project_id: str, db: Session = Depends(get_db)):
    _require_project(db, project_id)
    return db.scalars(
        select(Prompt).where(Prompt.project_id == project_id).order_by(Prompt.created_at)
    ).all()


@router.post("/projects/{project_id}/prompts", response_model=PromptOut, status_code=201)
def add_prompt(project_id: str, body: PromptCreate, db: Session = Depends(get_db)):
    _require_project(db, project_id)
    prompt = Prompt(project_id=project_id, text=body.text.strip(), intent=body.intent)
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.post("/projects/{project_id}/prompts/suggest", response_model=list[PromptOut], status_code=201)
def suggest_prompts(project_id: str, db: Session = Depends(get_db)):
    """Generate buyer-intent prompts (LLM if a key is set, else templates) and
    persist them so the project is immediately monitorable."""
    project = _require_project(db, project_id)
    context = _homepage_context(db, project)
    suggestions = prompt_suggester.suggest(project.name, project.domain, context)
    created = []
    for s in suggestions:
        prompt = Prompt(project_id=project_id, text=s["text"], intent=s.get("intent", "category"))
        db.add(prompt)
        created.append(prompt)
    db.commit()
    for p in created:
        db.refresh(p)
    return created


@router.delete("/prompts/{prompt_id}", status_code=204)
def delete_prompt(prompt_id: str, db: Session = Depends(get_db)):
    prompt = db.get(Prompt, prompt_id)
    if prompt:
        db.delete(prompt)
        db.commit()


# ── Phase 2: AI monitoring runs ───────────────────────────────────────
@router.post("/projects/{project_id}/monitor", response_model=MonitoringRunSummary, status_code=202)
def start_monitoring(project_id: str, background: BackgroundTasks, db: Session = Depends(get_db)):
    project = _require_project(db, project_id)

    # Make the project monitorable out of the box: seed prompts if none exist.
    if not any(p.active for p in project.prompts):
        context = _homepage_context(db, project)
        for s in prompt_suggester.suggest(project.name, project.domain, context):
            db.add(Prompt(project_id=project_id, text=s["text"], intent=s.get("intent", "category")))
        db.commit()

    run = MonitoringRun(project_id=project_id, status="pending",
                        engines=list(settings.monitored_engines))
    db.add(run)
    db.commit()
    db.refresh(run)

    background.add_task(_run_monitoring_task, run.id)
    return run


def _run_monitoring_task(run_id: str) -> None:
    db = SessionLocal()
    try:
        run = db.get(MonitoringRun, run_id)
        if run:
            run_monitoring(db, run, run.project)
    finally:
        db.close()


@router.get("/projects/{project_id}/monitor", response_model=list[MonitoringRunSummary])
def list_monitoring_runs(project_id: str, db: Session = Depends(get_db)):
    _require_project(db, project_id)
    return db.scalars(
        select(MonitoringRun).where(MonitoringRun.project_id == project_id)
        .order_by(MonitoringRun.created_at.desc())
    ).all()


@router.get("/monitor/{run_id}", response_model=MonitoringRunDetail)
def get_monitoring_run(run_id: str, db: Session = Depends(get_db)):
    run = db.get(MonitoringRun, run_id)
    if not run:
        raise HTTPException(404, "Monitoring run not found")
    return run


# ── Billing (Razorpay) ────────────────────────────────────────────────
@router.get("/billing/config", response_model=BillingConfig)
def billing_config():
    return BillingConfig(
        enabled=billing.is_enabled(),
        key_id=settings.razorpay_key_id if billing.is_enabled() else None,
        currency=billing.CURRENCY,
    )


@router.post("/billing/order", response_model=OrderOut)
def create_order(body: OrderCreate, db: Session = Depends(get_db)):
    if not billing.is_enabled():
        raise HTTPException(503, "Billing is not configured")
    try:
        amount = billing.amount_paise(body.plan, body.period)
    except ValueError as e:
        raise HTTPException(400, str(e))

    sub = Subscription(
        email=body.email, plan=body.plan, period=body.period,
        amount=amount, currency=billing.CURRENCY, status="created",
    )
    db.add(sub)
    db.flush()  # get sub.id for the receipt

    try:
        order = billing.create_order(
            amount=amount, receipt=f"sub_{sub.id[:18]}",
            notes={"plan": body.plan, "period": body.period, "email": body.email or ""},
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(502, f"Razorpay order creation failed: {e}")

    sub.razorpay_order_id = order["id"]
    db.commit()
    db.refresh(sub)

    return OrderOut(
        subscription_id=sub.id, order_id=order["id"], amount=amount,
        currency=billing.CURRENCY, key_id=settings.razorpay_key_id,
        plan=body.plan, period=body.period,
    )


@router.post("/billing/verify", response_model=PaymentResult)
def verify_payment(body: PaymentVerify, db: Session = Depends(get_db)):
    sub = db.get(Subscription, body.subscription_id)
    if not sub:
        raise HTTPException(404, "Subscription not found")

    ok = billing.verify_signature(
        body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature
    )
    sub.razorpay_payment_id = body.razorpay_payment_id
    sub.razorpay_signature = body.razorpay_signature
    sub.status = "active" if ok else "failed"
    db.commit()

    if not ok:
        raise HTTPException(400, "Payment signature verification failed")
    return PaymentResult(status="active")


# ── helpers ───────────────────────────────────────────────────────────
def _require_project(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return project


def _homepage_context(db: Session, project: Project) -> str | None:
    """Title + meta of the latest scan's homepage, to ground prompt suggestions."""
    latest = project.scans[0] if project.scans else None
    if not latest:
        return None
    page = db.scalars(
        select(PageSnapshot).where(PageSnapshot.scan_id == latest.id).limit(1)
    ).first()
    if not page:
        return None
    return " | ".join(filter(None, [page.title, page.meta_description]))



def _project_out(project: Project) -> ProjectOut:
    latest = project.scans[0] if project.scans else None
    return ProjectOut(
        id=project.id, name=project.name, domain=project.domain,
        created_at=project.created_at,
        latest_scan_id=latest.id if latest else None,
        latest_score=latest.overall_score if latest else None,
    )
