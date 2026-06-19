import Link from "next/link";

/** Shared layout for knowledge-hub articles: breadcrumb, single H1, prose, CTA. */
export function ArticleShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-white/70">
          Home
        </Link>
        <span>/</span>
        <span className="text-white/60">{title}</span>
      </nav>

      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 text-lg text-white/55">{subtitle}</p>

      <div
        className="mt-8 space-y-4 text-[15px] text-white/70
          [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white
          [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white/90
          [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_li]:text-white/60
          [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5
          [&_strong]:text-white [&_a]:text-brand-300 [&_a]:underline"
      >
        {children}
      </div>

      {/* Conversion CTA on every knowledge page */}
      <div className="mt-12 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-600/15 to-transparent p-6 text-center">
        <h2 className="text-lg font-bold text-white">See your AEO score in under a minute</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
          Run a free scan — no API key, no credit card — and find out why AI
          doesn&apos;t mention your brand yet.
        </p>
        <Link
          href="/app"
          className="mt-4 inline-flex rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
        >
          Launch AEO Pilot →
        </Link>
      </div>
    </article>
  );
}
