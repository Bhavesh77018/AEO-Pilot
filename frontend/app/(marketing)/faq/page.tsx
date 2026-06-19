import type { Metadata } from "next";
import { ArticleShell } from "@/components/marketing/ArticleShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/lib/pricing";
import { breadcrumbSchema, faqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "AEO Pilot FAQ: Answer Engine Optimization questions answered",
  description:
    "Frequently asked questions about Answer Engine Optimization and AEO Pilot — what AEO is, how visibility is measured, AI tokens, pricing, and getting cited by ChatGPT and Perplexity.",
  alternates: { canonical: "/faq" },
};

// The marketing FAQ plus a few AEO-specific questions, all marked up as FAQPage.
const EXTRA: { q: string; a: string }[] = [
  {
    q: "How long does it take to improve AEO visibility?",
    a: "On-page AEO score improvements (schema, FAQ, knowledge hub) take effect as soon as engines re-crawl your site. Measured mention and citation gains across answer engines typically show over weeks as models and live indexes update.",
  },
  {
    q: "Which answer engines does AEO Pilot track?",
    a: "ChatGPT, GPT Search, Gemini, Claude, Perplexity, Copilot, Grok and DeepSeek today, with more added as new answer engines emerge.",
  },
  {
    q: "Is AEO the same as GEO?",
    a: "Largely yes. Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) describe the same goal: being mentioned and cited inside AI-generated answers.",
  },
];

const ALL = [...FAQ, ...EXTRA];

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={[
          faqSchema(ALL),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />
      <ArticleShell
        title="Frequently Asked Questions"
        subtitle="Everything about Answer Engine Optimization and AEO Pilot."
      >
        <div className="space-y-7">
          {ALL.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              <p className="mt-1.5 text-white/60">{item.a}</p>
            </div>
          ))}
        </div>
      </ArticleShell>
    </>
  );
}
