import Link from "next/link";
import { EngineMarquee } from "@/components/marketing/EngineMarquee";
import { Faq } from "@/components/marketing/Faq";
import { HeroVisual } from "@/components/marketing/HeroVisual";
import { Pricing } from "@/components/marketing/Pricing";
import { Reveal } from "@/components/marketing/Reveal";
import { SeoAeoAnimation } from "@/components/marketing/SeoAeoAnimation";
import { SeoVsAeoComparison } from "@/components/marketing/SeoVsAeoComparison";
import { ChatPilotInterface } from "@/components/marketing/ChatPilotInterface";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/structured-data";
import {
  ScanIcon,
  MonitorIcon,
  RecommendIcon,
  CompareIcon,
} from "@/components/Icons";

const STATS = [
  { value: "8+", label: "Answer engines tracked" },
  { value: "25", label: "Autonomous agents" },
  { value: "8", label: "AEO score categories" },
  { value: "60s", label: "To your first score" },
];

const STEPS = [
  {
    n: "01",
    title: "Crawl & understand",
    body: "Drop in a domain. The Website Auditor crawls your pages, metadata, schema, and content to build a semantic picture of your brand.",
    icon: "scan",
  },
  {
    n: "02",
    title: "Score across 8 categories",
    body: "The AEO engine scores Technical AEO, Entity Strength, Schema, Answerability, AI Readability, Citation Readiness and more — 0 to 100.",
    icon: "monitor",
  },
  {
    n: "03",
    title: "Monitor the engines",
    body: "The AI Monitoring Agent prompts ChatGPT, Gemini, Claude & Perplexity with real buyer questions and measures your mention rate, rank, and citations.",
    icon: "monitor",
  },
  {
    n: "04",
    title: "Fix & grow",
    body: "Get prioritized fixes — or let our Done-For-You team implement schema, FAQ corpora, entity graphs and citation campaigns for you.",
    icon: "recommend",
  },
];

const FEATURES = [
  { icon: "recommend", title: "Entity graph", body: "Map your company, people, products and competitors, then auto-generate JSON-LD that engines trust." },
  { icon: "recommend", title: "FAQ engine", body: "Generate hundreds of intent-clustered, schema-ready FAQs that become the answers LLMs cite." },
  { icon: "compare", title: "Competitor intelligence", body: "See which rivals own the AI answers, and the exact authority gaps you can close." },
  { icon: "recommend", title: "Knowledge hub generator", body: "Spin up /faq, /guides, /glossary and /compare pages — AI-readable and human-readable." },
  { icon: "scan", title: "Citation builder", body: "Surface the sources, communities and pages where a mention turns into a citation." },
  { icon: "monitor", title: "Visibility tracking", body: "Track mention frequency, ranking, and Share of AI Voice over time, per engine." },
];

const ENGINES = [
  "ChatGPT", "GPT Search", "Gemini", "Claude",
  "Perplexity", "Copilot", "Grok", "DeepSeek",
];

// Helper function to get icon component
function getIcon(iconName: string) {
  switch (iconName) {
    case "scan":
      return <ScanIcon size={28} className="text-brand-400" />;
    case "monitor":
      return <MonitorIcon size={28} className="text-sky-400" />;
    case "recommend":
      return <RecommendIcon size={28} className="text-emerald-400" />;
    case "compare":
      return <CompareIcon size={28} className="text-amber-400" />;
    default:
      return <ScanIcon size={28} className="text-brand-400" />;
  }
}

