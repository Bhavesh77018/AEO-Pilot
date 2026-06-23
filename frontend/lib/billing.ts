import { apiBase } from "./apiBase";

const API = apiBase();

export interface BillingConfig {
  enabled: boolean;
  key_id: string | null;
  currency: string;
}

export interface OrderOut {
  subscription_id: string;
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  plan: string;
  period: string;
}

export async function getBillingConfig(): Promise<BillingConfig> {
  const r = await fetch(`${API}/api/v1/billing/config`);
  if (!r.ok) return { enabled: false, key_id: null, currency: "INR" };
  return r.json();
}

export async function createOrder(input: {
  plan: string;
  period: string;
  email?: string | null;
}): Promise<OrderOut> {
  // Generous timeout — the free-tier backend can cold-start (~50s).
  const r = await fetch(`${API}/api/v1/billing/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(75000),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || "Order failed");
  return r.json();
}

export async function verifyPayment(input: {
  subscription_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ status: string }> {
  const r = await fetch(`${API}/api/v1/billing/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || "Verification failed");
  return r.json();
}

let scriptPromise: Promise<boolean> | null = null;

/** Lazily load Razorpay checkout.js (once). */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return scriptPromise;
}
