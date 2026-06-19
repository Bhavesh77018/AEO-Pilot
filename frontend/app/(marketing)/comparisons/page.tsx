import type { Metadata } from "next";
import { ArticleShell } from "@/components/marketing/ArticleShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "AEO vs SEO: optimizing for answers, not links",
  description:
    "AEO vs SEO compared. SEO ranks you in a list of links; AEO gets you into the single answer an AI assistant gives. Here's how the two disciplines differ and overlap.",
  alternates: { canonical: "/comparisons" },
};

export default function ComparisonsPage() {
  return (
    <>
      <JsonLd
        data={[
          articleSchema({
            headline: "AEO vs SEO: optimizing for answers, not links",
            description: metadata.description as string,
            path: "/comparisons",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "AEO vs SEO", path: "/comparisons" },
          ]),
        ]}
      />
      <ArticleShell
        title="AEO vs SEO"
        subtitle="Optimizing for the answer is a different game than optimizing for the link."
      >
        <p>
          <strong>SEO (Search Engine Optimization)</strong> is the practice of
          ranking a page in a search engine&rsquo;s list of results.
          <strong> AEO (Answer Engine Optimization)</strong> is the practice of
          being named and cited inside the single answer an AI assistant
          generates. They share roots but reward different things.
        </p>

        <h2>Where they differ</h2>
        <h3>The unit of competition</h3>
        <p>
          SEO competes for a position in a ranked list — being #1 to #10. AEO
          competes to be <strong>inside the answer itself</strong>. There is no
          page two; you are either synthesized into the response or you are not.
        </p>

        <h3>What gets rewarded</h3>
        <ul>
          <li><strong>SEO</strong> rewards backlinks, keywords, page speed, and crawlability.</li>
          <li><strong>AEO</strong> rewards entity clarity, structured data, liftable
            question→answer content, and citation-worthy authority.</li>
        </ul>

        <h3>How success is measured</h3>
        <p>
          SEO success is keyword rankings and organic clicks. AEO success is
          <strong> mention rate, answer rank, citation share, and Share of AI
          Voice</strong> across engines like ChatGPT and Perplexity — which is
          exactly what AEO Pilot measures.
        </p>

        <h2>Where they overlap</h2>
        <p>
          Good SEO hygiene helps AEO: clean HTML, fast pages, sitemaps and crawl
          access all matter. But AEO goes further — it asks whether a language
          model can confidently attribute a fact to your brand and quote you.
          Schema markup, an entity graph, and FAQ corpora are AEO-first moves that
          most SEO checklists ignore.
        </p>

        <h2>Do you still need SEO?</h2>
        <p>
          Yes — but it&rsquo;s no longer enough. As buyers shift from searching to
          asking, the brands that win will be the ones optimized for both the link
          and the answer. AEO Pilot scores and improves the answer half.
        </p>
      </ArticleShell>
    </>
  );
}
