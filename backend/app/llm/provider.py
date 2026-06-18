"""LLM provider abstraction layer.

A single `LLMProvider` interface with swappable backends. OpenAI is the
default per spec; Anthropic and Gemini adapters share the same surface so
the rest of the app never imports a vendor SDK directly.

Everything degrades gracefully: if no API key is configured the provider
reports `available == False` and callers fall back to heuristic behavior.
That's what lets the whole MVP run with zero keys.
"""
from __future__ import annotations

import json
from abc import ABC, abstractmethod
from functools import lru_cache
from typing import Any

from ..config import settings


class LLMProvider(ABC):
    name: str = "base"

    @property
    @abstractmethod
    def available(self) -> bool:
        """True when a usable API key is configured."""

    @abstractmethod
    def complete(self, prompt: str, *, system: str | None = None,
                 temperature: float = 0.3, max_tokens: int = 1024) -> str:
        ...

    def complete_json(self, prompt: str, *, system: str | None = None) -> Any:
        """Convenience: ask for JSON and parse it, tolerating code fences."""
        raw = self.complete(prompt, system=system, temperature=0.1)
        return _loads_loose(raw)


class OpenAIProvider(LLMProvider):
    name = "openai"

    def __init__(self) -> None:
        self._key = settings.openai_api_key
        self._model = settings.llm_model or "gpt-4o-mini"
        self._client = None

    @property
    def available(self) -> bool:
        return bool(self._key)

    def _ensure_client(self):
        if self._client is None:
            from openai import OpenAI  # imported lazily so missing SDK ≠ crash
            self._client = OpenAI(api_key=self._key)
        return self._client

    def complete(self, prompt: str, *, system: str | None = None,
                 temperature: float = 0.3, max_tokens: int = 1024) -> str:
        client = self._ensure_client()
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = client.chat.completions.create(
            model=self._model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content or ""


class PerplexityProvider(LLMProvider):
    """Perplexity — OpenAI-compatible API that grounds answers with live web
    citations. The single most AEO-relevant engine, so it gets a real adapter.
    """
    name = "perplexity"

    def __init__(self) -> None:
        self._key = settings.perplexity_api_key
        self._model = "sonar"
        self._client = None
        self.last_citations: list[str] = []

    @property
    def available(self) -> bool:
        return bool(self._key)

    def _ensure_client(self):
        if self._client is None:
            from openai import OpenAI  # OpenAI-compatible surface
            self._client = OpenAI(api_key=self._key, base_url="https://api.perplexity.ai")
        return self._client

    def complete(self, prompt: str, *, system: str | None = None,
                 temperature: float = 0.3, max_tokens: int = 1024) -> str:
        client = self._ensure_client()
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = client.chat.completions.create(
            model=self._model, messages=messages,
            temperature=temperature, max_tokens=max_tokens,
        )
        # Perplexity returns citations alongside the completion.
        self.last_citations = list(getattr(resp, "citations", []) or [])
        return resp.choices[0].message.content or ""


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(self) -> None:
        self._key = settings.anthropic_api_key
        self._model = settings.llm_model if settings.llm_model.startswith("claude") else "claude-opus-4-8"

    @property
    def available(self) -> bool:
        return bool(self._key)

    def complete(self, prompt: str, *, system: str | None = None,
                 temperature: float = 0.3, max_tokens: int = 1024) -> str:
        from anthropic import Anthropic  # lazy
        client = Anthropic(api_key=self._key)
        resp = client.messages.create(
            model=self._model,
            system=system or "",
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in resp.content if block.type == "text")


class GeminiProvider(LLMProvider):
    name = "gemini"

    def __init__(self) -> None:
        self._key = settings.gemini_api_key
        self._model = settings.llm_model if "gemini" in settings.llm_model else "gemini-1.5-flash"

    @property
    def available(self) -> bool:
        return bool(self._key)

    def complete(self, prompt: str, *, system: str | None = None,
                 temperature: float = 0.3, max_tokens: int = 1024) -> str:
        import google.generativeai as genai  # lazy
        genai.configure(api_key=self._key)
        model = genai.GenerativeModel(self._model, system_instruction=system)
        resp = model.generate_content(prompt)
        return resp.text or ""


class NullProvider(LLMProvider):
    """Used when no key is configured. Always unavailable."""
    name = "null"

    @property
    def available(self) -> bool:
        return False

    def complete(self, prompt: str, **_: Any) -> str:  # pragma: no cover
        raise RuntimeError("No LLM provider configured (set an API key).")


_REGISTRY = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "gemini": GeminiProvider,
    "perplexity": PerplexityProvider,
}


@lru_cache
def get_provider(name: str | None = None) -> LLMProvider:
    """Return the configured provider, or a NullProvider if its key is absent."""
    chosen = (name or settings.llm_provider or "openai").lower()
    cls = _REGISTRY.get(chosen)
    if cls is None:
        return NullProvider()
    provider = cls()
    return provider if provider.available else NullProvider()


def _loads_loose(raw: str) -> Any:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip().strip("`").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("[")
        if start == -1:
            start = raw.find("{")
        end = max(raw.rfind("]"), raw.rfind("}"))
        if start != -1 and end != -1:
            return json.loads(raw[start : end + 1])
        raise
