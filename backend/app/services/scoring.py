"""Search Visibility scoring engine — SEO + AEO + GEO in one place.

Turns a CrawlResult into:
  - extracted signals (booleans / counts, fully transparent)
  - 9 category scores grouped into 3 PILLARS:
      SEO  — rank in classic search (Google, Bing)
      AEO  — be the answer in answer engines, snippets & voice
      GEO  — get cited / synthesized by generative AI (ChatGPT, Perplexity)
  - an overall **Search Visibility Score** (weighted mean of the pillars)
  - per-engine AI Visibility estimates (a GEO-side derived proxy)
  - prioritized recommendations (each tied to a category → pillar)

Every number is explainable from the signals dict. No external/paid data — all
three pillars are computed from the on-page crawl.

⚠️  Per-engine visibility is a *derived proxy* from on-page readiness, NOT a live
    measurement of whether ChatGPT/Gemini/etc. actually cite the brand. Live
    probing is the AI Monitoring Agent.
"""
from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse

from ..agents.crawler import KNOWLEDGE_PATHS, CrawlResult

# ── Pillars ───────────────────────────────────────────────────────────
PILLARS = {
    "seo": {"label": "SEO", "weight": 0.34, "tagline": "Rank in classic search (Google, Bing)."},
    "aeo": {"label": "AEO", "weight": 0.33, "tagline": "Be the answer in AI answer engines & snippets."},
    "geo": {"label": "GEO", "weight": 0.33, "tagline": "Get cited by generative AI (ChatGPT, Perplexity)."},
}

# category key -> (pillar, label, weight-within-pillar)
CATEGORY_META: dict[str, tuple[str, str, float]] = {
    # SEO
    "technical_seo":      ("seo", "Technical SEO", 0.40),
    "onpage_seo":         ("seo", "On-Page SEO", 0.35),
    "content_structure":  ("seo", "Content & Structure", 0.25),
    # AEO
    "schema_coverage":    ("aeo", "Schema Coverage", 0.34),
    "answerability":      ("aeo", "Answerability", 0.33),
    "entity_strength":    ("aeo", "Entity Strength", 0.33),
    # GEO
    "ai_readability":     ("geo", "AI Readability", 0.34),
    "knowledge_coverage": ("geo", "Knowledge Coverage", 0.33),
    "citation_readiness": ("geo", "Citation Readiness", 0.33),
}

# Per-engine "bias" — which categories most influence visibility in that engine.
# AI engines lean on AEO/GEO categories. Default weight is 1.0 for any category
# not listed.
ENGINE_BIAS = {
    "ChatGPT":    {"schema_coverage": 1.2, "answerability": 1.3, "entity_strength": 1.1, "citation_readiness": 1.1},
    "GPT Search": {"citation_readiness": 1.3, "schema_coverage": 1.1, "technical_seo": 1.1},
    "Gemini":     {"entity_strength": 1.2, "knowledge_coverage": 1.2, "content_structure": 1.1},
    "Claude":     {"answerability": 1.2, "ai_readability": 1.3, "citation_readiness": 1.1},
    "Perplexity": {"citation_readiness": 1.4, "answerability": 1.1, "knowledge_coverage": 1.1},
    "Copilot":    {"schema_coverage": 1.1, "technical_seo": 1.2, "entity_strength": 1.0},
    "Grok":       {"knowledge_coverage": 1.1, "answerability": 1.1, "ai_readability": 1.0},
    "DeepSeek":   {"ai_readability": 1.2, "content_structure": 1.1, "schema_coverage": 1.0},
}


@dataclass
class ScoreResult:
    signals: dict
    category_scores: dict
    overall_score: float
    visibility: dict
    recommendations: list[dict]
    pillars: dict


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

    # SEO signals
    total_imgs = sum(p.image_count for p in pages)
    imgs_alt = sum(p.images_with_alt for p in pages)

    return {
        "pages_crawled": len(pages),
        "robots_txt": crawl.robots_txt,
        "sitemap_xml": crawl.sitemap_xml,
        "llms_txt": crawl.llms_txt,
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
        "pct_https": round(100 * sum(1 for p in pages if p.https) / n, 1),
        "pct_canonical": round(100 * sum(1 for p in pages if p.canonical) / n, 1),
        "pct_viewport": round(100 * sum(1 for p in pages if p.has_viewport) / n, 1),
        "pct_og": round(100 * sum(1 for p in pages if p.has_og) / n, 1),
        "image_alt_pct": round(100 * imgs_alt / total_imgs, 1) if total_imgs else 100.0,
        "avg_internal_links": round(sum(len(p.internal_links) for p in pages) / n, 1),
        "avg_word_count": round(avg_words, 1),
        "thin_pages": thin_pages,
    }


