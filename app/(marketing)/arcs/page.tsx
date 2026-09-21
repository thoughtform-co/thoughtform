import type { Metadata } from "next";

import { SheetRenderer } from "@/components/sheet/SheetRenderer";
import { SheetShell } from "@/components/sheet/SheetShell";
import { assertOwner, ownerGate } from "@/lib/auth/ownerGate";
import { arcsSheetSections } from "@/lib/sheet/arcs";
import { chaptersOf } from "@/lib/sheet/composition";
import { sliceV7Sections } from "@/lib/v7-parse";

import "@/components/landing/v7/landing.css";
import "@/components/sheet/sheet.css";
// Theme sheet LAST (ADR-058), then the corner instruments.
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";

/**
 * /arcs — the client-arc overview. THE OWNER'S PAGE (ADR-117).
 *
 * ⚠ DYNAMIC, AND GATED HERE, IN THE PAGE. A prerendered overview leaves
 * `arcs.html`, `arcs.rsc` and `arcs.segments/*` on the server with every
 * client's name in them, reachable under URL shapes a path check does not
 * see. So nothing is prerendered, and the first thing the page does is ask
 * for the owner's pass — a stranger gets the site's ordinary 404, and the
 * metadata below tells them nothing either. The client pages and the arcs
 * themselves (`[slug]`) stay public-by-link and untouched.
 *
 * Unlisted as ever: out of the sitemap and the footer, noindex.
 */
export const dynamic = "force-dynamic";

const ROBOTS = { index: false, follow: false } as const;

export async function generateMetadata(): Promise<Metadata> {
  // A denied request gets the root's title, exactly like any other 404.
  if ((await ownerGate()) === "deny") return { robots: ROBOTS };
  return {
    title: "Arcs — Thoughtform",
    description:
      "Client arcs — the briefing as a place: each engagement's context, proof, and practice on one page.",
    robots: ROBOTS,
  };
}

export default async function ArcsPage() {
  await assertOwner();
  const slice = sliceV7Sections([]);
  const sections = arcsSheetSections();
  return (
    <SheetShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      page="arcs"
      chapters={chaptersOf(sections)}
    >
      <SheetRenderer sections={sections} />
    </SheetShell>
  );
}
