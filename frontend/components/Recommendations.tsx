"use client";

import type { Recommendation } from "@/lib/types";

const SEVERITY: Record<string, string> = {
  high: "bg-red-500/15 text-red-300 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

export function Recommendations({ items }: { items: Recommendation[] }) {
  if (!items.length) {
    return (
      <p className="text-sm text-white/40">
        No recommendations — nicely optimized, or the scan found little to crawl.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {items.map((r) => (
        <li key={r.id} className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  SEVERITY[r.severity] ?? SEVERITY.low
                }`}
              >
                {r.severity}
              </span>
              {r.source === "llm" && (
                <span className="rounded-md border border-brand-500/30 bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-400">
                  AI
                </span>
              )}
            </div>
            <span className="shrink-0 text-xs text-white/40">
              +{r.impact} est. lift
            </span>
          </div>
          <h4 className="mt-2 text-sm font-semibold text-white">{r.title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-white/55">{r.detail}</p>
        </li>
      ))}
    </ol>
  );
}
