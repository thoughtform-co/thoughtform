import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TRINNY_BOARD } from "@/app/(marketing)/arcs/trinny-london/proposal/offer/offerSections";
import {
  BAND_PX,
  BAND_Y,
  CUT,
  FACTS,
  FLOOR_Y,
  FS_FLOOR,
  GAP1,
  GAP2,
  INSET,
  MODULE_H,
  NODE_H,
  NODE_Y,
  PAD,
  ROW_H,
  SANS_ADV,
  SEAT_H,
  TOP_Y,
  VB,
  boardFloorPx,
  boardGeom,
  letterWidth,
  type BoardGeom,
  type BoardLetter,
} from "@/components/arcs/board/boardLayout";
import { adv } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import { MODULE } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";
import { ARCS } from "@/lib/arcs/registry";
import type { BoardState } from "@/lib/arcs/types";

/**
 * THE BOARD's fit guard (ADR-100 U2) — the drawing measured against its own
 * declaration.
 *
 * ⚠ SVG `<text>` NEITHER WRAPS NOR REPORTS OVERFLOW: a label past its
 * measure vanishes with nothing on screen to say so. So `boardGeom` emits
 * every lettered string WITH the measure it must fit, and this walk holds
 * each one to it — mono through the surface's advance model, sans through
 * the measured 0.55 em cell — plus the longest WORD, the type floor at the
 * binding band, the chain's closure, the cut law and the CSS box's parity
 * with the crops. The live half is the smoke's overlap walk and its
 * rendered-px floor; neither half is sufficient alone (the arithmetic
 * cannot see a CSS change, the smoke cannot say which constant to move).
 *
 * ⚠ AND THE NO-DIGIT WALK IS HERE, NOT ONLY ON THE RECORD. The ledger's
 * tools row is COMPOSED at draw time (the item names joined), and a string
 * built in a renderer is outside every content scanner — the finding
 * ADR-070 U15 paid for with `8 TEAMS` on a public page.
 */

type States = readonly [BoardState<"today">, BoardState<"configured">];

function trinnyStates(): States {
  if (TRINNY_BOARD.kind !== "board") throw new Error("the Trinny beat is not a board");
  return TRINNY_BOARD.states;
}

/**
 * ⚠ EVERY REGISTERED BOARD IS WALKED, NOT ONLY TRINNY'S (ADR-128). The kind was
 * guarded "so a registered proposal can adopt it", and the first one to do so
 * (Pandora) letters a longer tools row than Trinny's — a fit walk that only
 * read the Trinny record would have stayed green over a row through the wall.
 * The label-set pin below stays Trinny's own; the geometry is every board's.
 */
const BOARDS: readonly (readonly [string, States])[] = [
  ["trinny", trinnyStates()],
  ...ARCS.flatMap((arc) =>
    arc.sections.flatMap((section) =>
      section.kind === "board" ? [[`${arc.slug}#${section.id}`, section.states] as const] : []
    )
  ),
];

/** Every board's states, flattened, each tagged with its home for the message. */
function states(): readonly (BoardState & { home: string })[] {
  return BOARDS.flatMap(([home, pair]) => pair.map((state) => ({ ...state, home })));
}

const longestWord = (text: string) =>
  text.split(" ").reduce((a, b) => (b.length > a.length ? b : a), "");

const wordWidth = (l: BoardLetter, word: string) =>
  l.face === "mono" ? word.length * adv(l.fs, l.track) : word.length * SANS_ADV * l.fs;

