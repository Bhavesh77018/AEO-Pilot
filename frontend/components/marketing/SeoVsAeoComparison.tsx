"use client";

import { Reveal } from "./Reveal";

export function SeoVsAeoComparison() {
  const comparisons = [
    {
      aspect: "Search Target",
      seo: "Google's 10 blue links",
      aeo: "AI-generated answers (single source)",
      geo: "AI Search & LLM Overviews",
    },
    {
      aspect: "Optimization Focus",
      seo: "Keywords, backlinks, page rank",
      aeo: "Schema, FAQ, entity graph, answerability",
      geo: "Citations, factual accuracy, semantic depth",
    },
    {
      aspect: "Win Condition",
      seo: "Appear in top 10 results",
      aeo: "Get mentioned, ranked, cited by AI",
      geo: "Synthesized in main response with citations",
    },
    {
      aspect: "Buyer Journey",
      seo: "User searches, browses links, clicks",
      aeo: "User asks AI, gets one answer, you're cited or not",
      geo: "User converses with AI, explores cited sources",
    },
    {
      aspect: "Measurement",
      seo: "Impressions, clicks, traffic",
      aeo: "Mentions, visibility %, share of AI voice",
      geo: "Citation frequency, RAG inclusion",
    },
    {
      aspect: "Tools",
      seo: "Ahrefs, SEMrush, Moz",
      aeo: "AEO Pilot (built for answer engines)",
      geo: "AEO Pilot (built for generative engines)",
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <Reveal className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          SEO vs AEO vs GEO: What's the difference?
        </h2>
        <p className="mt-4 text-white/50">
          SEO optimizes for Google. AEO optimizes for the AI answer your buyer gets. GEO optimizes for Generative Engines.
        </p>
      </Reveal>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="grid grid-cols-4 gap-0 border-b border-white/10">
          {/* Header row */}
          <div className="border-r border-white/10 px-6 py-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Aspect
            </div>
          </div>
          <div className="border-r border-white/10 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                SEO
              </span>
            </div>
          </div>
          <div className="border-r border-white/10 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                AEO
              </span>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                GEO
              </span>
            </div>
          </div>
        </div>

        {/* Rows */}
        {comparisons.map((row, i) => (
          <div key={i} className="grid grid-cols-4 gap-0 border-b border-white/5 last:border-b-0">
            <div className="border-r border-white/5 px-6 py-4">
              <div className="text-sm font-semibold text-white">{row.aspect}</div>
            </div>
            <div className="border-r border-white/5 px-6 py-4">
              <div className="text-sm text-white/60">{row.seo}</div>
            </div>
            <div className="border-r border-white/5 px-6 py-4">
              <div className="text-sm text-emerald-300">{row.aeo}</div>
            </div>
            <div className="px-6 py-4">
              <div className="text-sm text-purple-300">{row.geo}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Key insight */}
      <div className="mt-10 rounded-xl border border-brand-500/30 bg-brand-500/10 p-6">
        <p className="text-sm leading-relaxed text-white/80">
          <strong className="text-brand-300">The bottom line:</strong> The brands
          that invest in{" "}
          <span className="font-semibold text-white">all three pillars today</span>{" "}
          will own AI search tomorrow. AEO Pilot is the only platform — and the
          only expert team — purpose-built to audit, execute, and measure your
          visibility across SEO, AEO, and GEO simultaneously.
        </p>
      </div>
    </section>
  );
}
