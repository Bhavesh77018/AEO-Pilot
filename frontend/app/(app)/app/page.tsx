"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  TrashIcon,
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

/* ── Hamburger icon ──────────────────────────────────────────────── */
function HamburgerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <line x1="3" y1="5" x2="17" y2="5" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="3" y1="15" x2="17" y2="15" />
    </svg>
  );
}

function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <line x1="4" y1="4" x2="16" y2="16" />
      <line x1="16" y1="4" x2="4" y2="16" />
    </svg>
  );
}

function AppPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDomain = searchParams.get("domain") ?? undefined;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // default closed; desktop overrides via CSS
  const [isMobile, setIsMobile] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const qc = useQueryClient();

  /* detect mobile */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setIsMobile(mq.matches);
      // On desktop, start with sidebar open; on mobile start closed
      if (!mq.matches) setSidebarOpen(true);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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

  const deleteProject = useMutation({
    mutationFn: (projectId: string) => api.deleteProject(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", userEmail] });
    },
    onError: (e) => {
      alert(`Couldn't delete project: ${(e as Error).message}`);
    },
  });

  const handleProjectClick = (project: Project) => {
    setActiveProjectId(project.id);
    if (isMobile) setSidebarOpen(false); // close drawer on mobile nav
    if (project.latest_scan_id) {
      router.push(`/scans/${project.latest_scan_id}`);
    }
  };

  const handleNewProject = () => {
    if (projectList.length >= projectLimit) {
      setUpgradeOpen(true);
    }
    if (isMobile) setSidebarOpen(false);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-ink-900">

      {/* ── Mobile overlay backdrop ─────────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`
          flex flex-col border-r border-white/10 bg-ink-950 transition-all duration-300
          ${isMobile
            ? `fixed inset-y-0 left-0 z-40 w-72 shadow-2xl shadow-black/50 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
            : sidebarOpen ? "w-64" : "w-[72px]"
          }
        `}
      >
        {/* Logo + collapse / close */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <button
            onClick={() => isMobile ? closeSidebar() : setSidebarOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-lg p-1 transition hover:bg-white/5"
            title={sidebarOpen ? "Collapse sidebar (⌘B)" : "Expand sidebar (⌘B)"}
          >
            <LogoMark size={32} className="shrink-0 rounded-[8px] shadow-lg shadow-brand-600/20" />
            {(sidebarOpen) && (
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

          {/* Close button visible on mobile */}
          {isMobile && sidebarOpen && (
            <button
              onClick={closeSidebar}
              className="grid h-8 w-8 place-items-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition"
              aria-label="Close sidebar"
            >
              <CloseIcon size={18} />
            </button>
          )}
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
                  className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
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
                    <>
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="truncate text-xs font-medium">{project.domain}</div>
                        {project.latest_score !== null && (
                          <div className={`text-[10px] ${scoreColor(project.latest_score)}`}>
                            Score: {Math.round(project.latest_score)}
                          </div>
                        )}
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this project?")) {
                            deleteProject.mutate(project.id);
                          }
                        }}
                        className="absolute right-2 p-1 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        title="Delete project"
                      >
                        <TrashIcon size={14} />
                      </div>
                    </>
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
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <div className="truncate text-[11px] text-white/40">{userEmail}</div>
                  {planKey !== "starter" && (
                    <div className="rounded bg-emerald-500/20 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400" title="Premium Member">
                      PRO
                    </div>
                  )}
                </div>
              )}
              {userEmail ? (
                <button
                  onClick={async () => {
                    await createClient().auth.signOut();
                    window.location.href = "/login";
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <AccountIcon size={16} />
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <AccountIcon size={16} />
                  Sign in
                </Link>
              )}
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
              {userEmail ? (
                <button
                  onClick={async () => {
                    await createClient().auth.signOut();
                    window.location.href = "/login";
                  }}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white/50 transition hover:bg-white/10"
                  title="Sign out"
                >
                  <AccountIcon size={18} />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white/50 transition hover:bg-white/10"
                  title="Sign in"
                >
                  <AccountIcon size={18} />
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-white/10 bg-ink-900/60 px-4 py-3 md:px-6 md:py-4 backdrop-blur">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition md:hidden"
            aria-label="Open sidebar"
          >
            <HamburgerIcon size={20} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white md:text-xl truncate">
              How can I help you today?
            </h1>
            <p className="hidden md:block text-xs text-white/40">
              {userEmail
                ? `Rank your brand in AI + Google · ${planName} plan · ${projectList.length}/${projectLimit} projects`
                : "Sign in to start ranking your brand in AI + Google"}
            </p>
            {/* Mobile subtitle — shorter */}
            <p className="md:hidden text-[11px] text-white/35 truncate">
              {userEmail
                ? `${planName} plan · ${projectList.length}/${projectLimit} projects`
                : "Sign in to get started"}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Plan badge — desktop only */}
            <span
              className={`hidden md:inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                PLAN_COLORS[planKey] ?? PLAN_COLORS.starter
              }`}
            >
              {planName}
            </span>

            {/* User avatar */}
            {userEmail && (
              <Link href="/login" className="relative">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300 ring-2 ring-brand-500/20 transition hover:ring-brand-500/40">
                  {userEmail[0].toUpperCase()}
                </div>
                {planKey !== "starter" && (
                   <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 ring-2 ring-ink-900 grid place-items-center p-0.5 shadow-sm" title="Premium Member">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                      </svg>
                   </div>
                )}
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
    <Suspense fallback={<div className="flex h-[100dvh] items-center justify-center bg-ink-900 text-white/40 text-sm">Loading…</div>}>
      <AppPageInner />
    </Suspense>
  );
}
