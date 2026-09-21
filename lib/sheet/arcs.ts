/**
 * lib/sheet/arcs — the `/arcs` overview and the client pages, as sheet
 * ladders over the arcs registry (ADR-114).
 *
 * ⚠ EVERY READOUT IS DERIVED. The client console's facts are computed from
 * `CLIENTS`, `ARCS` and two optional fields (`ArcDef.status`,
 * `ClientDef.since`) — never authored here, so the console cannot say
 * something the registry does not. `tests/lib/sheet-arcs.test.ts` recomputes
 * every value and walks every composed string through the copy law, because
 * a string built at render time is outside every content scanner
 * (ADR-070 U15).
 *
 * Since ADR-118 the overview is an INSTRUMENT — `arcsInstrumentSections` —
 * and the same rule holds for every reading it letters: the monitor's
 * tallies, its lanes, its axis and the dossiers' readouts are all computed
 * from the registry here and recomputed a second way in `sheet-arcs`.
 *
 * Imports `lib/arcs` and the theme lock's route list (both pure).
 */

import { CLIENTS, KIND_LABEL, clientPageCount, kindOf } from "@/lib/arcs/clients";
import type { ClientDef } from "@/lib/arcs/clients";
import { arcsOf, houseArcs } from "@/lib/arcs/registry";
import type { ArcDef, ArcKind } from "@/lib/arcs/types";
import { isLightLockedPath } from "@/lib/theme/themeLock";

import { atOnWindow, axisWindow } from "./axis";
import { letterDateShort } from "./dates";
import type {
  SheetConsoleDef,
  SheetDossier,
  SheetFlashcard,
  SheetLogGroup,
  SheetLogRow,
  SheetMonitorLane,
  SheetMonitorMark,
  SheetReadoutRow,
  SheetSection,
  SheetStanding,
} from "./types";

const KINDS: readonly ArcKind[] = ["keynote", "workshop", "production"];

/** What a status word letters on the console — a record, not a claim. */
export const STANDING: Record<NonNullable<ArcDef["status"]>, string> = {
  proposed: "Proposal out",
  running: "In progress",
  shipped: "Delivered",
};

export function kindsOf(client: ClientDef): ArcKind[] {
  const pages = client.pages ?? [];
  const arcs = arcsOf(client.slug);
  return Array.from(new Set<ArcKind>([...pages.map((p) => p.kind), ...arcs.map(kindOf)]));
}

/**
 * The console's readout column: five facts a reader could check against
 * the registry. Newest engagement first — a client's non-arc pages lead,
 * as they lead its band (ADR-098 U2).
 */
export function clientReadout(client: ClientDef): SheetReadoutRow[] {
  const arcs = arcsOf(client.slug);
  const pages = client.pages ?? [];
  const latest =
    pages[0] !== undefined
      ? { chip: pages[0].chip, status: pages[0].status }
      : arcs[0] !== undefined
        ? { chip: arcs[0].cardChip ?? arcs[0].format, status: arcs[0].status }
        : null;
  return [
    { label: "Engagements", value: String(clientPageCount(client, arcs)) },
    { label: "Standing", value: latest?.status ? STANDING[latest.status] : "On record" },
    { label: "Latest", value: latest?.chip ?? "" },
    { label: "Since", value: client.since ?? "" },
    {
      label: "Kinds",
      value: kindsOf(client)
        .map((k) => KIND_LABEL[k])
        .join(" · "),
    },
  ];
}

function arcCard(arc: ArcDef): SheetFlashcard {
  return {
    id: arc.slug,
    kicker: arc.cardChip ?? arc.format,
    title: arc.cardTitle,
    body: arc.cardLede,
    figure: {
      kind: "image",
      src: arc.cardImage.src,
      alt: arc.cardImage.alt,
      width: 840,
      height: 1360,
      caption: arc.cardChip ?? arc.format,
      treatment: "duotone",
    },
    href: `/arcs/${arc.slug}`,
    data: { kind: kindOf(arc) },
  };
}

/** A client's cards: its pages first, then its arcs in registry order. */
export function consoleCardsOf(client: ClientDef): SheetFlashcard[] {
  const pages = (client.pages ?? []).map<SheetFlashcard>((p) => ({
    id: p.href,
    kicker: p.chip,
    title: p.title,
    body: p.lede,
    figure: {
      kind: "image",
      src: p.image.src,
      alt: p.image.alt,
      width: 840,
      height: 1360,
      caption: p.chip,
      treatment: "duotone",
    },
    href: p.href,
    data: { kind: p.kind },
  }));
  return [...pages, ...arcsOf(client.slug).map(arcCard)];
}

