import { describe, expect, it } from "vitest";

import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  TRINNY_BOARD,
  TRINNY_OFFER_SECTIONS,
  TRINNY_OUTCOMES,
  TRINNY_PHASES,
  TRINNY_SCENE,
} from "@/app/(marketing)/arcs/trinny-london/proposal/offer/offerSections";
import { PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";
import type { BoardState } from "@/lib/arcs/types";

/** Every beat the page mounts, in reading order: the board, the phases and
 *  the outcomes are beats one to three and live in `#proposition`'s pinned
 *  scene (ADR-099 → ADR-100 → ADR-102 → ADR-103), the rest follow in `#offer`. */
const ALL_BEATS = [TRINNY_BOARD, TRINNY_PHASES, TRINNY_OUTCOMES, ...TRINNY_OFFER_SECTIONS];

/** How many strings a state carries — the record's own count. The exact SET
 *  the drawing letters is pinned in `arc-board-fit` (the ledger joins the
 *  tool names into one row, so it letters fewer than it holds); this is the
 *  budget the owner's "radically simplify it" set.
 *  ⚠ The leading `1` was the head STRIP, deleted in U4 — the two `2`s the
 *  seat and the card, and the trailing `2` is the fifth fact's pair. */
const lettered = (s: BoardState) =>
  2 + 2 + 1 + (s.layer.sub ? 1 : 0) + s.layer.rows.length + 1 + s.tools.items.length + 2;

/**
 * The Trinny pitch page's offer (ADR-094 U9) — the proposal's beats after
 * the configuration, rendered by the arcs' components over a route-local
 * record. It is OUTSIDE `ARCS`, so nothing in `arcs-registry` sees it;
 * this is the same copy law, walked over the same shape of record.
 */
describe("trinny-london offer (ADR-094 U9)", () => {
  it("holds the proposal's client-facing copy law", () => {
    const offenders: string[] = [];
    scanStrings(ALL_BEATS, "beats", (value, path) => {
      for (const [pattern, what] of PROPOSAL_COPY_BANS) {
        if (pattern.test(value)) offenders.push(`${path}: ${what}`);
      }
    });
    expect(offenders).toEqual([]);
  });

  it("carries no noun of the client it was copied from", () => {
    /* The offer's record is the Suri proposal's with the client's nouns
       swapped — placeholder copy by the owner's own instruction, to be
       rewritten. A swap is only a swap if nothing of the other client
       survived it: a Trinny page that says "Suri" once is not a placeholder,
       it is the wrong client's proposal. */
    const leaks: string[] = [];
    scanStrings(ALL_BEATS, "beats", (value, path) => {
      if (/\bSuri\b|\bKate\b|\bMark\b|\bNick\b/.test(value)) leaks.push(path);
    });
    expect(leaks).toEqual([]);
  });

  it("uses only the kinds the page's mount dispatches, with unique ids", () => {
    /* `TrinnyBeats.tsx` switches over the four kinds this page draws and
       renders nothing for any other — deliberately, to keep the arcs' heavier
       kinds (the dossier console, the holo program) off this route. A beat
       authored in another kind would vanish silently, and this is the
       failure that says so. */
    const kinds = new Set(ALL_BEATS.map((s) => s.kind));
    for (const kind of kinds) {
      expect(["list-groups", "cards", "board", "flow", "steps"]).toContain(kind);
    }
    /* ⚠ UNIQUE ACROSS BOTH ROOTS, not within each. The ids are DOM ids on
       one page — the board mounts into `#proposition` and the rest into
       `#offer`, two React trees but one document, so a collision is a
       duplicate anchor that `topOf()` and every in-page link resolve to the
       first of. */
    const ids = ALL_BEATS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    /* ⚠ THE SCENE IS THE BOARD AND THE PHASES, IN THAT ORDER, AND THE OFFER
       OPENS ON THE FLOW (ADR-102). The chip becomes the plates' head bands
       inside one pinned stage, so the phases render in the configuration's
       root; a phases beat back in `#offer` would be a second copy of the
       plates the scene lands on, and a scene without it has nothing to land
       on. `#phases` keeps its id either way, which is what every guard names. */
    /* ⚠ AND THE OUTCOMES ARE THE SCENE'S THIRD BEAT (ADR-103): the plates
       collapse to their bands and travel to its rows inside the same pinned
       stage, so it lives in the configuration's root too. */
    expect(TRINNY_SCENE.map((s) => s.id)).toEqual(["configuration", "phases", "outcomes"]);
    expect(TRINNY_SCENE[0]).toBe(TRINNY_BOARD);
    expect(TRINNY_SCENE[1]).toBe(TRINNY_PHASES);
    expect(TRINNY_SCENE[2]).toBe(TRINNY_OUTCOMES);
    expect(TRINNY_OFFER_SECTIONS[0].id).toBe("flow");
    expect(TRINNY_OFFER_SECTIONS.map((s) => s.id)).not.toContain("phases");
    expect(TRINNY_OFFER_SECTIONS.map((s) => s.id)).not.toContain("outcomes");
    expect(TRINNY_OFFER_SECTIONS).toHaveLength(7);
    /* The scene's heads carry no `state` chip: the head carrier letters the
       three lead runs and the three intro runs and nothing else (ADR-103). */
    for (const s of TRINNY_SCENE) {
      expect("head" in s ? s.head?.state : undefined, `${s.id}: a state chip`).toBeUndefined();
    }
    // The phases are PLATES and the fee is a LEDGER — the two drawings this
    // pass exists for (ADR-098 U2).
    const phases = TRINNY_PHASES;
    expect(phases.kind === "list-groups" && phases.layout).toBe("plates");
    expect(phases.kind === "list-groups" && phases.groups.length).toBe(3);
    const pricing = TRINNY_OFFER_SECTIONS.find((s) => s.id === "pricing");
    expect(pricing?.kind === "cards" && pricing.ledger?.columns).toEqual(["Phase", "What", "Fee"]);
  });

  it("the board's two states are the same layer, dormant then lit (ADR-100)", () => {
    /* The record is the discovery call as ONE set of five facts — who owns
       it, the context, the work, the tools, where it scales — answered
       twice. The drawing then reads them as a ledger and as a board
       (ADR-100 U2, U4). What a render cannot catch is a tool that exists in
       one state and not the other, a dormant side that letters tags it has
       no sentence for, or a figure on either. */
    const b = TRINNY_BOARD;
    expect(b.kind).toBe("board");
    if (b.kind !== "board") return;
    // ⚠ THE BEAT KEEPS ITS ID — the datum guard measures `seatOf("configuration")`.
    expect(b.id).toBe("configuration");
    const [today, configured] = b.states;
    expect(today.mode).toBe("today");
    expect(configured.mode).toBe("configured");
    for (const s of b.states) {
      const ids = s.layer.rows.map((r) => r.id);
      expect(new Set(ids).size, `${s.mode}: duplicate layer id`).toBe(ids.length);
      const tools = s.tools.items.map((t) => t.id);
      expect(new Set(tools).size, `${s.mode}: duplicate tool id`).toBe(tools.length);
      // Every fact is answered on both sides: the drawing has five slots and
      // an empty one is a hole, not a reading.
      expect(s.seat.a.length, `${s.mode}: the seat`).toBeGreaterThan(0);
      expect(s.card.work.length, `${s.mode}: the work`).toBeGreaterThan(0);
      expect(s.tools.label.length, `${s.mode}: the tools' label`).toBeGreaterThan(0);
      /* ⚠ THE FIFTH FACT IS ANSWERED ON BOTH SIDES TOO (U4). The board's
         node is what the beat is FOR — the capability scaling out — and a
         claim the before side does not answer is one the reader cannot
         measure against anything. Today it stops at the studio. */
      expect(s.reach.label.length, `${s.mode}: the reach's label`).toBeGreaterThan(0);
      expect(s.reach.value.length, `${s.mode}: the reach`).toBeGreaterThan(0);
      expect(s.alt.length, `${s.mode}: the drawing's accessible name`).toBeGreaterThan(40);
    }
    /* ⚠ THE TOOLS ARE PEERS AND THE LIST IS ONE (owner, 2026-09-14: Figma
       "should be the same level as the other elements"). Both sides carry
       the same four ids in the same order — the ledger joins their names
       into one row, the board letters them as four. */
    expect(configured.tools.items.map((t) => t.id)).toEqual(today.tools.items.map((t) => t.id));
    expect(today.tools.items.length).toBe(4);
    // The dormant context is its one line ("not written down" IS the row);
    // the lit one is the four tags.
    expect(today.layer.rows).toHaveLength(0);
    expect(today.layer.sub).toBeTruthy();
    expect(configured.layer.rows).toHaveLength(4);
    expect(configured.layer.sub, "the lit side letters its tags, not a sub").toBeUndefined();
    // The two sides answer with DIFFERENT words — a fact that reads the same
    // on both is a row the before/after cannot justify.
    expect(configured.seat.a).not.toBe(today.seat.a);
    expect(configured.card.name).not.toBe(today.card.name);
    expect(configured.reach.value).not.toBe(today.reach.value);
    // One key, both sides: the fact is the same question twice.
    expect(configured.reach.label).toBe(today.reach.label);
    /* The budgets: the owner's "keep it simple on the left" and "radically
       simplify it", as counts the record can be held to. */
    expect(lettered(today)).toBeLessThanOrEqual(14);
    expect(lettered(configured)).toBeLessThanOrEqual(17);
    /* ⚠ NO DIGIT ON THE DRAWING, the ruling this beat has carried since
       ADR-094 U7: it plots the configuration, it does not measure it. */
    scanStrings(b, "board", (value, path) => {
      expect(/\d/.test(value), `${path}: a figure on the board`).toBe(false);
    });
  });

  it("the outcomes are three deliverables, each with a stage (ADR-103)", () => {
    const o = TRINNY_OUTCOMES;
    expect(o.kind).toBe("steps");
    if (o.kind !== "steps") return;
    expect(o.id).toBe("outcomes");
    expect(o.items).toHaveLength(3);
    const ids = o.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of o.items) {
      /* The carrier letters the name on ONE line while the band travels, and
         the kicker beside it on the band's own row. */
      expect(item.name.length, `${item.id}: name too long for the band`).toBeLessThanOrEqual(40);
      expect(item.kicker.length, `${item.id}: kicker too long`).toBeLessThanOrEqual(24);
      // A few short sentences under the name, never a paragraph.
      expect(item.body.length, `${item.id}: body too long for the row`).toBeLessThanOrEqual(190);
      expect(
        item.body.split(/[.!?]\s/).length,
        `${item.id}: too many sentences`
      ).toBeLessThanOrEqual(3);
    }
    /* ⚠ NOT THE PHASES RESTATED (owner): no row may carry a phase's own
       deliverable line or its name. */
    const phaseLines = new Set<string>();
    if (TRINNY_PHASES.kind === "list-groups") {
      for (const g of TRINNY_PHASES.groups) {
        if (g.blurb) phaseLines.add(g.blurb.toLowerCase());
        for (const line of g.foot?.lines ?? []) phaseLines.add(line.toLowerCase());
      }
    }
    for (const item of o.items) {
      expect(phaseLines.has(item.name.toLowerCase()), `${item.id} restates a phase`).toBe(false);
    }

    /* THE SCAN: a record of a real grading pass. */
    const scan = o.items[0].visual;
    expect(scan.kind).toBe("scan");
    if (scan.kind !== "scan") return;
    expect(scan.checks.length).toBeGreaterThanOrEqual(3);
    expect(scan.checks.length).toBeLessThanOrEqual(5);
    const checkIds = scan.checks.map((c) => c.id);
    expect(new Set(checkIds).size).toBe(checkIds.length);
    let lastY = -1;
    for (const c of scan.checks) {
      // Inside the field, in the sweep's own order, with room for a row each.
      expect(c.x).toBeGreaterThanOrEqual(0.06);
      expect(c.x).toBeLessThanOrEqual(0.94);
      expect(c.y).toBeGreaterThanOrEqual(0.06);
      expect(c.y).toBeLessThanOrEqual(0.94);
      expect(c.y - lastY, `${c.id}: too close to the check above it`).toBeGreaterThanOrEqual(0.16);
      lastY = c.y;
      // One mono line each; the label box is `max-content`.
      expect(c.key.length, `${c.id}: key`).toBeLessThanOrEqual(10);
      expect(c.reading.length, `${c.id}: reading`).toBeLessThanOrEqual(20);
    }
    expect(scan.verdict.length).toBeLessThanOrEqual(28);
    for (const f of scan.fix) expect(f.length).toBeLessThanOrEqual(26);
    /* ⚠ NO DIGIT ON THE DRAWING — the house habit on every instrument; a
       string composed for a label is outside every other scanner. */
    scanStrings(scan, "scan", (value, path) => {
      if (path.endsWith(".src") || path.endsWith(".alt")) return;
      expect(/\d/.test(value), `${path}: a figure on the drawing`).toBe(false);
    });
    /* ⚠ THE IMAGE MUST EXIST ON DISK, with its box authored (the flow's own
       guard): a typo renders an empty frame every geometry gate reads as
       present. */
    expect(scan.image.src).toMatch(/^\/[a-z0-9\-/]+\.webp$/);
    expect(
      existsSync(join(__dirname, "..", "..", "public", scan.image.src.replace(/^\//, ""))),
      `${scan.image.src} is missing from public/`
    ).toBe(true);
    expect(scan.image.width).toBeGreaterThan(0);
    expect(scan.image.height).toBeGreaterThan(0);
    expect(scan.image.alt.length).toBeGreaterThan(0);
    /* THE RUN (ADR-106): the production run the team does itself, as four
       stations on one lit ring. ⚠ `by` IS THE WHOLE READING — a filled node
       is the team's hand, an open one the model — so a run that is all one or
       all the other has stopped saying what the deliverable's body says. */
    const loop = o.items[1].visual;
    expect(loop.kind).toBe("loop");
    if (loop.kind !== "loop") return;
    expect(loop.stations).toHaveLength(4);
    const stationIds = loop.stations.map((st) => st.id);
    expect(new Set(stationIds).size).toBe(stationIds.length);
    expect(loop.stations.some((st) => st.by === "team")).toBe(true);
    expect(loop.stations.some((st) => st.by === "model")).toBe(true);
    for (const st of loop.stations) {
      // Set ON the ring, in the annulus, with a tick either side of it.
      expect(st.name.length, `${st.id}: station name`).toBeLessThanOrEqual(8);
    }
    expect(loop.hub.length).toBeGreaterThan(0);
    expect(loop.hub.length).toBeLessThanOrEqual(16);

    /* THE ARC THAT ENDS (ADR-106): the engagement terminates, the setup does
       not. Two labels on the dial and one on the node. */
    const hand = o.items[2].visual;
    expect(hand.kind).toBe("handover");
    if (hand.kind !== "handover") return;
    expect(hand.inner.length).toBeGreaterThan(0);
    expect(hand.inner.length).toBeLessThanOrEqual(16);
    expect(hand.outer.length).toBeLessThanOrEqual(18);
    expect(hand.node.length).toBeLessThanOrEqual(14);

    /* Every figure carries the dial's diagonal pair, and none of them letters
       a digit — the same law the scan holds, one drawing over. */
    for (const item of o.items) {
      expect(item.visual.fix, `${item.id}: the dial's diagonal pair`).toHaveLength(2);
      for (const f of item.visual.fix) {
        expect(f.length, `${item.id}: fix too long for the corner`).toBeLessThanOrEqual(26);
        expect(f.length).toBeGreaterThan(0);
      }
    }
    for (const item of o.items.slice(1)) {
      scanStrings(item.visual, item.id, (value, path) => {
        expect(/\d/.test(value), `${path}: a figure on the drawing`).toBe(false);
      });
    }
  });

  it("draws the flow from a real template's fields and the client's own renders (ADR-099)", () => {
    const flow = TRINNY_OFFER_SECTIONS.find((s) => s.id === "flow");
    expect(flow?.kind).toBe("flow");
    if (!flow || flow.kind !== "flow") return;

    /* The eight fields a working brief carries. Short, because each is a
       LABEL on a plate and a clause there would wrap into the bar beneath
       it; digit-free, because the drawing letters no counts. */
    expect(flow.brief.fields).toHaveLength(8);
    for (const field of flow.brief.fields) {
      expect(field.length, `${field} is too long for a plate row`).toBeLessThanOrEqual(12);
      expect(/\d/.test(field), `${field} carries a digit`).toBe(false);
    }
    expect(new Set(flow.brief.fields).size).toBe(flow.brief.fields.length);

    /* ⚠ THE RENDERS MUST EXIST ON DISK. They are `public/` paths written by
       hand, and a typo renders an empty frame that every geometry gate reads
       as present — the plate would measure correct and show nothing. */
    expect(flow.renders.images.length).toBeGreaterThanOrEqual(3);
    for (const image of flow.renders.images) {
      expect(image.src, `${image.src} is not repo-rooted`).toMatch(/^\/[a-z0-9\-/]+\.webp$/);
      expect(
        existsSync(join(__dirname, "..", "..", "public", image.src.replace(/^\//, ""))),
        `${image.src} is missing from public/`
      ).toBe(true);
      // Decorative: the plate's own label carries the meaning.
      expect(image.alt).toBe("");
    }

    // Market codes, not country names — the plate's frames are small.
    expect(flow.scale.markets.length).toBeGreaterThanOrEqual(2);
    for (const market of flow.scale.markets) expect(market).toMatch(/^[A-Z]{2}$/);
    // Exactly two connectors, because there are exactly three plates.
    expect(flow.steps).toHaveLength(2);
  });
});
