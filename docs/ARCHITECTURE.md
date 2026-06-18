# AEO Pilot — System Architecture

> Scope: the design the MVP implements, and the seams it leaves for the full
> 25-agent autonomous platform. Where the MVP diverges from the end-state, it
> says so explicitly.

---

## 1. High-level architecture

```
                         ┌─────────────────────────────────────┐
                         │            Next.js frontend          │
                         │  Dashboard · Projects · Scans · ...   │
                         └──────────────┬──────────────────────┘
                                        │ REST (JSON)
                         ┌──────────────▼──────────────────────┐
                         │            FastAPI backend           │
                         │  /api/v1  ·  auth  ·  rate limiting   │
                         ├──────────────────────────────────────┤
                         │           Orchestrator layer         │
                         │   (sequential MVP → LangGraph graph)  │
                         │                                       │
                         │   WebsiteAuditor → AEOAnalyzer → …    │
                         ├───────────┬───────────────┬──────────┤
                         │ LLM layer │ Scoring engine │ Crawler  │
                         │ (provider │  (heuristic,   │ (httpx + │
                         │  abstr.)  │   explainable) │  bs4)    │
                         └─────┬─────┴───────┬────────┴────┬─────┘
                               │             │             │
                    ┌──────────▼──┐   ┌──────▼─────┐  ┌────▼─────────┐
                    │ OpenAI /    │   │ PostgreSQL │  │  Target      │
                    │ Anthropic / │   │ + pgvector │  │  websites    │
                    │ Gemini      │   │  + Redis   │  │  (the web)   │
                    └─────────────┘   └────────────┘  └──────────────┘
```

### Component responsibilities

| Layer | Responsibility | MVP state |
|---|---|---|
| Frontend | Visualize scores, drive scans, manage projects | ✅ built |
| API | REST contracts, validation, auth, rate limit | ✅ routes; 🟡 auth/limit |
| Orchestrator | Sequence agents, persist AgentRun audit trail | ✅ sequential |
| Agents | Discrete units of AEO work | ✅ 3 of 25 |
| Scoring | Deterministic 8-category score | ✅ built |
| LLM layer | Provider-agnostic completions | ✅ built (optional) |
| Crawler | Fetch + parse target sites | ✅ static HTML |
| Storage | Relational + vector + queue | ✅ Postgres/pgvector/Redis |

---

## 2. The 25-agent system

Every agent shares one contract: **input state → work → typed output +
AgentRun audit row**. That uniformity is what lets the orchestrator evolve
from a straight line (MVP) into a LangGraph `StateGraph` without touching the
agents themselves.

| # | Agent | Consumes | Produces | MVP |
|---|---|---|---|---|
| 1 | Website Auditor | domain | page snapshots | ✅ |
| 2 | SEO Analyzer | snapshots | classic SEO signals | 🔭 |
| 3 | AEO Analyzer | snapshots | AEO score + signals | ✅ |
| 4 | Schema Generator | entities, pages | JSON-LD blocks | 🔭 |
| 5 | FAQ Generator | topics, gaps | Q/A + FAQPage schema | 🔭 |
| 6 | Knowledge Base Generator | topic map | hub pages | 🔭 |
| 7 | Competitor Research | competitor domain | gaps, overlaps | 🔭 |
| 8 | Entity Graph | crawl + LLM | entity graph (Neo4j) | 🔭 |
| 9 | Topical Authority | corpus | coverage map | 🔭 |
| 10 | Citation Builder | gaps | citation targets | 🔭 |
| 11 | Content Generator | brief | drafts | 🔭 |
| 12 | Publishing | drafts | live pages (CMS API) | 🔭 |
| 13 | AI Monitoring | prompt set | engine answers | 🔭 |
| 14 | Visibility Tracking | answers | mention/rank metrics | 🟡 proxy |
| 15 | Brand Mention | web/social | mentions | 🔭 |
| 16 | SERP | keywords | SERP snapshots | 🔭 |
| 17 | Reddit Discovery | topics | threads | 🔭 |
| 18 | Community Discovery | topics | forums/Discords | 🔭 |
| 19 | Trend Discovery | niche | rising queries | 🔭 |
| 20 | Opportunity | all signals | ranked actions | 🟡 recs |
| 21 | AI Search Ranking | answers | rank model | 🔭 |
| 22 | Technical SEO | crawl | tech issues | 🟡 partial |
| 23 | Performance Opt | crawl | perf budget | 🔭 |
| 24 | Website Improvement | issues | PRs/patches | 🔭 |
| 25 | Growth Strategy | everything | roadmap | 🔭 |

