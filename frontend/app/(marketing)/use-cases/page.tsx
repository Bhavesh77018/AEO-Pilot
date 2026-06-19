import type { Metadata } from "next";
import { ArticleShell } from "@/components/marketing/ArticleShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "AEO Pilot use cases: who uses it and how",
  description:
    "How startups, SaaS companies, agencies, creators and enterprise brands use AEO Pilot to become discoverable, mentioned and cited inside AI answer engines.",
  alternates: { canonical: "/use-cases" },
};

export default function UseCasesPage() {
  return (
    <>
      <JsonLd
        data={[
          articleSchema({
            headline: "AEO Pilot use cases: who uses it and how",
            description: metadata.description as string,
            path: "/use-cases",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Use Cases", path: "/use-cases" },
          ]),
        ]}
      />
      <ArticleShell
        title="Use Cases"
        subtitle="Who uses AEO Pilot, and the outcome they're after."
      >
        <h2>Startups</h2>
        <p>
          Early-stage teams use AEO Pilot to make sure that when a buyer asks an AI
          &ldquo;what are the best tools for X?&rdquo;, the startup is in the
          answer. It&rsquo;s category entry without a years-long backlink grind.
        </p>

        <h2>SaaS companies</h2>
        <p>
          Product teams track their <strong>Share of AI Voice</strong> against
          competitors across ChatGPT, Gemini and Perplexity, then close the entity
          and schema gaps that keep them out of comparison answers.
        </p>

        <h2>Agencies</h2>
        <p>
          Agencies run AEO Pilot across every client from one dashboard, deliver
          white-label visibility reports, and add a new high-margin retainer line:
          managed Answer Engine Optimization.
        </p>

        <h2>Creators &amp; personal brands</h2>
        <p>
          Authors, founders and experts use AEO to become the named source an
          assistant reaches for in their niche — building authority that compounds
          as models retrain.
        </p>

        <h2>Enterprise &amp; brands</h2>
        <p>
          Larger brands defend their narrative: monitoring how AI describes them,
          catching the moment a competitor displaces them in an answer, and keeping
          their entity, facts and citations accurate at scale.
        </p>

        <h2>The common thread</h2>
        <p>
          Every one of them faces the same shift: buyers are asking AI instead of
          scrolling search results. AEO Pilot is how they measure and win the
          answer — across every engine, continuously.
        </p>
      </ArticleShell>
    </>
  );
}
