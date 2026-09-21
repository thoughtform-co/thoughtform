import type { ClientDef } from "@/lib/arcs/clients";
import { instrumentSections } from "@/lib/sheet/arcs";
import type { Engagement } from "@/lib/sheet/arcs";
import type { SheetConfiguration, SheetSection } from "@/lib/sheet/types";

/**
 * The instrument kit's fixtures (ADR-118) — the eval's type `AK`.
 *
 * The real record holds one engagement per client, no two on one day and
 * nothing in progress, so the states the instrument has to draw and the page
 * never shows are drawn HERE first: a client with three engagements (one of
 * them still running, which runs a dotted tail to NOW), two engagements filed
 * on the same day on the same lane, a client whose relationship began before
 * the window (it enters from the left edge), a house format's V2 cut, and —
 * since U2 — a configuration AT ITS CEILING: four workstreams, a ghost, eight
 * links, the most the board's layout seats (`CONFIG_MAX_*`).
 *
 * ⚠ FIXTURES ARE LABELLED AS FIXTURES: invented clients, hrefs back into
 * this page, no price, no claim. `NOW` is PINNED so a still of the kit is the
 * same still on every day it is shot. The ceiling's links are written here
 * directly, not derived — two of them (Notion, Drive) are tools no proposal
 * names, and the stack vocabulary only holds what a proposal does.
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

/** THE CEILING: four workstreams, a ghost, eight links (ADR-118 U2). */
export const KIT_CEILING: SheetConfiguration = {
  rows: [
    { id: "research", name: "Research and briefing", note: "reviews to brief", tag: "M1" },
    { id: "imagery", name: "Imagery", note: "stills and video", tag: "M1" },
    { id: "composition", name: "Composition", note: "layout, type and motion", tag: "M2" },
    { id: "ads", name: "Ads", note: "brief to finished ad", tag: "M3" },
    { id: "next", name: "Localisation", note: "six languages, the next workstream", ghost: true },
  ],
  links: [
    { id: "claude", kind: "llm", kicker: "LLM", name: "Claude", users: 4 },
    { id: "image-generation", kind: "model", kicker: "Model", name: "Image generation", users: 2 },
    { id: "video-generation", kind: "model", kicker: "Model", name: "Video generation", users: 1 },
    { id: "figma", kind: "design", kicker: "Design", name: "Figma", users: 3 },
    { id: "monday", kind: "ops", kicker: "Ops", name: "Monday", users: 2 },
    { id: "slack", kind: "ops", kicker: "Ops", name: "Slack", users: 2 },
    { id: "notion", kind: "ops", kicker: "Ops", name: "Notion", users: 1 },
    { id: "drive", kind: "ops", kicker: "Ops", name: "Drive", users: 1 },
  ],
};

/** A proposal's usual shape: three workstreams, three links. */
const KIT_USUAL: SheetConfiguration = {
  rows: [
    { id: "imagery", name: "Imagery", note: "stills and video", tag: "M1" },
    { id: "composition", name: "Composition", note: "layout, type and motion", tag: "M2" },
    { id: "ads", name: "Ads", note: "brief to finished ad", tag: "M3" },
  ],
  links: [
    { id: "claude", kind: "llm", kicker: "LLM", name: "Claude", users: 3 },
    { id: "image-generation", kind: "model", kicker: "Model", name: "Image generation", users: 1 },
    { id: "figma", kind: "design", kicker: "Design", name: "Figma", users: 1 },
  ],
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
    kind: "production",
    href,
    sections: 12,
    configuration: null,
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
      configuration: KIT_CEILING,
    }),
    fixture({
      id: "northwind-studio",
      client: NORTHWIND,
      cardTitle: "Northwind · the studio",
      chip: "pitch",
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
    }),
    fixture({
      id: "halcyon-proposal",
      client: HALCYON,
      cardTitle: "Halcyon · the proposal",
      date: "2026-09-02",
      standing: "proposed",
      sections: 15,
      configuration: KIT_USUAL,
    }),
    fixture({
      id: "meridian-keynote",
      client: MERIDIAN,
      cardTitle: "Meridian · the keynote",
      chip: "keynote",
      kind: "keynote",
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
      date: "2026-07-30",
      standing: "shipped",
      sections: 22,
    }),
    fixture({
      id: "fixture-keynote-v2",
      cardTitle: "The fixture keynote · V2",
      chip: "keynote",
      kind: "keynote",
      lane: "formats-keynote",
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