describe("arc board fit (ADR-100)", () => {
  it("both sides share the top and the floor, and the cross is symmetric", () => {
    /* One inset on all four sides since U4 deleted the head strips: both
       drawings start at TOP_Y and end at FLOOR_Y, and the crop closes on
       the same inset it opened with. */
    expect(TOP_Y).toBe(INSET);
    expect(TOP_Y + SEAT_H + GAP1).toBe(BAND_Y);
    expect(BAND_Y + MODULE_H + GAP2).toBe(NODE_Y);
    expect(NODE_Y + NODE_H).toBe(FLOOR_Y);
    expect(FLOOR_Y + INSET).toBe(VB.h);
    // The ledger's five rows run from that top to that floor.
    expect(TOP_Y + FACTS * ROW_H).toBe(FLOOR_Y);
    expect(VB.w.today + VB.seam + VB.w.configured).toBe(VB.row);
  });

  it("every lettered string fits its measure, word by word, and letters no digit", () => {
    for (const state of states()) {
      const g = boardGeom(state);
      expect(g.vb.h, `${state.home} ${state.mode}: the crop is the chain's`).toBe(VB.h);
      expect(g.letters.length, `${state.home} ${state.mode}: letters`).toBeGreaterThan(0);
      for (const l of g.letters) {
        const at = `${state.home} ${state.mode} ${l.slot} "${l.text}"`;
        expect(l.text.trim().length, `${at}: blank`).toBeGreaterThan(0);
        expect(/\d/.test(l.text), `${at}: a figure on the drawing`).toBe(false);
        // A wrapped line past the cap is declared at measure 0 — the tail
        // the drawing would slice in silence.
        expect(l.measure, `${at}: a sliced tail`).toBeGreaterThan(0);
        expect(letterWidth(l), `${at}: past its measure`).toBeLessThanOrEqual(l.measure + 1e-6);
        expect(
          wordWidth(l, longestWord(l.text)),
          `${at}: a word through the wall`
        ).toBeLessThanOrEqual(l.measure + 1e-6);
        expect(l.fs, `${at}: under the floor`).toBeGreaterThanOrEqual(FS_FLOOR);
      }
    }
  });

  it("the type floor holds at the binding band", () => {
    // 15.3 units at 1022px is 11.2px — above the surface's 10px control
    // floor, and the number that moves first if the crops, the seam or the
    // flex bases move.
    expect(boardFloorPx(BAND_PX["1280x720"])).toBeGreaterThanOrEqual(10);
    /* ⚠ THE TEXT BAND, NOT THE INSTRUMENT BAND (U4). 1200 is `--band-max`;
       reading 1440 here would measure a floor the drawing no longer has. */
    expect(BAND_PX["1920x1247"]).toBe(1200);
    expect(BAND_PX["1920x1080"]).toBe(1200);
    for (const state of states()) {
      for (const l of boardGeom(state).letters) {
        expect(
          (l.fs * BAND_PX["1280x720"]) / VB.row,
          `${state.home} ${state.mode} ${l.slot}`
        ).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it("every letter sits inside its own object, and the cuts are the house's", () => {
    expect(CUT.module).toBe(MODULE.cut);
    expect(PAD.module).toBe(MODULE.pad);
    for (const state of states()) {
      const g = boardGeom(state);
      for (const l of g.letters) {
        if (l.anchor !== "start") continue;
        const m = moduleFor(g, l);
        expect(m, `${state.home} ${state.mode} ${l.slot}: no object holds it`).toBeTruthy();
        if (!m) continue;
        /* ⚠ A LEDGER ROW HAS NO WALL. Its content hangs on the crop's own
           inset, which is the row's left edge — a module's 4-unit clearance
           is about padding, and a row has none. */
        const pad = m.paint === "row" ? 0 : 4;
        expect(
          l.x,
          `${state.home} ${state.mode} ${l.slot}: left of its wall`
        ).toBeGreaterThanOrEqual(m.rect.x + pad);
        expect(
          l.x + letterWidth(l),
          `${state.home} ${state.mode} ${l.slot}: through its wall`
        ).toBeLessThanOrEqual(m.rect.x + m.rect.w - pad + 1e-6);
        expect(l.y, `${state.home} ${state.mode} ${l.slot}: above its object`).toBeGreaterThan(
          m.rect.y
        );
        expect(l.y, `${state.home} ${state.mode} ${l.slot}: below its object`).toBeLessThanOrEqual(
          m.rect.y + m.rect.h
        );
      }
      /* Every object inside the crop's own inset, on all four sides — the
         head strips are gone, so the inset is the whole frame (U4). */
      for (const m of g.modules) {
        expect(
          m.rect.y,
          `${state.home} ${state.mode} ${m.id}: above the top`
        ).toBeGreaterThanOrEqual(TOP_Y);
        expect(
          m.rect.x,
          `${state.home} ${state.mode} ${m.id}: past the inset`
        ).toBeGreaterThanOrEqual(INSET);
        expect(
          m.rect.x + m.rect.w,
          `${state.home} ${state.mode} ${m.id}: past the inset`
        ).toBeLessThanOrEqual(g.vb.w - INSET);
        expect(
          m.rect.y + m.rect.h,
          `${state.home} ${state.mode} ${m.id}: below the floor`
        ).toBeLessThanOrEqual(FLOOR_Y);
      }
    }
  });

  it.each(BOARDS)(
    "the dormant side is a LEDGER and the lit side is a BOARD (%s)",
    (_home, pair) => {
      const [today, configured] = pair;
      const t = boardGeom(today);
      const k = boardGeom(configured);
      /* ⚠ THE CONTRAST IS THE KIND OF OBJECT, NOT THE BRIGHTNESS (U2). Four
       rows, no housing, no cable, no colour on the left; the assembled
       board on the right. Drawn as dashed modules the left read as the
       right greyed out, which is what the owner rejected. */
      expect(t.modules).toHaveLength(FACTS);
      expect(t.modules.every((m) => m.paint === "row" && m.cut === 0)).toBe(true);
      /* ⚠ EVERY ROW RULES ITS BOTTOM and the ledger opens UNRULED: with the
       datum gone (U4) a rule at the crop's top would be a line with no
       object over it, and the last row's closes on the board's own floor. */
      expect(t.modules.every((m) => m.rule === "bottom")).toBe(true);
      expect(t.lanes).toHaveLength(0);
      // The five facts, in the order both sides read them.
      expect(t.modules.map((m) => m.role)).toEqual(["seat", "layer", "card", "tools", "reach"]);
      // The lit side: one green seat, one gold chip, three head bands.
      expect(k.modules.filter((m) => m.paint === "seat-lit")).toHaveLength(1);
      expect(k.modules.filter((m) => m.paint === "card-lit")).toHaveLength(1);
      expect(k.modules.filter((m) => m.head)).toHaveLength(3);
      expect(k.modules.some((m) => m.paint === "row")).toBe(false);
      expect(k.modules.map((m) => m.role)).toEqual(["seat", "layer", "card", "tools", "reach"]);
      /* ⚠ THE CORNER IS PINNED FROM BOTH ENDS (ADR-065 U4/U5's own finding: a
       one-sided assertion verifies a cut EXISTS, never that it is on the
       right corner). The chip is TOP-RIGHT alone — it is what becomes the
       offer's phase plates — and every housing around it keeps the pair. */
      expect(k.modules.find((m) => m.id === "card")?.notch).toBe("tr");
      for (const m of k.modules) {
        if (m.id === "card") continue;
        expect(m.notch, `${m.id}: a lone notch on a housing`).toBeUndefined();
      }
      for (const m of t.modules) {
        expect(m.notch, `${m.id}: a ledger row has no corner`).toBeUndefined();
      }
    }
  );

  it.each(BOARDS)(
    "the four ribbons run wall to wall and meet the chip, a cross (%s)",
    (_home, pair) => {
      const [, configured] = pair;
      const g = boardGeom(configured);
      const card = g.modules.find((m) => m.id === "card")!;
      const layer = g.modules.find((m) => m.id === "layer")!;
      const tools = g.modules.find((m) => m.id === "tools")!;
      const seat = g.modules.find((m) => m.id === "seat")!;
      const node = g.modules.find((m) => m.id === "reach")!;
      const lane = (id: string) => g.lanes.find((l) => l.id === id)!;
      const cx = card.rect.x + card.rect.w / 2;
      const cy = card.rect.y + card.rect.h / 2;
      expect(g.lanes.map((l) => l.id)).toEqual(["seat", "layer", "tools", "reach"]);
      expect(lane("seat").pts[0][1]).toBeCloseTo(seat.rect.y + seat.rect.h, 6);
      expect(lane("seat").pts[1][1]).toBeCloseTo(card.rect.y, 6);
      // The seat drops onto the chip's own centre line, not a module's corner.
      expect(lane("seat").pts[0][0]).toBeCloseTo(card.rect.x + card.rect.w / 2, 6);
      expect(lane("layer").pts[0]).toEqual([card.rect.x, cy]);
      expect(lane("layer").pts[1][0]).toBeCloseTo(layer.rect.x + layer.rect.w, 6);
      expect(lane("tools").pts[0]).toEqual([card.rect.x + card.rect.w, cy]);
      expect(lane("tools").pts[1][0]).toBeCloseTo(tools.rect.x, 6);
      /* ⚠ THE FIFTH FACT HANGS OFF THE CHIP'S FLOOR ON THE SEAT'S OWN RUN —
       equal lengths above and below is what makes the drawing a CROSS on the
       one lit object rather than a row with something under it (U4). */
      expect(lane("reach").pts[0]).toEqual([cx, card.rect.y + card.rect.h]);
      expect(lane("reach").pts[1]).toEqual([cx, node.rect.y]);
      expect(lane("reach").len).toBeCloseTo(lane("seat").len, 6);
      // And the node is the seat's own box, mirrored below.
      expect(node.rect.x).toBe(seat.rect.x);
      expect(node.rect.w).toBe(seat.rect.w);
      for (const l of g.lanes) {
        expect(l.len).toBeGreaterThan(0);
        expect(l.wires).toBe(8);
      }
    }
  );

  it("the label sets are pinned, per state (Trinny)", () => {
    const [today, configured] = trinnyStates();
    const texts = (s: BoardState) =>
      boardGeom(s)
        .letters.map((l) => l.text)
        .sort();
    // Ten strings on the ledger, seventeen on the board — from 19 and 38
    // before U1, 10 and 18 before U2 folded the tools into one row, and 9 and
    // 16 before U4 took the head strips and added the fifth fact.
    expect(texts(today)).toEqual([
      "Claude, Figma, Monday, Slack",
      "No one, as their day job",
      "THE CONTEXT",
      "THE TOOLS",
      "THE WORK",
      "WHERE IT SCALES",
      "WHO OWNS IT",
      "all by hand",
      "not past the studio",
      "not written down",
    ]);
    expect(texts(configured)).toEqual([
      "AI CAPABILITY",
      "CLAUDE",
      "EXAMPLES",
      "FIGMA",
      "LOOPS",
      "MONDAY",
      "RULES",
      "SLACK",
      "SOURCES",
      "THE CONTEXT",
      "The studio lead, with the",
      "WHERE IT RUNS",
      "WHERE IT SCALES",
      "WHO OWNS IT",
      "founder's sign-off.",
      "into the rest of the business",
      "owned by the team",
    ]);
  });

  it("the CSS box agrees with the crops", () => {
    const css = readFileSync(join(__dirname, "..", "..", "components", "arcs", "arcs.css"), "utf8");
    expect(css).toMatch(new RegExp(`gap:\\s*calc\\(100% \\* ${VB.seam} / ${VB.row}\\)`));
    expect(css).toMatch(new RegExp(`flex-basis:\\s*calc\\(100% \\* ${VB.w.today} / ${VB.row}\\)`));
    expect(css).toMatch(
      new RegExp(`flex-basis:\\s*calc\\(100% \\* ${VB.w.configured} / ${VB.row}\\)`)
    );
    // The row sits at its own height: no cap, no aspect, no observer.
    expect(css).not.toMatch(/--arc-board-aspect|--arc-board-h:/);
    /* ⚠ AND THE HEAD TAKES THE STANDARD MARGIN (U4): the beat-local override
       existed to clear the head's coord stamp from the datum LABEL, which is
       deleted, and it was what put this drawing 45px under its dek where
       every plate beat's sits 143px under its own. */
    /* The DECLARATION and the rule, never the name: the block's comment
       still records what the override was and why it went, and a bare
       token regex fails on prose (`theme-css-sweep`'s own trap). */
    expect(css).not.toMatch(/--arc-board-gap:/);
    expect(css).not.toMatch(/\.arc-sec--board \.arc-head\s*\{/);
    // The fifth fact has a rung on both ladders, scoped by state.
    expect(css).toMatch(/\[data-board-state="configured"\] \[data-board-role="reach"\]/);
    expect(css).toMatch(/\[data-board-state="today"\] \[data-board-role="reach"\]/);
  });
});

function moduleFor(g: BoardGeom, l: BoardLetter) {
  const candidates = g.modules.filter((m) => m.role === l.role);
  return (
    candidates.find(
      (m) =>
        l.x >= m.rect.x &&
        l.x <= m.rect.x + m.rect.w &&
        l.y >= m.rect.y &&
        l.y <= m.rect.y + m.rect.h
    ) ?? null
  );
}
