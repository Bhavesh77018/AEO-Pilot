"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ChatDashboard } from "@/components/app/ChatDashboard";
import { AdminNavLink } from "@/components/app/AdminNavLink";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import {
  PlusIcon,
  ProjectsIcon,
  HistoryIcon,
  UpgradeIcon,
  AccountIcon,
} from "@/components/Icons";
import type { Project } from "@/lib/types";

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-white/10 text-white/50",
  growth: "bg-brand-500/20 text-brand-300",
  agency: "bg-purple-500/20 text-purple-300",
  enterprise: "bg-amber-500/20 text-amber-300",
};

function scoreColor(s: number) {
  if (s >= 75) return "text-emerald-400";
  if (s >= 50) return "text-amber-400";
  return "text-red-400";
}

function AppPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDomain = searchParams.get("domain") ?? undefined;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  /* auth */
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUserEmail(null);
      return;
    }
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserEmail(data.user?.email ?? null))
      .catch(() => setUserEmail(null));
  }, []);

  /* keyboard shortcut ⌘B / Ctrl+B → toggle sidebar */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const projects = useQuery({
    queryKey: ["projects", userEmail],
    queryFn: api.listProjects,
  });

  const userPlan = useQuery({
    queryKey: ["userPlan", userEmail],
    queryFn: api.getUserPlan,
  });

  const plan = userPlan.data;
  const planName = plan?.name ?? "Starter";
  const planKey = plan?.plan ?? "starter";
  const projectLimit = plan?.project_limit ?? 2;
  const projectList: Project[] = projects.data ?? [];

  const handleProjectClick = (project: Project) => {
    setActiveProjectId(project.id);
    if (project.latest_scan_id) {
      router.push(`/scans/${project.latest_scan_id}`);
    }
  };

  const handleNewProject = () => {
    if (projectList.length >= projectLimit) {
      setUpgradeOpen(true);
    }
    // If within limit, the chat input handles it naturally
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-900">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col border-r border-white/10 bg-ink-950 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-[72px]"
        }`}
      >
        {/* Logo + collapse */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-lg p-1 transition hover:bg-white/5"
            title={sidebarOpen ? "Collapse sidebar (⌘B)" : "Expand sidebar (⌘B)"}
          >
            <LogoMark size={32} className="shrink-0 rounded-[8px] shadow-lg shadow-brand-600/20" />
            {sidebarOpen && (
              <div className="text-left">
                <div className="text-sm font-semibold text-white leading-tight">AEO Pilot</div>
                <div
                  className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                    PLAN_COLORS[planKey] ?? PLAN_COLORS.starter
                  }`}
                >
                  {planName}
                </div>
              </div>
            )}
          </button>
        </div>

        {/* New scan / project */}
        <div className="p-3">
          <button
            onClick={handleNewProject}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
              projectList.length < projectLimit
                ? "bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-600/20"
                : "bg-white/5 text-white/40"
            }`}
            title={projectList.length >= projectLimit ? "Upgrade to add more projects" : "New project"}
          >
            <PlusIcon size={16} />
            {sidebarOpen && (projectList.length >= projectLimit ? "Upgrade for more" : "New project")}
          </button>
        </div>

        {/* Projects list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {sidebarOpen && (
            <div className="mb-1 flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              <ProjectsIcon size={12} />
              Projects
            </div>
          )}
          <nav className="space-y-0.5">
            {projects.isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="mx-2 h-9 animate-pulse rounded-lg bg-white/5"
                />
              ))
            ) : projectList.length === 0 ? (
              sidebarOpen && (
                <p className="px-3 py-2 text-xs text-white/30">
                  No projects yet — type a domain in the chat
                </p>
              )
            ) : (
              projectList.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    activeProjectId === project.id
                      ? "bg-brand-600/20 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                  title={project.domain}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/5 text-[10px] font-bold uppercase group-hover:bg-white/10">
                    {project.domain.slice(0, 2).toUpperCase()}
                  </span>
                  {sidebarOpen && (
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{project.domain}</div>
                      {project.latest_score !== null && (
                        <div className={`text-[10px] ${scoreColor(project.latest_score)}`}>
                          Score: {Math.round(project.latest_score)}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))
            )}
          </nav>

          {/* Scan history divider */}
          {sidebarOpen && projectList.length > 0 && (
            <>
              <div className="my-3 border-t border-white/5" />
              <div className="mb-1 flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                <HistoryIcon size={12} />
                Recent
              </div>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-white/40 hover:bg-white/5 hover:text-white/70 transition">
                <HistoryIcon size={14} />
                View scan history
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-3 space-y-2">
          {sidebarOpen ? (
            <>
              {/* Plan badge + upgrade */}
              {planKey === "starter" && (
                <button
                  onClick={() => setUpgradeOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-sky-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:from-brand-600 hover:to-sky-600"
                >
                  <UpgradeIcon size={16} />
                  Upgrade plan
                </button>
              )}
              <AdminNavLink />
              {userEmail && (
                <div className="truncate px-2 py-1 text-[11px] text-white/40">{userEmail}</div>
              )}
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <AccountIcon size={16} />
                {userEmail ? "Account" : "Sign in"}
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setUpgradeOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600/20 text-brand-400 transition hover:bg-brand-600/30"
                title="Upgrade plan"
              >
                <UpgradeIcon size={18} />
              </button>
              <Link
                href="/login"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white/50 transition hover:bg-white/10"
                title={userEmail ?? "Sign in"}
              >
                <AccountIcon size={18} />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 bg-ink-900/60 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-white">How can I help you today?</h1>
            <p className="text-xs text-white/40">
              {userEmail
                ? `Rank your brand in AI + Google · ${planName} plan · ${projectList.length}/${projectLimit} projects`
                : "Sign in to start ranking your brand in AI + Google"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Plan badge */}
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                PLAN_COLORS[planKey] ?? PLAN_COLORS.starter
              }`}
            >
              {planName}
            </span>

            {/* User avatar */}
            {userEmail && (
              <Link href="/login">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300 ring-2 ring-brand-500/20 transition hover:ring-brand-500/40">
                  {userEmail[0].toUpperCase()}
                </div>
              </Link>
            )}
          </div>
        </header>

        {/* Chat */}
        <ChatDashboard
          userEmail={userEmail}
          projects={projectList}
          isLoading={projects.isLoading}
          planName={planName}
          projectLimit={projectLimit}
          initialDomain={initialDomain}
          onUpgradeRequest={() => setUpgradeOpen(true)}
        />
      </main>

      {/* Upgrade modal — triggered from sidebar or chat */}
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason="project_limit"
        currentPlan={planKey}
      />
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-ink-900 text-white/40 text-sm">Loading…</div>}>
      <AppPageInner />
    </Suspense>
  );
}
