import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { LogoMark } from "@/components/Logo";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next || "/app";

  // Extract domain from the `next` URL if it was passed from the scan widget
  let pendingDomain: string | null = null;
  try {
    const nextUrl = new URL(next, "http://localhost");
    pendingDomain = nextUrl.searchParams.get("domain");
  } catch {
    /* next may be a relative path — ignore */
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-6">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <LogoMark size={36} className="rounded-[9px] shadow-lg shadow-brand-600/30" />
          <span className="text-lg font-semibold tracking-tight">AEO Pilot</span>
        </Link>

        {/* Domain context banner */}
        {pendingDomain && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-brand-500/25 bg-brand-500/10 px-4 py-3">
            <span className="text-lg">🔍</span>
            <div>
              <p className="text-sm font-semibold text-white">
                Scan queued for <span className="text-brand-300">{pendingDomain}</span>
              </p>
              <p className="text-xs text-white/40">
                Sign in to start your free Search Visibility scan
              </p>
            </div>
          </div>
        )}

        <div className="card p-7">
          <h1 className="text-center text-xl font-bold">
            {pendingDomain ? "Sign in to start scanning" : "Welcome back"}
          </h1>
          <p className="mb-6 mt-1 text-center text-sm text-white/45">
            {pendingDomain
              ? "Create a free account — no credit card needed"
              : "Sign in to your AI visibility command center."}
          </p>
          <div className="flex justify-center">
            <AuthForm next={next} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          <Link href="/" className="hover:text-white/60">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
