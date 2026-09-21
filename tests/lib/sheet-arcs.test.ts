import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CLIENTS, KIND_LABEL, clientPageCount, kindOf } from "@/lib/arcs/clients";
import { PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";
import { ARCS, arcSlugs, arcsOf, houseArcs } from "@/lib/arcs/registry";
import {
  CARD_IMAGE_SIZE,
  KIND_ONE,
  STANDING,
  arcsInstrumentSections,
  clientReadout,
  clientSheetSections,
  consoleCardsOf,
  consoleFor,
  kindsOf,
} from "@/lib/sheet/arcs";
import { letterDateShort } from "@/lib/sheet/dates";
import type { SheetSection } from "@/lib/sheet/types";
import PREVIEWS from "@/lib/arcs/previews.json";
import { isLightLockedPath } from "@/lib/theme/themeLock";

/**
 * The client console's record, recomputed (ADR-114).
 *
 * ⚠ EVERY VALUE ON THE CONSOLE IS DERIVED, and this is where that is
 * checked against the registry a second way: the readout's five rows, the
 * cards' count and targets, the set's order. A console that lettered a
 * number the registry does not hold would be a live dashboard lying.
 */

const CLIENTS_LISTED = CLIENTS.filter((c) => clientPageCount(c, arcsOf(c.slug)) > 0);
const KINDS = ["keynote", "workshop", "production"];

describe("the arcs sheet (ADR-114)", () => {
  it("every client-bound arc carries a status and every client a since year", () => {
    for (const arc of ARCS) {
      if (!arc.client) continue;
      expect(arc.status, `${arc.slug}: status`).toBeDefined();
      expect(Object.keys(STANDING), `${arc.slug}: status`).toContain(arc.status);
    }
    for (const client of CLIENTS) {
      expect(client.since, `${client.slug}: since`).toMatch(/^\d{4}$/);
      for (const page of client.pages ?? [])
        expect(Object.keys(STANDING), `${client.slug}: page status`).toContain(page.status);
    }
  });

  it("the readout is five checkable facts, in order, none of them empty", () => {
    for (const client of CLIENTS_LISTED) {
      const rows = clientReadout(client);
      expect(rows.map((r) => r.label)).toEqual([
        "Engagements",
        "Standing",
        "Latest",
        "Since",
        "Kinds",
      ]);
      const arcs = arcsOf(client.slug);
      const pages = client.pages ?? [];
      expect(rows[0].value).toBe(String(arcs.length + pages.length));
      expect([...Object.values(STANDING), "On record"]).toContain(rows[1].value);
      const latest = pages[0]?.chip ?? arcs[0]?.cardChip ?? arcs[0]?.format;
      expect(rows[2].value).toBe(latest);
      expect(rows[3].value).toBe(client.since);
      const kinds = rows[4].value.split(" · ");
      expect(kinds.length).toBeGreaterThan(0);
      for (const k of kinds) expect(Object.values(KIND_LABEL)).toContain(k);
      for (const r of rows) {
        expect(r.value.length, `${client.slug}: ${r.label}`).toBeGreaterThan(0);
        for (const [re, why] of PROPOSAL_COPY_BANS) expect(r.value, why).not.toMatch(re);
      }
    }
  });

  it("the cards are the client's pages then its arcs, each pointing at a real page", () => {
    for (const client of CLIENTS_LISTED) {
      const cards = consoleCardsOf(client);
      const pages = client.pages ?? [];
      const arcs = arcsOf(client.slug);
      expect(cards).toHaveLength(pages.length + arcs.length);
      expect(cards.slice(0, pages.length).map((c) => c.href)).toEqual(pages.map((p) => p.href));
      expect(cards.slice(pages.length).map((c) => c.href)).toEqual(
        arcs.map((a) => `/arcs/${a.slug}`)
      );
      expect(new Set(cards.map((c) => c.href)).size).toBe(cards.length);
      for (const card of cards) {
        expect(card.kicker.length, card.id).toBeGreaterThan(0);
        expect(card.title.length, card.id).toBeGreaterThan(0);
        expect(card.body.length, card.id).toBeGreaterThan(0);
        expect(KINDS).toContain(card.data?.kind);
        expect(card.figure.kind).toBe("image");
        if (card.figure.kind === "image") expect(card.figure.src).toMatch(/^\/(arcs|images)\//);
        if (card.href.startsWith("/arcs/") && !card.href.slice(6).includes("/"))
          expect(arcSlugs()).toContain(card.href.slice(6));
      }
      const console = consoleFor(client);
      expect(console.id).toBe(client.slug);
      expect(console.menuPrimary).toBe(true);
      expect(console.panel.href).toBe(`/arcs/${client.slug}`);
      expect(console.data).toEqual({ "sh-filter": "kind", kinds: kindsOf(client).join(" ") });
      for (const k of kindsOf(client)) expect(KINDS).toContain(k);
    }
  });

  it("a client page is its console alone", () => {
    for (const client of CLIENTS_LISTED) {
      const sections = clientSheetSections(client);
      expect(sections.map((s) => s.kind)).toEqual(["split", "console", "close"]);
      const consoles = sections[1];
      if (consoles.kind !== "console") throw new Error("no console");
      expect(consoles.consoles).toEqual([consoleFor(client)]);
    }
  });
});

/* ------------------------------------------------ the instrument (ADR-118) */

const TODAY = "2026-09-21";

/** Every engagement the registry holds, recomputed without `engagements()`:
 *  each client's pages, each arc — its date, standing, kind and page. */
function registryRecord() {
  const out: {
    id: string;
    client: string | null;
    date: string;
    status: string;
    kind: string;
    href: string;
    title: string;
    sections: number | null;
  }[] = [];
  for (const c of CLIENTS)
    for (const p of c.pages ?? [])
      out.push({
        id: `${c.slug}-${p.chip}`,
        client: c.slug,
        date: p.date,
        status: p.status ?? "",
        kind: p.kind,
        href: p.href,
        title: p.title,
        sections: null,
      });
  for (const a of ARCS)
    out.push({
      id: a.slug,
      client: a.client ?? null,
      date: a.date,
      status: a.status ?? "",
      kind: kindOf(a),
      href: `/arcs/${a.slug}`,
      title: a.cardTitle,
      sections: a.sections.length,
    });
  return out;
}

/** A webp's pixel size, read off its header (VP8 / VP8L / VP8X). */
function webpSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  const fourcc = b.toString("ascii", 12, 16);
  if (fourcc === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  if (fourcc === "VP8 ")
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (fourcc === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  throw new Error(`${file}: not a webp this reader knows (${fourcc})`);
}

describe("the arcs instrument, recomputed from the registry (ADR-118)", () => {
  const [monitor, log] = arcsInstrumentSections(TODAY) as [
    Extract<SheetSection, { kind: "monitor" }>,
    Extract<SheetSection, { kind: "log" }>,
  ];
  const record = registryRecord();
  const newest = [...record].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0];

  it("plots every engagement exactly once, at its own date and standing", () => {
    expect(monitor.plot.marks).toHaveLength(record.length);
    for (const r of record) {
      const mark = monitor.plot.marks.find((m) => m.id === r.id);
      expect(mark, r.id).toBeDefined();
      expect(mark?.date, r.id).toBe(r.date);
      expect(mark?.standing, r.id).toBe(r.status);
      expect(mark?.href, r.id).toBe(r.href);
      expect(mark?.sections, r.id).toBe(r.sections);
      expect(mark?.lane, r.id).toBe(r.client ?? `formats-${r.kind}`);
    }
    expect(monitor.terminus.find((t) => t.label === "Marks")?.value).toBe(String(record.length));
  });

  it("gives every client with an engagement a lane, in registry order, then the formats", () => {
    const clients = CLIENTS.filter((c) => record.some((r) => r.client === c.slug));
    const formats = ["workshop", "keynote", "production"].filter((k) =>
      record.some((r) => !r.client && r.kind === k)
    );
    expect(monitor.plot.lanes.map((l) => l.id)).toEqual([
      ...clients.map((c) => c.slug),
      ...formats.map((k) => `formats-${k}`),
    ]);
    for (const lane of monitor.plot.lanes) {
      const own = record
        .filter((r) => (r.client ?? `formats-${r.kind}`) === lane.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      expect(lane.reading, lane.id).toBe(STANDING[own[0].status as keyof typeof STANDING]);
    }
    // Only a relationship older than the window's own year ENTERS from the left.
    const from = monitor.plot.windows.active.from.slice(0, 4);
    for (const lane of monitor.plot.lanes) {
      const c = CLIENTS.find((x) => x.slug === lane.id);
      expect(lane.since, lane.id).toBe(c?.since && c.since < from ? c.since : undefined);
    }
    expect(monitor.datum.readings.find((r) => r.label === "Clients")?.value).toBe(
      String(clients.length)
    );
  });

  it("tallies the standing and the kinds from the record, and names the latest", () => {
    const rowsOf = (id: string) =>
      Object.fromEntries(
        (monitor.cells.find((c) => c.id === id)?.rows ?? []).map((r) => [r.label, r.value])
      );
    const standing = rowsOf("standing");
    for (const [status, word] of Object.entries(STANDING)) {
      const n = record.filter((r) => r.status === status).length;
      expect(standing[word], word).toBe(n > 0 ? String(n) : undefined);
    }
    const kinds = rowsOf("kinds");
    for (const [kind, word] of Object.entries(KIND_LABEL)) {
      const n = record.filter((r) => r.kind === kind).length;
      expect(kinds[word], word).toBe(n > 0 ? String(n) : undefined);
    }
    expect(rowsOf("latest").Filed).toBe(letterDateShort(newest.date));
  });

  it("chooses the newest engagement on the server, lit on the monitor and filled in the log", () => {
    expect(log.selected).toBe(newest.id);
    expect(monitor.lit).toBe(newest.id);
  });

  it("groups the log by client in registry order, newest first, each title without its client's name", () => {
    const clients = CLIENTS.filter((c) => record.some((r) => r.client === c.slug));
    expect(log.groups.map((g) => g.name)).toEqual([
      ...clients.map((c) => c.name),
      ...(record.some((r) => !r.client) ? ["Thoughtform formats"] : []),
    ]);
    for (const g of log.groups) {
      for (const row of g.rows) {
        expect(row.title.startsWith(`${g.name} · `), row.id).toBe(false);
        expect(row.title.length, row.id).toBeGreaterThan(0);
        expect(row.title[0], row.id).toBe(row.title[0].toUpperCase());
      }
    }
  });

  it("files a dossier per row whose every readout is a fact the registry holds", () => {
    for (const r of record) {
      const d = log.dossiers.find((x) => x.id === r.id);
      expect(d, r.id).toBeDefined();
      if (!d) continue;
      const read = Object.fromEntries(d.readout.map((row) => [row.label, row.value]));
      const client = CLIENTS.find((c) => c.slug === r.client);
      expect(read.Client, r.id).toBe(client?.name ?? "Thoughtform");
      expect(read.Kind, r.id).toBe(KIND_ONE[r.kind as keyof typeof KIND_ONE]);
      expect(read.Standing, r.id).toBe(STANDING[r.status as keyof typeof STANDING]);
      expect(read.Filed, r.id).toBe(letterDateShort(r.date));
      expect(read.Sections, r.id).toBe(r.sections === null ? undefined : String(r.sections));
      expect(read.Theme, r.id).toBe(isLightLockedPath(r.href) ? "Light only" : "Dark and light");
      expect(d.title, r.id).toBe(r.title);
      expect(d.cta.href, r.id).toBe(r.href);
      expect(d.designation.href, r.id).toBe(client ? `/arcs/${client.slug}` : undefined);
      const arc = ARCS.find((a) => a.slug === r.id);
      expect(
        d.chapters.map((c) => c.id),
        r.id
      ).toEqual(arc ? arc.sections.filter((s) => s.menuPrimary).map((s) => s.id) : []);
      for (const c of d.chapters) expect(c.href, r.id).toBe(`${r.href}#${c.id}`);
    }
  });

  it("every preview names a real engagement, and its file is the size it declares", () => {
    /* The first screens (`scripts/capture-arc-previews.mjs`) are optional per
       engagement — a scaffolded arc falls back to its card — but every entry
       the manifest HAS must point at a page on the overview and a real file. */
    const ids = new Set(record.map((r) => r.id));
    for (const [id, p] of Object.entries(PREVIEWS)) {
      expect(ids.has(id), `${id}: a preview for no engagement`).toBe(true);
      expect(p.src).toBe(`/arcs/previews/${id}.webp`);
      expect(webpSize(join(__dirname, "..", "..", "public", p.src)), id).toEqual({
        width: p.width,
        height: p.height,
      });
      expect(log.dossiers.find((d) => d.id === id)?.image.src, id).toBe(p.src);
    }
  });

  it("declares every picture at the size its file says", () => {
    for (const d of log.dossiers) {
      const size = webpSize(join(__dirname, "..", "..", "public", d.image.src));
      expect(size, d.image.src).toEqual({ width: d.image.width, height: d.image.height });
    }
    expect(CARD_IMAGE_SIZE).toEqual({ width: 840, height: 1360 });
  });

  it("composes no string the copy law refuses, and none unrendered", () => {
    /* Every string the instrument COMPOSES — readouts, lanes, the axis, the
       mark labels, the row titles — is built here, outside every content
       scanner (ADR-070 U15). The card copy it carries (a lede, a title) is
       the decks' own and answers to the arcs registry's law. */
    const composed = {
      datum: monitor.datum,
      cells: monitor.cells,
      terminus: monitor.terminus,
      lanes: monitor.plot.lanes,
      windows: monitor.plot.windows,
      labels: monitor.plot.marks.map((m) => m.label),
      rows: log.groups.map((g) => ({ name: g.name, rows: g.rows.map((r) => [r.chip, r.title]) })),
      readouts: log.dossiers.map((d) => [d.kind, d.readout, d.cta.label, d.designation.name]),
      filter: log.filter,
    };
    scanStrings(composed, "instrument", (value, path) => {
      expect(value, `${path}: an unrendered value`).not.toMatch(/undefined|\bNaN\b|\[object/);
      for (const [re, why] of PROPOSAL_COPY_BANS) expect(value, `${path}: ${why}`).not.toMatch(re);
    });
  });

  it("keeps the house formats on the overview: every arc reaches it exactly once", () => {
    const rowIds = log.groups.flatMap((g) => g.rows.map((r) => r.id));
    for (const a of ARCS)
      expect(
        rowIds.filter((id) => id === a.slug),
        a.slug
      ).toHaveLength(1);
    expect(houseArcs().every((a) => rowIds.includes(a.slug))).toBe(true);
  });
});
