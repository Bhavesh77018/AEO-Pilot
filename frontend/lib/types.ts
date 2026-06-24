export interface Project {
  id: string;
  name: string;
  domain: string;
  created_at: string;
  latest_scan_id: string | null;
  latest_score: number | null;
}

export interface Recommendation {
  id: string;
  category: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  impact: number;
  source: "heuristic" | "llm";
}

export type Pillar = "seo" | "aeo" | "geo";

export interface CategoryScore {
  score: number;
  label: string;
  summary: string;
  weight: number;
  pillar?: Pillar;
}

export interface PillarScore {
  label: string;
  tagline: string;
  score: number;
  weight: number;
}

export interface Page {
  url: string;
  status_code: number | null;
  title: string | null;
  word_count: number;
  h1_count: number;
  schema_types: string[] | null;
  has_faq: boolean;
}

export interface ScanSummary {
  id: string;
  project_id: string;
  status: "pending" | "running" | "completed" | "failed";
  overall_score: number | null;
  pages_crawled: number;
  visibility: Record<string, number> | null;
  created_at: string;
  completed_at: string | null;
}

export interface ServicePackage {
  tier: string;
  name: string;
  badge: string;
  summary: string;
  guarantee: string;
  price_one_time: number;
  price_monthly: number;
  currency: string;
  timeline_weeks: number;
  current_score: number;
  projected_score: number;
  est_lift: number;
  deliverables: string[];
}

export interface ServiceTier {
  key: string;
  name: string;
  badge: string;
  price_one_time: number;
  price_monthly: number;
  timeline_weeks: number;
  summary: string;
}

export interface AlaCarteItem {
  title: string;
  category: string;
  severity: "high" | "medium" | "low";
  price: number;
  currency: string;
  eta_days: number;
}

export interface ServiceOffer {
  headline: string;
  subhead: string;
  risk: string;
  recommended_package: ServicePackage;
  all_packages: ServiceTier[];
  a_la_carte: AlaCarteItem[];
  cta: string;
  cta_secondary: string;
  disclaimer: string;
}

export interface ScanDetail extends ScanSummary {
  category_scores: Record<string, CategoryScore> | null;
  signals: Record<string, unknown> | null;
  error: string | null;
  recommendations: Recommendation[];
  pages: Page[];
  service_offer: ServiceOffer | null;
}
