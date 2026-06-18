# AEO Pilot — Product Requirements (condensed)

> Full vision is a 25-agent autonomous AEO platform. This PRD frames the
> product and specifies the **MVP vertical slice** that this repo implements.

## 1. Problem

SEO optimized for Google's ten blue links. Discovery is shifting to **answer
engines** — ChatGPT, Gemini, Claude, Perplexity, Copilot — that synthesize an
answer and cite a few sources. Brands have no idea whether, or why, they show
up there. They ask:

- "Why doesn't ChatGPT mention my company?"
- "Why doesn't Perplexity cite us?"
- "How do we become an authoritative entity inside LLM ecosystems?"

There is no Ahrefs/Semrush for this. That's the gap.

## 2. Vision & positioning

**AEO Pilot — make your startup discoverable by AI.** The HubSpot/Ahrefs/
Semrush for AI search: measure AI visibility, diagnose why, and autonomously
fix it (generate schema, FAQs, knowledge hubs, citations) and publish.

## 3. Target users

| Persona | Job-to-be-done | Primary value |
|---|---|---|
| Startup founder | "Get us cited when buyers ask AI for tools like ours" | Visibility score + fixes |
| SaaS growth lead | "Own our category inside answer engines" | Competitor gaps, content |
| SEO agency | "Offer AEO as a service to clients" | Multi-project, white-label |
| Creator / brand | "Be the entity AI recommends" | Entity graph, knowledge hub |

## 4. Core user flow (MVP)

```
Add project (domain) → Run scan → Crawl + score → Dashboard
   → AI Visibility by engine
   → 8 AEO category scores + breakdown
   → Prioritized recommendations (heuristic + optional AI)
```

## 5. MVP scope (this repo)

**In:** project CRUD, website crawl, 8-category AEO scoring, derived per-engine
visibility, prioritized recommendations, optional LLM enrichment, dashboard.

**Out (roadmap):** auth/billing, content generation & publishing, live
LLM-probed visibility, competitor intelligence, entity graph, the other 22
agents. See [ROADMAP.md](ROADMAP.md).

## 6. The AEO score (what we measure)

8 categories, each 0–100, weighted into an overall 0–100 (weights in
`app/services/scoring.py`):

| Category | Measures |
|---|---|
| Technical AEO | robots.txt, sitemap, titles, meta — crawlability |
| Entity Strength | Organization schema, breadcrumbs, entity coverage |
| Topical Authority | content breadth (pages) × depth (words) |
| Schema Coverage | Organization / FAQ / Article / Breadcrumb JSON-LD |
| Answerability | FAQ content + FAQPage schema (liftable answers) |
| AI Readability | clean heading structure, low thin-content ratio |
| Citation Readiness | article schema, depth, supporting resources |
| Knowledge Coverage | FAQ/guides/glossary/comparisons/use-cases hubs |

Every score is explainable from the transparent `signals` dict on each scan.

## 7. API contracts (MVP)

Base: `/api/v1`. OpenAPI served at `/docs`.

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/projects` | `{domain, name?}` | `Project` |
| `GET` | `/projects` | — | `Project[]` |
| `GET` | `/projects/{id}` | — | `Project` |
| `POST` | `/projects/{id}/scans` | — | `ScanSummary` (202) |
| `GET` | `/projects/{id}/scans` | — | `ScanSummary[]` |
| `GET` | `/scans/{id}` | — | `ScanDetail` |
| `GET` | `/health` | — | health + LLM availability |

`ScanDetail` = summary + `category_scores`, `visibility`, `signals`,
`recommendations[]`, `pages[]`. Schemas defined in `app/schemas.py`; TS mirror
in `frontend/lib/types.ts`.

Scan lifecycle: `pending → running → completed | failed`. The dashboard polls
`GET /scans/{id}` every 1.5s while running.

## 8. Non-functional requirements

- **Runs with zero secrets.** No API key required to get a real score.
- **Explainable.** Every number traces to a signal.
- **Polite crawling.** Depth- and page-capped, identifiable user agent.
- **Honest metrics.** Proxy vs. measured is always labeled.

## 9. Success metrics (north stars)

- Activation: % of new projects that complete a first scan (target > 80%).
- Aha: % that view recommendations and mark ≥1 as actioned.
- Retention: weekly re-scans per active project.
- Expansion: visibility-score lift over 30/60/90 days (the core promise).
