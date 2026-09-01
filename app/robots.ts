import type { MetadataRoute } from "next";

/**
 * Crawl policy for the public launch (2026-09-01).
 *
 * - `/prototypes/` is the load-bearing entry: the raw v7 prototype HTML
 *   must live in `public/` because `lib/v7-parse` reads it at request
 *   time, and `public/` is world-fetchable — without this rule the
 *   crawlable near-duplicate of the homepage competes with the homepage.
 * - `/admin`, `/orrery`, `/astrogation` are auth-gated shells with
 *   nothing to index (the prefix also covers `/admin/callback`).
 * - `/api/` has no crawlable content.
 * - `/arcs/*` is deliberately NOT disallowed: those pages carry
 *   `robots: { index: false }` metadata, and a crawler must be able to
 *   fetch a page to see its noindex. A disallow here would hide the
 *   noindex, not the page.
 * - `/test/*` is proxy-404'd in production, so it needs no rule.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/prototypes/", "/admin", "/orrery", "/astrogation", "/api/"],
      },
    ],
    sitemap: "https://thoughtform.co/sitemap.xml",
  };
}
