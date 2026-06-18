"""Central configuration, loaded from environment / .env."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    secret_key: str = "change-me-in-prod"

    # Storage. Default is a local sqlite file so the API boots even with no
    # Postgres around; docker-compose overrides this with the pgvector DB.
    database_url: str = "sqlite+pysqlite:///./aeo.db"
    redis_url: str = "redis://localhost:6379/0"

    # LLM provider abstraction
    llm_provider: str = "openai"          # openai | anthropic | gemini
    llm_model: str = "gpt-4o-mini"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
    # Perplexity is the citation-first answer engine — most relevant to AEO.
    # OpenAI-compatible API at api.perplexity.ai. Optional.
    perplexity_api_key: str | None = None
    embedding_model: str = "text-embedding-3-small"

    # AI Monitoring (Phase 2). Engines swept per visibility run; each is probed
    # live if its backing provider has a key, else deterministically simulated.
    monitored_engines: list[str] = [
        "ChatGPT", "GPT Search", "Gemini", "Claude",
        "Perplexity", "Copilot", "Grok", "DeepSeek",
    ]

    # Crawler
    crawl_max_pages: int = 15
    crawl_timeout_seconds: int = 10
    user_agent: str = "AEOPilotBot/0.1 (+https://aeopilot.example/bot)"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
