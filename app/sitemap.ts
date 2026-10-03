import type { MetadataRoute } from "next";

import { publishedPosts } from "@/lib/musings/registry";

/**
 * The sitemap lists exactly the routes meant to be found (2026-09-01):
 * the landing and the sheet pages. The workshop variant was listed until
 * ADR-142 moved it under `/arcs/thoughtform/` (owner, 2026-10-03), where it
 * is noindexed like every arc.
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
    /* The sheet pages (ADR-114): public and listed, unlike anything under
       `/arcs`. A musing joins when it is published (`draft: false`). */
    {
      url: "https://thoughtform.co/home-sessions",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://thoughtform.co/musings",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...publishedPosts().map((post) => ({
      url: `https://thoughtform.co/musings/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
