"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const router = useRouter();
  const [question, setQuestion] = useState("");

  const scan = useMutation({
    mutationFn: () => api.startScan(project.id),
    onSuccess: (s) => router.push(`/scans/${s.id}`),
  });

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    scan.mutate();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <button
          onClick={onBack}
          className="mb-4 text-white/60 hover:text-white transition"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold">{project.domain}</h2>
        {project.latest_score !== null && (
          <p className="text-sm text-white/60 mt-1">
            Latest score: <span className="text-emerald-400 font-semibold">{project.latest_score}</span>/100
          </p>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-2xl">
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <h3 className="font-semibold mb-2">Welcome to {project.domain}</h3>
            <p className="text-white/60 text-sm mb-4">
              Ready to analyze your AEO score? Click the button below to start a new scan.
            </p>
            {project.latest_score !== null && (
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3 text-sm">
                <p className="text-white/80">
                  Your last scan: <span className="font-semibold text-brand-300">{project.latest_score}/100</span>
                </p>
                <p className="text-white/50 text-xs mt-1">
                  Run another scan to track improvements over time
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-ink-800/50 p-4">
        <form onSubmit={handleScan} className="max-w-2xl">
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={scan.isPending}
              className="flex-1 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-400 disabled:opacity-50 transition"
            >
              {scan.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span> Scanning…
                </span>
              ) : (
                "Run AEO Scan"
              )}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-white/15 px-6 py-3 text-white/80 hover:bg-white/5 transition"
            >
              Back
            </button>
          </div>
          {scan.isError && (
            <p className="mt-2 text-xs text-red-400">
              {(scan.error as Error).message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
