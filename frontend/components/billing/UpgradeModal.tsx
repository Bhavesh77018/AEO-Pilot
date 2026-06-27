"use client";

import { useState } from "react";
import { CheckoutButton } from "./CheckoutButton";
import { PLANS } from "@/lib/pricing";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "project_limit" | "scan_limit" | "monitoring" | "api_access";
  currentPlan?: string;
}

const REASON_COPY: Record<string, { title: string; body: string }> = {
  project_limit: {
    title: "You've hit your project limit",
    body: "The free plan supports 2 projects. Upgrade to track more brands, clients, or domains.",
  },
  scan_limit: {
    title: "You've hit your scan limit",
    body: "You've used all 5 free scans this month. Upgrade for 100–unlimited scans.",
  },
  monitoring: {
    title: "AI monitoring is a paid feature",
    body: "Live monitoring of ChatGPT, Gemini, Claude & Perplexity — included from Growth.",
  },
  api_access: {
    title: "API access requires a paid plan",
    body: "Full REST API access is available on the Agency plan and above.",
  },
};

export function UpgradeModal({
  open,
  onClose,
  reason = "project_limit",
  currentPlan = "starter",
}: UpgradeModalProps) {
  const [annual, setAnnual] = useState(false);
  const copy = REASON_COPY[reason] ?? REASON_COPY.project_limit;

  // Show Growth and Agency plans only
  const upgradePlans = PLANS.filter((p) => p.id === "growth" || p.id === "agency");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                Upgrade required
              </span>
              <h2 className="mt-1 text-xl font-bold text-white">{copy.title}</h2>
              <p className="mt-1 text-sm text-white/50">{copy.body}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Billing toggle */}
          <div className="mt-4 flex items-center gap-3">
            <span className={`text-sm ${!annual ? "text-white" : "text-white/40"}`}>Monthly</span>
            <button
              onClick={() => setAnnual((a) => !a)}
              className="relative h-6 w-11 rounded-full border border-white/15 bg-white/5 transition"
              aria-label="Toggle annual billing"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-brand-500 shadow transition-all ${
                  annual ? "left-5" : "left-0.5"
                }`}
              />
            </button>
            <span className={`text-sm ${annual ? "text-white" : "text-white/40"}`}>
              Annual <span className="text-emerald-400">−20%</span>
            </span>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          {upgradePlans.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            const isHighlighted = plan.highlight;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-5 transition ${
                  isHighlighted
                    ? "border-brand-500/60 bg-gradient-to-b from-brand-500/10 to-transparent shadow-lg shadow-brand-600/10"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                    {plan.badge}
                  </span>
                )}
                <div className="text-base font-bold text-white">{plan.name}</div>
                <p className="mt-0.5 text-xs text-white/45">{plan.tagline}</p>

                <div className="mt-3 flex items-baseline gap-1">
                  {price === null ? (
                    <span className="text-2xl font-black text-white">Custom</span>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-white">
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-white/40">/mo</span>
                    </>
                  )}
                </div>
                {annual && price && price > 0 && (
                  <div className="mt-0.5 text-[11px] text-emerald-400">billed annually</div>
                )}

                <ul className="mt-4 space-y-1.5">
                  {Object.values(plan.limits)
                    .slice(0, 4)
                    .map((l) => (
                      <li key={l} className="flex items-center gap-2 text-xs text-white/60">
                        <span className="text-brand-400">›</span>
                        {l}
                      </li>
                    ))}
                </ul>

                <CheckoutButton plan={plan} period={annual ? "annual" : "monthly"} enabled={true} />
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/10 px-6 py-3 text-center text-xs text-white/30">
          Prices in INR · Secured by Razorpay · Cancel anytime
        </div>
      </div>
    </div>
  );
}