export default function LandingPage() {
  return (
    <>
      <JsonLd data={faqSchema()} />

      {/* ───────── Hero ───────── */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up">
            <Link
              href="/#how"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 transition hover:bg-white/10"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              AI Search is the new frontier
            </Link>
            
            {/* Animated SEO → AEO transition */}
            <div className="mt-8 mb-6">
              <SeoAeoAnimation />
            </div>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/55">
              SEO got you ranked on Google's blue links. AEO gets you{" "}
              <span className="text-white/80">mentioned, ranked, and cited</span>{" "}
              inside ChatGPT, Gemini, Claude and Perplexity — with an autonomous
              agent fleet that audits, scores, and grows your AI visibility.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/app"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition hover:bg-brand-400"
              >
                Launch AEO Pilot
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:bg-white/5"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/35">
              2 free projects · zero API keys needed · first score in under a minute.
            </p>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <HeroVisual />
          </div>
        </div>

        {/* marquee */}
        <div className="mt-16">
          <p className="mb-3 text-center text-xs uppercase tracking-wider text-white/30">
            Optimized for every answer engine
          </p>
          <EngineMarquee />
        </div>
      </section>

      {/* ───────── Stats ───────── */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="text-center">
              <div className="text-3xl font-black text-white sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs text-white/45">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── SEO vs AEO Comparison ───────── */}
      <SeoVsAeoComparison />

      {/* ───────── Chat Pilot Interface ───────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Meet your AEO Pilot
          </h2>
          <p className="mt-4 text-white/50">
            Conversational scanning. Instant AEO insights. Every project in one place.
          </p>
        </Reveal>
        <ChatPilotInterface />
      </section>

      {/* ───────── What is AEO Pilot (answer-optimized definition) ───────── */}
      <section id="what" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-16">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            What is AEO Pilot?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            <strong className="text-white">AEO Pilot</strong> is an Answer Engine
            Optimization platform that audits your website, scores its AI-readiness
            across 8 categories, and monitors whether ChatGPT, Gemini, Claude and
            Perplexity actually mention, rank, and cite your brand. It then
            generates the fixes — structured data, FAQs, an entity graph, and a
            knowledge hub — that get you into AI-generated answers.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            Where SEO optimizes for Google&apos;s ten blue links, AEO optimizes
            for the single answer an AI assistant gives. As buyers shift from
            searching to asking, the brands cited in those answers win the
            consideration — and AEO Pilot is how you become one of them.
          </p>
        </Reveal>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            From invisible to cited — in four moves
          </h2>
          <p className="mt-3 text-white/50">
            A fleet of agents does the work SEO teams can&apos;t: optimizing for
            the single answer an AI gives.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-brand-500/40 hover:bg-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{getIcon(s.icon)}</span>
                  <span className="text-xs font-bold text-white/20">{s.n}</span>
                </div>
                <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to win AI Search
          </h2>
          <p className="mt-3 text-white/50">
            One platform for auditing, generating, publishing and tracking your
            answer-engine presence.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:-translate-y-1 hover:border-brand-500/40">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500/20 to-sky-400/10">
                  {getIcon(f.icon)}
                </div>
                <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Engines ───────── */}
      <section id="engines" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-8 sm:p-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              We measure where it counts
            </h2>
            <p className="mt-3 text-white/50">
              For every engine, we track three things buyers feel: are you{" "}
              <span className="text-white/80">mentioned</span>, at what{" "}
              <span className="text-white/80">rank</span>, and are you{" "}
              <span className="text-white/80">cited</span>.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ENGINES.map((e, i) => (
              <Reveal key={e} delay={i * 50}>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/40 px-4 py-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-300">
                    {e.slice(0, 2)}
                  </span>
                  <span className="text-sm text-white/75">{e}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Done-For-You ───────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-600/20 via-brand-500/5 to-transparent p-8 sm:p-14">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                Done-for-you
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Short on time? Our experts repair your AEO for you.
              </h2>
              <p className="mt-4 text-white/55">
                Every scan includes a managed-service option. We implement the
                schema, build the entity graph and knowledge hub, and run the
                citation campaign that gets your brand cited across the engines —
                with a measurable-lift guarantee.
              </p>
              <Link
                href="/app"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-white/90"
              >
                Run a free scan to see your plan →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Freemium pricing that grows with you
          </h2>
          <p className="mt-3 text-white/50">
            Start with 2 free projects. Upgrade anytime to unlock more projects, 
            AI monitoring, and done-for-you services.
          </p>
        </Reveal>
        <div className="mt-12">
          <Pricing />
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
        </Reveal>
        <div className="mt-10">
          <Faq />
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-800/60 p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand-600/20 via-transparent to-sky-500/10" />
            <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
              Find out why AI doesn&apos;t mention you yet.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/55">
              Run your first AEO scan in under a minute — no key, no card.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition hover:bg-brand-400"
              >
                Launch AEO Pilot →
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-8 py-4 text-sm font-semibold text-white/80 transition hover:bg-white/5"
              >
                Compare plans
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
