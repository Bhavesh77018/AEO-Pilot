"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { getBillingConfig } from "@/lib/billing";
import { PLANS } from "@/lib/pricing";
import { Reveal } from "./Reveal";

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [billingEnabled, setBillingEnabled] = useState(false);

  useEffect(() => {
    getBillingConfig()
      .then((c) => setBillingEnabled(c.enabled))
      .catch(() => setBillingEnabled(false));
  }, []);

  return (
    <div>
      {/* billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={`text-sm ${!annual ? "text-white" : "text-white/40"}`}>Monthly</span>
        <button
          onClick={() => setAnnual((a) => !a)}
          className="relative h-7 w-12 rounded-full border border-white/15 bg-white/5 transition"
          aria-label="Toggle annual billing"
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-brand-500 shadow transition-all ${
              annual ? "left-6" : "left-1"
            }`}
          />
        </button>
        <span className={`text-sm ${annual ? "text-white" : "text-white/40"}`}>
          Annual <span className="text-emerald-400">−20%</span>
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {PLANS.map((plan, i) => {
          const price = annual ? plan.annual : plan.monthly;
          const isPaid = price !== null && price > 0;
          return (
            <Reveal key={plan.id} delay={i * 80}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-6 ${
                  plan.highlight
                    ? "border-brand-500/50 bg-gradient-to-b from-brand-500/10 to-transparent shadow-2xl shadow-brand-600/20"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg">
                    {plan.badge}
                  </span>
                )}
                <div className="text-lg font-bold text-white">{plan.name}</div>
                <p className="mt-1 text-xs text-white/45">{plan.tagline}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  {price === null ? (
                    <span className="text-3xl font-black text-white">Custom</span>
                  ) : price === 0 ? (
                    <span className="text-3xl font-black text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-white">
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-sm text-white/40">/mo</span>
                    </>
                  )}
                </div>
                {annual && isPaid && (
                  <div className="mt-0.5 text-[11px] text-emerald-400">billed annually</div>
                )}

                {/* CTA: paid plans → Razorpay checkout; free/custom → link */}
                {isPaid ? (
                  <CheckoutButton
                    plan={plan}
                    period={annual ? "annual" : "monthly"}
                    enabled={billingEnabled}
                  />
                ) : (
                  <Link
                    href={plan.ctaHref}
                    className={`mt-5 block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                      plan.highlight
                        ? "bg-brand-500 text-white hover:bg-brand-400"
                        : "border border-white/15 text-white/80 hover:bg-white/5"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}

                {/* limits */}
                <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
                  {Object.values(plan.limits).map((l) => (
                    <div key={l} className="flex items-center gap-2 text-[13px] text-white/70">
                      <span className="text-brand-400">›</span>
                      {l}
                    </div>
                  ))}
                </div>

                {/* features */}
                <div className="mt-5 space-y-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-[13px] text-white/55">
                      <span className="mt-0.5 text-emerald-400">✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-white/35">
        Prices in INR, billed securely via Razorpay. Bring your own OpenAI /
        Anthropic / Gemini key on any plan — then AI compute is on you and token
        limits don&apos;t apply.
      </p>
    </div>
  );
}
