import { describe, expect, it } from "vitest";

import { CLIENTS, KIND_LABEL, clientPageCount } from "@/lib/arcs/clients";
import { PROPOSAL_COPY_BANS } from "@/lib/arcs/copyLaw";
import { ARCS, arcSlugs, arcsOf, houseArcs } from "@/lib/arcs/registry";
import {
  STANDING,
  arcsSheetSections,
  clientReadout,
  clientSheetSections,
  consoleCardsOf,
  consoleFor,
  kindsOf,
} from "@/lib/sheet/arcs";

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

  it("the overview is split · console · cells · close, the consoles in registry order", () => {
    const sections = arcsSheetSections();
    expect(sections.map((s) => s.kind)).toEqual(["split", "console", "cells", "close"]);
    const split = sections[0];
    if (split.kind !== "split") throw new Error("no split");
    expect(split.stations?.attr).toBe("kind");
    expect(split.stations?.stations.map((s) => s.id)).toEqual(KINDS);
    const consoles = sections[1];
    if (consoles.kind !== "console") throw new Error("no console set");
    expect(consoles.consoles.map((c) => c.id)).toEqual(CLIENTS_LISTED.map((c) => c.slug));
    const cells = sections[2];
    if (cells.kind !== "cells") throw new Error("no cells");
    expect(cells.n).toBe(4);
    expect(cells.cells.map((c) => c.href)).toEqual(
      houseArcs()
        .slice(0, 4)
        .map((a) => `/arcs/${a.slug}`)
    );
    /* Every arc reaches the overview exactly once: the client-bound ones as
       cards, the house formats as cells (ADR-098's two partitions). */
    const cardHrefs = consoles.consoles.flatMap((c) => c.cards.map((k) => k.href));
    const arcHrefs = ARCS.map((a) => `/arcs/${a.slug}`);
    for (const href of arcHrefs) {
      const onCards = cardHrefs.includes(href);
      const onCells = cells.cells.some((c) => c.href === href);
      expect(
        onCards !== onCells,
        `${href} appears ${onCards && onCells ? "twice" : "nowhere"}`
      ).toBe(true);
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
