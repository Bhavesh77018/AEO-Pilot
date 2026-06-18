"""Parse a LIVE engine answer into structured visibility signals.

Given the raw answer text (and any citations), determine whether the brand is
mentioned, at what rank, whether it's cited, and which competitors co-occur.

Two strategies:
  • LLM extractor — if a provider key is configured, ask the model to read the
    answer and return strict JSON. Most reliable across answer formats.
  • Heuristic    — pure string/list parsing. No key required. The fallback.

(Simulated answers don't pass through here — `engines.simulate()` produces their
analysis directly.)
"""
from __future__ import annotations

import re
from urllib.parse import urlparse

from ..llm import get_provider
from .engines import AnswerAnalysis, EngineAnswer

_LIST_RE = re.compile(r"^\s*(?:(\d+)[.)]|[-*•])\s+(.*\S)", re.MULTILINE)
_EXTRACT_SYSTEM = "You extract structured data from text. Return ONLY valid JSON."


def _domain_root(domain: str) -> str:
    d = domain.lower().replace("https://", "").replace("http://", "").strip("/")
    d = d.split("/")[0]
    if d.startswith("www."):
        d = d[4:]
    # brandable root: 'stripe' from 'stripe.com'
    return d.split(".")[0]


def analyze_live(answer: EngineAnswer, brand: str, domain: str) -> AnswerAnalysis:
    provider = get_provider()
    if provider.available:
        llm = _analyze_with_llm(provider, answer.answer_text, brand, domain)
        if llm is not None:
            # citation can also be confirmed structurally from returned links
            llm.cited = llm.cited or _cited(answer, domain)
            return llm
    return _analyze_heuristic(answer, brand, domain)


# ── heuristic ─────────────────────────────────────────────────────────
def _analyze_heuristic(answer: EngineAnswer, brand: str, domain: str) -> AnswerAnalysis:
    text = answer.answer_text or ""
    low = text.lower()
    brand_l = brand.lower()
    root = _domain_root(domain)

    mentioned = brand_l in low or (len(root) > 2 and root in low)

    rank: int | None = None
    competitors: list[str] = []
    items = _LIST_RE.findall(text)  # list of (number, content)
    if items:
        for idx, (num, content) in enumerate(items, start=1):
            position = int(num) if num else idx
            name = _leading_name(content)
            is_brand = brand_l in content.lower() or (len(root) > 2 and root in content.lower())
            if is_brand and rank is None:
                rank = position
            elif name and name.lower() != brand_l:
                competitors.append(name)
    if mentioned and rank is None:
        # mentioned in prose but not in a list — approximate by sentence order
        sentences = re.split(r"(?<=[.!?])\s+", text)
        for i, s in enumerate(sentences, start=1):
            if brand_l in s.lower() or (len(root) > 2 and root in s.lower()):
                rank = min(i, 10)
                break

    return AnswerAnalysis(
        brand_mentioned=mentioned, rank=rank,
        cited=_cited(answer, domain), competitors=competitors[:10],
    )


def _leading_name(content: str) -> str:
    # take the text before the first separator and strip markdown emphasis
    head = re.split(r"[—\-:|(\n]| - ", content, maxsplit=1)[0]
    head = head.replace("**", "").replace("*", "").strip().strip(".")
    return head[:60]


def _cited(answer: EngineAnswer, domain: str) -> bool:
    root = _domain_root(domain)
    hay = (answer.answer_text or "") + " " + " ".join(answer.citations or [])
    hay = hay.lower()
    if any(root in urlparse(c).netloc.lower() for c in (answer.citations or [])):
        return True
    # bare domain or markdown link appearing in the text
    return bool(re.search(rf"\b{re.escape(root)}\.[a-z]{{2,}}", hay))


# ── LLM extractor ─────────────────────────────────────────────────────
def _analyze_with_llm(provider, text: str, brand: str, domain: str) -> AnswerAnalysis | None:
    prompt = (
        f"Brand: {brand} (domain {domain})\n"
        f"Answer-engine response:\n\"\"\"\n{text[:4000]}\n\"\"\"\n\n"
        "Return JSON with keys: mentioned (bool — is the brand referenced?), "
        "rank (int or null — its 1-based position if the answer is a ranked "
        "list, else null), cited (bool — does the answer link to or name the "
        "brand's domain?), competitors (array of other named brands/products "
        "in the answer, max 10). JSON only."
    )
    try:
        data = provider.complete_json(prompt, system=_EXTRACT_SYSTEM)
        if not isinstance(data, dict):
            return None
        rank = data.get("rank")
        rank = int(rank) if isinstance(rank, (int, float)) else None
        comps = data.get("competitors") or []
        comps = [str(c)[:60] for c in comps if isinstance(c, (str, int))][:10]
        return AnswerAnalysis(
            brand_mentioned=bool(data.get("mentioned")),
            rank=rank, cited=bool(data.get("cited")), competitors=comps,
        )
    except Exception:
        return None
