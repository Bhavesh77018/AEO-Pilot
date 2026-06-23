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
  enabled: boolean; // billing configured?
};

type Stage = "idle" | "checking" | "starting" | "paying" | "verifying" | "success" | "error";

export function CheckoutButton({ plan, period, enabled }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  const cls = plan.highlight
    ? "bg-brand-500 text-white hover:bg-brand-400"
    : "border border-white/15 text-white/80 hover:bg-white/5";

  // Billing off → keep the original CTA as a plain link (e.g. → /app).
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
  }

  async function checkout() {
    setError(null);
    setStage("checking");

    // ── Stage 1: require login BEFORE any payment ─────────────────────
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
        // Send them to sign in first, then back to pricing to complete checkout.
        router.push(`/login?next=${encodeURIComponent("/#pricing")}`);
        return;
      }
    }

    // ── Stage 2: create the order (backend may be cold-starting) ──────
    setStage("starting");
    let order;
    try {
      order = await createOrder({ plan: plan.id, period, email });
    } catch (e) {
      return fail(orderError(e));
    }

    // ── Stage 3: load the secure checkout script ──────────────────────
    let scriptOk = false;
    try {
      scriptOk = await loadRazorpay();
    } catch {
      scriptOk = false;
    }
    if (!scriptOk) {
      return fail("Couldn't load the secure checkout. Disable any ad-blocker and try again.");
    }

    // ── Stage 4: open Razorpay & handle the outcome ───────────────────
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
        // User closed the modal without paying — not an error.
        modal: { ondismiss: () => setStage("idle") },
        handler: async (resp: any) => {
          // ── Stage 5: verify the signature server-side ───────────────
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
            }, 1600);
          } catch {
            // Payment likely went through but we couldn't confirm it — reassure.
            fail(
              `Payment received, but we couldn't confirm it automatically. ` +
                `Save your payment id (${resp.razorpay_payment_id}) and email ` +
                `support@aeopilot.in — you won't be charged again.`,
            );
          }
        },
      });
      rzp.on("payment.failed", (r: any) => {
        fail(r?.error?.description || "Payment failed — no money was deducted. Please try again.");
      });
      rzp.open();
    } catch {
      fail("Couldn't open the payment window. Please try again.");
    }
  }

  const label =
    stage === "checking"
      ? "Checking…"
      : stage === "starting"
        ? "Starting checkout…"
        : stage === "paying"
          ? "Opening payment…"
          : stage === "verifying"
            ? "Confirming payment…"
            : stage === "success"
              ? "✓ Subscribed — redirecting…"
              : stage === "error"
                ? "Try again"
                : plan.cta;

  const busy = stage !== "idle" && stage !== "error";

  return (
    <div className="mt-5">
      <button
        onClick={checkout}
        disabled={busy}
        className={`block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition disabled:opacity-70 ${cls}`}
      >
        {label}
      </button>
      {stage === "starting" && (
        <p className="mt-2 text-center text-[11px] text-white/40">
          Waking the server — this can take a few seconds…
        </p>
      )}
      {error && <p className="mt-2 text-center text-[11px] leading-relaxed text-red-400">{error}</p>}
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
