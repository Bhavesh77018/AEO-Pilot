/** JSON-LD builders — the structured data AI answer engines read to resolve
 *  our brand as an entity and lift answers. This is AEO Pilot eating its own
 *  dog food: the exact schema we tell customers to add. */
import { PLANS } from "./pricing";
import { FAQ } from "./pricing";
import { SITE, SITE_URL } from "./site";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: SITE.logo,
    description: SITE.description,
    email: SITE.email,
    sameAs: SITE.sameAs,
    slogan: SITE.tagline,
    foundingDate: "2026",
    knowsAbout: [
      "Search Engine Optimization",
      "Answer Engine Optimization",
      "Generative Engine Optimization",
      "AI Search visibility",
      "LLM citations",
      "Structured data",
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/learn?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** SoftwareApplication with Offers built from the real pricing tiers. */
export function softwareApplicationSchema() {
  const offers = PLANS.filter((p) => p.monthly !== null).map((p) => ({
    "@type": "Offer",
    name: p.name,
    price: String(p.monthly),
    priceCurrency: "INR",
    description: p.tagline,
    category: p.monthly === 0 ? "Free" : "Subscription",
  }));

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE.description,
    url: SITE.url,
    publisher: { "@id": `${SITE_URL}/#organization` },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "0",
      highPrice: "15999",
      offerCount: String(offers.length),
      offers,
    },
    featureList: [
      "8-category AEO score",
      "Live AI visibility monitoring across 8 answer engines",
      "Entity graph & JSON-LD generation",
      "FAQ & knowledge-hub generation",
      "Competitor intelligence",
      "Share of AI Voice tracking",
    ],
  };
}

export function faqSchema(items: { q: string; a: string }[] = FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  };
}

export function articleSchema(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    datePublished: opts.datePublished || "2026-06-17",
    dateModified: "2026-06-17",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${opts.path}` },
    about: "Answer Engine Optimization",
  };
}

export function definedTermSetSchema(
  name: string,
  terms: { term: string; definition: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name,
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.definition,
      inDefinedTermSet: `${SITE_URL}/glossary`,
    })),
  };
}
