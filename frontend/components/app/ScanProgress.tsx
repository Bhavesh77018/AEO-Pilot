"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ScanStep {
  id: string;
  label: string;
  detail: string;
  icon: string;
  tip: string;
  durationMs: number;
}

const SCAN_STEPS: ScanStep[] = [
  {
    id: "crawl",
    label: "Crawling your site",
    detail: "Discovering pages, links & structure",
    icon: "🔍",
    tip: "We map every reachable URL to build a complete picture of your web presence.",
    durationMs: 2200,
  },
  {
    id: "schema",
    label: "Analysing schema markup",
    detail: "Checking JSON-LD, microdata & structured data",
    icon: "📋",
    tip: "Structured data is the #1 signal AI engines use to understand your content.",
    durationMs: 1800,
  },
  {
    id: "content",
    label: "Scoring content answerability",
    detail: "FAQ density, headings & entity coverage",
    icon: "✍️",
    tip: "AI models prefer content written in clear Q&A format with rich entity mentions.",
    durationMs: 2000,
  },
  {
    id: "seo",
    label: "Running SEO audit",
    detail: "HTTPS, canonicals, mobile, meta & links",
    icon: "📈",
    tip: "Strong technical SEO is the foundation — without it, AEO gains won't stick.",
    durationMs: 1600,
  },
  {
    id: "ai",
    label: "Estimating AI visibility",
    detail: "ChatGPT · Gemini · Claude · Perplexity · Copilot",
    icon: "🤖",
    tip: "We simulate how each AI engine retrieves and ranks your brand as an answer.",
    durationMs: 2400,
  },
  {
    id: "score",
    label: "Computing visibility score",
    detail: "Combining SEO + AEO + GEO across 9 categories",
    icon: "📊",
    tip: "Your Search Visibility Score is a single number that unifies three disciplines.",
    durationMs: 1400,
  },
  {
    id: "recs",
    label: "Generating recommendations",
    detail: "Prioritised fixes ranked by impact",
    icon: "💡",
    tip: "Every recommendation is tied to a specific metric so you know exactly what to fix first.",
    durationMs: 1600,
  },
];

type StepState = "waiting" | "running" | "done";

interface ScanProgressProps {
  domain: string;
  onComplete?: () => void;
}

