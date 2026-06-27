"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function SignOutButton({ email }: { email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const qc = useQueryClient();

  async function signOut() {
    setLoading(true);
    await createClient().auth.signOut();
    qc.clear(); // Clear cached queries (projects/scans) to prevent cross-user leakage
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-white/40 sm:inline" title={email}>
        {email}
      </span>
      <button
        onClick={signOut}
        disabled={loading}
        className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5"
      >
        {loading ? "…" : "Sign out"}
      </button>
    </div>
  );
}
