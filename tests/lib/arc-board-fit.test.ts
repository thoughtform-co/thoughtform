import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TRINNY_BOARD } from "@/app/(marketing)/arcs/trinny-london/proposal/offer/offerSections";
import {
  BAND_PX,
  CUT,
  EXT_MAX,
  FS_FLOOR,
  INSET,
  PAD,
  SANS_ADV,
  VB,
  boardFloorPx,
  boardGeom,
  chain,
  letterWidth,
  type BoardGeom,
  type BoardLetter,
} from "@/components/arcs/board/boardLayout";
import { adv } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import { MODULE } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";
import type { BoardState } from "@/lib/arcs/types";

/**
 * THE BOARD's fit guard (ADR-100) — the drawing measured against its own
 * declaration, at rest and at every extension the elastic crop can reach.
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
 */

const EXTS = [0, 41, 55, 166, 314, EXT_MAX] as const;

function states(): readonly [BoardState<"today">, BoardState<"configured">] {
  if (TRINNY_BOARD.kind !== "board") throw new Error("the Trinny beat is not a board");
  return TRINNY_BOARD.states;
}

const longestWord = (text: string) =>
  text.split(" ").reduce((a, b) => (b.length > a.length ? b : a), "");

const wordWidth = (l: BoardLetter, word: string) =>
  l.face === "mono" ? word.length * adv(l.fs, l.track) : word.length * SANS_ADV * l.fs;

