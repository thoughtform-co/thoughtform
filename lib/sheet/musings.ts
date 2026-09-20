/**
 * lib/sheet/musings — the blog index and a post, as sheet ladders (ADR-114).
 *
 * Index: split · figure (two features on a dashed divider) · table (every
 * post under a tag station row) · close. Post: split (the title and the
 * summary) · prose (the sticky metadata column beside the body) · figure
 * (two related) · close.
 *
 * Pure over `MusingPost` records — the fs read stays in the registry.
 */

import type { MusingPost } from "@/lib/musings/types";

import { letterDate, letterDateShort } from "./dates";
import type { SheetFigureDef, SheetSection } from "./types";

function figureOf(post: MusingPost, seed: number): SheetFigureDef {
  return post.figure
    ? { kind: "image", ...post.figure, caption: post.title, treatment: "duotone" }
    : { kind: "mark", caption: post.title, seed };
}

export function allTags(posts: readonly MusingPost[]): string[] {
  return Array.from(new Set(posts.flatMap((p) => p.tags))).sort();
}

export function musingsIndexSections(
  posts: readonly MusingPost[],
  featured: readonly MusingPost[]
): SheetSection[] {
  return [
    {
      kind: "split",
      id: "musings",
      name: "Musings",
      title: { pre: "Notes from", em: "the practice." },
      paragraphs: [
        "What the work teaches, written down as it happens: how a team navigates intelligence, what it encodes, what it builds and keeps.",
        "Short, dated, and in the order they were written.",
      ],
    },
    {
      kind: "figure",
      id: "featured",
      kicker: "Featured",
      menuLabel: "Featured",
      menuPrimary: true,
      items: featured.map((p, i) => ({
        id: p.slug,
        figure: figureOf(p, i + 1),
        kicker: letterDate(p.date),
        title: p.title,
        lede: p.summary,
        href: `/musings/${p.slug}`,
      })),
    },
    {
      kind: "table",
      id: "all-posts",
      kicker: "Every post",
      menuLabel: "All posts",
      menuPrimary: true,
      columns: ["Date", "Title", "Summary", "Tags"],
      rows: posts.map((p) => ({
        id: p.slug,
        cells: [letterDateShort(p.date), p.title, p.summary, p.tags.join(" · ")],
        href: `/musings/${p.slug}`,
        tags: p.tags,
        ...(p.draft ? { draft: true as const } : {}),
      })),
      stations: {
        attr: "tag",
        label: "Filter the posts by tag",
        stations: allTags(posts).map((t) => ({ id: t, name: t })),
      },
    },
    { kind: "close", id: "contact", menuLabel: "Contact" },
  ];
}

export function musingPostSections(
  post: MusingPost,
  related: readonly MusingPost[]
): SheetSection[] {
  const sections: SheetSection[] = [
    {
      kind: "split",
      id: post.slug + "-head",
      name: "Musing",
      title: { pre: post.title },
      paragraphs: [post.summary],
    },
    {
      kind: "prose",
      id: "article",
      kicker: "The piece",
      menuLabel: "Article",
      menuPrimary: true,
      meta: [
        { label: "Date", value: letterDate(post.date) },
        { label: "Author", value: post.author },
        { label: "Reading", value: `${post.readingMinutes} min` },
        { label: "Tags", value: post.tags.join(" · ") },
      ],
    },
  ];
  if (related.length > 0)
    sections.push({
      kind: "figure",
      id: "related",
      kicker: "Related",
      menuLabel: "Related",
      menuPrimary: true,
      items: related.map((p, i) => ({
        id: p.slug,
        figure: figureOf(p, i + 3),
        kicker: letterDate(p.date),
        title: p.title,
        lede: p.summary,
        href: `/musings/${p.slug}`,
      })),
    });
  sections.push({ kind: "close", id: "contact", menuLabel: "Contact" });
  return sections;
}
