import Link from "next/link";
import { EngineMarquee } from "@/components/marketing/EngineMarquee";
import { Faq } from "@/components/marketing/Faq";
import { HeroVisual } from "@/components/marketing/HeroVisual";
import { Pricing } from "@/components/marketing/Pricing";
import { Reveal } from "@/components/marketing/Reveal";
import { SeoVsAeoComparison } from "@/components/marketing/SeoVsAeoComparison";
import { ChatPilotInterface } from "@/components/marketing/ChatPilotInterface";
import { HireUsButton } from "@/components/marketing/HireUsButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/structured-data";
import {
  ScanIcon,
  MonitorIcon,
  RecommendIcon,
  CompareIcon,
} from "@/components/Icons";

const STATS = [
  { value: "3", label: "Pillars · SEO · AEO · GEO" },
  { value: "8+", label: "AI engines tracked" },
  { value: "9", label: "Score categories" },
  { value: "60s", label: "To your first score" },
];

const STEPS = [
  {
    n: "01",
    title: "Deep-crawl your brand",
    body: "We crawl every page, schema, metadata and content signal to build a complete semantic model of your brand — the same way AI models see you.",
    icon: "scan",
  },
  {
    n: "02",
    title: "Score across SEO · AEO · GEO",
    body: "One unified Search Visibility Score across all three modern pillars — 9 categories, 0 to 100. You see exactly where you're winning and where you're invisible.",
    icon: "monitor",
  },
  {
    n: "03",
    title: "Monitor every AI engine",
    body: "We actively prompt ChatGPT, Gemini, Claude & Perplexity with real buyer questions and track your mention rate, rank position, and citations — daily.",
    icon: "monitor",
  },
  {
    n: "04",
    title: "Execute & dominate",
    body: "Our expert team implements schema, FAQ corpora, entity graphs and citation campaigns — or you self-serve with our AI-generated, step-by-step fix list.",
    icon: "recommend",
  },
];

const FEATURES = [
  { icon: "recommend", title: "Entity graph engineering", body: "Map your company, people, products and competitors into a trust graph, then auto-generate JSON-LD that every AI engine reads and trusts." },
  { icon: "recommend", title: "FAQ & answer corpus", body: "Generate hundreds of intent-clustered, schema-ready Q&As that become the exact answers LLMs cite when buyers ask about your category." },
  { icon: "compare", title: "Competitor intelligence", body: "Discover which rivals own the AI narrative in your category, the exact gap, and the fastest path to closing it." },
  { icon: "recommend", title: "Knowledge hub generation", body: "We build /faq, /guides, /glossary and /compare pages — perfectly structured for both AI crawlers and human readers." },
  { icon: "scan", title: "Citation & authority builder", body: "Surface the exact sources, communities and publications where earning a mention turns into a durable AI citation." },
  { icon: "monitor", title: "Share of AI Voice™ tracking", body: "Track how often you're mentioned, at what rank, and with what framing — per engine, per buyer intent, over time." },
];

const ENGINES = [
  "ChatGPT", "GPT Search", "Gemini", "Claude",
  "Perplexity", "Copilot", "Grok", "DeepSeek",
];

const WHY_HIRE_US = [
  {
    icon: "🏆",
    title: "We built the playbook",
    body: "AEO Pilot is the only platform purpose-built for Answer Engine & Generative Engine Optimization — not an SEO tool retrofitted for AI. We wrote the methodology from scratch.",
  },
  {
    icon: "⚡",
    title: "Speed that beats your market",
    body: "From first scan to first fix in under 60 seconds. Your competitors are still ranking for blue links while we get your brand into the AI answer.",
  },
  {
    icon: "📡",
    title: "We track what others can't see",
    body: "Real-time AI engine monitoring across 8+ LLMs. We actively prompt ChatGPT, Gemini, Claude and Perplexity with your buyer's exact questions — and show you who's winning.",
  },
  {
    icon: "🔬",
    title: "Proprietary scoring model",
    body: "Our 9-category Search Visibility Score is the only unified metric that combines traditional SEO health with AI answerability and generative citation depth.",
  },
  {
    icon: "🤝",
    title: "Done-For-You execution",
    body: "Insight is worthless without action. Our expert team implements every fix — schema, entity graphs, FAQ corpora, content and citations — with a measurable lift guarantee.",
  },
  {
    icon: "📈",
    title: "ROI you can prove",
    body: "Buyer questions → AI answer → your brand cited → sale. We measure every step of that chain so you can present hard numbers to stakeholders.",
  },
];

const WHY_INVEST = [
  {
    stat: "$1.8T",
    label: "AI market by 2030",
    detail: "Every dollar of that growth flows through search. Brands cited in AI answers capture consideration that blue-link brands will never see.",
  },
  {
    stat: "54%",
    label: "of buyers start with AI",
    detail: "More than half of B2B purchase journeys now begin with an AI query — and the AI gives one answer, not ten links. Position zero is everything.",
  },
  {
    stat: "3×",
    label: "conversion lift from citations",
    detail: "Brands explicitly cited by ChatGPT or Perplexity convert at 3× the rate of brands found via a regular search link. Trust is pre-built.",
  },
  {
    stat: "Early",
    label: "mover advantage closes fast",
    detail: "AI citations form preference loops — the brands cited most become the brands cited first. The window to establish dominance is now.",
  },
];

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

