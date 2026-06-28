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
  let res: Response;
  const fullUrl = `${apiBase()}${path}`;
  try {
    res = await fetch(fullUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(await authHeaders()),
        ...(init?.headers as Record<string, string> | undefined),
      },
      ...init,
    });
  } catch (err: any) {
    throw new Error(`Network Error: Cannot reach backend at ${fullUrl}. Check CORS or URL typos.`);
  }

  if (!res.ok) {
    let body: any;
    try {
      body = await res.json();
    } catch {
      body = {};
    }
    throw new Error(body.detail || `HTTP ${res.status} Error at ${path}`);
  }
  if (res.status === 204) return null as T;
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
  deleteProject: (projectId: string) =>
    req<{ status: string }>(`/api/v1/projects/${projectId}`, { method: "DELETE" }),
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
