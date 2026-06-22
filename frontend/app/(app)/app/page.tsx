"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChatDashboard } from "@/components/app/ChatDashboard";
import { AdminNavLink } from "@/components/app/AdminNavLink";
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

export default function AppPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [expandedSidebar, setExpandedSidebar] = useState(true);

  // Get user email
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUserEmail(null);
      return;
    }
    const getUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserEmail(user?.email ?? null);
      } catch {
        setUserEmail(null);
      }
    };
    getUser();
  }, []);

  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-ink-900">
      {/* Left Sidebar - Inspired by DialforAI design */}
      <aside
        className={`${
          expandedSidebar ? "w-64" : "w-20"
        } border-r border-white/10 bg-ink-950 overflow-y-auto transition-all duration-300 flex flex-col`}
      >
        {/* Branding */}
        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => setExpandedSidebar(!expandedSidebar)}
            className="w-full flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition"
          >
            <LogoMark size={32} className="flex-shrink-0 rounded-[8px]" />
            {expandedSidebar && (
              <div className="text-left">
                <div className="text-sm font-semibold text-white">AEO Pilot</div>
                <div className="text-xs text-white/50">Beta</div>
              </div>
            )}
          </button>
        </div>

        {/* New Chat Button */}
        {expandedSidebar && (
          <div className="p-3">
            <button className="w-full bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 px-3 text-sm font-medium transition flex items-center justify-center gap-2">
              <PlusIcon size={16} />
              New Chat
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="px-3 py-4 flex-1 overflow-y-auto">
          {expandedSidebar && (
            <>
              {/* Projects Section */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2 px-2 flex items-center gap-2">
                  <ProjectsIcon size={14} />
                  Projects
                </div>
                <nav className="space-y-1">
                  {Array.isArray(projects.data) && projects.data.length > 0 ? (
                    projects.data.map((project: any) => (
                      <button
                        key={project.id}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition text-left truncate group"
                        title={project.domain}
                      >
                        <div className="text-white/50 group-hover:text-white/70">
                          <ProjectsIcon size={16} />
                        </div>
                        <span className="truncate">{project.domain}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-white/50">No projects yet</p>
                  )}
                </nav>
              </div>

              {/* History Section */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2 px-2 flex items-center gap-2">
                  <HistoryIcon size={14} />
                  History
                </div>
                <nav className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition text-left group">
                    <div className="text-white/50 group-hover:text-white/70">
                      <HistoryIcon size={16} />
                    </div>
                    <span>Recent Scans</span>
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {expandedSidebar && (
          <div className="p-3 border-t border-white/10 space-y-2">
            <Link
              href="/#pricing"
              className="w-full bg-gradient-to-r from-brand-500 to-sky-400 hover:from-brand-600 hover:to-sky-500 text-white text-sm font-semibold py-2 px-3 rounded-lg transition block text-center flex items-center justify-center gap-2"
            >
              <UpgradeIcon size={16} />
              Upgrade Now
            </Link>
            <AdminNavLink />
            {userEmail && (
              <div className="text-xs text-white/60 truncate px-2 py-2">
                {userEmail}
              </div>
            )}
            <Link
              href="/login"
              className="w-full bg-white/10 hover:bg-white/20 text-white text-sm py-2 px-3 rounded-lg transition block text-center flex items-center justify-center gap-2"
            >
              <AccountIcon size={16} />
              {userEmail ? "Account" : "Sign In"}
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-white/10 bg-ink-900/50 backdrop-blur">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">How can I help you today?</h1>
            <p className="text-sm text-white/60">Analyze your AEO visibility and optimize your presence across AI search engines</p>
          </div>
        </header>

        {/* Chat Dashboard */}
        <ChatDashboard
          userEmail={userEmail}
          projects={projects.data ?? []}
          isLoading={projects.isLoading}
        />
      </main>
    </div>
  );
}
