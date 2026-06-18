import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next || "/app";

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-6">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-sky-400 text-base font-black text-white shadow-lg shadow-brand-600/30">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight">AEO Pilot</span>
        </Link>

        <div className="card p-7">
          <h1 className="text-center text-xl font-bold">Welcome back</h1>
          <p className="mb-6 mt-1 text-center text-sm text-white/45">
            Sign in to your AI visibility command center.
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
