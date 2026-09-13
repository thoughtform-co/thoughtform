import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TRINNY_BOARD } from "@/app/(marketing)/arcs/trinny-london/proposal/offer/offerSections";
import {
  BAND_PX,
  BAND_Y,
  CUT,
  DATUM_Y,
  FS_FLOOR,
  GAP1,
  INSET,
  MARGIN,
  MODULE_H,
  PAD,
  SANS_ADV,
  SEAT_H,
  VB,
  boardFloorPx,
  boardGeom,
  letterWidth,
  type BoardGeom,
  type BoardLetter,
} from "@/components/arcs/board/boardLayout";
import { adv } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import { MODULE } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";
import type { BoardState } from "@/lib/arcs/types";

/**
 * THE BOARD's fit guard (ADR-100 U1) — the drawing measured against its own
 * declaration.
 *
 * ⚠ SVG `<text>` NEITHER WRAPS NOR REPORTS OVERFLOW: a label past its
 * measure vanishes with nothing on screen to say so. So `boardGeom` emits
 * every lettered string WITH the measure it must fit, and this walk holds
 * each one to it — mono through the surface's advance model, sans through
 * the measured 0.55 em cell — plus the longest WORD (a wrap that fits per
 * line can still put one word through a wall), the type floor at the
 * binding band, the chain's closure, the cut law and the CSS box's parity
 * with the crops. The live half is the smoke's overlap walk and its
 * rendered-px floor; neither half is sufficient alone (the arithmetic
 * cannot see a CSS change, the smoke cannot say which constant to move).
 *
 * ⚠ ONE CROP, FIXED. The first cut walked six extensions of an elastic
 * crop; the owner's "radically simplify it" took the extension with the
 * bed, the sockets and the foot it was buying room for.
 */

function states(): readonly [BoardState<"today">, BoardState<"configured">] {
  if (TRINNY_BOARD.kind !== "board") throw new Error("the Trinny beat is not a board");
  return TRINNY_BOARD.states;
}

const longestWord = (text: string) =>
  text.split(" ").reduce((a, b) => (b.length > a.length ? b : a), "");

const wordWidth = (l: BoardLetter, word: string) =>
  l.face === "mono" ? word.length * adv(l.fs, l.track) : word.length * SANS_ADV * l.fs;

