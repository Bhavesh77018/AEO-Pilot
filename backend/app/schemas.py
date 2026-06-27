"""Pydantic request/response schemas (API contracts)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Projects ──────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str | None = Field(default=None, description="Display name; defaults to the domain")
    domain: str = Field(description="Bare domain or URL, e.g. stripe.com")

class ContactCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None
    domain: str | None = None
    message: str | None = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    domain: str
    created_at: datetime
    latest_scan_id: str | None = None
    latest_score: float | None = None


# ── Scans ─────────────────────────────────────────────────────────────
class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    category: str
    severity: str
    title: str
    detail: str
    impact: int
    source: str


class PageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    url: str
    status_code: int | None
    title: str | None
    word_count: int
    h1_count: int
    schema_types: list[str] | None
    has_faq: bool


class ScanSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    status: str
    overall_score: float | None
    pages_crawled: int
    visibility: dict[str, float] | None
    created_at: datetime
    completed_at: datetime | None


class ScanDetail(ScanSummary):
    category_scores: dict | None
    signals: dict | None
    error: str | None
    recommendations: list[RecommendationOut] = []
    pages: list[PageOut] = []
    # Done-For-You managed-service pitch derived from the findings (monetization)
    service_offer: dict | None = None


# ── Phase 2: prompts & AI monitoring ──────────────────────────────────
class PromptCreate(BaseModel):
    text: str = Field(min_length=3, max_length=500)
    intent: str = "custom"


class PromptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    text: str
    intent: str
    active: bool
    created_at: datetime


class PromptSuggestion(BaseModel):
    text: str
    intent: str


class VisibilityCheckOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    prompt_id: str
    prompt_text: str
    engine: str
    mode: str
    model: str | None
    brand_mentioned: bool
    rank: int | None
    cited: bool
    competitors: list[str] | None
    citations: list[str] | None
    answer_text: str | None


class MonitoringRunSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    status: str
    checks_total: int
    has_live: bool
    summary: dict | None
    created_at: datetime
    completed_at: datetime | None


class MonitoringRunDetail(MonitoringRunSummary):
    error: str | None
    engines: list[str] | None
    checks: list[VisibilityCheckOut] = []


# ── Billing (Razorpay) ────────────────────────────────────────────────
class BillingConfig(BaseModel):
    enabled: bool
    key_id: str | None = None
    currency: str = "INR"


class OrderCreate(BaseModel):
    plan: str
    period: str = "monthly"
    email: str | None = None


class OrderOut(BaseModel):
    subscription_id: str
    order_id: str
    amount: int
    currency: str
    key_id: str
    plan: str
    period: str


class PaymentVerify(BaseModel):
    subscription_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentResult(BaseModel):
    status: str  # active | failed
