import type { Metadata } from "next";
import { ArticleShell } from "@/components/marketing/ArticleShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "AEO Guides: playbooks to get cited by AI",
  description:
    "Practical, step-by-step AEO playbooks: add structured data, build an FAQ corpus, strengthen your entity graph, and earn citations from ChatGPT, Gemini, Claude and Perplexity.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <>
      <JsonLd
        data={[
          articleSchema({
            headline: "AEO Guides: playbooks to get cited by AI",
            description: metadata.description as string,
            path: "/guides",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
          ]),
        ]}
      />
      <ArticleShell
        title="AEO Guides"
        subtitle="A practical playbook for getting your brand into AI answers."
      >
        <p>
          Becoming the answer isn&rsquo;t luck — it&rsquo;s a repeatable process.
          These are the highest-leverage moves, in the order we&rsquo;d run them.
        </p>

        <h2>1. Make your brand an unambiguous entity</h2>
        <p>
          Add <strong>Organization JSON-LD</strong> to your homepage with your
          name, logo, description, and <code>sameAs</code> links to your social and
          knowledge-graph profiles. This is how a model resolves &ldquo;you&rdquo;
          to a specific entity it can attribute facts to.
        </p>

        <h2>2. Publish liftable answers</h2>
        <p>
          Structure key content as <strong>question → answer pairs</strong> and
          mark them up with <strong>FAQPage schema</strong>. FAQ blocks are the
          single most quotable format for answer engines — they can lift a clean
          pair straight into a response.
        </p>

        <h2>3. Build a knowledge hub</h2>
        <p>
          Create the pages LLMs reach for: a glossary, guides, comparisons, and
          use-cases. Breadth and depth in your domain signal topical authority and
          give engines more surfaces to cite.
        </p>

        <h2>4. Earn citation trust</h2>
        <ul>
          <li>Add author and <code>datePublished</code> metadata (Article schema).</li>
          <li>Cite primary sources and include concrete numbers.</li>
          <li>Keep pages above ~300 words — thin pages rarely get quoted.</li>
        </ul>

        <h2>5. Welcome the AI crawlers</h2>
        <p>
          Make sure your <code>robots.txt</code> allows GPTBot, ClaudeBot,
          PerplexityBot, Google-Extended and friends — and expose a
          <code> sitemap.xml</code> and an <code>llms.txt</code>. You can&rsquo;t be
          cited by a crawler you accidentally blocked.
        </p>

        <h2>6. Measure and iterate</h2>
        <p>
          Track your mention rate, rank, and Share of AI Voice across engines over
          time. AEO Pilot automates every step above — from the audit to the
          monitoring to the done-for-you fixes.
        </p>
      </ArticleShell>
    </>
  );
}