describe("arc board fit (ADR-100)", () => {
  it("the chain closes at every extension, with air on both sides", () => {
    for (const e of EXTS) {
      const c = chain(e);
      expect(c.cropH, `e=${e}: crop`).toBeCloseTo(VB.h + e, 6);
      expect(26 + c.m + 88 + c.gap1 + c.bandH + c.m + 26, `e=${e}: chain`).toBeCloseTo(VB.h + e, 6);
      expect(c.m, `e=${e}: margin`).toBeGreaterThan(0);
      expect(c.cellH, `e=${e}: cell pitch`).toBeGreaterThanOrEqual(89);
    }
  });

  it("every lettered string fits its measure, word by word, at every extension", () => {
    for (const state of states()) {
      for (const e of EXTS) {
        const g = boardGeom(state, e);
        expect(g.vb.h, `${state.mode} e=${e}: the crop is the chain's`).toBeCloseTo(VB.h + e, 6);
        for (const l of g.letters) {
          const at = `${state.mode} e=${e} ${l.slot} "${l.text}"`;
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
    }
  });

  it("the type floor holds at the binding band", () => {
    // 15.3 units at 1022px is 10.02px — the surface's control floor, and the
    // number that moves first if the crops, the seam or the flex bases move.
    expect(boardFloorPx(BAND_PX["1280x720"])).toBeGreaterThanOrEqual(10);
    for (const state of states()) {
      for (const l of boardGeom(state, 0).letters) {
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
      for (const e of EXTS) {
        const g = boardGeom(state, e);
        for (const l of g.letters) {
          if (l.role === "head" || l.role === "foot" || l.anchor !== "start") continue;
          if (l.slot === "sockets.note" || l.slot === "tools.note.0") continue;
          const m = moduleFor(g, l);
          expect(m, `${state.mode} e=${e} ${l.slot}: no module holds it`).toBeTruthy();
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
        // The head strip and foot row stay on the crop's inset.
        expect(g.datum.x1).toBe(INSET);
        expect(g.foot.x2).toBe(g.vb.w - INSET);
      }
    }
  });

  it("the ribbons run from wall to wall and the sockets sit on the band's floor", () => {
    const [, configured] = states();
    for (const e of EXTS) {
      const g = boardGeom(configured, e);
      const c = chain(e);
      const card = g.modules.find((m) => m.id === "card")!;
      const layer = g.modules.find((m) => m.id === "layer")!;
      const tools = g.modules.find((m) => m.id === "tools")!;
      const seat = g.modules.find((m) => m.id === "seat")!;
      const lane = (id: string) => g.lanes.find((l) => l.id === id)!;
      expect(lane("seat").pts[0][1]).toBeCloseTo(seat.rect.y + seat.rect.h, 6);
      expect(lane("seat").pts[1][1]).toBeCloseTo(card.rect.y, 6);
      expect(lane("layer").pts[1][0]).toBeCloseTo(layer.rect.x + layer.rect.w, 6);
      expect(lane("tools").pts[1][0]).toBeCloseTo(tools.rect.x, 6);
      for (const id of ["drop-l", "drop-r"] as const) {
        const d = lane(id);
        expect(d.pts[0][1]).toBeCloseTo(card.rect.y + card.rect.h, 6);
        // The jog is 45°: the diagonal's dx equals its dy.
        const [p1, p2] = [d.pts[1], d.pts[2]];
        expect(Math.abs(p2[0] - p1[0])).toBeCloseTo(Math.abs(p2[1] - p1[1]), 6);
      }
      const sockets = g.modules.filter((m) => m.role === "sockets");
      expect(sockets).toHaveLength(2);
      for (const s of sockets) expect(s.rect.y + s.rect.h + 28).toBeCloseTo(c.bandFloor, 6);
      expect(layer.rect.y + layer.rect.h).toBeCloseTo(c.bandFloor, 6);
      // Every lane's `--l` is its own polyline length, never a guess.
      for (const l of g.lanes) expect(l.len).toBeGreaterThan(0);
    }
  });

  it("green is the human and gold is the built thing, on both boards", () => {
    const [today, configured] = states();
    const t = boardGeom(today, 0);
    const k = boardGeom(configured, 0);
    // The dormant board lights nothing gold and seats no one in green.
    expect(t.modules.filter((m) => m.paint === "card-lit" || m.paint === "seat-lit")).toHaveLength(
      0
    );
    expect(t.diamonds.filter((d) => d.paint === "gold" || d.paint === "gold-line")).toHaveLength(0);
    expect(t.lanes).toHaveLength(0);
    expect(t.bed).toBeNull();
    // Its card is green — the work is all the people's.
    expect(t.modules.find((m) => m.id === "card")?.paint).toBe("card-led");
    // The lit board: one lit card, one green seat, one green cable.
    expect(k.modules.filter((m) => m.paint === "card-lit")).toHaveLength(1);
    expect(k.modules.filter((m) => m.paint === "seat-lit")).toHaveLength(1);
    expect(k.lanes.filter((l) => l.paint === "green")).toHaveLength(1);
    expect(k.bed).not.toBeNull();
  });

  it("the label sets are pinned, per state", () => {
    const [today, configured] = states();
    const texts = (s: BoardState) =>
      boardGeom(s, 0)
        .letters.map((l) => l.text)
        .sort();
    expect(texts(today)).toMatchInlineSnapshot(`
      [
        "AS IT RUNS TODAY",
        "BY HAND",
        "CLAUDE",
        "EXAMPLES",
        "LOOPS",
        "MONDAY",
        "NO OWNER",
        "No one, as their day job",
        "RULES",
        "SLACK",
        "SOURCES",
        "THE LAYER",
        "THE STUDIO",
        "UNWIRED",
        "WHO OWNS IT",
        "all by hand, and no",
        "creative strategist",
        "nothing written down",
        "trained on, not wired in",
      ]
    `);
    expect(texts(configured)).toMatchInlineSnapshot(`
      [
        "A brand Skill, on the",
        "CLAUDE",
        "CREATIVE OPS",
        "EXAMPLES",
        "FINANCE",
        "LOOPS",
        "MONDAY",
        "NO VENDOR IN THE WAY",
        "ONE CONFIGURATION",
        "On-brand, and the line",
        "RULES",
        "SLACK",
        "SOURCES",
        "THE BAR",
        "THE LAYER",
        "THE PEOPLE RUN IT",
        "THE STUDIO",
        "The studio lead",
        "WHAT RUNS IT",
        "WHERE IT RUNS",
        "WHO OWNS IT",
        "WITH A CONFIGURATION",
        "before the founder does",
        "brand rules, and the",
        "customer's voice",
        "from their own work",
        "inside Figma",
        "line where AI stops",
        "next, on the same layer",
        "owned by Trinny London",
        "team's own keys",
        "the alert",
        "the brief",
        "the catalogue and the",
        "the checks that catch it",
        "the founder's sense-check last",
        "what good looks like,",
        "where AI stops",
      ]
    `);
  });

  it("the CSS box agrees with the crops", () => {
    const css = readFileSync(join(__dirname, "..", "..", "components", "arcs", "arcs.css"), "utf8");
    const aspect = css.match(/--arc-board-aspect:\s*([\d.]+)/);
    expect(aspect, "--arc-board-aspect is declared").toBeTruthy();
    expect(Number(aspect![1])).toBeCloseTo(VB.row / VB.h, 3);
    expect(css).toMatch(new RegExp(`gap:\\s*calc\\(100% \\* ${VB.seam} / ${VB.row}\\)`));
    expect(css).toMatch(new RegExp(`flex-basis:\\s*calc\\(100% \\* ${VB.w.today} / ${VB.row}\\)`));
    expect(css).toMatch(
      new RegExp(`flex-basis:\\s*calc\\(100% \\* ${VB.w.configured} / ${VB.row}\\)`)
    );
    expect(VB.w.today + VB.seam + VB.w.configured).toBe(VB.row);
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
