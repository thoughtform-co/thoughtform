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
 * Imports `lib/arcs` only.
 */

import { CLIENTS, KIND_LABEL, clientPageCount, kindOf } from "@/lib/arcs/clients";
import type { ClientDef } from "@/lib/arcs/clients";
import { arcsOf, houseArcs } from "@/lib/arcs/registry";
import type { ArcDef, ArcKind } from "@/lib/arcs/types";

import type { SheetConsoleDef, SheetFlashcard, SheetReadoutRow, SheetSection } from "./types";

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
