import { SheetRenderer } from "@/components/sheet/SheetRenderer";
import { SheetShell } from "@/components/sheet/SheetShell";
import { chaptersOf } from "@/lib/sheet/composition";
import { sliceV7Sections } from "@/lib/v7-parse";

import { KitFakeFills } from "./KitFakeFills";
import { kitSections } from "./fixtures";
import type { KitFake } from "./fixtures";

import "@/components/landing/v7/landing.css";
import "@/components/sheet/sheet.css";
import "@/components/sheet/instrument.css";
// Theme sheet LAST (ADR-058), then the corner instruments.
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";

const FAKES: readonly KitFake[] = ["even", "fills"];

/** The instrument on fixtures — a SERVER route, because the HUD slice reads
 *  the prototype off disk. */
export default async function ArcsInstrumentKitRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).fake;
  const fake = FAKES.find((f) => f === raw);
  const slice = sliceV7Sections([]);
  const sections = kitSections(fake);
  return (
    <SheetShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      page="arcs-instrument-kit"
      profile="instrument"
      chapters={chaptersOf(sections)}
    >
      <SheetRenderer sections={sections} />
      {fake === "fills" ? <KitFakeFills /> : null}
    </SheetShell>
  );
}
