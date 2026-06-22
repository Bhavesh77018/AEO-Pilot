import { apiBase } from "./apiBase";
import type { Project, ScanDetail, ScanSummary } from "./types";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
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
