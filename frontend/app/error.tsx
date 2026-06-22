"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogoMark } from "@/components/Logo";

/** Next.js route error boundary — catches render/runtime errors in the tree. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-md">
        <LogoMark size={48} className="mx-auto mb-5 rounded-xl" />
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-white/50">
          An unexpected error occurred. Try again, or head back home.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/5"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
