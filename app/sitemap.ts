import type { MetadataRoute } from "next";

/**
 * The sitemap lists exactly the routes meant to be found (2026-09-01):
 * the landing and the workshop variant, which is indexable by explicit
 * owner decision (ADR-053 — see the commented-out noindex in its page).
 *
 * Deliberately absent: `/arcs/*` (noindexed client decks), the admin
 * shells and `/api/*` (disallowed in robots.ts), and `/test/*`
 * (proxy-404'd in production). A sitemap that lists a disallowed or
 * noindexed URL is advertising a page it then tells crawlers to drop.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: "https://thoughtform.co/",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://thoughtform.co/claude-workshop",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
