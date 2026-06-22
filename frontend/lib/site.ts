/** Canonical site metadata, used by SEO/AEO surfaces (schema, sitemap, robots). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const SITE = {
  name: "AEO Pilot",
  tagline: "Make your startup discoverable by AI.",
  description:
    "AEO Pilot is the growth platform for Answer Engine Optimization. Audit, " +
    "score, and grow your brand's visibility inside ChatGPT, Gemini, Claude, " +
    "Perplexity, Copilot, Grok and DeepSeek — with an autonomous agent fleet.",
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
