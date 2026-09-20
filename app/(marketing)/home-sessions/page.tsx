import type { Metadata } from "next";

import { SheetRenderer } from "@/components/sheet/SheetRenderer";
import { SheetShell } from "@/components/sheet/SheetShell";
import { chaptersOf } from "@/lib/sheet/composition";
import { homeSessionsSections } from "@/lib/sheet/home-sessions";
import { sliceV7Sections } from "@/lib/v7-parse";

import "@/components/landing/v7/landing.css";
import "@/components/sheet/sheet.css";
// Theme sheet LAST (ADR-058), then the corner instruments (they declare no
// theme rules, and the landing route cascades them in this order).
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";

/**
 * /home-sessions — the fourth service's own page (ADR-112 → ADR-114): the
 * mornings at the owner's table in Antwerp, plotted on a dated axis, one
 * lit; the stepped list with the next one open and its seat to reserve; the
 * morning's run and its practical readout; the table photograph; the close.
 *
 * ⚠ REVALIDATES DAILY. The lit morning is DERIVED from the date at request
 * time; a static prerender would freeze "next morning" at build.
 *
 * Public and listed: it is in the sitemap and the footer, unlike anything
 * under `/arcs`.
 */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Home sessions — Thoughtform",
  description:
    "Six to eight people at a table in Antwerp for one morning: the argument behind the practice, then the skill by hand.",
};

export default function HomeSessionsPage() {
  const slice = sliceV7Sections([]);
  const sections = homeSessionsSections(new Date());
  return (
    <SheetShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      page="home-sessions"
      chapters={chaptersOf(sections)}
    >
      <SheetRenderer sections={sections} />
    </SheetShell>
  );
}
