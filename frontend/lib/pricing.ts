export interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthly: number | null; // null = custom / contact
  annual: number | null; // effective per-month price billed annually
  badge?: string;
  cta: string;
  ctaHref: string;
  highlight?: boolean;
  limits: {
    projects: string;
    scans: string;
    prompts: string;
    engines: string;
    tokens: string;
    monitoring: string;
  };
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Find out why AI ignores you.",
    monthly: 0,
    annual: 0,
    cta: "Start free",
    ctaHref: "/app",
    limits: {
      projects: "2 projects",
      scans: "5 scans / month",
      prompts: "50 tracked prompts",
      engines: "4 answer engines",
      tokens: "25K AI tokens / mo",
      monitoring: "Weekly refresh",
    },
    features: [
      "Full 8-category AEO score",
      "Prioritized recommendations",
      "Per-engine visibility estimate",
      "Community support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Climb into the AI answers.",
    monthly: 3999,
    annual: 3199,
    badge: "Most popular",
    highlight: true,
    cta: "Start Growth",
    ctaHref: "/app",
    limits: {
      projects: "5 projects",
      scans: "100 scans / month",
      prompts: "500 tracked prompts",
      engines: "All 8 engines",
      tokens: "500K AI tokens / mo",
      monitoring: "Daily monitoring",
    },
    features: [
      "Live AI monitoring + Share of Voice",
      "Competitor tracking",
      "Schema, FAQ & content generation",
      "Email support",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    tagline: "Run AEO for every client.",
    monthly: 15999,
    annual: 12999,
    cta: "Start Agency",
    ctaHref: "/app",
    limits: {
      projects: "25 projects",
      scans: "Unlimited scans",
      prompts: "5,000 tracked prompts",
      engines: "All engines + early access",
      tokens: "3M AI tokens / mo",
      monitoring: "Hourly monitoring",
    },
    features: [
      "White-label reports",
      "Full REST API access",
      "Bulk publishing (WordPress, Webflow…)",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Own the answer at scale.",
    monthly: null,
    annual: null,
    cta: "Talk to sales",
    ctaHref: "mailto:sales@aeopilot.example?subject=Enterprise%20inquiry",
    limits: {
      projects: "Unlimited projects",
      scans: "Unlimited scans",
      prompts: "Unlimited prompts",
      engines: "Custom + private models",
      tokens: "Bring-your-own-key · unlimited",
      monitoring: "Real-time monitoring",
    },
    features: [
      "SSO / SAML & audit logs",
      "Dedicated success manager + SLA",
      "Done-For-You AEO team",
      "On-prem / VPC deployment",
    ],
  },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Answer Engine Optimization (AEO)?",
    a: "SEO optimizes for Google's ten blue links. AEO optimizes for the single answer an AI gives — making sure ChatGPT, Gemini, Claude and Perplexity actually mention, rank, and cite your brand when buyers ask.",
  },
  {
    q: "How is visibility measured?",
    a: "Two ways. On-page AEO readiness is scored deterministically across 8 categories (no API key needed). With a provider key connected, the AI Monitoring Agent actively prompts each engine and parses the answers for real mention rate, rank, and citations.",
  },
  {
    q: "What are AI tokens and why do plans include them?",
    a: "Tokens power content generation, recommendation enrichment, and live answer-engine probing. A scan uses ~5–20K tokens; a monitoring sweep ~8K per engine. Or bring your own OpenAI / Anthropic / Gemini key and the AI compute is on you — every plan supports it.",
  },
  {
    q: "Do I need to connect an API key to start?",
    a: "No. The crawler, the 8-category score, and recommendations run entirely on heuristics with zero keys. Add a key only when you want LLM-written content and live per-engine measurement.",
  },
  {
    q: "Can you implement the fixes for me?",
    a: "Yes — every scan includes a Done-For-You managed-service option where our AEO team implements the schema, entity graph, knowledge hub, and citation campaign for you.",
  },
  {
    q: "Can I change plans or cancel anytime?",
    a: "Always. Upgrade, downgrade, or cancel from billing — changes prorate instantly and your data stays put.",
  },
];
