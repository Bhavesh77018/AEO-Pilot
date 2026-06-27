"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DOMAIN_RE = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

function cleanDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];
}

export function ChatPilotInterface() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [launching, setLaunching] = useState(false);

  const launch = () => {
    const domain = cleanDomain(input);
    if (!domain) {
      setError("Please enter a domain to scan.");
      return;
    }
    if (!DOMAIN_RE.test(domain)) {
      setError("Enter a valid domain — e.g. yourbrand.com");
      return;
    }
    setError("");
    setLaunching(true);
    // Pass domain as query param so the app chat can pre-fill and auto-submit
    router.push(`/app?domain=${encodeURIComponent(domain)}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 backdrop-blur shadow-2xl shadow-black/40">
        {/* Avatar + messages */}
        <div className="mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500/20 text-sm">
              🤖
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/80">
              👋 Hi! I'm AEO Pilot. Let's get your brand mentioned in AI answers.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500/20 text-sm">
              🤖
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/80">
              Drop your website domain below — I'll score it across{" "}
              <span className="font-semibold text-white">SEO, AEO & GEO</span> in
              under 60 seconds. No API key needed.
            </div>
          </div>
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                launch();
              }
            }}
            placeholder="yourbrand.com"
            autoComplete="off"
            spellCheck={false}
            disabled={launching}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 transition focus:border-brand-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-brand-500/20 disabled:opacity-60"
          />
          <button
            onClick={launch}
            disabled={!input.trim() || launching}
            className="relative overflow-hidden rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-400 disabled:opacity-50"
          >
            {launching ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Launching…
              </span>
            ) : (
              <>
                Scan →
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-white/30">
          Free scan · SEO + AEO + GEO · 8 AI engines · results in under a minute
        </p>
      </div>

      {/* Social proof micro-copy */}
      <p className="mt-4 text-center text-xs text-white/25">
        Press <kbd className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono">Enter</kbd>{" "}
        or click <strong className="text-white/40">Scan →</strong> to launch your AEO Pilot dashboard
      </p>
    </div>
  );
}
