import { describe, expect, it } from "vitest";

import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  TRINNY_BOARD,
  TRINNY_OFFER_SECTIONS,
} from "@/app/(marketing)/arcs/trinny-london/proposal/offer/offerSections";
import { PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";
import type { BoardState } from "@/lib/arcs/types";

/** Every beat the page mounts, in reading order: the board is beat one and
 *  lives in its own station (ADR-099 → ADR-100), the rest follow in `#offer`. */
const ALL_BEATS = [TRINNY_BOARD, ...TRINNY_OFFER_SECTIONS];

/** How many strings a state letters — the drawing's own count, from the
 *  record. The exact SET is pinned in `arc-board-fit`; this is the budget
 *  the owner's "not too complicated" set. */
const lettered = (s: BoardState) =>
  1 +
  2 +
  (s.seat.note ? 1 : 0) +
  1 +
  (s.card.work ? 1 : 0) +
  (s.card.q ? 1 : 0) +
  (s.card.a ? 1 : 0) +
  1 +
  (s.layer.sub ? 1 : 0) +
  s.layer.rows.length +
  (s.tools.label ? 1 : 0) +
  s.tools.items.reduce((n, t) => n + 1 + (t.note ? 1 : 0), 0);

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
      expect(["list-groups", "cards", "board", "flow"]).toContain(kind);
    }
    /* ⚠ UNIQUE ACROSS BOTH ROOTS, not within each. The ids are DOM ids on
       one page — the board mounts into `#proposition` and the rest into
       `#offer`, two React trees but one document, so a collision is a
       duplicate anchor that `topOf()` and every in-page link resolve to the
       first of. */
    const ids = ALL_BEATS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    // The phases are PLATES and the fee is a LEDGER — the two drawings this
    // pass exists for (ADR-098 U2).
    const phases = TRINNY_OFFER_SECTIONS.find((s) => s.id === "phases");
    expect(phases?.kind === "list-groups" && phases.layout).toBe("plates");
    const pricing = TRINNY_OFFER_SECTIONS.find((s) => s.id === "pricing");
    expect(pricing?.kind === "cards" && pricing.ledger?.columns).toEqual(["Phase", "What", "Fee"]);
  });

  it("the board's two states are the same layer, dormant then lit (ADR-100)", () => {
    /* The record is the discovery call in two states, and the claim the
       drawing makes is that they are ONE board: the same four objects, the
       same tools, dormant on the left and lit on the right. What a render
       cannot catch is a tool that exists in one state and not the other, a
       dormant layer that letters tags it has no sentence for, a card that
       says both a work line and a question, or a figure on either. */
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
      // The card says ONE thing under its name: the work line OR a question
      // and its answer, never both, never a question without its answer.
      expect(Boolean(s.card.q), `${s.mode}: a question needs its answer`).toBe(Boolean(s.card.a));
      expect(s.card.work && s.card.q, `${s.mode}: the card says one thing`).toBeFalsy();
      expect(s.alt.length, `${s.mode}: the board's accessible name`).toBeGreaterThan(40);
    }
    // The same tools, wired differently — the claim, mechanised.
    expect(configured.tools.items.map((t) => t.id)).toEqual(today.tools.items.map((t) => t.id));
    // The dormant layer is an empty dashed room under its one line; the lit
    // layer is the four tags. ("not written down" IS the reading.)
    expect(today.layer.rows).toHaveLength(0);
    expect(today.layer.sub).toBeTruthy();
    expect(configured.layer.rows).toHaveLength(4);
    // The dormant card is the people's work line; the lit card answers.
    expect(today.card.work).toBeTruthy();
    expect(configured.card.q).toBeTruthy();
    // Exactly one tool is lit, and only on the configured board; the note
    // rides the lit item alone.
    expect(today.tools.items.filter((t) => t.lit)).toHaveLength(0);
    expect(configured.tools.items.filter((t) => t.lit)).toHaveLength(1);
    for (const s of b.states) {
      for (const t of s.tools.items) {
        expect(!t.note || t.lit, `${s.mode}.${t.id}: a note on an unlit tool`).toBe(true);
      }
    }
    /* The budgets: the owner's "keep it simple on the left" and "radically
       simplify it", as counts the record can be held to — ten strings on
       the dormant board, seventeen on the lit one. */
    expect(lettered(today)).toBeLessThanOrEqual(10);
    expect(lettered(configured)).toBeLessThanOrEqual(17);
    /* ⚠ NO DIGIT ON THE DRAWING, the ruling this beat has carried since
       ADR-094 U7: it plots the configuration, it does not measure it. */
    scanStrings(b, "board", (value, path) => {
      expect(/\d/.test(value), `${path}: a figure on the board`).toBe(false);
    });
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
