"use client";

import { useEffect, useRef, useState } from "react";

const ENGINES = [
  { name: "ChatGPT", target: 68, color: "#10a37f" },
  { name: "Gemini", target: 74, color: "#4285f4" },
  { name: "Claude", target: 61, color: "#d97757" },
  { name: "Perplexity", target: 80, color: "#20b8cd" },
  { name: "Copilot", target: 70, color: "#8b5cf6" },
];

const OVERALL = 71;

/** Animated mock dashboard: a count-up score ring + engine visibility bars. */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [run, setRun] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setScore(Math.round(eased * OVERALL));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C - (score / 100) * C;

  return (
    <div ref={ref} className="relative">
      {/* glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-500/20 blur-3xl animate-glow-pulse" />

      <div className="glass rounded-3xl p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-white/60">
              acme.com · live AEO scan
            </span>
          </div>
          <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-white/40">
            8 engines
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* score ring */}
          <div className="relative grid shrink-0 place-items-center">
            <svg width="128" height="128" className="-rotate-90">
              <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle
                cx="64"
                cy="64"
                r={R}
                fill="none"
                stroke="url(#gring)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.1s linear" }}
              />
              <defs>
                <linearGradient id="gring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <div className="text-3xl font-black tabular-nums text-white">{score}</div>
              <div className="text-[9px] uppercase tracking-wider text-white/40">AI presence</div>
            </div>
          </div>

          {/* engine bars */}
          <div className="flex-1 space-y-2.5">
            {ENGINES.map((e, i) => (
              <div key={e.name}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-white/60">{e.name}</span>
                  <span className="tabular-nums text-white/40">{e.target}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full origin-left rounded-full"
                    style={{
                      background: e.color,
                      width: `${e.target}%`,
                      transform: run ? "scaleX(1)" : "scaleX(0)",
                      transition: `transform 1s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.12}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* floating chips */}
      <div className="absolute -right-4 -top-4 animate-float rounded-xl border border-white/10 bg-ink-800/90 px-3 py-2 text-xs shadow-xl backdrop-blur">
        <span className="text-emerald-400">▲ +24%</span>{" "}
        <span className="text-white/50">citations</span>
      </div>
      <div
        className="absolute -bottom-4 -left-4 animate-float rounded-xl border border-white/10 bg-ink-800/90 px-3 py-2 text-xs shadow-xl backdrop-blur"
        style={{ animationDelay: "1.5s" }}
      >
        <span className="text-brand-300">●</span>{" "}
        <span className="text-white/50">ranked #2 in Perplexity</span>
      </div>
    </div>
  );
}