def _cat(score: float, summary: str) -> dict:
    return {"score": _clamp(score), "summary": summary}


def _score_categories(s: dict) -> dict:
    cats: dict[str, dict] = {}

    # ── SEO ───────────────────────────────────────────────────────────
    cats["technical_seo"] = _cat(
        0.25 * s["pct_https"] + 0.25 * s["pct_canonical"] + 0.20 * s["pct_viewport"]
        + (15 if s["robots_txt"] else 0) + (15 if s["sitemap_xml"] else 0),
        "HTTPS, canonical tags, mobile viewport, robots.txt, sitemap",
    )
    cats["onpage_seo"] = _cat(
        0.35 * s["pct_pages_with_title"] + 0.35 * s["pct_pages_with_meta"]
        + 0.30 * s["pct_pages_single_h1"],
        "title tags, meta descriptions, one H1 per page",
    )
    cats["content_structure"] = _cat(
        min(100, s["avg_internal_links"] * 6) * 0.4 + s["image_alt_pct"] * 0.3
        + min(100, s["avg_word_count"] / 10) * 0.3,
        "internal linking, image alt text, content depth",
    )

    # ── AEO ───────────────────────────────────────────────────────────
    cats["schema_coverage"] = _cat(
        (30 if s["has_organization_schema"] else 0) + (30 if s["has_faq_schema"] else 0)
        + (25 if s["has_article_schema"] else 0) + (15 if s["has_breadcrumb_schema"] else 0),
        "Organization, FAQ, Article, Breadcrumb JSON-LD",
    )
    cats["answerability"] = _cat(
        min(60, s["faq_pages"] * 20) + (40 if s["has_faq_schema"] else 0),
        "FAQ content & FAQPage schema for liftable answers",
    )
    cats["entity_strength"] = _cat(
        (45 if s["has_organization_schema"] else 0) + (25 if s["has_breadcrumb_schema"] else 0)
        + min(30, s["knowledge_path_count"] * 6),
        "Organization schema, breadcrumbs, entity coverage",
    )

    # ── GEO ───────────────────────────────────────────────────────────
    thin_ratio = s["thin_pages"] / max(s["pages_crawled"], 1)
    cats["ai_readability"] = _cat(
        0.6 * s["pct_pages_single_h1"] + 40 * (1 - thin_ratio),
        "clean heading structure, low thin-content ratio, semantic HTML",
    )
    cats["knowledge_coverage"] = _cat(
        min(100, s["knowledge_path_count"] * 14),
        "FAQ/guides/glossary/comparisons/use-cases hubs",
    )
    cats["citation_readiness"] = _cat(
        (20 if s["llms_txt"] else 0) + (35 if s["has_article_schema"] else 0)
        + min(30, s["avg_word_count"] / 25) + (15 if s["knowledge_path_count"] >= 3 else 0),
        "llms.txt, article schema, depth, supporting resources",
    )

    # attach metadata
    for key, c in cats.items():
        pillar, label, weight = CATEGORY_META[key]
        c["label"], c["pillar"], c["weight"] = label, pillar, weight
    return cats


def _pillar_scores(cats: dict) -> dict:
    out: dict[str, dict] = {}
    for pkey, meta in PILLARS.items():
        keys = [k for k, (p, _, _) in CATEGORY_META.items() if p == pkey]
        num = sum(cats[k]["score"] * CATEGORY_META[k][2] for k in keys)
        den = sum(CATEGORY_META[k][2] for k in keys)
        out[pkey] = {
            "label": meta["label"], "tagline": meta["tagline"],
            "weight": meta["weight"], "score": _clamp(num / den),
            "categories": keys,
        }
    return out


def _overall(pillars: dict) -> float:
    return _clamp(sum(pillars[k]["score"] * PILLARS[k]["weight"] for k in PILLARS))


def _visibility(cats: dict) -> dict:
    base = {k: cats[k]["score"] for k in CATEGORY_META}
    out: dict[str, float] = {}
    for engine, bias in ENGINE_BIAS.items():
        num = den = 0.0
        for k in CATEGORY_META:
            w = bias.get(k, 1.0)
            num += base[k] * w
            den += w
        out[engine] = _clamp(num / den)
    return out