Legend: ✅ built · 🟡 partial/proxy · 🔭 roadmap.

### Orchestration: MVP → LangGraph

The MVP orchestrator (`app/agents/orchestrator.py`) runs a fixed sequence.
The end-state is a LangGraph `StateGraph` with:

- **shared state** = the `Scan` aggregate + an in-memory blackboard
- **conditional edges** (e.g. only run Competitor agent if a competitor is set)
- **fan-out / fan-in** (Reddit + Community + Trend agents in parallel → Opportunity)
- **retries & checkpoints** via LangGraph's persistence (backed by Postgres)

Heavy or fan-out agents move off the request path onto **Celery workers**
(scaffolded in `app/worker.py`); the API enqueues and the frontend polls the
`Scan.status`.

---

## 3. Data architecture

### Relational (PostgreSQL)

MVP tables (see `app/models.py`, migration `0001_initial`):

```
projects ──< scans ──< page_snapshots
                  ├──< recommendations
                  └──< agent_runs
```

Full target schema adds: `users`, `organizations` (tenancy), `keywords`,
`entities`, `competitors`, `faqs`, `knowledge_pages`, `visibility_reports`,
`prompts`, `brand_mentions`, `billing_subscriptions`. Each is an additive
Alembic migration — `projects` gains an `org_id` FK when multi-tenancy lands.

### Vector (pgvector)

The `vector` extension is enabled in the initial migration. Embedding-backed
tables (`page_embeddings`, `entity_embeddings`) land with the Topical
Authority / Entity Graph agents and power semantic clustering and gap
detection. Embeddings go through the same LLM provider abstraction.

### Graph (Neo4j)

The Entity Graph agent writes Company / People / Product / Service / Industry /
Location / Competitor nodes and their relations to Neo4j, and emits JSON-LD
for publishing. Kept separate from Postgres because entity reasoning is
natively a graph problem.

### Queue (Redis + Celery)

Broker + result backend for background scans, scheduled re-crawls, and the
recurring AI Monitoring sweeps.

---

## 4. LLM provider abstraction

`app/llm/provider.py` defines one `LLMProvider` interface with OpenAI (default),
Anthropic, and Gemini adapters. Vendor SDKs are imported lazily so a missing
package never crashes boot, and a missing key yields a `NullProvider` whose
`available == False`. Every LLM-dependent feature checks `available` and falls
back to deterministic behavior — which is exactly why the whole MVP runs with
zero keys.

---

## 5. Security architecture (target)

| Concern | Approach |
|---|---|
| AuthN | JWT access/refresh; OAuth (Google/GitHub) social login |
| AuthZ | Org-scoped RBAC (owner / admin / member / viewer) |
| Tenancy | `org_id` on every row; row-level filtering in a query dependency |
| Secrets | Customer LLM keys encrypted at rest (KMS envelope), never logged |
| Rate limiting | Per-org token buckets at the API edge (Redis) |
| Audit | `agent_runs` + an `audit_log` table for user actions |
| Transport | TLS everywhere; HSTS at the edge (Cloudflare) |

MVP ships permissive CORS and no auth — explicitly dev-only.

---

## 6. Deployment architecture (target)

```
Cloudflare (WAF, CDN, TLS)
        │
   AWS ALB ──► EKS (Kubernetes)
        ├── frontend (Next.js, HPA)
        ├── api (FastAPI, HPA)
        ├── workers (Celery, KEDA on queue depth)
        ├── orchestrator jobs
        └── observability: Prometheus + Grafana, Sentry
        │
   Managed data: RDS Postgres (pgvector) · ElastiCache Redis · Neo4j Aura
   CI/CD: GitHub Actions → build/test/scan → push ECR → deploy EKS
```

The MVP ships `docker-compose.yml` for local dev. The Compose services map
1:1 to Kubernetes Deployments, so the jump to EKS is mechanical (Helm chart
per service).

---

## 7. Key design decisions

1. **Heuristics first, LLM as enrichment.** The base score must be
   deterministic, explainable, and free to compute. LLMs add brand-specific
   nuance on top — never a hard dependency.
2. **Honest visibility.** Per-engine visibility is labeled a *derived proxy*
   until the AI Monitoring agent does live probing. We don't dress up a
   heuristic as a measurement.
3. **Audit everything.** `agent_runs` from day one — observability for an
   autonomous system is not a later add-on.
4. **One agent contract.** Uniform input/output so the orchestrator can grow
   from a line to a graph without rewrites.
```
