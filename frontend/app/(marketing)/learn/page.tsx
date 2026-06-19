import type { Metadata } from "next";
import { ArticleShell } from "@/components/marketing/ArticleShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "What is AEO? Answer Engine Optimization explained",
  description:
    "Answer Engine Optimization (AEO) is the practice of optimizing your brand so AI assistants like ChatGPT, Gemini, Claude and Perplexity mention and cite you. Here's how it works and how AEO Pilot helps.",
  alternates: { canonical: "/learn" },
};

export default function LearnPage() {
  return (
    <>
      <JsonLd
        data={[
          articleSchema({
            headline: "What is AEO? Answer Engine Optimization explained",
            description: metadata.description as string,
            path: "/learn",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "What is AEO", path: "/learn" },
          ]),
        ]}
      />
      <ArticleShell
        title="What is Answer Engine Optimization?"
        subtitle="And how AEO Pilot turns an invisible brand into a cited one."
      >
        <p>
          <strong>Answer Engine Optimization (AEO)</strong> is the practice of
          optimizing your brand, website, and content so that AI answer engines —
          ChatGPT, GPT Search, Gemini, Claude, Perplexity, Copilot, Grok and
          DeepSeek — mention, rank, and cite you in the answers they generate.
        </p>
        <p>
          Traditional SEO optimizes for a ranked list of ten blue links. AEO
          optimizes for the <strong>single synthesized answer</strong> an
          assistant returns. When a buyer asks &ldquo;what&rsquo;s the best tool
          for X?&rdquo;, the brands named in that answer win the consideration —
          and everyone else is invisible.
        </p>

        <h2>Why AEO matters now</h2>
        <p>
          Hundreds of millions of people now ask AI assistants instead of
          searching. Those assistants don&rsquo;t show ten options — they give one
          opinionated answer, often with a handful of citations. If your brand
          isn&rsquo;t in the model&rsquo;s understanding of your category, you are
          simply absent from the buying conversation.
        </p>

        <h2>The eight pillars of AEO</h2>
        <p>AEO Pilot scores your site across the factors that drive AI visibility:</p>
        <ul>
          <li><strong>Technical AEO</strong> — crawlability, robots.txt, sitemaps, titles, meta.</li>
          <li><strong>Entity Strength</strong> — is your brand a well-defined entity (Organization schema, sameAs)?</li>
          <li><strong>Topical Authority</strong> — breadth and depth of content in your domain.</li>
          <li><strong>Schema Coverage</strong> — Organization, FAQ, Article and Breadcrumb JSON-LD.</li>
          <li><strong>Answerability</strong> — content structured as liftable question→answer pairs.</li>
          <li><strong>AI Readability</strong> — clean headings, semantic HTML, non-thin pages.</li>
          <li><strong>Citation Readiness</strong> — author, dates, sources that earn trust.</li>
          <li><strong>Knowledge Coverage</strong> — FAQ, guides, glossary and comparison hubs.</li>
        </ul>

        <h2>How AEO Pilot works</h2>
        <ol>
          <li>Enter your domain.</li>
          <li>AEO Pilot crawls your site and extracts on-page signals.</li>
          <li>It computes a 0–100 AEO score across the eight pillars.</li>
          <li>The AI Monitoring Agent prompts each answer engine with real buyer
            questions and measures your mention rate, rank, and citations.</li>
          <li>You get prioritized, impact-ranked fixes — or have our team implement
            them for you.</li>
        </ol>
        <p>
          The result is a measurable <strong>Share of AI Voice</strong>: how often
          you show up in the answers your buyers actually see — and a clear path to
          increase it.
        </p>
      </ArticleShell>
    </>
  );
}
