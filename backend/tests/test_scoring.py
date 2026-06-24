"""Unit tests for the Search Visibility scoring engine (SEO + AEO + GEO).

Pure logic — no network, no DB. Run with:  pytest backend/tests
"""
from app.agents.crawler import CrawlResult, Page
from app.services.scoring import CATEGORY_META, ENGINE_BIAS, PILLARS, score_crawl


def _page(url, **kw):
    # sensible SEO defaults for a well-built page
    kw.setdefault("status_code", 200)
    kw.setdefault("https", True)
    kw.setdefault("canonical", True)
    kw.setdefault("has_viewport", True)
    kw.setdefault("image_count", 3)
    kw.setdefault("images_with_alt", 3)
    kw.setdefault("internal_links", ["a", "b", "c", "d", "e", "f"])
    return Page(url=url, **kw)


def _rich_site() -> CrawlResult:
    """A well-optimized site across all three pillars."""
    pages = [
        _page("https://acme.com/", title="Acme — Home", meta_description="Acme does things",
              word_count=900, h1_count=1, schema_types=["Organization", "BreadcrumbList"]),
        _page("https://acme.com/faq", title="FAQ", meta_description="Questions",
              word_count=700, h1_count=1, schema_types=["FAQPage"], has_faq=True),
        _page("https://acme.com/guides/setup", title="Setup guide", meta_description="How to",
              word_count=1500, h1_count=1, schema_types=["Article"]),
        _page("https://acme.com/glossary", title="Glossary", meta_description="Terms",
              word_count=1200, h1_count=1, schema_types=[]),
        _page("https://acme.com/comparisons/acme-vs-other", title="Acme vs Other",
              meta_description="Compare", word_count=1100, h1_count=1, schema_types=["Article"]),
    ]
    return CrawlResult(base_url="https://acme.com", pages=pages,
                       robots_txt=True, sitemap_xml=True, llms_txt=True)


def _bare_site() -> CrawlResult:
    pages = [
        Page(url="http://bare.com/", status_code=200, title="Bare",
             meta_description=None, word_count=120, h1_count=0, schema_types=[]),
    ]
    return CrawlResult(base_url="http://bare.com", pages=pages,
                       robots_txt=False, sitemap_xml=False)


def test_scores_are_in_range():
    result = score_crawl(_rich_site())
    assert 0 <= result.overall_score <= 100
    for cat in CATEGORY_META:
        assert 0 <= result.category_scores[cat]["score"] <= 100


def test_three_pillars_present():
    result = score_crawl(_rich_site())
    assert set(result.pillars.keys()) == {"seo", "aeo", "geo"}
    for p in result.pillars.values():
        assert 0 <= p["score"] <= 100
    # pillar summaries are also surfaced via signals for the dashboard
    assert set(result.signals["pillars"].keys()) == {"seo", "aeo", "geo"}


def test_each_category_tagged_with_pillar():
    result = score_crawl(_rich_site())
    for key, c in result.category_scores.items():
        assert c["pillar"] in {"seo", "aeo", "geo"}
        assert c["pillar"] == CATEGORY_META[key][0]


def test_rich_site_beats_bare_site():
    rich = score_crawl(_rich_site())
    bare = score_crawl(_bare_site())
    assert rich.overall_score > bare.overall_score + 20
    # and it wins on every pillar
    for k in ("seo", "aeo", "geo"):
        assert rich.pillars[k]["score"] > bare.pillars[k]["score"]


def test_pillar_weights_sum_to_one():
    assert abs(sum(p["weight"] for p in PILLARS.values()) - 1.0) < 1e-9


def test_every_engine_reported():
    result = score_crawl(_rich_site())
    assert set(result.visibility.keys()) == set(ENGINE_BIAS.keys())
    for v in result.visibility.values():
        assert 0 <= v <= 100


def test_bare_site_generates_high_severity_recs():
    result = score_crawl(_bare_site())
    severities = {r["severity"] for r in result.recommendations}
    assert "high" in severities
    assert any("Organization" in r["title"] for r in result.recommendations)


def test_seo_recs_fire_for_bare_site():
    # bare.com is http, no canonical/viewport/sitemap → SEO recs should appear
    result = score_crawl(_bare_site())
    cats = {r["category"] for r in result.recommendations}
    assert "technical_seo" in cats


def test_signals_are_transparent():
    result = score_crawl(_rich_site())
    s = result.signals
    assert s["has_organization_schema"] is True
    assert s["has_faq_schema"] is True
    assert s["robots_txt"] is True
    assert s["llms_txt"] is True
    assert s["knowledge_path_count"] >= 3
    assert s["pct_https"] == 100.0
