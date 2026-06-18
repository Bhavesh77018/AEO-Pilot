"""Suggest buyer-intent prompts to track for a project.

These are the questions real buyers ask answer engines ("best X for Y",
"alternatives to Z"). LLM-generated when a key is present; otherwise a set of
solid templates derived from the brand + any homepage context.
"""
from __future__ import annotations

from ..llm import get_provider

_SYSTEM = (
    "You generate the natural-language questions that potential buyers type "
    "into AI answer engines (ChatGPT, Perplexity). Return ONLY valid JSON."
)


def suggest(brand: str, domain: str, context: str | None = None, n: int = 6) -> list[dict]:
    provider = get_provider()
    if provider.available:
        llm = _suggest_with_llm(provider, brand, domain, context, n)
        if llm:
            return llm[:n]
    return _templates(brand)[:n]


def _suggest_with_llm(provider, brand, domain, context, n) -> list[dict]:
    prompt = (
        f"Brand: {brand} (domain {domain}).\n"
        + (f"Homepage context: {context[:500]}\n" if context else "")
        + f"Generate {n} distinct questions a potential customer would ask an "
        "AI answer engine where this brand SHOULD ideally appear. Mix intents: "
        "category ('best ... for ...'), comparison ('X vs Y'), alternative "
        "('alternatives to ...'), branded ('is X good'). Each item: "
        "{text, intent}. intent ∈ {category, comparison, alternative, branded}. "
        "Return a JSON array."
    )
    try:
        items = provider.complete_json(prompt, system=_SYSTEM)
        if not isinstance(items, list):
            return []
        out = []
        for it in items:
            if isinstance(it, dict) and it.get("text"):
                out.append({
                    "text": str(it["text"])[:500],
                    "intent": it.get("intent", "category"),
                })
        return out
    except Exception:
        return []


def _templates(brand: str) -> list[dict]:
    return [
        {"text": f"What are the best alternatives to {brand}?", "intent": "alternative"},
        {"text": f"Is {brand} a good choice and why?", "intent": "branded"},
        {"text": f"What does {brand} do?", "intent": "branded"},
        {"text": f"How does {brand} compare to its competitors?", "intent": "comparison"},
        {"text": f"What are the top tools similar to {brand}?", "intent": "category"},
        {"text": f"Which companies are leaders in {brand}'s category?", "intent": "category"},
    ]
