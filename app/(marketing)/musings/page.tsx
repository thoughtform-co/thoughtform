import type { Metadata } from "next";

import { SheetRenderer } from "@/components/sheet/SheetRenderer";
import { SheetShell } from "@/components/sheet/SheetShell";
import { featuredPosts, listedPosts } from "@/lib/musings/registry";
import { chaptersOf } from "@/lib/sheet/composition";
import { musingsIndexSections } from "@/lib/sheet/musings";
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
 * /musings — the blog index on the sheet (ADR-114): a split head, two
 * features framed on a dashed divider, every post as a ruled table under a
 * tag station row, the close. Drafts are listed in development and hidden
 * in production; the index itself is public and listed.
 */
export const metadata: Metadata = {
  title: "Musings — Thoughtform",
  description:
    "Notes from the practice: how a team navigates intelligence, what it encodes, what it builds and keeps.",
};

export default function MusingsPage() {
  const slice = sliceV7Sections([]);
  const posts = listedPosts();
  const sections = musingsIndexSections(posts, featuredPosts(posts));
  return (
    <SheetShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      page="musings"
      chapters={chaptersOf(sections)}
    >
      <SheetRenderer sections={sections} />
    </SheetShell>
  );
}
