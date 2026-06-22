# Deploying AEO Pilot

Production runs in three managed pieces that already exist in this repo:

| Piece | Platform | Why |
|---|---|---|
| **Frontend** (Next.js) | **Netlify** or **Vercel** | First-class Next.js hosting, edge middleware, previews |
| **Backend** (FastAPI) | **Render** (or Railway/Fly) | Long scans + migrations + background work don't fit serverless |
| **Database + Auth** | **Supabase** | Postgres (pgvector) + auth — already wired |

```
Browser ──▶ Vercel (Next.js) ──NEXT_PUBLIC_API_URL──▶ Render (FastAPI) ──▶ Supabase Postgres
                  │                                                              ▲
                  └────────────────── Supabase Auth ────────────────────────────┘
```

---

## 1. Backend → Render

1. Push this repo to GitHub (already done).
2. Render → **New → Blueprint** → select this repo. It reads [`render.yaml`](render.yaml).
3. Set the secret env vars (marked `sync: false`) in the Render dashboard:

   | Var | Value |
   |---|---|
   | `DATABASE_URL` | Supabase **session pooler** URL (IPv4). `postgresql+psycopg://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres?sslmode=require` |
   | `CORS_ORIGINS` | Your Vercel URL, e.g. `https://aeo-pilot.vercel.app` (comma-separate multiples) |
   | `OPENAI_API_KEY` | `sk-...` (optional — unlocks live monitoring + content) |
   | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | optional — leave unset to keep billing disabled |

   `SECRET_KEY` is auto-generated; `preDeployCommand` runs `alembic upgrade head` automatically.
4. Deploy. Confirm `https://<your-app>.onrender.com/health` returns `{"status":"ok"}`.

> ⚠️ Use the Supabase **session pooler** (IPv4) host, NOT the direct `db.<ref>.supabase.co` host — the direct host is IPv6-only and many platforms can't reach it.

## 2. Frontend → Vercel

1. Vercel → **New Project** → import this repo.
2. **Root Directory: `frontend`** (important — the app is in a subfolder).
   Framework auto-detects as Next.js; [`frontend/vercel.json`](frontend/vercel.json) adds security headers.
3. Set Environment Variables (Production **and** Preview):

   | Var | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | your Render URL, e.g. `https://aeo-pilot-api.onrender.com` |
   | `NEXT_PUBLIC_SITE_URL` | your Vercel/custom domain, e.g. `https://aeo-pilot.vercel.app` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` (browser-safe) |

4. Deploy. Then go back to Render and set `CORS_ORIGINS` to the final Vercel domain.

## 2b. Frontend → Netlify (alternative to Vercel)

The repo ships [`netlify.toml`](netlify.toml) with `base = "frontend"` and the
official Next.js runtime plugin.

1. Netlify → **Add new site → Import from Git** → pick this repo.
2. Build settings are read from `netlify.toml` (base `frontend`, `next build`).
3. **Site settings → Environment variables** — add the same four as Vercel:
   `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Deploy, then set the backend's `CORS_ORIGINS` to your `*.netlify.app` URL.

## 3. Database — apply the user + queries schema

In Supabase → **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql)
once. It creates `profiles` (your user list, auto-filled on signup),
`user_queries` (everything users ask — to improve the product), a `waitlist`,
RLS policies, and an `admin_user_overview` view. Make yourself admin:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

> The backend's own tables (projects, scans, …) are created by Alembic; this SQL
> only adds the **auth-scoped, RLS-protected** tables the frontend reads directly.

## 4. Supabase auth redirect URLs

Supabase → **Authentication → URL Configuration**:
- **Site URL**: your Vercel domain.
- **Redirect URLs**: add `https://<your-domain>/auth/callback` (and the Vercel preview pattern `https://*-<team>.vercel.app/auth/callback` if you use previews).

(Optional) Turn **off** email confirmation for instant sign-in while testing:
Authentication → Providers → Email → disable "Confirm email".

---

## Environment variable reference

**Frontend (Vercel)** — see [`frontend/.env.example`](frontend/.env.example):
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Backend (Render)** — see [`.env.example`](.env.example):
`DATABASE_URL`, `CORS_ORIGINS`, `LLM_PROVIDER`, `LLM_MODEL`, `OPENAI_API_KEY`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SECRET_KEY`, `APP_ENV`

## HTTPS / "Not Secure" — checklist

Netlify (and Vercel) serve every site over HTTPS automatically. If the browser
shows **"Not Secure"**, it's one of these:

1. **Custom domain, cert still provisioning.** Netlify → Domain management →
   HTTPS → **Verify DNS configuration** then **Provision certificate** (Let's
   Encrypt, free). Turn on **Force HTTPS**. New certs can take a few minutes.
   Make sure your DNS points to Netlify (CNAME/ALIAS), not an old host.
2. **Mixed content** — an HTTPS page loading an HTTP resource. The usual culprit
   is `NEXT_PUBLIC_API_URL` set to `http://…`. Set it to your **https** backend
   URL. The app now also (a) sends `Content-Security-Policy:
   upgrade-insecure-requests` and (b) auto-upgrades an http API base to https in
   the browser — but fix the env var so the request starts secure.
3. **You typed `http://`.** `Strict-Transport-Security` (HSTS) is now sent, so
   browsers will stick to https after the first secure visit.

Verify headers after deploy:
```bash
curl -sI https://<your-site> | grep -iE "strict-transport|content-security|x-frame"
```

## Smoke test after deploy

```bash
curl https://<render>/health                       # {"status":"ok"}
curl https://<vercel>/robots.txt                   # welcomes AI crawlers
curl https://<vercel>/sitemap.xml                  # lists routes
# In the app: sign up → add a domain → run a scan → see the score.
```