describe("arc board fit (ADR-100)", () => {
  it("the chain closes: datum, seat, cable, one module row, and the margin under it", () => {
    expect(DATUM_Y + MARGIN + SEAT_H + GAP1).toBe(BAND_Y);
    expect(BAND_Y + MODULE_H + MARGIN).toBe(VB.h);
    expect(VB.w.today + VB.seam + VB.w.configured).toBe(VB.row);
  });

  it("every lettered string fits its measure, word by word", () => {
    for (const state of states()) {
      const g = boardGeom(state);
      expect(g.vb.h, `${state.mode}: the crop is the chain's`).toBe(VB.h);
      expect(g.letters.length, `${state.mode}: letters`).toBeGreaterThan(0);
      for (const l of g.letters) {
        const at = `${state.mode} ${l.slot} "${l.text}"`;
        expect(l.text.trim().length, `${at}: blank`).toBeGreaterThan(0);
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
    for (const state of states()) {
      for (const l of boardGeom(state).letters) {
        expect(
          (l.fs * BAND_PX["1280x720"]) / VB.row,
          `${state.mode} ${l.slot}`
        ).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it("every letter sits inside its own module, and the cuts are the house's", () => {
    expect(CUT.module).toBe(MODULE.cut);
    expect(PAD.module).toBe(MODULE.pad);
    for (const state of states()) {
      const g = boardGeom(state);
      for (const l of g.letters) {
        if (l.role === "head" || l.anchor !== "start") continue;
        const m = moduleFor(g, l);
        expect(m, `${state.mode} ${l.slot}: no module holds it`).toBeTruthy();
        if (!m) continue;
        expect(l.x, `${state.mode} ${l.slot}: left of its wall`).toBeGreaterThanOrEqual(
          m.rect.x + 4
        );
        expect(
          l.x + letterWidth(l),
          `${state.mode} ${l.slot}: through its wall`
        ).toBeLessThanOrEqual(m.rect.x + m.rect.w - 4 + 1e-6);
        expect(l.y, `${state.mode} ${l.slot}: above its module`).toBeGreaterThan(m.rect.y);
        expect(l.y, `${state.mode} ${l.slot}: below its module`).toBeLessThanOrEqual(
          m.rect.y + m.rect.h
        );
      }
      // The head strip stays on the crop's inset; every module inside it.
      expect(g.datum.x1).toBe(INSET);
      expect(g.datum.x2).toBe(g.vb.w - INSET);
      for (const m of g.modules) {
        expect(m.rect.x, `${state.mode} ${m.id}: past the inset`).toBeGreaterThanOrEqual(INSET);
        expect(m.rect.x + m.rect.w, `${state.mode} ${m.id}: past the inset`).toBeLessThanOrEqual(
          g.vb.w - INSET
        );
        expect(m.rect.y + m.rect.h, `${state.mode} ${m.id}: below the floor`).toBeLessThanOrEqual(
          VB.h - MARGIN
        );
      }
    }
  });

  it("the three ribbons run wall to wall on the lit board", () => {
    const [, configured] = states();
    const g = boardGeom(configured);
    const card = g.modules.find((m) => m.id === "card")!;
    const layer = g.modules.find((m) => m.id === "layer")!;
    const tools = g.modules.find((m) => m.id === "tools")!;
    const seat = g.modules.find((m) => m.id === "seat")!;
    const lane = (id: string) => g.lanes.find((l) => l.id === id)!;
    expect(g.lanes.map((l) => l.id)).toEqual(["seat", "layer", "tools"]);
    expect(lane("seat").pts[0][1]).toBeCloseTo(seat.rect.y + seat.rect.h, 6);
    expect(lane("seat").pts[1][1]).toBeCloseTo(card.rect.y, 6);
    expect(lane("layer").pts[0][0]).toBeCloseTo(card.rect.x, 6);
    expect(lane("layer").pts[1][0]).toBeCloseTo(layer.rect.x + layer.rect.w, 6);
    expect(lane("tools").pts[0][0]).toBeCloseTo(card.rect.x + card.rect.w, 6);
    expect(lane("tools").pts[1][0]).toBeCloseTo(tools.rect.x, 6);
    // Every lane's `--l` is its own polyline length, never a guess; every
    // lane is the eight-wire bundle.
    for (const l of g.lanes) {
      expect(l.len).toBeGreaterThan(0);
      expect(l.wires).toBe(8);
    }
  });

  it("green is the human and gold is the built thing, on both boards", () => {
    const [today, configured] = states();
    const t = boardGeom(today);
    const k = boardGeom(configured);
    // The dormant board lights nothing gold, seats no one in green, and runs
    // no cable.
    expect(t.modules.filter((m) => m.paint === "card-lit" || m.paint === "seat-lit")).toHaveLength(
      0
    );
    expect(t.diamonds.filter((d) => d.paint === "gold-line")).toHaveLength(0);
    expect(t.lanes).toHaveLength(0);
    // Its card is green — the work is all the people's.
    expect(t.modules.find((m) => m.id === "card")?.paint).toBe("card-led");
    // The lit board: one lit card, one green seat, one green cable, and the
    // one lit tool marked.
    expect(k.modules.filter((m) => m.paint === "card-lit")).toHaveLength(1);
    expect(k.modules.filter((m) => m.paint === "seat-lit")).toHaveLength(1);
    expect(k.lanes.filter((l) => l.paint === "green")).toHaveLength(1);
    expect(k.diamonds.filter((d) => d.role === "tools" && d.filled)).toHaveLength(1);
  });

  it("the label sets are pinned, per state", () => {
    const [today, configured] = states();
    const texts = (s: BoardState) =>
      boardGeom(s)
        .letters.map((l) => l.text)
        .sort();
    expect(texts(today)).toEqual([
      "AS IT RUNS TODAY",
      "CLAUDE",
      "MONDAY",
      "No one, as their day job",
      "SLACK",
      "THE LAYER",
      "THE STUDIO",
      "WHO OWNS IT",
      "all by hand",
      "not written down",
    ]);
    expect(texts(configured)).toEqual([
      "A brand Skill, on the",
      "CLAUDE",
      "EXAMPLES",
      "LOOPS",
      "MONDAY",
      "RULES",
      "SLACK",
      "SOURCES",
      "THE LAYER",
      "THE STUDIO",
      "The studio lead",
      "WHAT RUNS IT",
      "WHERE IT RUNS",
      "WHO OWNS IT",
      "WITH A CONFIGURATION",
      "inside Figma",
      "team's own keys",
      "the founder's sense-check last",
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
