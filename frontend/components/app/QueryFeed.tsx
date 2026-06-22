"use client";

import { useState } from "react";
import { type QueryStatus, updateQueryStatus } from "@/lib/supabase/insights";

interface Query {
  id: string;
  email: string | null;
  kind: string;
  message: string;
  status: string;
  created_at: string;
}

const KIND_STYLE: Record<string, string> = {
  chat: "bg-white/10 text-white/70",
  query: "bg-white/10 text-white/70",
  feedback: "bg-emerald-500/15 text-emerald-300",
  bug: "bg-red-500/15 text-red-300",
  feature_request: "bg-brand-500/15 text-brand-300",
  support: "bg-amber-500/15 text-amber-300",
};

const STATUSES: QueryStatus[] = ["new", "reviewed", "in_progress", "resolved", "archived"];

const STATUS_STYLE: Record<string, string> = {
  new: "border-sky-500/40 text-sky-300",
  reviewed: "border-amber-500/40 text-amber-300",
  in_progress: "border-brand-500/40 text-brand-300",
  resolved: "border-emerald-500/40 text-emerald-300",
  archived: "border-white/15 text-white/40",
};

function fmt(d: string) {
  return new Date(d).toLocaleString();
}

export function QueryFeed({ initial }: { initial: Query[] }) {
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);

  async function onChange(id: string, status: QueryStatus) {
    const prev = rows;
    setRows((r) => r.map((q) => (q.id === id ? { ...q, status } : q)));
    setSaving(id);
    const ok = await updateQueryStatus(id, status);
    setSaving(null);
    if (!ok) setRows(prev); // revert on failure
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/40">
        No queries yet — they&apos;ll appear here as users chat or send feedback.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((q) => (
        <div
          key={q.id}
          className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
        >
          <span
            className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
              KIND_STYLE[q.kind] ?? KIND_STYLE.query
            }`}
          >
            {q.kind}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/80">{q.message}</p>
            <p className="mt-0.5 text-[11px] text-white/35">
              {q.email || "anon"} · {fmt(q.created_at)}
            </p>
          </div>
          <select
            value={q.status}
            disabled={saving === q.id}
            onChange={(e) => onChange(q.id, e.target.value as QueryStatus)}
            className={`shrink-0 rounded-lg border bg-ink-900 px-2 py-1 text-xs outline-none disabled:opacity-50 ${
              STATUS_STYLE[q.status] ?? STATUS_STYLE.new
            }`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-ink-900 text-white">
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
