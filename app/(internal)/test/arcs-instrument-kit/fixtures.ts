import type { ClientDef } from "@/lib/arcs/clients";
import { instrumentSections } from "@/lib/sheet/arcs";
import type { Engagement } from "@/lib/sheet/arcs";
import type { SheetSection } from "@/lib/sheet/types";

/**
 * The instrument kit's fixtures (ADR-118) — the eval's type `AK`.
 *
 * The real record holds one engagement per client, no two on one day and
 * nothing in progress, so the three states the instrument has to draw and
 * the page never shows are drawn HERE first: a client with three engagements
 * (one of them still running, which runs a dotted tail to NOW), two
 * engagements filed on the same day on the same lane, a client whose
 * relationship began before the window (it enters from the left edge), and a
 * client-bound keynote the filter can hide from under a chosen row.
 *
 * ⚠ FIXTURES ARE LABELLED AS FIXTURES: invented clients, hrefs back into
 * this page, no price, no claim. `NOW` is PINNED so a still of
 * the kit is the same still on every day it is shot.
 */
export const KIT_NOW = "2026-09-21";

const client = (slug: string, name: string, since: string): ClientDef => ({
  slug,
  name,
  lede: `${name} is a fixture client.`,
  since,
});

const NORTHWIND = client("northwind", "Northwind", "2024");
const HALCYON = client("halcyon", "Halcyon", "2026");
const MERIDIAN = client("meridian", "Meridian", "2026");
export const KIT_CLIENTS: readonly ClientDef[] = [NORTHWIND, HALCYON, MERIDIAN];

const IMAGES = {
  embedded: { src: "/images/services/embedded.webp", alt: "" },
  workshop: { src: "/images/services/workshop.webp", alt: "" },
  keynote: { src: "/images/services/keynote.webp", alt: "" },
};

function fixture(
  over: Partial<Engagement> & Pick<Engagement, "id" | "cardTitle" | "date" | "standing">
): Engagement {
  const href = `/test/arcs-instrument-kit#${over.id}`;
  return {
    lane: over.client ? over.client.slug : `formats-${over.kind ?? "workshop"}`,
    client: null,
    isArc: true,
    chip: "proposal",
    lede: "A fixture engagement: the instrument's grammar on a record the real one does not hold yet.",
    image: IMAGES.embedded,
    kind: "production",
    href,
    sections: 12,
    chapters: [
      { id: "one", label: "The brief", href: `${href}-one` },
      { id: "two", label: "The work", href: `${href}-two` },
      { id: "three", label: "The setup", href: `${href}-three` },
    ],
    lightOnly: false,
    ...over,
  };
}

/** Every fixture engagement, in LOG order (each client's, then the house's). */
export function kitEngagements(): Engagement[] {
  return [
    fixture({
      id: "northwind-proposal",
      client: NORTHWIND,
      cardTitle: "Northwind · the proposal",
      date: "2026-09-15",
      standing: "proposed",
      lightOnly: true,
    }),
    fixture({
      id: "northwind-studio",
      client: NORTHWIND,
      cardTitle: "Northwind · the studio",
      chip: "portfolio",
      date: "2026-08-17",
      standing: "running",
      sections: 20,
    }),
    fixture({
      id: "northwind-portfolio",
      client: NORTHWIND,
      cardTitle: "Northwind · the portfolio",
      chip: "portfolio",
      date: "2026-07-29",
      standing: "shipped",
      sections: 9,
    }),
    fixture({
      id: "halcyon-pitch",
      client: HALCYON,
      isArc: false,
      cardTitle: "Halcyon · the pitch",
      chip: "pitch",
      date: "2026-09-02",
      standing: "proposed",
      sections: null,
      chapters: [],
      lightOnly: true,
    }),
    fixture({
      id: "halcyon-proposal",
      client: HALCYON,
      cardTitle: "Halcyon · the proposal",
      date: "2026-09-02",
      standing: "proposed",
      sections: 15,
      lightOnly: true,
    }),
    fixture({
      id: "meridian-keynote",
      client: MERIDIAN,
      cardTitle: "Meridian · the keynote",
      chip: "keynote",
      kind: "keynote",
      image: IMAGES.keynote,
      date: "2026-08-05",
      standing: "shipped",
      sections: 24,
    }),
    fixture({
      id: "fixture-workshop",
      cardTitle: "The fixture workshop",
      chip: "workshop",
      kind: "workshop",
      lane: "formats-workshop",
      image: IMAGES.workshop,
      date: "2026-07-30",
      standing: "shipped",
      sections: 22,
    }),
    fixture({
      id: "fixture-keynote",
      cardTitle: "The fixture keynote",
      chip: "keynote",
      kind: "keynote",
      lane: "formats-keynote",
      image: IMAGES.keynote,
      date: "2026-08-10",
      standing: "shipped",
      sections: 26,
    }),
  ];
}

/** The two CHEAPEST fakes the rubric's M and L blocks are written against. */
export type KitFake = "even" | "fills";

export function kitSections(fake?: KitFake): SheetSection[] {
  const sections = instrumentSections(kitEngagements(), KIT_CLIENTS, KIT_NOW);
  if (fake !== "even") return sections;
  /* THE EVEN FAKE: every mark at an evenly spaced x, like a bullet row — what
     M3 fails, and what `instrumentViolations` refuses by name. */
  const [monitor, log] = sections;
  if (monitor.kind !== "monitor") return sections;
  const n = monitor.plot.marks.length;
  const marks = monitor.plot.marks.map((m, i) => {
    const t = (i + 0.5) / n;
    return { ...m, at: { active: t, full: t } };
  });
  return [{ ...monitor, plot: { ...monitor.plot, marks } }, log];
}