export function consoleFor(client: ClientDef, chapter = true): SheetConsoleDef {
  return {
    id: client.slug,
    menuLabel: client.name,
    ...(chapter ? { menuPrimary: true as const } : {}),
    panel: {
      name: client.name,
      readout: clientReadout(client),
      lede: client.lede,
      href: `/arcs/${client.slug}`,
    },
    cards: consoleCardsOf(client),
    data: { "sh-filter": "kind", kinds: kindsOf(client).join(" ") },
  };
}

/** The overview's ladder: split · console (the client set) · cells (the
 *  house formats) · close. */
export function arcsSheetSections(): SheetSection[] {
  const clients = CLIENTS.filter((c) => clientPageCount(c, arcsOf(c.slug)) > 0);
  const house = houseArcs();
  return [
    {
      kind: "split",
      id: "arcs",
      name: "Client arcs",
      title: { pre: "The briefing,", em: "as a place." },
      paragraphs: [
        "Every engagement gets an arc: the context, the proof and the practice on one page, in the same instrument the work ships in.",
        "One console per client. The pile on its right is the work, newest first.",
      ],
      stations: {
        attr: "kind",
        label: "Filter the arcs by kind",
        stations: KINDS.map((k) => ({ id: k, name: KIND_LABEL[k] })),
      },
    },
    {
      kind: "console",
      id: "clients",
      kicker: "Clients",
      consoles: clients.map((c) => consoleFor(c)),
    },
    {
      kind: "cells",
      id: "formats",
      kicker: "Thoughtform formats",
      menuLabel: "Formats",
      n: 4,
      cells: house.slice(0, 4).map((arc) => ({
        id: arc.slug,
        kicker: arc.cardChip ?? arc.format,
        body: [arc.cardLede],
        caption: arc.cardTitle,
        href: `/arcs/${arc.slug}`,
        data: { "sh-filter": "kind", kinds: kindOf(arc) },
      })),
    },
    { kind: "close", id: "contact", menuLabel: "Contact" },
  ];
}

/** One client's page: split · its console · close. */
export function clientSheetSections(client: ClientDef): SheetSection[] {
  return [
    {
      kind: "split",
      id: client.slug + "-head",
      name: "Client",
      title: { pre: client.name },
      paragraphs: [client.lede],
    },
    {
      kind: "console",
      id: "engagements",
      kicker: "Engagements",
      consoles: [consoleFor(client)],
    },
    { kind: "close", id: "contact", menuLabel: "Contact" },
  ];
}

/* ======================================================== the instrument */

/** The practice's clock: the day the monitor's NOW cursor marks. */
export const PRACTICE_TIME_ZONE = "Europe/Brussels";

/** A kind, singular — the dossier's head band and its readout. */
export const KIND_ONE: Record<ArcKind, string> = {
  keynote: "Keynote",
  workshop: "Workshop",
  production: "Production",
};

/**
 * The card images' own size. Read off the files, never typed from memory:
 * `sheet-arcs` opens every card image the instrument can show and asserts
 * its header says this.
 */
export const CARD_IMAGE_SIZE = { width: 840, height: 1360 } as const;

/** The three standings in the order a tally reads them. */
const STANDINGS: readonly SheetStanding[] = ["proposed", "running", "shipped"];

/** One engagement, whichever registry holds it: an arc, or a client's page. */
export interface Engagement {
  /** The arc's slug, or `<client>-<chip>` for a page that is not an arc. */
  id: string;
  /** The monitor lane: the client's slug, or `formats-<kind>`. */
  lane: string;
  client: ClientDef | null;
  isArc: boolean;
  /** The log row's chip: what the page is. */
  chip: string;
  cardTitle: string;
  lede: string;
  image: { src: string; alt: string };
  kind: ArcKind;
  standing: SheetStanding;
  date: string;
  href: string;
  /** The arc's section count, or null for a page with no registry sections. */
  sections: number | null;
  chapters: { id: string; label: string; href: string }[];
  lightOnly: boolean;
}

function standingOf(status: SheetStanding | undefined, what: string): SheetStanding {
  if (!status) throw new Error(`${what} carries no status (ADR-114)`);
  return status;
}

/** Every engagement on the overview exactly once, in LOG order: each client's
 *  pages and arcs in `CLIENTS` order, then the house formats. */
