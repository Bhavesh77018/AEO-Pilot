"use client";

import { useEffect, useState } from "react";

interface ScanStep {
  id: string;
  label: string;
  detail: string;
  icon: string;
  durationMs: number;
}

const SCAN_STEPS: ScanStep[] = [
  {
    id: "crawl",
    label: "Crawling your site",
    detail: "Discovering pages, links, and structure",
    icon: "🔍",
    durationMs: 2200,
  },
  {
    id: "schema",
    label: "Analysing schema markup",
    detail: "Checking JSON-LD, microdata, and structured data",
    icon: "📋",
    durationMs: 1800,
  },
  {
    id: "content",
    label: "Scoring content answerability",
    detail: "FAQ density, heading structure, and entity coverage",
    icon: "✍️",
    durationMs: 2000,
  },
  {
    id: "seo",
    label: "Running SEO audit",
    detail: "HTTPS, canonicals, mobile, meta, internal links",
    icon: "📈",
    durationMs: 1600,
  },
  {
    id: "ai",
    label: "Estimating AI visibility",
    detail: "ChatGPT · Gemini · Claude · Perplexity · Copilot",
    icon: "🤖",
    durationMs: 2400,
  },
  {
    id: "score",
    label: "Computing Search Visibility Score",
    detail: "Combining SEO + AEO + GEO across 9 categories",
    icon: "📊",
    durationMs: 1400,
  },
  {
    id: "recs",
    label: "Generating recommendations",
    detail: "Prioritised fixes ranked by impact",
    icon: "💡",
    durationMs: 1600,
  },
];

type StepState = "waiting" | "running" | "done";

interface ScanProgressProps {
  domain: string;
  onComplete?: () => void;
}

export function ScanProgress({ domain, onComplete }: ScanProgressProps) {
  const [stepStates, setStepStates] = useState<Record<string, StepState>>(
    Object.fromEntries(SCAN_STEPS.map((s) => [s.id, "waiting"]))
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dots, setDots] = useState(".");

  // Animated dots for the running step
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 400);
    return () => clearInterval(t);
  }, []);

  // Walk through steps sequentially
  useEffect(() => {
    if (currentIdx >= SCAN_STEPS.length) {
      onComplete?.();
      return;
    }
    const step = SCAN_STEPS[currentIdx];
    setStepStates((prev) => ({ ...prev, [step.id]: "running" }));
    const t = setTimeout(() => {
      setStepStates((prev) => ({ ...prev, [step.id]: "done" }));
      setCurrentIdx((i) => i + 1);
    }, step.durationMs);
    return () => clearTimeout(t);
  }, [currentIdx, onComplete]);

  const doneCount = Object.values(stepStates).filter((s) => s === "done").length;
  const totalSteps = SCAN_STEPS.length;
  const pct = Math.round((doneCount / totalSteps) * 100);

  return (
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
              Scanning
            </p>
            <h3 className="mt-0.5 text-base font-bold text-white">{domain}</h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white tabular-nums">{pct}%</span>
            <p className="text-[10px] text-white/30">complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sky-400 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {SCAN_STEPS.map((step) => {
          const state = stepStates[step.id];
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 ${
                state === "running"
                  ? "bg-brand-500/10 border border-brand-500/20"
                  : state === "done"
                    ? "opacity-60"
                    : "opacity-30"
              }`}
            >
              {/* Status indicator */}
              <div className="mt-0.5 shrink-0">
                {state === "done" ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[11px]">
                    ✓
                  </span>
                ) : state === "running" ? (
                  <span className="flex h-5 w-5 items-center justify-center">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
                  </span>
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px]">
                    {step.icon}
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm font-medium transition-colors ${
                    state === "running" ? "text-white" : state === "done" ? "text-emerald-400" : "text-white/40"
                  }`}
                >
                  {step.label}
                  {state === "running" && (
                    <span className="ml-1 font-normal text-brand-400">{dots}</span>
                  )}
                </div>
                {state === "running" && (
                  <div className="mt-0.5 text-xs text-white/40">{step.detail}</div>
                )}
              </div>

              {/* Done check */}
              {state === "done" && (
                <span className="shrink-0 text-xs text-emerald-400">✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="mt-4 text-center text-[10px] text-white/20">
        Results are ready when the bar reaches 100% — usually under 60 seconds
      </p>
    </div>
  );
}
