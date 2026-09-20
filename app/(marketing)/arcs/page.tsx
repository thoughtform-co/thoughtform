import type { Metadata } from "next";

import { SheetRenderer } from "@/components/sheet/SheetRenderer";
import { SheetShell } from "@/components/sheet/SheetShell";
import { arcsSheetSections } from "@/lib/sheet/arcs";
import { chaptersOf } from "@/lib/sheet/composition";
import { sliceV7Sections } from "@/lib/v7-parse";

import "@/components/landing/v7/landing.css";
import "@/components/sheet/sheet.css";
// Theme sheet LAST (ADR-058), then the corner instruments.
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";

/**
 * /arcs — the client-arc overview, on the sheet (ADR-114, superseding
 * ADR-098's band-and-grid). A split head with the kind filter, one CLIENT
 * CONSOLE per client (a sticky terminal panel with a registry-derived
 * readout beside the client's flashcards), a two-by-two of the house
 * formats, the close.
 *
 * Unlisted: reachable by link, never indexed (ADR-052) — every route under
 * `/arcs` is client material and stays out of the sitemap and the footer.
 */
export const metadata: Metadata = {
  title: "Arcs — Thoughtform",
  description:
    "Client arcs — the briefing as a place: each engagement's context, proof, and practice on one page.",
  robots: { index: false, follow: false },
};

export default function ArcsPage() {
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
