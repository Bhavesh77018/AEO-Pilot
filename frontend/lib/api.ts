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

export interface UserPlan {
  plan: "starter" | "growth" | "agency" | "enterprise";
  name: string;
  project_limit: number;
  scan_limit: number;
  period: "monthly" | "annual" | null;
  active_since: string | null;
}

export const api = {
  listProjects: () => req<Project[]>("/api/v1/projects"),
  createProject: (domain: string, name?: string) =>
    req<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify({ domain, name }),
    }),
  getProject: (projectId: string) =>
    req<Project>(`/api/v1/projects/${projectId}`),
  startScan: (projectId: string) =>
    req<ScanSummary>(`/api/v1/projects/${projectId}/scans`, { method: "POST" }),
  getScan: (scanId: string) => req<ScanDetail>(`/api/v1/scans/${scanId}`),
  listScans: (projectId: string) =>
    req<ScanSummary[]>(`/api/v1/projects/${projectId}/scans`),
  submitContact: (body: any) =>
    req<{ status: string }>("/api/v1/contact", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  /** Returns the user's current billing plan. Falls back to starter if the
   *  endpoint doesn't exist yet (so the UI degrades gracefully). */
  getUserPlan: async (): Promise<UserPlan> => {
    try {
      return await req<UserPlan>("/api/v1/billing/plan");
    } catch {
      return {
        plan: "starter",
        name: "Starter",
        project_limit: 2,
        scan_limit: 5,
        period: null,
        active_since: null,
      };
    }
  },
};