const THREE_PILLARS = [
  {
    abbr: "SEO",
    full: "Search Engine Optimization",
    title: "Rank on Google & Bing",
    what: "Technical health, on-page signals, and content structure that traditional search engines reward with top positions.",
    win: "You appear high in the search results.",
    does: "Audits HTTPS, canonicals, mobile, titles/meta, headings, internal linking and content depth — with the exact fixes.",
    accent: "from-sky-500/15 to-transparent border-sky-500/30",
    badge: "bg-sky-500/20 text-sky-300",
  },
  {
    abbr: "AEO",
    full: "Answer Engine Optimization",
    title: "Be the direct answer",
    what: "Featured snippets, voice, and AI answer engines that return one answer instead of ten links. First or invisible.",
    win: "You ARE the answer the engine returns.",
    does: "Builds your entity graph + schema (Organization, FAQ, Article) and liftable Q&A so engines quote you directly.",
    accent: "from-brand-500/15 to-transparent border-brand-500/30",
    badge: "bg-brand-500/20 text-brand-300",
  },
  {
    abbr: "GEO",
    full: "Generative Engine Optimization",
    title: "Get cited by generative AI",
    what: "ChatGPT, Gemini, Claude, Perplexity and AI Overviews synthesize answers and name their sources. Be that source.",
    win: "AI names and links your brand in its reply.",
    does: "Tracks your mention rate & Share of AI Voice, adds llms.txt + citation-ready content, and monitors every engine.",
    accent: "from-emerald-500/15 to-transparent border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
];

export default function LandingPage() {
  return (
    <>
      <JsonLd data={faqSchema()} />

      {/* ───────── Hero ───────── */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up">
            <Link
              href="/#why-hire-us"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 transition hover:bg-white/10"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              The AI search era is here — is your brand ready?
            </Link>

            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              We rank your brand in{" "}
              <span className="gradient-text">AI + Google.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/55">
              AEO Pilot is the{" "}
              <span className="text-white/80">premium AI search agency</span>{" "}
              that makes your brand the answer ChatGPT, Gemini, Claude &
              Perplexity give — across{" "}
              <span className="text-white/80">SEO</span>,{" "}
              <span className="text-white/80">AEO</span> and{" "}
              <span className="text-white/80">GEO</span> — one score, one
              workflow, zero guesswork.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/#why-hire-us"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition hover:bg-brand-400"
              >
                Why hire us
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="/#invest"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:bg-white/5"
              >
                Why invest in us
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/35">
              Free visibility scan · no API keys needed · first score in under a minute.
            </p>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <HeroVisual />
          </div>
        </div>

        {/* marquee */}
        <div className="mt-16">
          <p className="mb-3 text-center text-xs uppercase tracking-wider text-white/30">
            We rank you on Google, Bing & every AI answer engine
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

      {/* ───────── Vision ───────── */}
      <section id="vision" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-20">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            Our vision
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Every brand deserves to be the answer.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Search is no longer a list of links. It's a single, authoritative
            answer generated by an AI that has already decided who to trust.{" "}
            <strong className="text-white">
              That decision is made before the buyer ever types their question.
            </strong>
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/55">
            We built AEO Pilot to solve this — a proprietary platform that
            audits, scores, and grows your visibility across{" "}
            <span className="text-sky-300">SEO</span>,{" "}
            <span className="text-brand-300">AEO</span>, and{" "}
            <span className="text-emerald-300">GEO</span>. One unified Search
            Visibility Score. One workflow. A team of experts who execute every
            fix. This is not an SEO tool with AI features bolted on — this is
            the platform built from day one for the answer-engine era.
          </p>
        </Reveal>
      </section>

      {/* ───────── The three pillars ───────── */}
      <section id="pillars" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            One score for the whole search era
          </h2>
          <p className="mt-3 text-white/50">
            Search is splitting three ways — the blue link, the direct answer,
            and the generative reply. Most agencies cover one. We cover all three.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {THREE_PILLARS.map((p, i) => (
            <Reveal key={p.abbr} delay={i * 90}>
              <div className={`h-full rounded-2xl border bg-gradient-to-b p-6 ${p.accent}`}>
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${p.badge}`}>
                    {p.abbr}
                  </span>
                  <span className="text-xs text-white/45">{p.full}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{p.what}</p>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="text-[10px] uppercase tracking-wider text-white/35">
                    You win when
                  </div>
                  <p className="mt-1 text-sm font-medium text-white/80">{p.win}</p>
                </div>
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/35">
                    AEO Pilot does
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">{p.does}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center">
          <p className="text-sm text-white/45">
            Three pillars →{" "}
            <span className="text-white/80">one Search Visibility Score</span>.
            Enter your domain and see all three in under a minute.
          </p>
          <Link
            href="/app"
            className="mt-4 inline-flex rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            Get your free visibility score →
          </Link>
        </Reveal>
      </section>

      {/* ───────── SEO vs AEO vs GEO Comparison ───────── */}
      <SeoVsAeoComparison />

      {/* ───────── Why Invest in Us ───────── */}
      <section id="invest" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Why invest in us
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            The market is moving. The window is now.
          </h2>
          <p className="mt-3 text-white/50">
            AI search is not a future trend — it&apos;s the present default for
            high-intent buyers. The brands investing in AI visibility today will
            own the category tomorrow.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_INVEST.map((item, i) => (
            <Reveal key={item.stat} delay={i * 80}>
              <div className="h-full rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-6 transition hover:border-amber-500/40">
                <div className="text-4xl font-black text-amber-300">{item.stat}</div>
                <div className="mt-1 text-sm font-semibold text-white">{item.label}</div>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{item.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
            <p className="text-base leading-relaxed text-white/70">
              <strong className="text-amber-300">The opportunity:</strong>{" "}
              AI citation preference loops form early and compound fast. The brands
              that earn citations now become the default cited brands for years.{" "}
              <span className="font-semibold text-white">
                First-mover advantage in AI search is worth more than a decade of
                traditional SEO backlinks.
              </span>
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-ink-900 shadow-lg shadow-amber-600/30 transition hover:bg-amber-400"
              >
                Scan your brand now →
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
              >
                View investment plans
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Why Hire Us ───────── */}
      <section id="why-hire-us" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            Why hire us
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            We don&apos;t just audit. We dominate.
          </h2>
          <p className="mt-3 text-white/50">
            We built the methodology, the platform, and the execution team that
            makes your brand the answer — across every AI engine.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_HIRE_US.map((item, i) => (
            <Reveal key={item.title} delay={i * 70}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:-translate-y-1 hover:border-brand-500/40 hover:bg-white/[0.04]">
                <div className="text-3xl">{item.icon}</div>
                <h3 className="mt-4 font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center">
          <HireUsButton
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition hover:bg-brand-400"
          >
            Hire our team →
          </HireUsButton>
          <p className="mt-3 text-xs text-white/35">
            Done-for-you service · schema + entity graph + citations + monitoring
          </p>
        </Reveal>
      </section>

      {/* ───────── Chat Pilot Interface ───────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Meet your AEO Pilot
          </h2>
          <p className="mt-4 text-white/50">
            Conversational scanning. Instant visibility insights. Every project in one place.
          </p>
        </Reveal>
        <ChatPilotInterface />
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How we rank your brand — in four moves
          </h2>
          <p className="mt-3 text-white/50">
            A proprietary system — part platform, part expert team — that does
            the work no traditional SEO agency can.
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
            Everything built to win AI Search
          </h2>
          <p className="mt-3 text-white/50">
            A complete arsenal — auditing, generating, publishing and tracking —
            purpose-built for the generative search era.
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
              We track every engine that matters
            </h2>
            <p className="mt-3 text-white/50">
              For every engine, we answer three questions buyers care about:{" "}
              <span className="text-white/80">are you mentioned</span>, at what{" "}
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
                Hire our team · done-for-you
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Not enough time? We execute every fix for you.
              </h2>
              <p className="mt-4 text-white/55">
                Every scan includes a managed-service option. Our team
                implements schema, builds the entity graph and knowledge hub,
                and runs citation campaigns that get your brand cited across all
                AI engines — with a{" "}
                <strong className="text-white">measurable lift guarantee</strong>.
              </p>
              <ul className="mt-5 space-y-2">
                {[
                  "Schema & structured data implementation",
                  "Entity graph & knowledge base creation",
                  "FAQ corpus & citation-ready content",
                  "AI citation campaign execution",
                  "Monthly Share of AI Voice reports",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                    <span className="text-brand-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <HireUsButton
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-white/90"
              >
                Talk to our team →
              </HireUsButton>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Pricing / Investment Plans ───────── */}
      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            Investment plans
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Choose your path to AI search dominance
          </h2>
          <p className="mt-3 text-white/50">
            Start free to see your visibility score. Upgrade to unlock
            monitoring, content generation, and Done-For-You execution.
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
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
              Start now · free
            </span>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
              See exactly where your brand stands in AI{" "}
              <span className="gradient-text">+ Google.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/55">
              One free visibility scan. One unified Search Visibility Score
              across SEO, AEO & GEO — in under a minute. No API key. No credit
              card.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition hover:bg-brand-400"
              >
                Get your free score →
              </Link>
              <HireUsButton
                className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Hire our team →
              </HireUsButton>
            </div>
            <p className="mt-4 text-xs text-white/30">
              Join brands that are already winning the AI answer.
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