export function engagements(): Engagement[] {
  const out: Engagement[] = [];
  const fromArc = (arc: ArcDef, client: ClientDef | null): Engagement => ({
    id: arc.slug,
    lane: client ? client.slug : `formats-${kindOf(arc)}`,
    client,
    isArc: true,
    chip: arc.format,
    cardTitle: arc.cardTitle,
    lede: arc.cardLede,
    image: arc.cardImage,
    kind: kindOf(arc),
    standing: standingOf(arc.status, arc.slug),
    date: arc.date,
    href: `/arcs/${arc.slug}`,
    sections: arc.sections.length,
    chapters: arc.sections
      .filter((s) => s.menuPrimary && s.menuLabel)
      .map((s) => ({ id: s.id, label: s.menuLabel ?? s.id, href: `/arcs/${arc.slug}#${s.id}` })),
    lightOnly: isLightLockedPath(`/arcs/${arc.slug}`),
  });
  for (const client of CLIENTS) {
    for (const page of client.pages ?? [])
      out.push({
        id: `${client.slug}-${page.chip}`,
        lane: client.slug,
        client,
        isArc: false,
        chip: page.chip,
        cardTitle: page.title,
        lede: page.lede,
        image: page.image,
        kind: page.kind,
        standing: standingOf(page.status, page.href),
        date: page.date,
        href: page.href,
        sections: null,
        chapters: [],
        lightOnly: isLightLockedPath(page.href),
      });
    for (const arc of arcsOf(client.slug)) out.push(fromArc(arc, client));
  }
  for (const arc of houseArcs()) out.push(fromArc(arc, null));
  return out;
}

