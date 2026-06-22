import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const KIND_STYLE: Record<string, string> = {
  chat: "bg-white/10 text-white/70",
  query: "bg-white/10 text-white/70",
  feedback: "bg-emerald-500/15 text-emerald-300",
  bug: "bg-red-500/15 text-red-300",
  feature_request: "bg-brand-500/15 text-brand-300",
  support: "bg-amber-500/15 text-amber-300",
};

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString() : "—";
}

export default async function AdminPage() {
  if (!isSupabaseConfigured) redirect("/app");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/admin");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") {
    return (
      <div className="grid h-screen place-items-center px-6 text-center">
        <div className="max-w-sm">
          <LogoMark size={44} className="mx-auto mb-4 rounded-xl" />
          <h1 className="text-xl font-bold text-white">Admins only</h1>
          <p className="mt-2 text-sm text-white/50">
            Your account doesn&apos;t have admin access.
          </p>
          <Link
            href="/app"
            className="mt-5 inline-flex rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-400"
          >
            ← Back to app
          </Link>
        </div>
      </div>
    );
  }

  // Admin RLS lets these read all rows.
  const [usersRes, queriesRes, allIdsRes, waitlistRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,full_name,plan,role,created_at,last_seen_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_queries")
      .select("id,email,kind,message,status,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("user_queries").select("user_id"),
    supabase.from("waitlist").select("*", { count: "exact", head: true }),
  ]);

  const users = usersRes.data ?? [];
  const queries = queriesRes.data ?? [];
  const totalQueries = queriesRes.count ?? queries.length;
  const waitlistCount = waitlistRes.count ?? 0;

  // per-user query tally
  const counts = new Map<string, number>();
  for (const row of allIdsRes.data ?? []) {
    if (row.user_id) counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }

  const stats = [
    { label: "Users", value: users.length },
    { label: "Queries", value: totalQueries },
    { label: "Paid users", value: users.filter((u) => u.plan && u.plan !== "free").length },
    { label: "Waitlist", value: waitlistCount },
  ];

  return (
    <div className="h-screen overflow-y-auto bg-ink-900">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={32} className="rounded-[8px]" />
            <div>
              <h1 className="text-xl font-bold text-white">Admin</h1>
              <p className="text-xs text-white/40">Users &amp; product feedback</p>
            </div>
          </div>
          <Link
            href="/app"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5"
          >
            ← Back to app
          </Link>
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-3xl font-black tabular-nums text-white">{s.value}</div>
              <div className="mt-1 text-xs text-white/45">{s.label}</div>
            </div>
          ))}
        </div>

        {/* users */}
        <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-white/50">
          Users ({users.length})
        </h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Queries</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/85">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/60">
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="rounded-md bg-brand-500/15 px-2 py-0.5 text-xs text-brand-300">
                        admin
                      </span>
                    ) : (
                      <span className="text-xs text-white/40">user</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/60">
                    {counts.get(u.id) ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* queries feed */}
        <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-white/50">
          Latest user queries ({totalQueries})
        </h2>
        {queries.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/40">
            No queries yet — they&apos;ll appear here as users chat in the app.
          </p>
        ) : (
          <div className="space-y-2">
            {queries.map((q) => (
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
                    {q.email || "anon"} · {fmt(q.created_at)} · {q.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-white/25">
          Read-only admin · powered by Supabase RLS
        </p>
      </div>
    </div>
  );
}
