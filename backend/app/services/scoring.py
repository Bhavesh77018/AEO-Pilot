"""AEO scoring engine.

Turns a CrawlResult into:
  - a set of extracted signals (booleans / counts, fully transparent)
  - 8 category scores (0-100)
  - an overall score (weighted mean)
  - per-engine AI Visibility estimates
  - heuristic recommendations

Design principle: every number here is explainable from the signals dict.
No magic — a user can audit exactly why their score is what it is.

⚠️  Per-engine visibility is a *derived proxy* from on-page AEO readiness,
    NOT a live measurement of whether ChatGPT/Gemini/etc. actually cite the
    brand. Live probing is the roadmap "AI Monitoring Agent". We expose the
    derivation so it's never mistaken for ground truth.
"""
from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse

from ..agents.crawler import KNOWLEDGE_PATHS, CrawlResult

# ── Category weights (sum = 1.0) ──────────────────────────────────────
CATEGORY_WEIGHTS = {
    "technical_aeo": 0.12,
    "entity_strength": 0.14,
    "topical_authority": 0.14,
    "schema_coverage": 0.14,
    "answerability": 0.14,
    "ai_readability": 0.12,
    "citation_readiness": 0.10,
    "knowledge_coverage": 0.10,
}

CATEGORY_LABELS = {
    "technical_aeo": "Technical AEO",
    "entity_strength": "Entity Strength",
    "topical_authority": "Topical Authority",
    "schema_coverage": "Schema Coverage",
    "answerability": "Answerability",
    "ai_readability": "AI Readability",
    "citation_readiness": "Citation Readiness",
    "knowledge_coverage": "Knowledge Coverage",
}

# Engines we report. Each has a "bias" vector over categories — i.e. which
# AEO factors most influence visibility in that engine (informed heuristic).
ENGINE_BIAS = {
    "ChatGPT":    {"schema_coverage": 1.1, "answerability": 1.2, "entity_strength": 1.1},
    "GPT Search": {"citation_readiness": 1.2, "technical_aeo": 1.1, "schema_coverage": 1.1},
    "Gemini":     {"entity_strength": 1.2, "topical_authority": 1.1, "knowledge_coverage": 1.1},
    "Claude":     {"answerability": 1.2, "ai_readability": 1.2, "citation_readiness": 1.1},
    "Perplexity": {"citation_readiness": 1.3, "answerability": 1.1, "knowledge_coverage": 1.1},
    "Copilot":    {"schema_coverage": 1.1, "technical_aeo": 1.2, "entity_strength": 1.0},
    "Grok":       {"topical_authority": 1.1, "answerability": 1.1, "ai_readability": 1.0},
    "DeepSeek":   {"ai_readability": 1.2, "topical_authority": 1.1, "schema_coverage": 1.0},
}


@dataclass
class ScoreResult:
    signals: dict
    category_scores: dict
    overall_score: float
    visibility: dict
    recommendations: list[dict]


def _clamp(x: float) -> float:
    return max(0.0, min(100.0, round(x, 1)))


def extract_signals(crawl: CrawlResult) -> dict:
    pages = [p for p in crawl.pages if p.status_code and 200 <= p.status_code < 400]
    n = max(len(pages), 1)

    all_schema_types = {t for p in pages for t in p.schema_types}
    paths = {urlparse(p.url).path.lower() for p in pages}
    knowledge_hits = sorted({k for k in KNOWLEDGE_PATHS if any(k in path for path in paths)})

    pages_with_meta = sum(1 for p in pages if p.meta_description)
    pages_with_title = sum(1 for p in pages if p.title)
    pages_single_h1 = sum(1 for p in pages if p.h1_count == 1)
    faq_pages = sum(1 for p in pages if p.has_faq)
    avg_words = sum(p.word_count for p in pages) / n
    thin_pages = sum(1 for p in pages if p.word_count < 300)

    return {
        "pages_crawled": len(pages),
        "robots_txt": crawl.robots_txt,
        "sitemap_xml": crawl.sitemap_xml,
        "schema_types": sorted(all_schema_types),
        "has_organization_schema": bool({"Organization", "Corporation", "LocalBusiness"} & all_schema_types),
        "has_faq_schema": "FAQPage" in all_schema_types,
        "has_article_schema": bool({"Article", "BlogPosting", "NewsArticle"} & all_schema_types),
        "has_breadcrumb_schema": "BreadcrumbList" in all_schema_types,
        "knowledge_paths": knowledge_hits,
        "knowledge_path_count": len(knowledge_hits),
        "faq_pages": faq_pages,
        "pct_pages_with_meta": round(100 * pages_with_meta / n, 1),
        "pct_pages_with_title": round(100 * pages_with_title / n, 1),
        "pct_pages_single_h1": round(100 * pages_single_h1 / n, 1),
        "avg_word_count": round(avg_words, 1),
        "thin_pages": thin_pages,
    }


