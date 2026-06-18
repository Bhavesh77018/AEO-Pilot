"""Answer-engine probing.

For a given prompt, ask each engine what it answers, so we can measure whether
the brand surfaces. Two paths, chosen per engine at runtime:

  • LIVE      — the engine's backing provider has an API key configured, so we
                make a real call (and capture citations where available).
  • SIMULATED — no key, so we produce a DETERMINISTIC, clearly-labeled estimate
                derived from the brand's measured AEO score. This keeps the
                feature demonstrable with zero keys, and — crucially — the
                simulated visibility *rises as the AEO score rises*, modeling
                the product's core value loop. It is never presented as real.

The honest contract: `EngineAnswer.mode` is always surfaced to the UI, and
simulated results carry their structured analysis directly (we don't dress a
synthetic string up as a parsed live answer).
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field

from ..llm import get_provider

# Which provider backs each engine. None → no adapter yet → always simulated.
# Note: ChatGPT / GPT Search / Copilot are all GPT-family; until dedicated
# adapters land they share the OpenAI provider (a truthful but low-variance
# signal when a real key is present). Grok/DeepSeek need their own keys → sim.
ENGINE_PROVIDER: dict[str, str | None] = {
    "ChatGPT": "openai",
    "GPT Search": "openai",
    "Gemini": "gemini",
    "Claude": "anthropic",
    "Perplexity": "perplexity",
    "Copilot": "openai",
    "Grok": None,
    "DeepSeek": None,
}

# Per-engine presence tilt for the simulation — engines that reward strong
# AEO/citation signals (Perplexity, GPT Search) lift a well-optimized brand a
# bit more; chattier general models are flatter. Centered near 1.0.
ENGINE_TILT: dict[str, float] = {
    "ChatGPT": 1.00, "GPT Search": 1.12, "Gemini": 1.05, "Claude": 0.98,
    "Perplexity": 1.18, "Copilot": 1.03, "Grok": 0.95, "DeepSeek": 0.92,
}

SIM_LIST_SIZE = 8  # a typical "best X" answer lists ~8 options


@dataclass
class AnswerAnalysis:
    brand_mentioned: bool = False
    rank: int | None = None
    cited: bool = False
    competitors: list[str] = field(default_factory=list)


@dataclass
class EngineAnswer:
    engine: str
    mode: str               # "live" | "simulated"
    model: str | None
    answer_text: str
    citations: list[str] = field(default_factory=list)
    # Present for simulated answers (structured result is generated directly).
    analysis: AnswerAnalysis | None = None


# ── deterministic seeded floats ───────────────────────────────────────
def _floats(*parts: str, n: int = 4) -> list[float]:
    """Stable pseudo-random floats in [0,1) from a string seed (sha256)."""
    seed = "|".join(parts)
    digest = hashlib.sha256(seed.encode("utf-8")).digest()
    out = []
    for i in range(n):
        chunk = digest[i * 4 : i * 4 + 4]
        out.append(int.from_bytes(chunk, "big") / 0xFFFFFFFF)
    return out


def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def simulate(engine: str, prompt: str, brand: str, aeo_score: float) -> EngineAnswer:
    """Deterministic, AEO-linked simulated answer for one engine×prompt."""
    r = _floats(engine, prompt, brand, n=4)
    p_base = _clamp(aeo_score / 100.0)
    tilt = ENGINE_TILT.get(engine, 1.0)

    # Probability the brand is mentioned at all, tilted by engine and a little
    # prompt-specific noise so different prompts vary.
    p_mention = _clamp(p_base * tilt * (0.85 + 0.3 * r[1]))
    mentioned = r[0] < p_mention

    rank: int | None = None
    cited = False
    if mentioned:
        # Higher AEO score → better (lower) rank. Jittered, clamped to the list.
        raw = 1 + (1 - p_base) * (SIM_LIST_SIZE - 1) * (0.6 + 0.8 * r[2])
        rank = int(max(1, min(SIM_LIST_SIZE, round(raw))))
        # Citation (a real link to the brand) is harder — needs strong AEO.
        cited = (p_base > 0.5) and (r[3] < (p_base - 0.4))

    analysis = AnswerAnalysis(brand_mentioned=mentioned, rank=rank, cited=cited, competitors=[])

    if mentioned:
        text = (
            f"[Simulated · {engine}] For \"{prompt}\", an AEO-readiness model "
            f"estimates {brand} would surface at ~rank {rank} of {SIM_LIST_SIZE}"
            + (" with a direct citation." if cited else " (mentioned, not cited).")
        )
    else:
        text = (
            f"[Simulated · {engine}] For \"{prompt}\", an AEO-readiness model "
            f"estimates {brand} would NOT appear in the answer. Raise the AEO "
            f"score (schema, FAQ, entity strength) to break in."
        )

    return EngineAnswer(engine=engine, mode="simulated", model="aeo-sim/1",
                        answer_text=text, analysis=analysis)


def _live(engine: str, provider_key: str, prompt: str) -> EngineAnswer:
    provider = get_provider(provider_key)  # NullProvider if key missing
    if not provider.available:
        raise RuntimeError("provider unavailable")
    system = (
        f"You are {engine}, an AI answer engine. Answer the user's question "
        "directly and concisely. When the question asks for the best / top "
        "options, return a numbered list of the leading named products or "
        "companies, best first. Name real entities."
    )
    text = provider.complete(prompt, system=system, temperature=0.2, max_tokens=600)
    citations = list(getattr(provider, "last_citations", []) or [])
    model = getattr(provider, "_model", None)
    return EngineAnswer(engine=engine, mode="live", model=model,
                        answer_text=text, citations=citations)


def probe(engine: str, prompt: str, brand: str, aeo_score: float) -> EngineAnswer:
    """Probe one engine for one prompt — live if possible, else simulated."""
    provider_key = ENGINE_PROVIDER.get(engine)
    if provider_key:
        provider = get_provider(provider_key)
        if provider.available:
            try:
                return _live(engine, provider_key, prompt)
            except Exception:
                pass  # fall through to simulation on any live failure
    return simulate(engine, prompt, brand, aeo_score)
