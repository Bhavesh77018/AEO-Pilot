"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";

function scoreColor(s: number | null) {
  if (s == null) return "text-white/40";
  if (s >= 75) return "text-emerald-400";
  if (s >= 50) return "text-amber-400";
  return "text-red-400";
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [domain, setDomain] = useState("");

  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  const create = useMutation({
    mutationFn: (d: string) => api.createProject(d),
    onSuccess: () => {
      setDomain("");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const scan = useMutation({
    mutationFn: (projectId: string) => api.startScan(projectId),
    onSuccess: (s) => router.push(`/scans/${s.id}`),
  });

  return (
    <div className="space-y-8">
      {/* Hero / add project */}
      <section className="card p-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Make your startup discoverable by AI
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-white/50">
          Enter a domain. AEO Pilot crawls it, scores its Answer Engine
          Optimization across 8 categories, and estimates your visibility inside
          ChatGPT, Gemini, Claude, Perplexity and more.
        </p>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (domain.trim()) create.mutate(domain.trim());
          }}
        >
          <input
            className="input sm:max-w-md"
            placeholder="stripe.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <button className="btn-primary" disabled={create.isPending}>
            {create.isPending ? "Adding…" : "Add project"}
          </button>
        </form>
        {create.isError && (
          <p className="mt-2 text-xs text-red-400">
            {(create.error as Error).message}
          </p>
        )}
      </section>

      {/* Projects */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Projects
          </h2>
          <span className="text-xs text-white/30">
            {projects.data?.length ?? 0} total
          </span>
        </div>

        {projects.isLoading && (
          <p className="text-sm text-white/40">Loading…</p>
        )}
        {projects.isError && (
          <div className="card p-5 text-sm text-red-400">
            Couldn&apos;t reach the API at{" "}
            <code>{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</code>.
            Is the backend running?
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data?.map((p: Project) => (
            <div key={p.id} className="card flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-white/40">{p.domain}</div>
                </div>
                <div className={`text-2xl font-black tabular-nums ${scoreColor(p.latest_score)}`}>
                  {p.latest_score != null ? Math.round(p.latest_score) : "—"}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-primary flex-1"
                  disabled={scan.isPending}
                  onClick={() => scan.mutate(p.id)}
                >
                  {scan.isPending ? "Starting…" : "Run scan"}
                </button>
                {p.latest_scan_id && (
                  <button
                    className="btn-ghost"
                    onClick={() => router.push(`/scans/${p.latest_scan_id}`)}
                  >
                    Latest
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {projects.data && projects.data.length === 0 && (
          <div className="card p-8 text-center text-sm text-white/40">
            No projects yet. Add a domain above to run your first AEO scan.
          </div>
        )}
      </section>
    </div>
  );
}
