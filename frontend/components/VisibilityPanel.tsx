"use client";

const ENGINE_META: Record<string, { icon: string; tint: string }> = {
  ChatGPT: { icon: "✦", tint: "#10a37f" },
  "GPT Search": { icon: "◎", tint: "#0ea5e9" },
  Gemini: { icon: "✧", tint: "#8b5cf6" },
  Claude: { icon: "◆", tint: "#d97757" },
  Perplexity: { icon: "≈", tint: "#22d3ee" },
  Copilot: { icon: "❖", tint: "#2563eb" },
  Grok: { icon: "𝕏", tint: "#94a3b8" },
  DeepSeek: { icon: "⊚", tint: "#6366f1" },
};

function barColor(v: number) {
  if (v >= 75) return "#34d399";
  if (v >= 50) return "#fbbf24";
  return "#f87171";
}

export function VisibilityPanel({
  visibility,
}: {
  visibility: Record<string, number>;
}) {
  const entries = Object.entries(visibility);
  return (
    <div className="space-y-3">
      {entries.map(([engine, value]) => {
        const meta = ENGINE_META[engine] ?? { icon: "•", tint: "#94a3b8" };
        return (
          <div key={engine} className="flex items-center gap-3">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm"
              style={{ backgroundColor: `${meta.tint}22`, color: meta.tint }}
            >
              {meta.icon}
            </span>
            <span className="w-28 shrink-0 text-sm text-white/70">{engine}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${value}%`, backgroundColor: barColor(value) }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums">
              {Math.round(value)}%
            </span>
          </div>
        );
      })}
      <p className="pt-1 text-[11px] leading-relaxed text-white/30">
        Derived from on-page AEO readiness as a directional proxy. Live
        per-engine measurement (actively prompting each model) ships with the AI
        Monitoring Agent.
      </p>
    </div>
  );
}