export function ScanProgress({ domain, onComplete }: ScanProgressProps) {
  const router = useRouter();
  const [stepStates, setStepStates] = useState<Record<string, StepState>>(
    Object.fromEntries(SCAN_STEPS.map((s) => [s.id, "waiting"]))
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dots, setDots] = useState(".");
  const [isComplete, setIsComplete] = useState(false);
  const [navCountdown, setNavCountdown] = useState(3);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // One unified navigate function — always does something.
  const handleComplete = () => {
    if (onCompleteRef.current) {
      onCompleteRef.current();
    } else {
      // Standalone/preview fallback — go to app dashboard.
      router.push("/app");
    }
  };

  // Animated dots
  useEffect(() => {
    if (isComplete) return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 400);
    return () => clearInterval(t);
  }, [isComplete]);

  // Walk through steps, then trigger completion
  useEffect(() => {
    if (currentIdx >= SCAN_STEPS.length) {
      setIsComplete(true);
      return;
    }
    const step = SCAN_STEPS[currentIdx];
    setStepStates((prev) => ({ ...prev, [step.id]: "running" }));
    const t = setTimeout(() => {
      setStepStates((prev) => ({ ...prev, [step.id]: "done" }));
      setCurrentIdx((i) => i + 1);
    }, step.durationMs);
    return () => clearTimeout(t);
  }, [currentIdx]);

  // Countdown + auto-navigate when complete
  useEffect(() => {
    if (!isComplete) return;
    // Count down 3 → 2 → 1 → navigate
    const tick = setInterval(() => {
      setNavCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          handleComplete();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const doneCount = Object.values(stepStates).filter((s) => s === "done").length;
  const totalSteps = SCAN_STEPS.length;
  const pct = isComplete ? 100 : Math.round((doneCount / totalSteps) * 100);
  const activeStep =
    currentIdx < SCAN_STEPS.length ? SCAN_STEPS[currentIdx] : SCAN_STEPS[SCAN_STEPS.length - 1];
  const secondsLeft = isComplete
    ? 0
    : Math.max(
        0,
        Math.round(
          SCAN_STEPS.slice(currentIdx).reduce((acc, s) => acc + s.durationMs, 0) / 1000
        )
      );

  /* ── Completion screen ───────────────────────────────────────────────── */
  if (isComplete) {
    return (
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-emerald-500/20 shadow-2xl"
        style={{ background: "#0f1929" }}>
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-white/8"
          style={{ background: "rgba(16,185,129,0.06)" }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Scan complete
            </span>
          </div>
          <span className="text-3xl font-black text-emerald-400">100%</span>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
          {/* Checkmark ring */}
          <div className="relative mb-8">
            <div className="absolute -inset-3 rounded-full border border-emerald-500/20 animate-ping"
              style={{ animationDuration: "2s" }} />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full"
              style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.4)" }}>
              <svg className="h-12 w-12 text-emerald-400" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-black text-white mb-3">Your results are ready!</h2>
          <p className="text-base text-white/50 mb-1">
            Full AEO · SEO · GEO report for
          </p>
          <p className="text-lg font-semibold text-white mb-10">{domain}</p>

          {/* Stat pills */}
          <div className="flex items-center gap-3 mb-10 flex-wrap justify-center">
            {[
              { icon: "📋", label: "7 steps", sub: "analysed" },
              { icon: "💡", label: "Fixes", sub: "prioritised" },
              { icon: "📊", label: "Score", sub: "computed" },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-lg">{p.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white/80">{p.label}</p>
                  <p className="text-[10px] text-white/35">{p.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={handleComplete}
            className="relative overflow-hidden px-8 py-3.5 rounded-full font-bold text-sm text-white transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              boxShadow: "0 0 30px rgba(99,102,241,0.4)",
            }}
          >
            View your results →
          </button>

          <p className="mt-4 text-xs text-white/25">
            Opening automatically in {navCountdown}s…
          </p>
        </div>
      </div>
    );
  }

  /* ── Scanning screen ─────────────────────────────────────────────────── */
  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
      style={{ background: "#11162a" }}>
      {/* Header */}
      <div className="px-7 py-4 flex items-center justify-between border-b border-white/8"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-500" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-300">
            Scanning in progress
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black tabular-nums text-white">{pct}%</span>
          <span className="text-xs text-white/30">complete</span>
        </div>
      </div>

      {/* Two-panel body */}
      <div className="flex min-h-[420px]">
        {/* Left sidebar — stepper */}
        <div className="w-56 shrink-0 border-r border-white/8 px-5 py-7"
          style={{ background: "rgba(255,255,255,0.012)" }}>
          <p className="mb-4 text-[9px] font-bold uppercase tracking-widest text-white/20">
            Scan Progress
          </p>
          <div className="flex flex-col">
            {SCAN_STEPS.map((step, idx) => {
              const state = stepStates[step.id];
              const isActive = state === "running";
              const isDone = state === "done";
              const isLast = idx === SCAN_STEPS.length - 1;
              return (
                <div key={step.id} className="relative flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="relative z-10 mt-1.5">
                      {isDone ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ background: "rgba(99,102,241,0.2)", boxShadow: "0 0 0 1px rgba(99,102,241,0.5)" }}>
                          <svg className="h-3 w-3 text-brand-400" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      ) : isActive ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ background: "rgba(99,102,241,0.15)", boxShadow: "0 0 0 2px #6366f1" }}>
                          <span className="h-2.5 w-2.5 animate-spin rounded-full border border-white/20 border-t-brand-400" />
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                          style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                          {step.icon}
                        </div>
                      )}
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 my-1 min-h-[18px] transition-colors duration-500"
                        style={{ background: isDone ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)" }} />
                    )}
                  </div>
                  <div className="pb-4 pt-0.5 min-w-0 flex-1">
                    <span className={`block text-xs leading-tight transition-colors duration-300 ${
                      isActive ? "font-semibold text-white" : isDone ? "text-brand-400/80" : "text-white/25"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel — active step detail */}
        <div className="flex flex-1 flex-col justify-between px-8 py-7">
          <div>
            {/* Domain pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-white/60"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              {domain}
            </div>

            {/* Active step */}
            <div key={activeStep.id} className="animate-fade-up" style={{ animationDuration: "0.3s" }}>
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-3xl">{activeStep.icon}</span>
                <h3 className="text-xl font-bold text-white leading-tight">
                  {activeStep.label}
                  <span className="ml-1 font-normal text-brand-400 text-lg">{dots}</span>
                </h3>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">{activeStep.detail}</p>

              {/* Did you know */}
              <div className="mt-6 rounded-2xl p-5"
                style={{ border: "1px solid rgba(99,102,241,0.15)", background: "rgba(99,102,241,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-400 mb-2">
                  💡 Did you know?
                </p>
                <p className="text-sm leading-relaxed text-white/55">{activeStep.tip}</p>
              </div>
            </div>
          </div>

          {/* Progress + meta */}
          <div className="mt-8">
            <div className="mb-2.5 flex items-center justify-between text-xs text-white/30">
              <span>{doneCount} of {totalSteps} steps complete</span>
              {secondsLeft > 0 && <span>~{secondsLeft}s remaining</span>}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(to right, #6366f1, #38bdf8, #818cf8)",
                }}
              />
            </div>
            <p className="mt-4 text-center text-xs text-white/20">
              Your results will open automatically when the scan completes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
