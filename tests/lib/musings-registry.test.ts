import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PROPOSAL_COPY_BANS } from "@/lib/arcs/copyLaw";
import { MUSINGS_COPY_BANS } from "@/lib/musings/copyLaw";
import {
  allPosts,
  featuredPosts,
  getPost,
  postSlugs,
  publishedPosts,
  relatedTo,
} from "@/lib/musings/registry";
import { compositionViolations } from "@/lib/sheet/composition";
import { musingPostSections, musingsIndexSections } from "@/lib/sheet/musings";

/**
 * The musings (ADR-114): every post is a file, and the file is the record.
 * Frontmatter is complete, slugs are the route, dates sort, drafts are
 * marked, related posts resolve, and the copy law a client-facing page
 * holds is held here too — plus the two ways a draft leaks a placeholder.
 */

const ROOT = join(__dirname, "..", "..");

describe("musings registry (ADR-114)", () => {
  const posts = allPosts();

  it("reads at least one post, newest first, with complete frontmatter", () => {
    expect(posts.length).toBeGreaterThan(0);
    for (let i = 1; i < posts.length; i++) expect(posts[i - 1].date >= posts[i].date).toBe(true);
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(postSlugs()).toEqual(slugs);
    for (const p of posts) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.summary.length).toBeGreaterThan(20);
      expect(p.summary.length).toBeLessThanOrEqual(220);
      expect(p.tags.length).toBeGreaterThan(0);
      for (const t of p.tags) expect(t).toMatch(/^[a-z][a-z-]*$/);
      expect(p.author.length).toBeGreaterThan(0);
      expect(p.readingMinutes).toBeGreaterThanOrEqual(1);
      expect(p.body.length).toBeGreaterThan(200);
      for (const r of p.related) {
        expect(r).not.toBe(p.slug);
        expect(getPost(r), `${p.slug}: related ${r}`).toBeDefined();
      }
      expect(getPost(p.slug)?.slug).toBe(p.slug);
    }
  });

  it("holds the copy law on the title, the summary and the body", () => {
    for (const p of posts) {
      for (const field of ["title", "summary", "body"] as const) {
        for (const [re, why] of [...PROPOSAL_COPY_BANS, ...MUSINGS_COPY_BANS])
          expect(p[field], `${p.slug}.${field}: ${why}`).not.toMatch(re);
      }
      /* A picture goes through <Figure>, which frames it; a raw image tag
         is a picture on the page with no FIG bar and no caption. */
      expect(p.body).not.toMatch(/<img\b/i);
      expect(p.body).not.toMatch(/!\[/);
    }
  });

  it("publishes no draft, and features at most two with the flagged ones first", () => {
    for (const p of publishedPosts()) expect(p.draft).toBe(false);
    const featured = featuredPosts(posts);
    expect(featured.length).toBeLessThanOrEqual(2);
    const flagged = posts.filter((p) => p.featured);
    for (let i = 0; i < Math.min(2, flagged.length); i++) expect(featured[i].featured).toBe(true);
    for (const p of posts) {
      const related = relatedTo(p, posts);
      expect(related.length).toBeLessThanOrEqual(2);
      expect(related.some((r) => r.slug === p.slug)).toBe(false);
    }
  });

  it("the index and every post are lawful ladders", () => {
    expect(compositionViolations(musingsIndexSections(posts, featuredPosts(posts)))).toEqual([]);
    for (const p of posts)
      expect(compositionViolations(musingPostSections(p, relatedTo(p, posts))), p.slug).toEqual([]);
  });

  it("the folder is traced for the two routes and the sitemap", () => {
    /* The posts are read by PATH at request time, which Next's tracer does
       not follow; without these three entries the pages work in dev and
       500 on Vercel (the design-MCP precedent). */
    const config = readFileSync(join(ROOT, "next.config.mjs"), "utf8");
    for (const route of ["/musings", "/musings/[slug]", "/sitemap.xml"])
      expect(config, route).toMatch(
        new RegExp(`"${route.replace(/[[\]]/g, "\\$&")}":\\s*\\["./content/musings/\\*\\*"\\]`)
      );
  });
});
