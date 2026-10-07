import type { Metadata } from "next";

import { SessionsDates } from "@/components/sessions/SessionsDates";
import { SessionsField } from "@/components/sessions/SessionsField";
import { SessionsHero } from "@/components/sessions/SessionsHero";
import { SessionsMorning } from "@/components/sessions/SessionsMorning";
import { SessionsReserve } from "@/components/sessions/SessionsReserve";
import { SessionsShell } from "@/components/sessions/SessionsShell";
import { SessionsTable } from "@/components/sessions/SessionsTable";
import { sessionsPageModel } from "@/lib/sessions/page";
import { sliceV7Sections } from "@/lib/v7-parse";

import "@/components/landing/v7/landing.css";
// The lattice's recipes (ADR-149): the frame, the wash head and the foot the
// dates housing, the tiles, the photo and the ask are drawn with.
import "@/components/lattice/lattice.css";
import "@/components/sessions/sessions.css";
// The site footer (ADR-105): the close mounts `SiteFooter`, and this is its
// sheet (ADR-127's rule for every route that mounts one).
import "@/components/landing/v7/site-footer/site-footer.css";
// Theme sheet LAST (ADR-058), then the corner instruments.
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";

/**
 * /home-sessions — the fourth service's own page (ADR-150, which retires the
 * sheet ladder ADR-114 drew here): the hero on the house key visual, the
 * morning as a dial that turns with the reader, the four mornings as tall
 * tiles in one notched instrument, the dates as ASCII numerals, the table
 * from the side and from above, the ask, the footer.
 *
 * ⚠ REVALIDATES DAILY. The lit morning is DERIVED from the date at request
 * time; a static prerender would freeze "next morning" at build.
 *
 * Public and listed: it is in the sitemap and the footer.
 */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Home sessions — Thoughtform",
  description:
    "Six to eight people at a table in Antwerp for one morning: the argument behind the practice, then the skill by hand.",
};

export default function HomeSessionsPage() {
  const slice = sliceV7Sections([]);
  const model = sessionsPageModel(new Date());
  return (
    <SessionsShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} chapters={model.chapters}>
      <SessionsHero hero={model.hero} />
      <SessionsMorning morning={model.morning} />
      <SessionsDates dates={model.dates} />
      <SessionsField field={model.field} />
      <SessionsTable table={model.table} />
      <SessionsReserve reserve={model.reserve} />
    </SessionsShell>
  );
}
