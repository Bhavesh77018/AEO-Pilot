import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function getUserEmail(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const email = await getUserEmail();

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/app" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-sky-400 text-sm font-black text-white">
              A
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">AEO Pilot</div>
              <div className="text-[10px] text-white/40">
                Make your startup discoverable by AI
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm text-white/60">
            <Link href="/app" className="rounded-lg px-3 py-1.5 hover:bg-white/5">
              Projects
            </Link>
            <Link href="/#pricing" className="hidden rounded-lg px-3 py-1.5 hover:bg-white/5 sm:inline-block">
              Pricing
            </Link>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-lg px-3 py-1.5 hover:bg-white/5 sm:inline-block"
            >
              API
            </a>
            {email ? (
              <div className="ml-2">
                <SignOutButton email={email} />
              </div>
            ) : (
              <Link href="/login" className="ml-1 rounded-lg px-3 py-1.5 hover:bg-white/5">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-white/30">
        AEO Pilot · scoring runs on heuristics; add an LLM key to enrich
        recommendations and enable live AI monitoring
      </footer>
    </>
  );
}
