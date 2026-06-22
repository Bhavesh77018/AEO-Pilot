"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Project } from "@/lib/types";

interface SidebarProps {
  projects: Project[];
  userEmail: string | null;
  isLoading: boolean;
  onNewProject: () => void;
}

export function Sidebar({
  projects,
  userEmail,
  isLoading,
  onNewProject,
}: SidebarProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);

  // Check if user can create more projects (2 free limit)
  const canCreateProject = !userEmail || projects.length < 2;

  return (
    <aside
      className={`fixed left-0 top-16 md:top-0 bottom-0 border-r border-white/10 bg-ink-800/50 backdrop-blur transition-all duration-300 z-20 ${
        expanded ? "w-64" : "w-20"
      }`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-6 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-ink-800 hover:bg-white/5"
      >
        {expanded ? "←" : "→"}
      </button>

      <div className="flex flex-col h-full">
        {/* New chat button */}
        <div className="p-3 border-b border-white/5">
          <button
            onClick={onNewProject}
            disabled={!canCreateProject || isLoading}
            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
              canCreateProject
                ? "bg-brand-600 hover:bg-brand-500 text-white"
                : "bg-white/5 text-white/40 cursor-not-allowed"
            }`}
          >
            <span className="text-lg">+</span>
            {expanded ? "New Project" : ""}
          </button>
          {!canCreateProject && expanded && (
            <p className="mt-2 text-xs text-white/40">
              {!userEmail
                ? "Sign in to add more projects"
                : "Free plan limit: 2 projects. Upgrade for more."}
            </p>
          )}
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-xs text-white/40">Loading…</div>
          ) : projects.length === 0 ? (
            <div className="p-3 text-xs text-white/40 text-center">
              {expanded ? "No projects yet" : ""}
            </div>
          ) : (
            <nav className="space-y-1 p-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => router.push(`/scans/${project.latest_scan_id}`)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 transition truncate"
                  title={project.domain}
                >
                  {expanded ? (
                    <div>
                      <div className="truncate font-medium">{project.domain}</div>
                      {project.latest_score !== null && (
                        <div className="text-xs text-white/40">
                          Score: {project.latest_score}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs">
                      {project.domain.split(".")[0].slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 p-3 space-y-2 text-xs">
          <Link
            href="/#pricing"
            className="block text-center text-white/50 hover:text-white/70 py-1"
          >
            {expanded ? "Upgrade plan" : "↑"}
          </Link>
          {userEmail && (
            <div className="text-white/40 text-center truncate">
              {expanded ? userEmail : "👤"}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
