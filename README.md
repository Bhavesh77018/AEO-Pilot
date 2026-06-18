# AEO Pilot

> **Make your startup discoverable by AI.**
> The HubSpot / Ahrefs / Semrush for AI Search (Answer Engine Optimization).

AEO Pilot helps brands optimize their visibility inside AI answer engines —
ChatGPT, Gemini, Claude, Perplexity, Copilot, Grok, DeepSeek, Meta AI, and
whatever comes next — instead of (only) Google's blue links.

This repository is the **MVP vertical slice**: a runnable foundation you can
`docker compose up` today. It implements the core loop end-to-end:

```
enter domain ─▶ crawl site ─▶ extract AEO signals ─▶ score (8 categories)
            ─▶ per-engine visibility ─▶ recommendations ─▶ dashboard
```

The full 25-agent autonomous platform described in the product vision is built
on top of this foundation incrementally — see [docs/ROADMAP.md](docs/ROADMAP.md).

---

## What runs today (MVP)

| Capability | Status | Notes |
|---|---|---|
| Crawl a website (homepage + internal pages) | ✅ | `httpx` + `BeautifulSoup`, depth-limited |
| AEO signal extraction (schema, FAQ, headings, meta) | ✅ | Pure heuristics, no API key needed |
| AEO score across 8 categories (0–100) | ✅ | Deterministic scoring engine |
| Per-engine AI Visibility estimate | ✅ | Derived from signals (see caveat below) |
| Prioritized recommendations | ✅ | Heuristic rules; LLM-enriched if key present |
| LLM provider abstraction (OpenAI/Anthropic/Gemini) | ✅ | OpenAI default, fully optional |
| Dashboard (visibility scores, categories, recs) | ✅ | Next.js + Tailwind + Recharts |
| Background jobs (Celery/Redis) | 🟡 | Scaffolded; scans run inline for MVP |
| LangGraph multi-agent orchestration | 🟡 | Orchestrator stub wired; agents land per-roadmap |
| Real LLM-probed visibility | 🔭 | Roadmap — AI Monitoring Agent |

> **Honest caveat on "AI Visibility %":** Truly measuring whether ChatGPT cites
> you requires actively prompting each engine and parsing answers (the *AI
> Monitoring Agent*, roadmap). In the MVP, per-engine visibility is **derived
> from on-page AEO signals** as a directional proxy, not a live measurement.
> The code marks this clearly so it's never mistaken for real probing data.

---

## Quick start

```bash
cp .env.example .env          # optional: add OPENAI_API_KEY to enrich recs
docker compose up --build
```

- Frontend dashboard → http://localhost:3000
- Backend API + docs → http://localhost:8000/docs

Then in the dashboard, create a project with a domain (e.g. `stripe.com`) and
run a scan.

### Run backend without Docker

```bash
cd backend
python -m venv .venv && . .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Run frontend without Docker

```bash
cd frontend
npm install
npm run dev
```

---

## Architecture at a glance

```
┌─────────────┐     REST      ┌──────────────────┐     ┌────────────┐
│  Next.js    │ ────────────▶ │  FastAPI backend │ ──▶ │ PostgreSQL │
│  dashboard  │ ◀──────────── │                  │     │ + pgvector │
└─────────────┘               │  ┌────────────┐  │     └────────────┘
                              │  │ Orchestr.  │  │
                              │  │ (LangGraph)│  │     ┌────────────┐
                              │  └─────┬──────┘  │ ──▶ │   Redis    │
                              │   Crawler→AEO    │     │  (Celery)  │
                              │   →Scoring→LLM   │     └────────────┘
                              └──────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design, the
25-agent map, and [docs/PRD.md](docs/PRD.md) for the product spec.

## Repo layout

```
AEO/
├── docker-compose.yml
├── .env.example
├── docs/                 # PRD, architecture, roadmap
├── backend/              # FastAPI + agents + scoring + LLM layer
│   └── app/
│       ├── api/          # REST routes
│       ├── agents/       # crawler, aeo_analyzer, orchestrator
│       ├── llm/          # provider abstraction (OpenAI default)
│       ├── services/     # scoring engine
│       ├── models.py     # SQLAlchemy models
│       └── main.py
└── frontend/             # Next.js app-router dashboard
    └── app/
```

## License

Proprietary — © AEO Pilot. Internal scaffold.