# ── Recommendation rules (each tied to a category → pillar) ────────────
def _recommendations(s: dict, cats: dict) -> list[dict]:
    recs: list[dict] = []

    def add(category, severity, title, detail, impact):
        recs.append({"category": category, "severity": severity, "title": title,
                     "detail": detail, "impact": impact, "source": "heuristic"})

    # SEO
    if s["pct_https"] < 100:
        add("technical_seo", "high" if s["pct_https"] < 50 else "medium",
            "Serve every page over HTTPS",
            "HTTPS is a baseline ranking and trust signal for Google and a hard "
            "requirement for many AI crawlers. Redirect all HTTP traffic to HTTPS.", 12)
    if s["pct_canonical"] < 70:
        add("technical_seo", "medium", "Add canonical tags",
            "Canonical tags prevent duplicate-content dilution and tell search "
            f"engines the preferred URL. Only {s['pct_canonical']}% of pages have one.", 7)
    if s["pct_viewport"] < 80:
        add("technical_seo", "medium", "Add a mobile viewport meta tag",
            "Mobile-friendliness is a Google ranking factor. Add "
            "<meta name=viewport content='width=device-width, initial-scale=1'>.", 6)
    if not s["robots_txt"] or not s["sitemap_xml"]:
        add("technical_seo", "medium", "Expose robots.txt and an XML sitemap",
            "These help every crawler (Google and AI) discover your pages. "
            "Add /robots.txt and /sitemap.xml and reference the sitemap in robots.", 6)
    if s["pct_pages_with_title"] < 90 or s["pct_pages_with_meta"] < 80:
        add("onpage_seo", "medium", "Fill in missing titles & meta descriptions",
            f"Titles on {s['pct_pages_with_title']}% and meta descriptions on "
            f"{s['pct_pages_with_meta']}% of pages. Both shape search snippets and AI summaries.", 8)
    if s["image_alt_pct"] < 70:
        add("content_structure", "low", "Add alt text to images",
            f"Only {s['image_alt_pct']}% of images have alt text. Alt text aids "
            "accessibility, image search, and how models interpret your pages.", 4)
    if s["avg_internal_links"] < 5:
        add("content_structure", "medium", "Strengthen internal linking",
            "Internal links spread authority and help crawlers find your content. "
            f"Pages average only {s['avg_internal_links']} internal links.", 6)

    # AEO
    if not s["has_organization_schema"]:
        add("entity_strength", "high", "Add Organization JSON-LD to your homepage",
            "Answer engines resolve your brand to a knowledge-graph entity via "
            "Organization schema (name, logo, sameAs, founder). Without it, LLMs "
            "struggle to attribute facts and citations to you.", 18)
    if not s["has_faq_schema"]:
        add("answerability", "high", "Publish FAQ content with FAQPage schema",
            "FAQ blocks are the single most liftable format for answer engines. "
            "Mark them up with FAQPage JSON-LD so ChatGPT/Perplexity can quote "
            "question→answer pairs directly.", 16)
    if not s["has_article_schema"]:
        add("citation_readiness", "medium", "Mark up articles with Article/BlogPosting schema",
            "Author, datePublished and headline metadata raise citation trust and "
            "help engines date your expertise.", 9)

    # GEO
    if not s["llms_txt"]:
        add("citation_readiness", "medium", "Add an llms.txt for AI crawlers",
            "llms.txt is the emerging standard that tells LLMs what your site is "
            "about and which pages matter — a direct signal to generative engines.", 7)
    if s["knowledge_path_count"] < 3:
        add("knowledge_coverage", "high", "Build out a knowledge hub",
            "You have few of the expected hub sections (FAQ, guides, glossary, "
            "comparisons, use-cases). These are exactly the pages LLMs cite. "
            f"Detected: {', '.join(s['knowledge_paths']) or 'none'}.", 14)
    if s["thin_pages"] > 0:
        add("ai_readability", "medium", f"Expand {s['thin_pages']} thin page(s)",
            "Pages under ~300 words rarely get cited. Deepen them with concrete "
            "facts, examples, and structured sections.", 7)

    recs.sort(key=lambda r: r["impact"], reverse=True)
    return recs


def score_crawl(crawl: CrawlResult) -> ScoreResult:
    signals = extract_signals(crawl)
    cats = _score_categories(signals)
    pillars = _pillar_scores(cats)
    overall = _overall(pillars)
    visibility = _visibility(cats)
    recs = _recommendations(signals, cats)
    # surface pillar summaries via signals (stored JSON) for the dashboard
    signals["pillars"] = {k: {"label": v["label"], "tagline": v["tagline"],
                              "score": v["score"], "weight": v["weight"]}
                          for k, v in pillars.items()}
    return ScoreResult(
        signals=signals, category_scores=cats, overall_score=overall,
        visibility=visibility, recommendations=recs, pillars=pillars,
    )
