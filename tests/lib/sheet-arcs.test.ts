import { describe, expect, it } from "vitest";

import { CLIENTS, KIND_LABEL, clientPageCount, kindOf } from "@/lib/arcs/clients";
import { PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";
import { ARCS, arcSlugs, arcsOf, houseArcs } from "@/lib/arcs/registry";
import {
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
import { LOG_GLYPHS } from "@/lib/sheet/logGlyphs";
import type { SheetSection } from "@/lib/sheet/types";

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
 *  each client's pages, each arc — its date, standing, kind, page and chip. */
function registryRecord() {
  const out: {
    id: string;
    client: string | null;
    date: string;
    status: string;
    kind: string;
    href: string;
    title: string;
    chip: string;
    sections: number | null;
    configured: boolean;
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
        chip: p.chip,
        sections: null,
        // The pitch page is Trinny London's proposal (ADR-098 U2), and its
        // board and phases are the one configuration a client page carries.
        configured: p.href === "/arcs/trinny-london/proposal",
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
      chip: a.format,
      sections: a.sections.length,
      configured: a.sections.some((s) => s.kind === "configuration"),
    });
  return out;
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

  it("sections the log by kind, each newest first, the sections by their newest filing", () => {
    /* ADR-118 U2: the kinds DIVIDE the list (the owner, on U1's filter tabs).
       Recomputed from the record: a section per kind present, a tie keeping
       the vocabulary's order (keynote, workshop, production). */
    const kinds = ["keynote", "workshop", "production"].filter((k) =>
      record.some((r) => r.kind === k)
    );
    const newestOf = (k: string) =>
      record
        .filter((r) => r.kind === k)
        .map((r) => r.date)
        .sort()
        .reverse()[0];
    const byFiling = [...kinds].sort((a, b) =>
      newestOf(a) < newestOf(b) ? 1 : newestOf(a) > newestOf(b) ? -1 : 0
    );
    expect(log.groups.map((g) => g.id)).toEqual(byFiling);
    expect(log.groups.map((g) => g.name)).toEqual(
      byFiling.map((k) => KIND_LABEL[k as keyof typeof KIND_LABEL])
    );
    for (const g of log.groups)
      expect(
        g.rows.map((r) => r.date),
        g.id
      ).toEqual([...g.rows.map((r) => r.date)].sort().reverse());
  });

  it("names every block for its client, and brackets what the engagement is", () => {
    /* The title is the CLIENT (owner: "more prominent, not too big"); the
       bracket is `The <chip>` — never the card title with the client taken
       off, which made the Loop block say "Loop" twice — or, for a house
       format, `House format` and its cut. */
    for (const r of record) {
      const row = log.groups.flatMap((g) => g.rows).find((x) => x.id === r.id)!;
      const client = CLIENTS.find((c) => c.slug === r.client);
      expect(row.chip, r.id).toBe(r.chip);
      if (client) {
        expect(row.name, r.id).toBe(client.name);
        expect(row.engagement, r.id).toBe(`The ${r.chip}`);
      } else {
        const v2 = r.title.endsWith(" · V2");
        expect(v2, `${r.id}: a -v2 id and a · V2 title agree`).toBe(r.id.endsWith("-v2"));
        expect(row.name, r.id).toBe(v2 ? r.title.slice(0, -" · V2".length) : r.title);
        expect(row.engagement, r.id).toBe(v2 ? "House format · V2" : "House format");
      }
      expect(row.engagement, r.id).not.toMatch(/[[\]]/);
    }
  });

  it("files a dossier per row whose status is a fact the registry holds", () => {
    for (const r of record) {
      const d = log.dossiers.find((x) => x.id === r.id);
      expect(d, r.id).toBeDefined();
      if (!d) continue;
      const read = Object.fromEntries(d.status.map((row) => [row.label, row.value]));
      const client = CLIENTS.find((c) => c.slug === r.client);
      expect(Object.keys(read), r.id).toEqual(
        r.sections === null ? ["Standing", "Filed"] : ["Standing", "Filed", "Sections"]
      );
      expect(read.Standing, r.id).toBe(STANDING[r.status as keyof typeof STANDING]);
      expect(read.Filed, r.id).toBe(letterDateShort(r.date));
      expect(read.Sections, r.id).toBe(r.sections === null ? undefined : String(r.sections));
      expect(d.kind, r.id).toBe(KIND_ONE[r.kind as keyof typeof KIND_ONE]);
      expect(d.title, r.id).toBe(r.title);
      expect(d.cta.href, r.id).toBe(r.href);
      expect(d.designation.href, r.id).toBe(client ? `/arcs/${client.slug}` : undefined);
      // Only a proposal draws a configuration — "not every type of arc has
      // this intelligence configuration" (owner, ADR-118 U2).
      expect(d.configuration !== null, `${r.id}: a board`).toBe(r.configured);
    }
  });

  it("composes no string the copy law refuses, and none unrendered", () => {
    /* Every string the instrument COMPOSES — readouts, lanes, the axis, the
       mark labels, the block lines, the configurations — is built here,
       outside every content scanner (ADR-070 U15). The card copy it carries
       (a lede, a title) is the decks' own and answers to the arcs registry's
       law. */
    const composed = {
      datum: monitor.datum,
      cells: monitor.cells,
      terminus: monitor.terminus,
      lanes: monitor.plot.lanes,
      windows: monitor.plot.windows,
      labels: monitor.plot.marks.map((m) => m.label),
      rows: log.groups.map((g) => ({
        name: g.name,
        rows: g.rows.map((r) => [r.chip, r.name, r.engagement]),
      })),
      readouts: log.dossiers.map((d) => [d.kind, d.status, d.cta.label, d.designation.name]),
      configurations: log.dossiers.map((d) => d.configuration),
    };
    scanStrings(composed, "instrument", (value, path) => {
      expect(value, `${path}: an unrendered value`).not.toMatch(/undefined|\bNaN\b|\[object/);
      for (const [re, why] of PROPOSAL_COPY_BANS) expect(value, `${path}: ${why}`).not.toMatch(re);
    });
  });

  it("keeps the house formats on the overview: every arc reaches it exactly once, one icon each", () => {
    for (const g of log.groups)
      for (const r of g.rows)
        expect(LOG_GLYPHS[r.chip], `${r.id}: no icon for ${r.chip}`).toBeDefined();
    const rowIds = log.groups.flatMap((g) => g.rows.map((r) => r.id));
    for (const a of ARCS)
      expect(
        rowIds.filter((id) => id === a.slug),
        a.slug
      ).toHaveLength(1);
    expect(houseArcs().every((a) => rowIds.includes(a.slug))).toBe(true);
  });
});
