import { apiBase } from "./apiBase";
import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import type { Project, ScanDetail, ScanSummary } from "./types";

/** Attach the signed-in user's Supabase token so the API scopes data to them. */
async function authHeaders(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) return {};
  try {
    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
      ...(init?.headers as Record<string, string> | undefined),
    },
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
