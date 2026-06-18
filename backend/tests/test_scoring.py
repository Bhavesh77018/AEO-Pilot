"""Unit tests for the AEO scoring engine.

Pure logic — no network, no DB. Run with:  pytest backend/tests
"""
from app.agents.crawler import CrawlResult, Page
from app.services.scoring import CATEGORY_WEIGHTS, ENGINE_BIAS, score_crawl


def _rich_site() -> CrawlResult:
    """A well-optimized site: org+FAQ+article schema, knowledge hubs, depth."""
    pages = [
        Page(
            url="https://acme.com/", status_code=200, title="Acme — Home",
            meta_description="Acme does things", word_count=900, h1_count=1,
            schema_types=["Organization", "BreadcrumbList"], has_faq=False,
        ),
        Page(
            url="https://acme.com/faq", status_code=200, title="FAQ",
            meta_description="Questions", word_count=700, h1_count=1,
            schema_types=["FAQPage"], has_faq=True,
        ),
        Page(
            url="https://acme.com/guides/setup", status_code=200, title="Setup guide",
            meta_description="How to", word_count=1500, h1_count=1,
            schema_types=["Article"], has_faq=False,
        ),
        Page(
            url="https://acme.com/glossary", status_code=200, title="Glossary",
            meta_description="Terms", word_count=1200, h1_count=1,
            schema_types=[], has_faq=False,
        ),
        Page(
            url="https://acme.com/comparisons/acme-vs-other", status_code=200,
            title="Acme vs Other", meta_description="Compare", word_count=1100,
            h1_count=1, schema_types=["Article"], has_faq=False,
        ),
    ]
    return CrawlResult(base_url="https://acme.com", pages=pages,
                       robots_txt=True, sitemap_xml=True)


def _bare_site() -> CrawlResult:
    pages = [
        Page(url="https://bare.com/", status_code=200, title="Bare",
             meta_description=None, word_count=120, h1_count=0,
             schema_types=[], has_faq=False),
    ]
    return CrawlResult(base_url="https://bare.com", pages=pages,
                       robots_txt=False, sitemap_xml=False)


def test_scores_are_in_range():
    result = score_crawl(_rich_site())
    assert 0 <= result.overall_score <= 100
    for cat in CATEGORY_WEIGHTS:
        assert 0 <= result.category_scores[cat]["score"] <= 100


def test_rich_site_beats_bare_site():
    rich = score_crawl(_rich_site())
    bare = score_crawl(_bare_site())
    assert rich.overall_score > bare.overall_score + 20


def test_weights_sum_to_one():
    assert abs(sum(CATEGORY_WEIGHTS.values()) - 1.0) < 1e-9


def test_every_engine_reported():
    result = score_crawl(_rich_site())
    assert set(result.visibility.keys()) == set(ENGINE_BIAS.keys())
    for v in result.visibility.values():
        assert 0 <= v <= 100


def test_bare_site_generates_high_severity_recs():
    result = score_crawl(_bare_site())
    severities = {r["severity"] for r in result.recommendations}
    assert "high" in severities
    # Missing Organization schema is a known high-impact gap.
    assert any("Organization" in r["title"] for r in result.recommendations)


def test_signals_are_transparent():
    result = score_crawl(_rich_site())
    s = result.signals
    assert s["has_organization_schema"] is True
    assert s["has_faq_schema"] is True
    assert s["robots_txt"] is True
    assert s["knowledge_path_count"] >= 3
