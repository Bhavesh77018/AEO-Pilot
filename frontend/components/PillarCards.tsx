"use client";

import type { CategoryScore, Pillar, PillarScore } from "@/lib/types";

const ORDER: Pillar[] = ["seo", "aeo", "geo"];

const META: Record<Pillar, { label: string; tagline: string; accent: string; bar: string }> = {
  seo: {
    label: "SEO",
    tagline: "Rank in classic search",
    accent: "from-sky-500/20 to-transparent border-sky-500/30",
    bar: "bg-sky-400",
  },
  aeo: {
    label: "AEO",
    tagline: "Be the answer in AI engines",
    accent: "from-brand-500/20 to-transparent border-brand-500/30",
    bar: "bg-brand-400",
  },
  geo: {
    label: "GEO",
    tagline: "Get cited by generative AI",
    accent: "from-emerald-500/20 to-transparent border-emerald-500/30",
    bar: "bg-emerald-400",
  },
};

function scoreColor(s: number) {
  if (s >= 75) return "text-emerald-400";
  if (s >= 50) return "text-amber-400";
  return "text-red-400";
}

export function PillarCards({
  categories,
  pillars,
}: {
  categories: Record<string, CategoryScore>;
  pillars?: Record<string, PillarScore> | null;
}) {
  // group categories by pillar
  const grouped: Record<Pillar, Array<[string, CategoryScore]>> = { seo: [], aeo: [], geo: [] };
  for (const [key, c] of Object.entries(categories)) {
    if (c.pillar && grouped[c.pillar]) grouped[c.pillar].push([key, c]);
  }

  function pillarScore(p: Pillar): number {
    if (pillars?.[p]) return pillars[p].score;
    const list = grouped[p];
    if (!list.length) return 0;
    return Math.round(list.reduce((s, [, c]) => s + c.score, 0) / list.length);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {ORDER.map((p) => {
        const m = META[p];
        const score = pillarScore(p);
        return (
          <div key={p} className={`rounded-2xl border bg-gradient-to-b p-5 ${m.accent}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold text-white">{m.label}</div>
                <div className="text-[11px] text-white/45">{m.tagline}</div>
              </div>
              <div className={`text-3xl font-black tabular-nums ${scoreColor(score)}`}>
                {Math.round(score)}
              </div>
            </div>
            <div className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
              {grouped[p].map(([key, c]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">{c.label}</span>
                    <span className="tabular-nums text-white/50">{Math.round(c.score)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${c.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
