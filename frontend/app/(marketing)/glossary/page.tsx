import type { Metadata } from "next";
import { ArticleShell } from "@/components/marketing/ArticleShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, definedTermSetSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "AEO Glossary: the vocabulary of Answer Engine Optimization",
  description:
    "Definitions of the key Answer Engine Optimization terms — AEO, GEO, answer engine, entity, Share of AI Voice, citation rate, llms.txt and more.",
  alternates: { canonical: "/glossary" },
};

const TERMS = [
  { term: "Answer Engine Optimization (AEO)", definition: "Optimizing a brand and its content so AI answer engines mention, rank, and cite it in generated answers." },
  { term: "Generative Engine Optimization (GEO)", definition: "A near-synonym for AEO, emphasizing optimization for generative AI search experiences." },
  { term: "Answer engine", definition: "An AI system that returns a single synthesized answer instead of a list of links — e.g. ChatGPT, Gemini, Claude, Perplexity." },
  { term: "Entity", definition: "A distinct thing (company, product, person) that a knowledge graph or language model can recognize and attribute facts to." },
  { term: "Share of AI Voice", definition: "The share of relevant AI answers in which your brand is mentioned, versus competitors." },
  { term: "Mention rate", definition: "The percentage of tracked prompts where an engine names your brand in its answer." },
  { term: "Citation rate", definition: "The percentage of answers that link to or explicitly source your domain." },
  { term: "Liftable content", definition: "Content structured (e.g. as FAQ pairs) so a model can quote it directly into an answer." },
  { term: "Structured data (JSON-LD)", definition: "Machine-readable schema markup (Organization, FAQPage, Article) that helps engines understand and trust your content." },
  { term: "llms.txt", definition: "An emerging plain-text file that tells AI crawlers what a site is about and which pages matter most." },
  { term: "Knowledge hub", definition: "A cluster of FAQ, guide, glossary and comparison pages that signals topical authority and gives engines surfaces to cite." },
];

export default function GlossaryPage() {
  return (
    <>
      <JsonLd
        data={[
          definedTermSetSchema("AEO Glossary", TERMS),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Glossary", path: "/glossary" },
          ]),
        ]}
      />
      <ArticleShell
        title="AEO Glossary"
        subtitle="The vocabulary of Answer Engine Optimization, defined."
      >
        <p>
          A shared language for the era of AI search. Each term below is also
          published as structured <code>DefinedTerm</code> data so answer engines
          can lift the definitions directly.
        </p>
        <dl className="mt-6 space-y-5">
          {TERMS.map((t) => (
            <div key={t.term} className="border-l-2 border-brand-500/40 pl-4">
              <dt className="font-semibold text-white">{t.term}</dt>
              <dd className="mt-1 text-white/60">{t.definition}</dd>
            </div>
          ))}
        </dl>
      </ArticleShell>
    </>
  );
}
