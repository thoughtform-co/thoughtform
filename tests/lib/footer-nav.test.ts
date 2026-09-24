/**
 * The footer's link grid is walkable data, and this is why (ADR-105 U2).
 *
 * The grid's destinations are the one thing on this surface that can be wrong
 * without looking wrong: a dead anchor renders as a perfectly good link, and a
 * link to `/arcs` renders as a perfectly good link while publishing three live
 * client proposals. Both are caught here and nowhere else.
 */
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getV7Content } from "@/lib/v7-parse";
import { FOOTER_COLUMNS, footerColumns } from "@/lib/site/footer-nav";
import { SOCIALS } from "@/lib/site/socials";

/* Duplicated from app/(marketing)/page.tsx, exactly as
   `tests/lib/rail-manifest.test.ts` duplicates it and for the same reason —
   importing the server component drags Next's server context into vitest. If
   the production options change there, this copy changes with them. */
const PRODUCTION_PARSE_OPTIONS = {
  removeStations: [
    "definition",
    "missing-layer",
    "intelligence-layer",
    "approach",
    "buildQuote",
    "build",
    "tools",
  ],
} as const;

const sitemapPaths = new Set(
  sitemap().map((e) => new URL(e.url).pathname.replace(/\/$/, "") || "/")
);

describe("the footer's link grid (ADR-105 U2)", () => {
  const published = footerColumns();
  const allRows = FOOTER_COLUMNS.flatMap((c) => c.links);

  it("never ships a placeholder href", () => {
    for (const link of allRows) {
      expect(link.href, `${link.label}`).not.toBe("#");
      expect(link.href, `${link.label}`).not.toBe("");
      expect(link.href, `${link.label}`).not.toBe("#/");
      if (link.href !== null) expect(link.href.trim()).toBe(link.href);
    }
  });

  it("opens a new tab only for cross-origin https — never a mailto, which leaves a blank tab", () => {
    for (const link of allRows) {
      // An unpublished social row keeps its flag with a null href; it renders nothing.
      if (link.external && link.href !== null)
        expect(link.href, `${link.label}`).toMatch(/^https:\/\//);
      if (link.href?.startsWith("mailto:")) expect(link.external, `${link.label}`).toBeFalsy();
    }
  });

  it("every href is an anchor, an internal path, a mailto, or absolute https", () => {
    for (const link of published.flatMap((c) => c.links)) {
      expect(
        /^#[a-z0-9-]+$/i.test(link.href) ||
          /^\/[a-z0-9\-/]*$/i.test(link.href) ||
          link.href.startsWith("mailto:") ||
          link.href.startsWith("https://"),
        `${link.label} -> ${link.href}`
      ).toBe(true);
    }
  });

  it("every anchor resolves against the parsed production DOM", () => {
    const { bodyHtml } = getV7Content(PRODUCTION_PARSE_OPTIONS);
    const ids = new Set(Array.from(bodyHtml.matchAll(/\bid="([^"]+)"/g)).map((m) => m[1]));
    for (const link of published.flatMap((c) => c.links)) {
      if (!link.href.startsWith("#")) continue;
      expect(ids.has(link.href.slice(1)), `${link.label} -> ${link.href}`).toBe(true);
    }
  });

  /* ⚠ THE ASSERTION THAT MAKES AN /arcs LINK UNMERGEABLE. `/arcs/*` is
     noindexed client material — robots.ts leaves it crawlable only so the
     per-page noindex is visible, and the sitemap names it deliberately absent.
     Three live client proposals sit behind those slugs. */
  it("every internal path is a route the sitemap publishes", () => {
    for (const link of published.flatMap((c) => c.links)) {
      if (!link.href.startsWith("/")) continue;
      expect(
        sitemapPaths.has(link.href.replace(/\/$/, "") || "/"),
        `${link.href} is not in app/sitemap.ts — if it is noindexed client ` +
          `material (every /arcs route is), it may not be linked from the footer`
      ).toBe(true);
    }
  });

  it("drops unpublished rows, and drops a column left empty", () => {
    for (const col of published) {
      expect(col.links.length, col.heading).toBeGreaterThan(0);
      for (const link of col.links) expect(typeof link.href).toBe("string");
    }
    // Legal is authored with both rows null, so it must not render at all.
    expect(published.some((c) => c.heading === "Legal")).toBe(false);
  });

  it("reads the socials record rather than keeping a third copy", () => {
    const connect = FOOTER_COLUMNS.find((c) => c.heading === "Connect");
    for (const icon of ["linkedin", "x"] as const) {
      const row = connect?.links.find((l) => l.social === icon);
      const source = SOCIALS.find((s) => s.icon === icon);
      expect(row?.href ?? null, icon).toBe(source?.href ?? null);
    }
  });

  it("no heading is repeated and none is empty", () => {
    const heads = FOOTER_COLUMNS.map((c) => c.heading);
    expect(new Set(heads).size).toBe(heads.length);
    for (const h of heads) expect(h.trim().length).toBeGreaterThan(0);
  });
});
