import type { Project, ScanDetail, ScanSummary } from "./types";

// Browser uses NEXT_PUBLIC_API_URL (localhost). Server components inside the
// container would use BACKEND_INTERNAL_URL. We only fetch from the client here.
const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listProjects: () => req<Project[]>("/api/v1/projects"),
  createProject: (domain: string, name?: string) =>
    req<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify({ domain, name }),
    }),
  startScan: (projectId: string) =>
    req<ScanSummary>(`/api/v1/projects/${projectId}/scans`, { method: "POST" }),
  getScan: (scanId: string) => req<ScanDetail>(`/api/v1/scans/${scanId}`),
  listScans: (projectId: string) =>
    req<ScanSummary[]>(`/api/v1/projects/${projectId}/scans`),
};
