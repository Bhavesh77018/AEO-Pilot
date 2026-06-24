"""WebsiteAuditor / crawler agent.

Depth-limited, polite crawl of a site. Fetches the homepage, discovers
same-host internal links, and parses each page into a structured snapshot.
No JS rendering in the MVP (static HTML only) — headless rendering is a
roadmap item for SPA-heavy sites.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from ..config import settings

# Paths that signal a "knowledge hub" — used by the scoring engine.
KNOWLEDGE_PATHS = (
    "faq", "faqs", "guide", "guides", "learn", "resources", "glossary",
    "comparison", "comparisons", "vs", "use-case", "use-cases", "industry",
    "case-study", "case-studies", "docs", "blog", "help", "knowledge",
)


@dataclass
class Page:
    url: str
    status_code: int | None = None
    title: str | None = None
    meta_description: str | None = None
    word_count: int = 0
    h1_count: int = 0
    headings: list[str] = field(default_factory=list)
    schema_types: list[str] = field(default_factory=list)
    has_faq: bool = False
    internal_links: list[str] = field(default_factory=list)
    text: str = ""
    # SEO signals
    https: bool = False
    canonical: bool = False
    has_viewport: bool = False
    has_og: bool = False
    image_count: int = 0
    images_with_alt: int = 0


@dataclass
class CrawlResult:
    base_url: str
    pages: list[Page] = field(default_factory=list)
    robots_txt: bool = False
    sitemap_xml: bool = False
    llms_txt: bool = False


def _normalize_base(domain: str) -> str:
    domain = domain.strip()
    if not domain.startswith(("http://", "https://")):
        domain = "https://" + domain
    return domain.rstrip("/")


def _same_host(a: str, b: str) -> bool:
    return urlparse(a).netloc.replace("www.", "") == urlparse(b).netloc.replace("www.", "")


def _extract_schema_types(soup: BeautifulSoup) -> list[str]:
    types: list[str] = []
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
        except (json.JSONDecodeError, TypeError):
            continue
        for node in data if isinstance(data, list) else [data]:
            if isinstance(node, dict):
                t = node.get("@type")
                if isinstance(t, list):
                    types.extend(str(x) for x in t)
                elif t:
                    types.append(str(t))
    return types


def _parse(url: str, html: str) -> Page:
    soup = BeautifulSoup(html, "lxml")
    title = soup.title.string.strip() if soup.title and soup.title.string else None

    meta_desc = None
    md = soup.find("meta", attrs={"name": "description"})
    if md and md.get("content"):
        meta_desc = md["content"].strip()

    headings = [h.get_text(strip=True) for h in soup.find_all(["h1", "h2", "h3"])]
    h1_count = len(soup.find_all("h1"))
    schema_types = _extract_schema_types(soup)

    text = soup.get_text(" ", strip=True)
    word_count = len(text.split())

    # FAQ detection: schema OR question-shaped headings.
    has_faq = "FAQPage" in schema_types or any(
        h.endswith("?") for h in headings
    )

    # SEO signals
    canonical = bool(soup.find("link", attrs={"rel": "canonical"}))
    has_viewport = bool(soup.find("meta", attrs={"name": "viewport"}))
    has_og = bool(soup.find("meta", attrs={"property": "og:title"}))
    imgs = soup.find_all("img")
    image_count = len(imgs)
    images_with_alt = sum(1 for img in imgs if (img.get("alt") or "").strip())

    links: list[str] = []
    for a in soup.find_all("a", href=True):
        href = urljoin(url, a["href"])
        if href.startswith("http") and _same_host(href, url):
            links.append(href.split("#")[0])

    return Page(
        url=url, title=title, meta_description=meta_desc,
        word_count=word_count, h1_count=h1_count, headings=headings[:50],
        schema_types=schema_types, has_faq=has_faq,
        internal_links=list(dict.fromkeys(links)),  # dedupe, keep order
        text=text[:20000],
        https=url.lower().startswith("https://"),
        canonical=canonical, has_viewport=has_viewport, has_og=has_og,
        image_count=image_count, images_with_alt=images_with_alt,
    )


def crawl(domain: str, max_pages: int | None = None) -> CrawlResult:
    base = _normalize_base(domain)
    max_pages = max_pages or settings.crawl_max_pages
    result = CrawlResult(base_url=base)

    headers = {"User-Agent": settings.user_agent}
    timeout = settings.crawl_timeout_seconds

    with httpx.Client(
        headers=headers, timeout=timeout, follow_redirects=True
    ) as client:
        # robots.txt / sitemap / llms.txt presence (cheap technical signals)
        for probe, attr in (
            ("/robots.txt", "robots_txt"),
            ("/sitemap.xml", "sitemap_xml"),
            ("/llms.txt", "llms_txt"),
        ):
            try:
                r = client.get(base + probe)
                setattr(result, attr, r.status_code == 200)
            except httpx.HTTPError:
                pass

        queue = [base]
        seen: set[str] = set()

        while queue and len(result.pages) < max_pages:
            url = queue.pop(0)
            if url in seen:
                continue
            seen.add(url)
            try:
                resp = client.get(url)
            except httpx.HTTPError:
                result.pages.append(Page(url=url, status_code=None))
                continue

            ctype = resp.headers.get("content-type", "")
            if "text/html" not in ctype:
                continue

            page = _parse(url, resp.text)
            page.status_code = resp.status_code
            result.pages.append(page)

            # Prioritize knowledge-hub-looking links for discovery.
            def _priority(link: str) -> int:
                path = urlparse(link).path.lower()
                return 0 if any(k in path for k in KNOWLEDGE_PATHS) else 1

            for link in sorted(page.internal_links, key=_priority):
                if link not in seen and link not in queue:
                    queue.append(link)

    return result
