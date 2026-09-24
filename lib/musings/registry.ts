import "server-only";

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";

import type { MusingPost } from "./types";

/**
 * lib/musings/registry — the posts, read off `content/musings/` (ADR-114).
 *
 * ⚠ SERVER ONLY, AND NO REACT. It reads the folder with `fs` and parses the
 * frontmatter with gray-matter; the MDX body is compiled one module over
 * (`mdx.tsx`), so `tests/lib/musings-registry.test.ts` can import THIS
 * module alone and walk every post without a renderer.
 *
 * ⚠ gray-matter hands a YAML date back as a `Date` object, not a string —
 * normalise it or the sort and the `^\d{4}-` guard both miss.
 *
 * ⚠ THE FOLDER IS OPAQUE TO NEXT'S TRACER (it follows imports, and this is
 * opened by path at request time): `next.config.mjs` lists it under
 * `outputFileTracingIncludes` for the two routes and the sitemap, or the
 * pages work in dev and 500 on Vercel.
 */

const DIR = join(process.cwd(), "content", "musings");

const REQUIRED = ["title", "date", "summary", "tags", "author"] as const;

function assertFrontmatter(path: string, data: Record<string, unknown>) {
  for (const key of REQUIRED)
    if (data[key] === undefined || data[key] === null || data[key] === "")
      throw new Error(`musings: ${path} is missing frontmatter "${key}"`);
  if (!Array.isArray(data.tags)) throw new Error(`musings: ${path} "tags" must be a list`);
}

function isoDate(value: unknown, path: string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  throw new Error(`musings: ${path} "date" must be YYYY-MM-DD`);
}

function readPost(file: string): MusingPost {
  const path = join(DIR, file);
  const parsed = matter(readFileSync(path, "utf8"));
  const data = parsed.data as Record<string, unknown>;
  assertFrontmatter(path, data);
  const body = parsed.content.trim();
  const words = body.split(/\s+/).filter(Boolean).length;
  const figure = data.figure as MusingPost["figure"] | undefined;
  return {
    slug: file.replace(/\.mdx$/, ""),
    title: String(data.title),
    date: isoDate(data.date, path),
    summary: String(data.summary),
    tags: (data.tags as unknown[]).map(String),
    author: String(data.author),
    draft: data.draft === true,
    featured: data.featured === true,
    related: Array.isArray(data.related) ? (data.related as unknown[]).map(String) : [],
    figure: figure && typeof figure === "object" ? figure : undefined,
    readingMinutes: Math.max(1, Math.round(words / 220)),
    body,
  };
}

/**
 * ⚠ MEMOISED ON THE FOLDER'S OWN STAMP (the `lib/v7-parse/parseBody.ts`
 * shape). One post page render asked for the folder three or four times —
 * `generateStaticParams` → `postSlugs`, `generateMetadata` → `getPost`, the
 * page → `getPost` and `relatedTo(post, allPosts())` — each a full
 * `readdirSync` plus a gray-matter parse per file: ~80 parses per slug at five
 * posts, and under `next dev` on every request. The stamp is every file's name
 * and `mtimeMs`, so an `.mdx` edit still shows on the next request; a plain
 * memo would freeze it. The array is FROZEN: every caller slices or filters,
 * none may mutate the shared record.
 */
let cache: { stamp: string; posts: readonly MusingPost[] } | null = null;

function folderStamp(files: readonly string[]): string {
  return files.map((f) => `${f}:${statSync(join(DIR, f)).mtimeMs}`).join("|");
}

/** Every post, newest first. Drafts included. */
export function allPosts(): MusingPost[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR)
      .filter((f) => f.endsWith(".mdx"))
      .sort();
  } catch {
    return [];
  }
  const stamp = folderStamp(files);
  if (cache && cache.stamp === stamp) return cache.posts as MusingPost[];
  const posts = Object.freeze(
    files.map(readPost).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  );
  cache = { stamp, posts };
  return posts as MusingPost[];
}

/** The posts the world may see: drafts excluded. */
export function publishedPosts(): MusingPost[] {
  return allPosts().filter((p) => !p.draft);
}

/** What the index lists: everything in development, published in production. */
export function listedPosts(): MusingPost[] {
  return process.env.NODE_ENV === "production" ? publishedPosts() : allPosts();
}

export function postSlugs(): string[] {
  return allPosts().map((p) => p.slug);
}

export function getPost(slug: string): MusingPost | undefined {
  return allPosts().find((p) => p.slug === slug);
}

/** The two features: `featured` posts first, then the newest, up to two. */
export function featuredPosts(posts: readonly MusingPost[]): MusingPost[] {
  const flagged = posts.filter((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);
  return [...flagged, ...rest].slice(0, 2);
}

/** A post's related posts, resolved; the two newest others when none are named. */
export function relatedTo(post: MusingPost, posts: readonly MusingPost[]): MusingPost[] {
  const named = post.related
    .map((slug) => posts.find((p) => p.slug === slug))
    .filter((p): p is MusingPost => Boolean(p));
  if (named.length > 0) return named.slice(0, 2);
  return posts.filter((p) => p.slug !== post.slug).slice(0, 2);
}
