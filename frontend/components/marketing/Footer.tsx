"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { ContactModal } from "./ContactModal";

const COLS = [
  {
    title: "Services",
    links: [
      { label: "Why Hire Us", href: "/#why-hire-us" },
      { label: "Why Invest", href: "/#invest" },
      { label: "Investment Plans", href: "/#pricing" },
      { label: "Free Scan", href: "/app" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "What is AEO?", href: "/learn" },
      { label: "SEO vs AEO vs GEO", href: "/comparisons" },
      { label: "AEO Glossary", href: "/glossary" },
      { label: "Use Cases", href: "/use-cases" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Vision", href: "/#vision" },
      { label: "FAQ", href: "/faq" },
      { label: "Hire our team", onClick: true },
    ],
  },
];

export function Footer() {
  const [modalOpen, setModalOpen] = useState(false);
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
              The premium AI search agency. We rank your brand in ChatGPT,
              Gemini, Claude & Perplexity — and measure every result.
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
                    {l.onClick ? (
                      <button onClick={() => setModalOpen(true)} className="text-white/60 transition hover:text-white">
                        {l.label}
                      </button>
                    ) : (
                      <Link href={l.href!} className="text-white/60 transition hover:text-white">
                        {l.label}
                      </Link>
                    )}
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
      <ContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </footer>
  );
}