def _score_categories(s: dict) -> dict:
    """Each category → {score, label, summary}. Pure functions of signals."""
    cats: dict[str, dict] = {}

    # Technical AEO: crawlability fundamentals
    tech = (
        (20 if s["robots_txt"] else 0)
        + (20 if s["sitemap_xml"] else 0)
        + 0.3 * s["pct_pages_with_title"]
        + 0.3 * s["pct_pages_with_meta"]
    )
    cats["technical_aeo"] = _cat(tech, "robots.txt, sitemap, titles & meta descriptions")

    # Entity Strength: is the brand a well-defined entity?
    ent = (
        (45 if s["has_organization_schema"] else 0)
        + (25 if s["has_breadcrumb_schema"] else 0)
        + min(30, s["knowledge_path_count"] * 6)
    )
    cats["entity_strength"] = _cat(ent, "Organization schema, breadcrumbs, entity coverage")

    # Topical Authority: breadth & depth of content
    topical = min(100, s["pages_crawled"] * 5) * 0.5 + min(100, s["avg_word_count"] / 12) * 0.5
    cats["topical_authority"] = _cat(topical, "content breadth (pages) and depth (avg words)")

    # Schema Coverage
    schema = (
        (30 if s["has_organization_schema"] else 0)
        + (30 if s["has_faq_schema"] else 0)
        + (25 if s["has_article_schema"] else 0)
        + (15 if s["has_breadcrumb_schema"] else 0)
    )
    cats["schema_coverage"] = _cat(schema, "Organization, FAQ, Article, Breadcrumb JSON-LD")

    # Answerability: can an LLM lift a direct answer?
    answer = (
        min(60, s["faq_pages"] * 20)
        + (40 if s["has_faq_schema"] else 0)
    )
    cats["answerability"] = _cat(answer, "FAQ content & FAQPage schema for liftable answers")

    # AI Readability: clean structure, non-thin content
    thin_ratio = s["thin_pages"] / max(s["pages_crawled"], 1)
    readability = 0.6 * s["pct_pages_single_h1"] + 40 * (1 - thin_ratio)
    cats["ai_readability"] = _cat(readability, "clean heading structure, low thin-content ratio")

    # Citation Readiness: article schema + depth signals trust
    citation = (
        (40 if s["has_article_schema"] else 0)
        + min(40, s["avg_word_count"] / 25)
        + (20 if s["knowledge_path_count"] >= 3 else 0)
    )
    cats["citation_readiness"] = _cat(citation, "article schema, depth, supporting resources")

    # Knowledge Coverage: presence of hub sections
    knowledge = min(100, s["knowledge_path_count"] * 14)
    cats["knowledge_coverage"] = _cat(knowledge, "FAQ/guides/glossary/comparisons/use-cases hubs")

    return cats


def _cat(score: float, summary: str) -> dict:
    return {"score": _clamp(score), "summary": summary}


def _overall(cats: dict) -> float:
    return _clamp(sum(cats[k]["score"] * w for k, w in CATEGORY_WEIGHTS.items()))


