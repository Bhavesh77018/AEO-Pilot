/** Canonical site metadata, used by SEO/AEO surfaces (schema, sitemap, robots).
 *  Defaults to the production domain so canonical/sitemap/robots are correct
 *  even if NEXT_PUBLIC_SITE_URL isn't set on the host. Override per-env as needed. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production" ? "https://aeopilot.in" : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE = {
  name: "AEO Pilot",
  tagline: "SEO + AEO + GEO — get found everywhere.",
  description:
    "AEO Pilot is the all-in-one Search Visibility platform for SEO, AEO and " +
    "GEO. Audit and grow your brand across Google search, AI answer engines, " +
    "and generative AI (ChatGPT, Gemini, Claude, Perplexity) — one score, one " +
    "place.",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  email: "hello@aeopilot.example",
  sameAs: [
    "https://github.com/Bhavesh77018/AEO-Pilot",
    "https://twitter.com/aeopilot",
    "https://www.linkedin.com/company/aeopilot",
  ],
};

/** The knowledge-hub pages — drive the sitemap, nav, and AEO knowledge coverage. */
export const KNOWLEDGE_PAGES = [
  { slug: "learn", title: "What is AEO?", blurb: "Answer Engine Optimization explained, and how AEO Pilot works." },
  { slug: "guides", title: "AEO Guides", blurb: "Step-by-step playbooks to get cited by AI answer engines." },
  { slug: "comparisons", title: "AEO vs SEO", blurb: "How optimizing for answers differs from optimizing for links." },
  { slug: "glossary", title: "AEO Glossary", blurb: "The vocabulary of Answer Engine Optimization, defined." },
  { slug: "use-cases", title: "Use Cases", blurb: "How startups, SaaS, agencies and brands use AEO Pilot." },
  { slug: "faq", title: "FAQ", blurb: "Answers to the most common questions about AEO and AEO Pilot." },
] as const;
