"use client";

import { createClient } from "./client";
import { isSupabaseConfigured } from "./config";

/**
 * Capture what users ask/submit into Supabase `public.user_queries` so the team
 * can review and improve the product. Best-effort: it NEVER blocks or breaks the
 * UX — if Supabase isn't configured, the table is missing, or the insert fails,
 * it silently no-ops. (Requires supabase/schema.sql to be applied.)
 */
export async function logUserQuery(input: {
  message: string;
  kind?: "query" | "chat" | "feedback" | "bug" | "feature_request" | "support";
  context?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured || !input.message?.trim()) return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return; // only log authenticated users (RLS requires it)
    await supabase.from("user_queries").insert({
      user_id: user.id,
      email: user.email,
      kind: input.kind ?? "chat",
      message: input.message.trim().slice(0, 2000),
      context: input.context ?? {},
    });
  } catch {
    /* swallow — telemetry must never affect the user */
  }
}

/** Anonymous launch waitlist capture → `public.waitlist`. */
export async function joinWaitlist(email: string, source = "landing"): Promise<boolean> {
  if (!isSupabaseConfigured || !email?.includes("@")) return false;
  try {
    const supabase = createClient();
    const { error } = await supabase.from("waitlist").insert({ email: email.trim(), source });
    return !error || error.code === "23505"; // 23505 = already on the list
  } catch {
    return false;
  }
}