def _visibility(cats: dict) -> dict:
    """Per-engine estimate: weighted blend of categories tilted by ENGINE_BIAS.

    Derived proxy — see module docstring. Returns {engine: percent}.
    """
    out: dict[str, float] = {}
    base_scores = {k: cats[k]["score"] for k in CATEGORY_WEIGHTS}
    for engine, bias in ENGINE_BIAS.items():
        num = 0.0
        den = 0.0
        for cat, w in CATEGORY_WEIGHTS.items():
            b = bias.get(cat, 1.0)
            num += base_scores[cat] * w * b
            den += w * b
        out[engine] = _clamp(num / den)
    return out


# ── Heuristic recommendation rules ────────────────────────────────────
def _recommendations(s: dict, cats: dict) -> list[dict]:
    recs: list[dict] = []

    def add(category, severity, title, detail, impact):
        recs.append({
            "category": category, "severity": severity, "title": title,
            "detail": detail, "impact": impact, "source": "heuristic",
        })

    if not s["has_organization_schema"]:
        add("entity_strength", "high",
            "Add Organization JSON-LD to your homepage",
            "Answer engines resolve your brand to a knowledge-graph entity via "
            "Organization schema (name, logo, sameAs, founder). Without it, LLMs "
            "struggle to attribute facts and citations to you specifically.", 18)

    if not s["has_faq_schema"]:
        add("answerability", "high",
            "Publish FAQ content with FAQPage schema",
            "FAQ blocks are the single most liftable format for answer engines. "
            "Mark them up with FAQPage JSON-LD so ChatGPT/Perplexity can quote "
            "question→answer pairs directly.", 16)

    if not s["sitemap_xml"]:
        add("technical_aeo", "medium",
            "Expose an XML sitemap",
            "A sitemap helps AI crawlers (and Google) discover every knowledge "
            "page. Add /sitemap.xml and reference it in robots.txt.", 8)

    if not s["robots_txt"]:
        add("technical_aeo", "medium",
            "Add a robots.txt that welcomes AI crawlers",
            "Ensure GPTBot, ClaudeBot, PerplexityBot, Google-Extended etc. are "
            "allowed (or deliberately scoped). A missing robots.txt is a missed "
            "control point.", 6)

    if s["knowledge_path_count"] < 3:
        add("knowledge_coverage", "high",
            "Build out a knowledge hub",
            "You have few of the expected hub sections (FAQ, guides, glossary, "
            "comparisons, use-cases). These are exactly the pages LLMs cite. "
            f"Detected: {', '.join(s['knowledge_paths']) or 'none'}.", 14)

    if not s["has_article_schema"]:
        add("citation_readiness", "medium",
            "Mark up articles with Article/BlogPosting schema",
            "Author, datePublished and headline metadata raise citation trust and "
            "help engines date your expertise.", 9)

    if s["thin_pages"] > 0:
        add("ai_readability", "medium",
            f"Expand {s['thin_pages']} thin page(s)",
            "Pages under ~300 words rarely get cited. Deepen them with concrete "
            "facts, examples, and structured sections.", 7)

    if s["pct_pages_with_meta"] < 80:
        add("technical_aeo", "low",
            "Fill in missing meta descriptions",
            f"Only {s['pct_pages_with_meta']}% of crawled pages have a meta "
            "description. These often seed AI snippets.", 4)

    # Sort by impact desc
    recs.sort(key=lambda r: r["impact"], reverse=True)
    return recs


def score_crawl(crawl: CrawlResult) -> ScoreResult:
    signals = extract_signals(crawl)
    cats = _score_categories(signals)
    overall = _overall(cats)
    visibility = _visibility(cats)
    recs = _recommendations(signals, cats)
    # attach labels for the frontend
    for key, c in cats.items():
        c["label"] = CATEGORY_LABELS[key]
        c["weight"] = CATEGORY_WEIGHTS[key]
    return ScoreResult(
        signals=signals, category_scores=cats, overall_score=overall,
        visibility=visibility, recommendations=recs,
    )
