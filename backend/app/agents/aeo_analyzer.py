"""AEOAnalyzer agent.

Consumes a CrawlResult, runs the deterministic scoring engine, then —
*only if an LLM provider key is configured* — asks the model for a handful
of higher-order, brand-specific recommendations the heuristics can't see.

The LLM call is strictly additive and wrapped so any failure (no key, rate
limit, bad JSON) leaves the heuristic output intact.
"""
from __future__ import annotations

import logging

from ..agents.crawler import CrawlResult
from ..llm import get_provider
from ..services.scoring import ScoreResult, score_crawl

log = logging.getLogger(__name__)

_LLM_SYSTEM = (
    "You are a Search Visibility strategist covering SEO (Google/Bing ranking), "
    "AEO (answer engines & snippets), and GEO (getting cited by generative AI "
    "like ChatGPT, Gemini, Claude, Perplexity). Be specific and actionable. "
    "Return ONLY valid JSON."
)

_LLM_CATEGORIES = (
    "technical_seo, onpage_seo, content_structure, schema_coverage, "
    "answerability, entity_strength, ai_readability, knowledge_coverage, "
    "citation_readiness"
)


def analyze(crawl: CrawlResult) -> ScoreResult:
    result = score_crawl(crawl)
    _maybe_enrich_with_llm(crawl, result)
    return result


def _maybe_enrich_with_llm(crawl: CrawlResult, result: ScoreResult) -> None:
    provider = get_provider()
    if not provider.available:
        return  # heuristics-only path — the default with no key

    titles = [p.title for p in crawl.pages if p.title][:10]
    prompt = (
        f"Brand site: {crawl.base_url}\n"
        f"Overall Search Visibility score: {result.overall_score}/100\n"
        f"Pillar scores: "
        + ", ".join(f"{k}={v['score']}" for k, v in result.pillars.items())
        + f"\nCategory scores: "
        + ", ".join(f"{k}={v['score']}" for k, v in result.category_scores.items())
        + f"\nDetected schema types: {result.signals['schema_types']}\n"
        f"Knowledge hubs present: {result.signals['knowledge_paths']}\n"
        f"Sample page titles: {titles}\n\n"
        "Give 3 high-leverage, brand-specific recommendations across SEO, AEO and "
        "GEO that go BEYOND generic schema/FAQ advice. For each, return an object "
        f"with keys: category (one of {_LLM_CATEGORIES}), severity (high|medium|"
        "low), title (<=80 chars), detail (2-3 sentences), impact (0-25 integer). "
        "Return a JSON array of exactly 3 objects."
    )
    try:
        items = provider.complete_json(prompt, system=_LLM_SYSTEM)
        if not isinstance(items, list):
            return
        for it in items[:3]:
            if not isinstance(it, dict) or "title" not in it:
                continue
            result.recommendations.append({
                "category": it.get("category", "entity_strength"),
                "severity": it.get("severity", "medium"),
                "title": str(it["title"])[:512],
                "detail": str(it.get("detail", "")),
                "impact": int(it.get("impact", 5)),
                "source": "llm",
            })
        result.recommendations.sort(key=lambda r: r["impact"], reverse=True)
    except Exception as e:  # never let enrichment break a scan
        log.warning("LLM enrichment skipped: %s", e)
