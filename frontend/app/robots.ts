import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt — deliberately WELCOMES AI answer-engine crawlers. Many sites
 * accidentally block GPTBot/ClaudeBot/etc. and then wonder why AI never cites
 * them. AEO Pilot does the opposite (and practices what it preaches).
 */
export default function robots(): MetadataRoute.Robots {
  const aiBots = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Googlebot",
    "Bingbot",
    "Applebot-Extended",
    "CCBot",
    "Bytespider",
    "Amazonbot",
    "cohere-ai",
    "DuckAssistBot",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/app", "/login", "/auth/"] },
      // Explicitly allow each AI crawler to reach the public marketing + hub.
      ...aiBots.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/app", "/auth/"],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
