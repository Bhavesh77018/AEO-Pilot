"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "magic";

export function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const supabase = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        setInfo("Check your email for a magic sign-in link.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setInfo("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setError(error.message); // otherwise the browser redirects to Google
  }

  return (
    <div className="w-full max-w-sm">
      {/* Continue with Google */}
      <button
        type="button"
        onClick={signInWithGoogle}
        className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-white/90"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.5 26.9 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C40.9 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
        </svg>
        Continue with Google
      </button>

      <div className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/30">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 text-sm">
        {(["signin", "signup", "magic"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-lg px-3 py-1.5 transition ${
              mode === m ? "bg-brand-500 text-white" : "text-white/55 hover:text-white"
            }`}
          >
            {m === "signin" ? "Sign in" : m === "signup" ? "Sign up" : "Magic link"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="you@company.com"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode !== "magic" && (
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 chars)"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
        {info && <p className="text-xs text-emerald-400">{info}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          {loading
            ? "Working…"
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send magic link"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-white/30">
        By continuing you agree to the AEO Pilot terms. New here? Use{" "}
        <button onClick={() => setMode("signup")} className="text-brand-300 underline">
          Sign up
        </button>
        .
      </p>
    </div>
  );
}
