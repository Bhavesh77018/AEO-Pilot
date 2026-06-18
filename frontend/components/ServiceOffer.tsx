"use client";

import { useMemo, useState } from "react";
import type { ServiceOffer as Offer } from "@/lib/types";

const SEV: Record<string, string> = {
  high: "text-red-300",
  medium: "text-amber-300",
  low: "text-sky-300",
};

function money(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function ServiceOffer({ offer }: { offer: Offer }) {
  const pkg = offer.recommended_package;
  const [booked, setBooked] = useState(false);
  const [cart, setCart] = useState<Set<string>>(new Set());

  const toggle = (title: string) =>
    setCart((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });

  const cartTotal = useMemo(
    () =>
      offer.a_la_carte
        .filter((i) => cart.has(i.title))
        .reduce((sum, i) => sum + i.price, 0),
    [cart, offer.a_la_carte],
  );

  // projection bar geometry
  const cur = pkg.current_score;
  const proj = pkg.projected_score;

  return (
    <div className="card overflow-hidden p-0">
      {/* Header band */}
      <div className="relative border-b border-white/10 bg-gradient-to-br from-brand-500/20 via-brand-500/5 to-transparent p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-300">
              Done-for-you · Managed service
            </span>
            <h3 className="mt-1 text-xl font-bold text-white">{offer.headline}</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
              {offer.subhead}
            </p>
          </div>
        </div>
        <p className="mt-3 inline-block rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200/90">
          ⚠ {offer.risk}
        </p>
      </div>

      {/* Recommended package */}
      <div className="grid gap-6 p-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-bold text-white">{pkg.name}</h4>
            <span className="rounded-full border border-brand-500/40 bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-brand-300">
              {pkg.badge}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{pkg.summary}</p>

          {/* Projected lift */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Projected AEO score after engagement</span>
              <span className="font-semibold text-emerald-300">
                {cur} → {proj} (+{pkg.est_lift})
              </span>
            </div>
            <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/20"
                style={{ width: `${cur}%` }}
              />
              <div
                className="absolute inset-y-0 rounded-full bg-gradient-to-r from-brand-500 to-emerald-400"
                style={{ left: `${cur}%`, width: `${Math.max(0, proj - cur)}%` }}
              />
            </div>
          </div>

          {/* Deliverables */}
          <ul className="mt-5 space-y-1.5">
            {pkg.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-0.5 text-emerald-400">✓</span>
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200/80">
            🛡 {pkg.guarantee}
          </p>
        </div>

        {/* Price box */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-brand-500/30 bg-ink-900/60 p-5">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">
                {money(pkg.price_one_time, pkg.currency)}
              </span>
              <span className="text-sm text-white/40">one-time</span>
            </div>
            <div className="mt-1 text-sm text-white/60">
              + {money(pkg.price_monthly, pkg.currency)}
              <span className="text-white/40">/mo retainer</span>
            </div>
            <div className="mt-3 text-xs text-white/40">
              Typical delivery: {pkg.timeline_weeks} weeks
            </div>

            <button
              onClick={() => setBooked(true)}
              disabled={booked}
              className="mt-4 w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-60"
            >
              {booked ? "✓ Request received — we'll be in touch" : offer.cta}
            </button>
            <p className="mt-2 text-center text-[11px] text-white/30">
              No commitment · 30-min strategy call
            </p>
          </div>
        </div>
      </div>

      {/* A-la-carte */}
      <div className="border-t border-white/10 p-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Or fix individual issues
          </h4>
          {cart.size > 0 && (
            <span className="text-xs text-white/50">
              {cart.size} selected · {money(cartTotal)}
            </span>
          )}
        </div>
        <div className="mt-3 space-y-2">
          {offer.a_la_carte.map((item) => {
            const selected = cart.has(item.title);
            return (
              <div
                key={item.title}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-ink-900/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-white/85">{item.title}</div>
                  <div className="text-[11px] text-white/40">
                    <span className={`uppercase ${SEV[item.severity]}`}>
                      {item.severity}
                    </span>{" "}
                    · {item.category.replace(/_/g, " ")} · ~{item.eta_days}d turnaround
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-white">
                    {money(item.price, item.currency)}
                  </span>
                  <button
                    onClick={() => toggle(item.title)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      selected
                        ? "border-brand-500 bg-brand-500/20 text-brand-200"
                        : "border-white/15 text-white/70 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {selected ? "✓ Added" : "Fix for me"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {cart.size > 0 && (
          <button
            onClick={() => setBooked(true)}
            className="mt-4 w-full rounded-xl border border-brand-500/40 bg-brand-500/10 px-4 py-3 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/20"
          >
            Checkout {cart.size} fix{cart.size > 1 ? "es" : ""} · {money(cartTotal)}
          </button>
        )}

        {/* Tier comparison */}
        <div className="mt-6">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-white/35">
            All engagement tiers
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {offer.all_packages.map((t) => (
              <div
                key={t.key}
                className={`rounded-xl border p-3 ${
                  t.key === pkg.tier
                    ? "border-brand-500/50 bg-brand-500/10"
                    : "border-white/10 bg-ink-900/30"
                }`}
              >
                <div className="text-xs font-semibold text-white/80">{t.name}</div>
                <div className="mt-1 text-sm font-bold text-white">
                  {money(t.price_one_time)}
                </div>
                <div className="text-[11px] text-white/40">
                  +{money(t.price_monthly)}/mo · {t.timeline_weeks}w
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-[11px] text-white/30">{offer.disclaimer}</p>
      </div>
    </div>
  );
}
