# AEO Pilot — Roadmap, Monetization & Plan

## 1. Phased roadmap

### Phase 0 — MVP slice ✅ (this repo)
Crawl → 8-category AEO score → derived per-engine visibility → recommendations
→ dashboard. Runs locally on Docker Compose, no API key required.

### Phase 1 — Multi-tenant SaaS foundation (4–6 wks)
- AuthN/AuthZ (JWT + OAuth), org-scoped RBAC, `org_id` tenancy migration
- Stripe billing (Starter / Growth / Agency / Enterprise)
- Move scans to Celery workers; scheduled re-crawls
- Project history & visibility timeline charts

### Phase 2 — Real AI visibility (4–6 wks)  ← the differentiator
- **AI Monitoring Agent**: maintain a prompt set per project ("best EV startup
  in India", "best battery-swapping company"), actively query each engine,
  parse answers for brand mention / rank / citation.
- **Visibility Tracking Agent**: store time-series; replace the derived proxy
  with measured visibility (proxy stays as the cold-start estimate).
- SERP + Brand Mention agents.

### Phase 3 — Autonomous fixing (6–8 wks)
- Schema, FAQ, Knowledge Base, Content Generator agents
- Entity Graph agent (Neo4j) + auto JSON-LD
- Publishing agent (WordPress / Webflow / Shopify / Ghost / webhook)
- Human-in-the-loop approval queue

### Phase 4 — Intelligence & growth (ongoing)
- Competitor Intelligence, Topical Authority, Citation Builder
- Reddit / Community / Trend discovery → Opportunity agent
- Growth Strategy agent: a living, ranked action roadmap per project
- LangGraph graph with conditional edges, fan-out, checkpointed retries

## 2. MVP → production checklist

- [ ] Auth + tenancy + RBAC
- [ ] Stripe metering & plan gates
- [ ] Celery workers + scheduled jobs
- [ ] Live AI monitoring (replace proxy)
- [ ] Secrets encryption (KMS) for customer LLM keys
- [ ] Rate limiting + audit log
- [ ] Observability: Sentry, Prometheus, Grafana
- [ ] CI/CD (GitHub Actions) + EKS Helm charts
- [ ] SOC2 path (audit logging, least privilege)

## 3. Monetization

| Plan | Price (indicative) | For | Key limits |
|---|---|---|---|
| Starter | $49/mo | solo founders | 1 project, weekly scans, 50 prompts tracked |
| Growth | $199/mo | scaling startups | 5 projects, daily scans, content gen, 500 prompts |
| Agency | $599/mo | agencies | 25 projects, white-label, API, 2.5k prompts |
| Enterprise | custom | large brands | SSO, SLA, dedicated entity graph, unlimited |

Expansion levers: extra projects, prompt-tracking volume, content-generation
credits, publishing seats, API usage. Bring-your-own-LLM-key keeps COGS low;
managed-key tiers add margin.

## 4. Cost estimation (rough, monthly)

**Pre-revenue / dev:**
- Infra (small EKS or single VM, RDS, Redis): $150–400
- LLM (BYO key for most; platform key for trials): $50–300
- Tooling (Sentry/monitoring free tiers, CI minutes): ~$0–50
- **Total: ~$200–750/mo**

**At ~500 paying customers:**
- Infra (EKS, RDS multi-AZ, Redis, Neo4j Aura, CDN): $3k–6k
- LLM (managed-key share + embeddings): $2k–5k (usage-gated)
- Crawl egress / proxies for engine probing: $1k–3k
- **Total: ~$6k–14k/mo** against six-figure MRR → healthy gross margin.

Cost control: heuristics do the heavy lifting (free); LLM calls are gated,
cached, and largely BYO-key; embeddings use small models; crawls are capped.

## 5. $100M ARR thesis

- TAM: every business that has a website and cares about discovery — the same
  base SEO tools sell into, now re-platforming onto AI search.
- Wedge: a free, honest **AI Visibility Score** (this MVP) → PLG funnel.
- Moat compounds: proprietary time-series of engine answers, per-vertical
  entity graphs, and an autonomous fix→publish→measure loop competitors can't
  easily replicate.
- Path: 10k Starter + 3k Growth + 800 Agency + 50 Enterprise ≈ $100M ARR.

## 6. Investor pitch deck outline

1. **Hook** — "SEO is for Google. The next decade of discovery is AI search.
   Nobody can measure it. We can."
2. **Problem** — brands invisible in ChatGPT/Gemini/Perplexity, flying blind.
3. **Insight** — AEO is a new, measurable, optimizable discipline.
4. **Product** — live demo: domain → AI Visibility Score → autonomous fixes.
5. **Why now** — answer engines crossing into mainstream discovery.
6. **Moat** — data flywheel: answers × entities × outcomes over time.
7. **Market** — SEO tooling TAM re-platforming to AI search.
8. **Business model** — PLG + tiered SaaS + expansion; BYO-key economics.
9. **Traction** — activation, score-lift outcomes, logos.
10. **GTM** — free score as top of funnel → self-serve → agency channel.
11. **Team** — AI + SEO + growth.
12. **Financials** — path to $100M ARR (§5).
13. **Ask** — raise, milestones (Phase 1–3), 18-month plan.
```
