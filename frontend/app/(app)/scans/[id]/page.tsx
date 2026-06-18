"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CategoryRadar } from "@/components/CategoryRadar";
import { Recommendations } from "@/components/Recommendations";
import { ScoreRing } from "@/components/ScoreRing";
import { ServiceOffer } from "@/components/ServiceOffer";
import { VisibilityPanel } from "@/components/VisibilityPanel";
import { api } from "@/lib/api";

export default function ScanPage() {
  const { id } = useParams<{ id: string }>();

  const scan = useQuery({
    queryKey: ["scan", id],
    queryFn: () => api.getScan(id),
    // Poll while the scan is running.
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "pending" || s === "running" ? 1500 : false;
    },
  });

  const data = scan.data;

  if (scan.isLoading || !data) {
    return <p className="text-sm text-white/40">Loading scan…</p>;
  }

  const running = data.status === "pending" || data.status === "running";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app" className="text-sm text-white/50 hover:text-white">
          ← Projects
        </Link>
        <span className="text-xs text-white/30">scan {data.id.slice(0, 8)}</span>
      </div>

      {running && (
        <div className="card flex items-center gap-3 p-5">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-500" />
          <span className="text-sm text-white/70">
            Agents working… crawling site and analyzing AEO signals. This
            refreshes automatically.
          </span>
        </div>
      )}

      {data.status === "failed" && (
        <div className="card p-5 text-sm text-red-400">
          Scan failed: {data.error || "unknown error"}
        </div>
      )}

      {data.status === "completed" && (
        <>
          {/* Top: overall + visibility */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card flex flex-col items-center justify-center gap-2 p-6">
              <ScoreRing score={data.overall_score ?? 0} />
              <div className="text-xs text-white/40">
                {data.pages_crawled} pages crawled
              </div>
            </div>
            <div className="card p-6 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
                AI Visibility by Engine
              </h3>
              {data.visibility && <VisibilityPanel visibility={data.visibility} />}
            </div>
          </div>

          {/* Middle: categories */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                AEO Category Scores
              </h3>
              {data.category_scores && (
                <CategoryRadar categories={data.category_scores} />
              )}
            </div>
            <div className="card p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
                Category breakdown
              </h3>
              <div className="space-y-3">
                {data.category_scores &&
                  Object.entries(data.category_scores).map(([key, c]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">{c.label}</span>
                        <span className="font-semibold tabular-nums">
                          {Math.round(c.score)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${c.score}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-white/35">{c.summary}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
              Prioritized Recommendations
            </h3>
            <Recommendations items={data.recommendations} />
          </div>

          {/* Done-For-You upsell */}
          {data.service_offer && <ServiceOffer offer={data.service_offer} />}
        </>
      )}
    </div>
  );
}
