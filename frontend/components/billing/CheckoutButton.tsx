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

export function CheckoutButton({ plan, period, enabled }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
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

  async function checkout() {
    setState("loading");
    setError(null);
    try {
      // Prefill email from the signed-in Supabase user, if any.
      let email: string | undefined;
      if (isSupabaseConfigured) {
        const { data } = await createClient().auth.getUser();
        email = data.user?.email ?? undefined;
      }

      const order = await createOrder({ plan: plan.id, period, email });
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load Razorpay checkout.");

      const rzp = new (window as any).Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "AEO Pilot",
        description: `${plan.name} — ${period}`,
        order_id: order.order_id,
        prefill: email ? { email } : undefined,
        theme: { color: "#6366f1" },
        modal: { ondismiss: () => setState("idle") },
        handler: async (resp: any) => {
          try {
            await verifyPayment({
              subscription_id: order.subscription_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            setState("success");
            setTimeout(() => router.push("/app"), 1600);
          } catch (e) {
            setError((e as Error).message);
            setState("error");
          }
        },
      });
      rzp.on("payment.failed", (r: any) => {
        setError(r?.error?.description || "Payment failed");
        setState("error");
      });
      rzp.open();
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  return (
    <div className="mt-5">
      <button
        onClick={checkout}
        disabled={state === "loading" || state === "success"}
        className={`block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition disabled:opacity-70 ${cls}`}
      >
        {state === "loading"
          ? "Opening checkout…"
          : state === "success"
            ? "✓ Subscribed — redirecting…"
            : plan.cta}
      </button>
      {error && <p className="mt-2 text-center text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
