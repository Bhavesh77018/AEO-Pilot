"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (domain: string) => void;
  isLoading: boolean;
  userEmail: string | null;
  canCreate: boolean;
  projectCount: number;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  userEmail,
  canCreate,
  projectCount,
}: NewProjectModalProps) {
  const [domain, setDomain] = useState("");
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      onSubmit(domain.trim());
      setDomain("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-8">
        {/* Sign-in requirement */}
        {!userEmail ? (
          <>
            <h2 className="text-2xl font-bold">Sign in to continue</h2>
            <p className="mt-3 text-white/60">
              Create projects and monitor your AI visibility. Sign in with your email.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-6 w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white hover:bg-brand-400 transition"
            >
              Sign in
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full rounded-xl border border-white/15 px-4 py-3 text-white/80 hover:bg-white/5 transition"
            >
              Cancel
            </button>
          </>
        ) : !canCreate ? (
          // Plan limit reached
          <>
            <h2 className="text-2xl font-bold">Project limit reached</h2>
            <p className="mt-3 text-white/60">
              Your free plan includes 2 projects. You have {projectCount} projects.
            </p>
            <p className="mt-2 text-white/50 text-sm">
              Upgrade to Growth or Agency plan to create more projects.
            </p>
            <Link
              href="/#pricing"
              className="mt-6 block w-full rounded-xl bg-brand-500 px-4 py-3 text-center font-semibold text-white hover:bg-brand-400 transition"
            >
              View Pricing
            </Link>
            <button
              onClick={onClose}
              className="mt-3 w-full rounded-xl border border-white/15 px-4 py-3 text-white/80 hover:bg-white/5 transition"
            >
              Close
            </button>
          </>
        ) : (
          // Add project form
          <>
            <h2 className="text-2xl font-bold">Add a new project</h2>
            <p className="mt-2 text-sm text-white/60">
              Enter your website domain to start analyzing your AEO score.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-ink-900/50 px-4 py-3 text-white placeholder-white/30 focus:border-brand-500/50 focus:outline-none"
                  autoFocus
                />
                <p className="mt-2 text-xs text-white/40">
                  We'll crawl your site and score your AI visibility across 8 categories.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!domain.trim() || isLoading}
                  className="flex-1 rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white hover:bg-brand-400 disabled:opacity-50 transition"
                >
                  {isLoading ? "Adding…" : "Add project"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-white/80 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
              </div>
            </form>

            <p className="mt-4 text-xs text-white/40">
              Your free plan includes{" "}
              <strong>2 projects</strong>. Upgrade for more.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
