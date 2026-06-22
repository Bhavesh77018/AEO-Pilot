"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Renders the Admin link only for users whose profile role = 'admin'. */
export function AdminNavLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (data?.role === "admin") setIsAdmin(true);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/app/admin"
      className="block w-full rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-center text-sm font-medium text-brand-200 transition hover:bg-brand-500/20"
    >
      ⚙ Admin
    </Link>
  );
}
