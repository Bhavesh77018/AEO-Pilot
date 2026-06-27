"""Central configuration, loaded from environment / .env."""
from __future__ import annotations
import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, ".env")

try:
    from dotenv import load_dotenv
    load_dotenv(env_path)
except ImportError:
    pass

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=env_path, extra="ignore")

    app_env: str = "development"
    secret_key: str = "change-me-in-prod"

    # CORS — comma-separated allowed origins. Default "*" for dev; in prod set
    # CORS_ORIGINS to your Vercel URL(s), e.g. "https://aeo-pilot.vercel.app".
    cors_origins: str = "*"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # Supabase — used to VERIFY the user's access token for per-user data
    # isolation. Both are public (the anon/publishable key is browser-safe).
    # When set, project/scan endpoints scope data to the authenticated user.
    supabase_url: str | None = None
    supabase_anon_key: str | None = None

    @property
    def auth_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_anon_key)

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

    # Payments (Razorpay). When unset, billing endpoints report disabled and
    # the frontend keeps the plan CTAs as plain links — nothing breaks.
    razorpay_key_id: str | None = None
    razorpay_key_secret: str | None = None

    @property
    def razorpay_enabled(self) -> bool:
        return bool(self.razorpay_key_id and self.razorpay_key_secret)

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