/** Newest first; a tie keeps the order it came in (Array#sort is stable). */
function newestFirst<T extends { date: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** The log row's title: the card's, with the client's name taken off when
 *  the group head above it already says it. */
export function rowTitleOf(e: Pick<Engagement, "cardTitle" | "client">): string {
  const prefix = e.client ? `${e.client.name} · ` : "";
  if (!prefix || !e.cardTitle.startsWith(prefix)) return e.cardTitle;
  const rest = e.cardTitle.slice(prefix.length);
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/** The dossier's readout: facts a reader could check against the registry. */
export function dossierReadout(e: Engagement): SheetReadoutRow[] {
  return [
    { label: "Client", value: e.client?.name ?? "Thoughtform" },
    { label: "Kind", value: KIND_ONE[e.kind] },
    { label: "Standing", value: STANDING[e.standing] },
    { label: "Filed", value: letterDateShort(e.date) },
    ...(e.sections === null ? [] : [{ label: "Sections", value: String(e.sections) }]),
    { label: "Theme", value: e.lightOnly ? "Light only" : "Dark and light" },
  ];
}

function tally<K extends string>(
  items: readonly Engagement[],
  keys: readonly K[],
  of: (e: Engagement) => K,
  name: (k: K) => string
): SheetReadoutRow[] {
  return keys
    .map((k) => ({ k, n: items.filter((e) => of(e) === k).length }))
    .filter(({ n }) => n > 0)
    .map(({ k, n }) => ({ label: name(k), value: String(n) }));
}

/**
 * The overview as an instrument (ADR-118): a monitor that plots every
 * engagement at the date it was filed, then a log that opens it.
 *
 * `today` is a `YYYY-MM-DD` the CALLER decides — the page asks the practice's
 * clock once per request (`todayIn(PRACTICE_TIME_ZONE)`), a test pins it —
 * so nothing in here reads a clock.
 */
export function arcsInstrumentSections(today: string): SheetSection[] {
  return instrumentSections(engagements(), CLIENTS, today);
}

/**
 * The instrument over ANY set of engagements — the registry's, or the kit's
 * fixtures (`/test/arcs-instrument-kit`), which is how a three-engagement
 * group, a same-day collision and a run still in progress get drawn before
 * the real record holds one.
 */
export function instrumentSections(
  all: readonly Engagement[],
  registry: readonly ClientDef[],
  today: string
): SheetSection[] {
  if (all.length === 0) throw new Error("the overview has no engagements to plot");
  const newest = newestFirst(all);
  const oldest = [...newest].reverse();
  const selected = newest[0];

  // The windows: the engagements' own stretch, and the whole record.
  const clients = registry.filter((c) => all.some((e) => e.client === c));
  const sinces = clients.map((c) => c.since).filter((s): s is string => Boolean(s));
  const active = axisWindow(oldest[0].date, today);
  const fullFirst = sinces.length > 0 ? `${[...sinces].sort()[0]}-01-01` : oldest[0].date;
  const full = axisWindow(fullFirst < oldest[0].date ? fullFirst : oldest[0].date, today);
  const at = (iso: string) => ({ active: atOnWindow(active, iso), full: atOnWindow(full, iso) });

  const houseKinds = (["workshop", "keynote", "production"] as const).filter((k) =>
    all.some((e) => e.lane === `formats-${k}`)
  );
  const lanes: SheetMonitorLane[] = [
    ...clients.map((c) => {
      const latest = newest.find((e) => e.client === c);
      return {
        id: c.slug,
        name: c.name,
        reading: latest ? STANDING[latest.standing] : "",
        ...(c.since && c.since < active.from.slice(0, 4) ? { since: c.since } : {}),
      };
    }),
    ...houseKinds.map((k) => {
      const latest = newest.find((e) => e.lane === `formats-${k}`);
      return {
        id: `formats-${k}`,
        name: `${KIND_ONE[k]} formats`,
        reading: latest ? STANDING[latest.standing] : "",
      };
    }),
  ];

  // Two engagements filed on one day on one lane share an x; the second
  // steps off the lane's rule rather than printing through the first.
  const sameDay = (e: Engagement) => oldest.filter((x) => x.lane === e.lane && x.date === e.date);
  const marks: SheetMonitorMark[] = oldest.map((e) => {
    const twins = sameDay(e);
    return {
      id: e.id,
      lane: e.lane,
      date: e.date,
      at: at(e.date),
      standing: e.standing,
      label: `${e.cardTitle}, ${STANDING[e.standing].toLowerCase()}, filed ${letterDateShort(e.date)}`,
      sections: e.sections,
      href: e.href,
      ...(twins.length > 1 ? { slot: twins.indexOf(e) - (twins.length - 1) / 2 } : {}),
    };
  });

  const rowOf = (e: Engagement): SheetLogRow => ({
    id: e.id,
    chip: e.chip,
    title: rowTitleOf(e),
    date: e.date,
    standing: e.standing,
    kind: e.kind,
    href: e.href,
  });
  const groups: SheetLogGroup[] = [
    ...clients.map((c) => ({
      id: c.slug,
      name: c.name,
      rows: newestFirst(all.filter((e) => e.client === c)).map(rowOf),
    })),
    ...(all.some((e) => !e.client)
      ? [
          {
            id: "formats",
            name: "Thoughtform formats",
            rows: newestFirst(all.filter((e) => !e.client)).map(rowOf),
          },
        ]
      : []),
  ];
  const byId = new Map(all.map((e) => [e.id, e]));

  const dossiers: SheetDossier[] = groups
    .flatMap((g) => g.rows)
    .map((row) => {
      const e = byId.get(row.id) as Engagement;
      return {
        id: e.id,
        designation: e.client
          ? { name: e.client.name, href: `/arcs/${e.client.slug}` }
          : { name: "Thoughtform" },
        kind: KIND_ONE[e.kind],
        title: e.cardTitle,
        lede: e.lede,
        image: { ...e.image, ...CARD_IMAGE_SIZE },
        readout: dossierReadout(e),
        chapters: e.chapters,
        cta: { label: e.isArc ? "Open arc" : "Open page", href: e.href },
      };
    });

  const kindsPresent = KINDS.filter((k) => all.some((e) => e.kind === k));

  return [
    {
      kind: "monitor",
      id: "monitor",
      menuLabel: "Monitor",
      menuPrimary: true,
      ariaLabel: "Every engagement, plotted at the date it was filed",
      datum: {
        name: "Arcs · monitor",
        readings: [
          { label: "Clients", value: String(clients.length) },
          { label: "Today", value: letterDateShort(today) },
        ],
      },
      identity: {
        name: "Arcs",
        lede: "Every engagement on the site, plotted at the date it was filed.",
      },
      cells: [
        {
          id: "standing",
          label: "Standing",
          rows: tally(
            all,
            STANDINGS,
            (e) => e.standing,
            (s) => STANDING[s]
          ),
        },
        {
          id: "kinds",
          label: "Kinds",
          rows: tally(
            all,
            KINDS,
            (e) => e.kind,
            (k) => KIND_LABEL[k]
          ),
        },
        {
          id: "latest",
          label: "Latest filed",
          rows: [
            { label: "Client", value: selected.client?.name ?? "Thoughtform" },
            { label: "Filed", value: letterDateShort(selected.date) },
          ],
        },
      ],
      plot: {
        windows: { active, full },
        lanes,
        marks,
        now: { date: today, label: "Now", at: at(today) },
      },
      terminus: [
        { label: "Marks", value: String(marks.length) },
        { label: "Lanes", value: String(lanes.length) },
        { label: "First filed", value: letterDateShort(oldest[0].date) },
      ],
      lit: selected.id,
    },
    {
      kind: "log",
      id: "log",
      menuLabel: "Log",
      menuPrimary: true,
      ariaLabel: "The engagements, by client",
      filter: {
        attr: "kind",
        label: "Filter the log by kind",
        stations: kindsPresent.map((k) => ({ id: k, name: KIND_LABEL[k] })),
      },
      groups,
      dossiers,
      selected: selected.id,
    },
  ];
}
