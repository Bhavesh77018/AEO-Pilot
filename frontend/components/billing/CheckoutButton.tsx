"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createOrder, loadRazorpay, verifyPayment } from "@/lib/billing";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = {
  plan: { id: string; name: string; cta: string; ctaHref: string; highlight?: boolean };
  period: "monthly" | "annual";
  enabled: boolean;
};

type Stage =
  | "idle"
  | "checking"
  | "starting"
  | "paying"
  | "verifying"
  | "success"
  | "error";

const STEPS: { key: Stage; label: string }[] = [
  { key: "checking", label: "Auth" },
  { key: "starting", label: "Order" },
  { key: "paying", label: "Pay" },
  { key: "verifying", label: "Verify" },
  { key: "success", label: "Done" },
];

function StepProgress({ stage }: { stage: Stage }) {
  if (stage === "idle" || stage === "error") return null;
  const activeIdx = STEPS.findIndex((s) => s.key === stage);

  return (
    <div className="mt-3 flex items-center justify-center gap-1">
      {STEPS.map((step, i) => {
        const done = i < activeIdx || stage === "success";
        const active = i === activeIdx && stage !== "success";
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`h-1.5 w-6 rounded-full transition-all duration-500 ${
                  done
                    ? "bg-emerald-400"
                    : active
                      ? "animate-pulse bg-brand-400"
                      : "bg-white/10"
                }`}
              />
              <span
                className={`text-[9px] font-medium transition-colors ${
                  done ? "text-emerald-400" : active ? "text-brand-300" : "text-white/20"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mb-3 h-px w-3 transition-colors ${
                  done ? "bg-emerald-400/40" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CheckoutButton({ plan, period, enabled }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [coldStart, setColdStart] = useState(false);

  const cls = plan.highlight
    ? "bg-brand-500 text-white hover:bg-brand-400 shadow-lg shadow-brand-600/30"
    : "border border-white/15 text-white/80 hover:bg-white/5";

  // Billing off → plain link
  if (!enabled) {
    return (
      <Link
        href={plan.ctaHref}
        className={`mt-5 block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${cls}`}
      >
        {plan.cta}
      </Link>
    );
  }

  function fail(msg: string) {
    setError(msg);
    setStage("error");
    setColdStart(false);
  }

  async function checkout() {
    setError(null);
    setColdStart(false);
    setStage("checking");

    // ── Stage 1: require login ─────────────────────────────────────────
    let userId: string | undefined;
    let email: string | undefined;
    if (isSupabaseConfigured) {
      try {
        const { data } = await createClient().auth.getUser();
        userId = data.user?.id;
        email = data.user?.email ?? undefined;
      } catch {
        /* treat as logged out */
      }
      if (!userId) {
        router.push(`/login?next=${encodeURIComponent("/#pricing")}`);
        return;
      }
    }

    // ── Stage 2: create order ──────────────────────────────────────────
    setStage("starting");
    // After 3s without response, show cold-start hint
    const coldTimer = setTimeout(() => setColdStart(true), 3000);
    let order;
    try {
      order = await createOrder({ plan: plan.id, period, email });
    } catch (e) {
      clearTimeout(coldTimer);
      return fail(orderError(e));
    }
    clearTimeout(coldTimer);
    setColdStart(false);

    // ── Stage 3: load checkout script ─────────────────────────────────
    let scriptOk = false;
    try {
      scriptOk = await loadRazorpay();
    } catch {
      scriptOk = false;
    }
    if (!scriptOk) {
      return fail(
        "Couldn't load the secure checkout. Disable any ad-blocker and try again."
      );
    }

    // ── Stage 4: open Razorpay ─────────────────────────────────────────
    setStage("paying");
    try {
      const rzp = new (window as any).Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "AEO Pilot",
        description: `${plan.name} — ${period}`,
        order_id: order.order_id,
        prefill: email ? { email } : undefined,
        theme: { color: "#6366f1" },
        modal: { ondismiss: () => setStage("idle") },
        handler: async (resp: any) => {
          // ── Stage 5: verify ────────────────────────────────────────
          setStage("verifying");
          try {
            await verifyPayment({
              subscription_id: order!.subscription_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            setStage("success");
            setTimeout(() => {
              router.push("/app");
              router.refresh();
            }, 2000);
          } catch {
            fail(
              `Payment received, but we couldn't confirm it automatically. ` +
                `Save your payment ID (${resp.razorpay_payment_id}) and email ` +
                `support@aeopilot.in — you won't be charged again.`
            );
          }
        },
      });
      rzp.on("payment.failed", (r: any) => {
        fail(
          r?.error?.description ||
            "Payment failed — no money was deducted. Please try again."
        );
      });
      rzp.open();
    } catch {
      fail("Couldn't open the payment window. Please try again.");
    }
  }

  const busy = stage !== "idle" && stage !== "error";

  const buttonLabel =
    stage === "checking"
      ? "Authenticating…"
      : stage === "starting"
        ? "Creating order…"
        : stage === "paying"
          ? "Opening payment…"
          : stage === "verifying"
            ? "Confirming payment…"
            : stage === "success"
              ? "✓ Subscribed!"
              : stage === "error"
                ? "Try again"
                : plan.cta;

  return (
    <div className="mt-5">
      <button
        onClick={checkout}
        disabled={busy}
        className={`relative block w-full overflow-hidden rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition disabled:opacity-80 ${cls}`}
      >
        {/* Success shimmer */}
        {stage === "success" && (
          <span className="absolute inset-0 animate-pulse bg-emerald-500/20" />
        )}
        <span className="relative">{buttonLabel}</span>
      </button>

      {/* Step progress bar */}
      <StepProgress stage={stage} />

      {/* Cold-start hint */}
      {coldStart && stage === "starting" && (
        <p className="mt-2 text-center text-[11px] text-white/40 animate-pulse">
          Server is waking up — this can take a few seconds…
        </p>
      )}

      {/* Success message */}
      {stage === "success" && (
        <p className="mt-2 text-center text-[11px] text-emerald-400">
          Welcome to {plan.name}! Redirecting to your dashboard…
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-center text-[11px] leading-relaxed text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/** Map an order-creation failure to a clear, friendly message. */
function orderError(e: unknown): string {
  const msg = (e as Error)?.message || "";
  if (/not configured|503/i.test(msg)) {
    return "Payments are temporarily unavailable. Please try again shortly.";
  }
  if (/abort|timeout|timed out|signal/i.test(msg)) {
    return "The server is waking up. Please tap again in a few seconds.";
  }
  return "Couldn't start checkout — check your connection and try again.";
}
