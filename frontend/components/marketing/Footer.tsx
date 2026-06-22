import Link from "next/link";
import { LogoMark } from "@/components/Logo";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Launch app", href: "/app" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "What is AEO?", href: "/learn" },
      { label: "AEO Guides", href: "/guides" },
      { label: "AEO vs SEO", href: "/comparisons" },
      { label: "Glossary", href: "/glossary" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Use cases", href: "/use-cases" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact sales", href: "mailto:sales@aeopilot.example" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-900/40">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark size={32} className="rounded-[8px]" />
              <span className="text-base font-semibold">AEO Pilot</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/40">
              Make your startup discoverable by AI. The growth platform for the
              answer-engine era.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                {c.title}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-white/60 transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/30 sm:flex-row">
          <span>© {new Date().getFullYear()} AEO Pilot. All rights reserved.</span>
          <span>Built for ChatGPT · Gemini · Claude · Perplexity · Copilot · Grok · DeepSeek</span>
        </div>
      </div>
    </footer>
  );
}
