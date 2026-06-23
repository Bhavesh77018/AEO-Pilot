# Getting aeopilot.in indexed & cited

The on-site foundations are already shipped: HTTPS, a correct `sitemap.xml`, a
`robots.txt` that **welcomes AI crawlers**, `llms.txt`, full JSON-LD, and
canonical tags. This is the submission playbook on top of that.

## 1. Google Search Console (the big one)
1. Go to **search.google.com/search-console** → Add property → **Domain** →
   `aeopilot.in`. (Domain property covers www + all paths.)
2. Verify. Easiest options:
   - **DNS TXT record** (recommended for a Domain property), or
   - **HTML tag**: copy the token, set it on the host as
     `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<token>` (Netlify env var) → redeploy.
     The app renders the `google-site-verification` meta tag automatically.
3. Once verified → **Sitemaps** → submit `https://aeopilot.in/sitemap.xml`.
4. Use **URL Inspection** → "Request indexing" for the homepage and `/learn` to
   nudge the first crawl.

> Google retired its sitemap-ping endpoint — Search Console is the way in now.

## 2. Bing Webmaster Tools (powers Microsoft Copilot)
1. **bing.com/webmasters** → add `aeopilot.in` → **Import from Google Search
   Console** (one click) or verify directly.
2. Submit the sitemap. Bing feeds **Copilot**, so this matters for AEO.

## 3. IndexNow — instant push (Bing, Yandex, DuckDuckGo, …)
The key file already ships at `https://aeopilot.in/a3f8c1e94b2d47f6a0e5d8c3b6f1029e.txt`.
After a deploy, ping all IndexNow engines at once:

```bash
node scripts/indexnow.mjs
```

Re-run it whenever you publish new pages — it's the fastest way to get
non-Google engines (and Copilot) to re-crawl.

## 4. AI answer engines (ChatGPT, Gemini, Claude, Perplexity)
There's **no submit button** for these — they discover and re-crawl on their own
schedule. What gets you in:
- `robots.txt` already allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.
- `llms.txt` + `sitemap.xml` + rich JSON-LD give them clean, liftable content.
- **Get cited elsewhere** — the strongest lever. Mentions on pages these models
  trust (Reddit, comparison sites, docs, your own knowledge hub) are what make
  them name you. That's literally the product's job — run a scan on yourself and
  work the recommendations.

## 5. Verify it's working
```bash
curl -s https://aeopilot.in/sitemap.xml | grep -c "<loc>"      # 7 URLs
curl -sI https://aeopilot.in/a3f8c1e94b2d47f6a0e5d8c3b6f1029e.txt | head -1   # 200
```
Then watch coverage in Search Console / Bing over the following days.
