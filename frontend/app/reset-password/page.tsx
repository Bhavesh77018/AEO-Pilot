"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setInfo("Password updated successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/app");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-6 bg-ink-900">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <LogoMark size={36} className="rounded-[9px] shadow-lg shadow-brand-600/30" />
          <span className="text-lg font-semibold tracking-tight text-white">AEO Pilot</span>
        </Link>

        <div className="card p-7">
          <h1 className="text-center text-xl font-bold text-white">
            Reset Password
          </h1>
          <p className="mb-6 mt-1 text-center text-sm text-white/45">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              required
              minLength={6}
              placeholder="New password (min 6 chars)"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-xs text-red-400">{error}</p>}
            {info && <p className="text-xs text-emerald-400">{info}</p>}

            <button className="btn-primary w-full text-white bg-brand-500 hover:bg-brand-400 py-2.5 rounded-xl font-semibold transition" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
