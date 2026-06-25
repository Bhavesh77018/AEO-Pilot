"""SQLAlchemy models — the MVP subset of the full schema.

Full target schema (Users, Keywords, Entities, Competitors, FAQs,
KnowledgePages, VisibilityReports, AgentRuns, Recommendations, ...) is laid
out in docs/ARCHITECTURE.md. Here we materialize the tables the vertical
slice actually uses: Project, Scan, PageSnapshot, Recommendation, plus a
lightweight AgentRun audit row.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255))
    domain: Mapped[str] = mapped_column(String(255), index=True)
    # Owner — the Supabase auth user. Nullable for legacy/dev rows.
    user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    scans: Mapped[list["Scan"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", order_by="Scan.created_at.desc()"
    )
    prompts: Mapped[list["Prompt"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", order_by="Prompt.created_at"
    )
    monitoring_runs: Mapped[list["MonitoringRun"]] = relationship(
        back_populates="project", cascade="all, delete-orphan",
        order_by="MonitoringRun.created_at.desc()",
    )


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending|running|completed|failed
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    pages_crawled: Mapped[int] = mapped_column(Integer, default=0)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # category_scores: {category: {score, signals, ...}}
    category_scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # visibility: {engine: percent}
    visibility: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # raw extracted signals, for transparency / debugging
    signals: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="scans")
    pages: Mapped[list["PageSnapshot"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )
    agent_runs: Mapped[list["AgentRun"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )


class PageSnapshot(Base):
    __tablename__ = "page_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    scan_id: Mapped[str] = mapped_column(ForeignKey("scans.id"), index=True)
    url: Mapped[str] = mapped_column(String(2048))
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    h1_count: Mapped[int] = mapped_column(Integer, default=0)
    schema_types: Mapped[list | None] = mapped_column(JSON, nullable=True)
    has_faq: Mapped[bool] = mapped_column(default=False)

    scan: Mapped["Scan"] = relationship(back_populates="pages")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    scan_id: Mapped[str] = mapped_column(ForeignKey("scans.id"), index=True)
    category: Mapped[str] = mapped_column(String(64))
    severity: Mapped[str] = mapped_column(String(16))  # high|medium|low
    title: Mapped[str] = mapped_column(String(512))
    detail: Mapped[str] = mapped_column(Text)
    impact: Mapped[int] = mapped_column(Integer, default=0)  # 0-100 estimated lift
    source: Mapped[str] = mapped_column(String(16), default="heuristic")  # heuristic|llm

    scan: Mapped["Scan"] = relationship(back_populates="recommendations")


class AgentRun(Base):
    """Audit trail for agent executions — the observability spine of the
    eventual multi-agent system. MVP records the crawler/analyzer passes."""

    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    scan_id: Mapped[str] = mapped_column(ForeignKey("scans.id"), index=True)
    agent: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(16), default="completed")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    output: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    scan: Mapped["Scan"] = relationship(back_populates="agent_runs")


# ── Phase 2: AI Monitoring / Visibility Tracking ──────────────────────
class Prompt(Base):
    """A natural-language query a buyer might ask an answer engine, e.g.
    'best battery-swapping company in India'. We track whether the brand
    surfaces in each engine's answer over time."""

    __tablename__ = "prompts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    intent: Mapped[str] = mapped_column(String(32), default="custom")  # category|comparison|alternative|branded|custom
    active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    project: Mapped["Project"] = relationship(back_populates="prompts")


class MonitoringRun(Base):
    """One sweep of all active prompts × monitored engines for a project."""

    __tablename__ = "monitoring_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending|running|completed|failed
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    engines: Mapped[list | None] = mapped_column(JSON, nullable=True)
    checks_total: Mapped[int] = mapped_column(Integer, default=0)
    # aggregate: {measured_visibility: {engine: pct}, share_of_voice, mention_rate, ...}
    summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # any live (non-simulated) probing happened this run?
    has_live: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="monitoring_runs")
    checks: Mapped[list["VisibilityCheck"]] = relationship(
        back_populates="run", cascade="all, delete-orphan"
    )


class VisibilityCheck(Base):
    """Result of probing ONE engine with ONE prompt at one point in time."""

    __tablename__ = "visibility_checks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    run_id: Mapped[str] = mapped_column(ForeignKey("monitoring_runs.id"), index=True)
    prompt_id: Mapped[str] = mapped_column(ForeignKey("prompts.id"), index=True)
    prompt_text: Mapped[str] = mapped_column(Text)  # snapshot
    engine: Mapped[str] = mapped_column(String(32))
    mode: Mapped[str] = mapped_column(String(16), default="simulated")  # live|simulated
    model: Mapped[str | None] = mapped_column(String(64), nullable=True)

    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand_mentioned: Mapped[bool] = mapped_column(default=False)
    rank: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1 = first; null = absent
    cited: Mapped[bool] = mapped_column(default=False)
    competitors: Mapped[list | None] = mapped_column(JSON, nullable=True)
    citations: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    run: Mapped["MonitoringRun"] = relationship(back_populates="checks")


# ── Billing (Razorpay) ────────────────────────────────────────────────
class Subscription(Base):
    """A billing record created when a user starts checkout for a plan.

    Tied to the buyer's email (passed from the authenticated frontend). Moves
    created → active once Razorpay confirms payment and the signature verifies.
    """

    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    plan: Mapped[str] = mapped_column(String(32))          # growth | agency | ...
    period: Mapped[str] = mapped_column(String(16))        # monthly | annual
    amount: Mapped[int] = mapped_column(Integer)           # smallest unit (paise)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    status: Mapped[str] = mapped_column(String(16), default="created")  # created|active|failed

    razorpay_order_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    razorpay_signature: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
