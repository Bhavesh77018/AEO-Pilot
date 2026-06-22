"use client";

import { useState } from "react";
import { logUserQuery } from "@/lib/supabase/insights";

const KINDS = [
  { value: "feedback", label: "Feedback" },
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature" },
] as const;

type Kind = (typeof KINDS)[number]["value"];

/** Floating in-app feedback widget → writes to public.user_queries. */
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("feedback");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!message.trim()) return;
    setSending(true);
    await logUserQuery({
      message,
      kind,
      context: { route: typeof window !== "undefined" ? window.location.pathname : "" },
    });
    setSending(false);
    setSent(true);
    setMessage("");
    setTimeout(() => {
      setSent(false);
      setOpen(false);
    }, 1600);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-72 rounded-2xl border border-white/10 bg-ink-800 p-4 shadow-2xl">
          {sent ? (
            <p className="py-6 text-center text-sm text-emerald-300">
              ✓ Thanks — we read every note.
            </p>
          ) : (
            <>
              <div className="mb-3 flex gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
                {KINDS.map((k) => (
                  <button
                    key={k.value}
                    onClick={() => setKind(k.value)}
                    className={`flex-1 rounded-md px-2 py-1 text-xs transition ${
                      kind === k.value ? "bg-brand-500 text-white" : "text-white/55 hover:text-white"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  kind === "bug"
                    ? "What went wrong?"
                    : kind === "feature_request"
                      ? "What would you love to see?"
                      : "Tell us what you think…"
                }
                rows={3}
                className="w-full resize-none rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500/50"
              />
              <button
                onClick={submit}
                disabled={sending || !message.trim()}
                className="mt-2 w-full rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-white/15 bg-ink-800 px-4 py-2.5 text-sm font-medium text-white shadow-xl transition hover:bg-ink-700"
        aria-label="Send feedback"
      >
        {open ? "✕" : "💬"} {open ? "Close" : "Feedback"}
      </button>
    </div>
  );
}
