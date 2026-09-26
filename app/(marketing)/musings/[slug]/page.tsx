import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SheetRenderer } from "@/components/sheet/SheetRenderer";
import { SheetShell } from "@/components/sheet/SheetShell";
import { renderPostBody } from "@/lib/musings/mdx";
import { allPosts, getPost, postSlugs, relatedTo } from "@/lib/musings/registry";
import { chaptersOf } from "@/lib/sheet/composition";
import { musingPostSections } from "@/lib/sheet/musings";
import { sliceV7Sections } from "@/lib/v7-parse";

import "@/components/landing/v7/landing.css";
import "@/components/sheet/sheet.css";
// The site footer (ADR-105): the close mounts `SiteFooter`, and this is its
// sheet. Every route that mounts a close loads it (ADR-127 - until then no
// sheet route did, and the footer rendered unstyled). BEFORE theme.css like
// every route sheet.
import "@/components/landing/v7/site-footer/site-footer.css";
// Theme sheet LAST (ADR-058), then the corner instruments.
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";

/**
 * /musings/[slug] — one post on the sheet (ADR-114): a split head with the
 * title and the summary, the sticky metadata column beside the compiled
 * body, two related posts framed, the close. Statically generated over the
 * folder; a draft is reachable by URL and noindexed.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return postSlugs().map((slug) => ({ slug }));
}

interface PostRouteParams {
  /* Next 16: route params arrive as a Promise. */
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostRouteParams): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { robots: { index: false, follow: false } };
  return {
    title: `${post.title} — Thoughtform`,
    description: post.summary,
    ...(post.draft ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function MusingPostPage({ params }: PostRouteParams) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const slice = sliceV7Sections([]);
  const sections = musingPostSections(post, relatedTo(post, allPosts()));
  const body = await renderPostBody(post);
  return (
    <SheetShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      page={`musings-${post.slug}`}
      chapters={chaptersOf(sections)}
    >
      <SheetRenderer sections={sections} slots={{ article: body }} />
    </SheetShell>
  );
}
