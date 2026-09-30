import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ABOUT_DWELL_SVH,
  ABOUT_ERA_PIN_U,
  ABOUT_HANDOFF_U,
  ABOUT_RUN_SVH,
  A_BOX_OUT,
  A_OUT,
  CARD_FLIGHT,
  DECK_SQUARE,
  ERA_OVERLAP_SVH,
  ERA_WELD_SVH,
  FOLD,
  LABELS_OUT,
  NAME_GLIDE,
  OPEN,
  RINGS_CLOSE,
  TRAVEL,
  aboutState,
  aboutU,
  APERTURE_FEATHER_VH,
  apertureFeather,
  apertureHalf,
  apertureHalfMax,
  apertureInset,
  cardFlight,
  easeInOutCubic,
  featherStops,
  flowState,
  windowOf,
} from "@/app/(marketing)/arcs/thoughtform-workshop/flow/flowClock";

/**
 * The workshop's opening flow (ADR-138): About → the eras → the Arc. The
 * clock is pure; the CSS declares the same lengths and has to exist before
 * hydration, so the two are pinned equal here.
 */

const ROOT = resolve(__dirname, "../..");
const CSS = readFileSync(
  resolve(ROOT, "app/(marketing)/arcs/thoughtform-workshop/thoughtform-workshop.css"),
  "utf8"
);
const VOIDWALKER_CSS = readFileSync(
  resolve(ROOT, "components/landing/home-v2/voidwalker/voidwalker.css"),
  "utf8"
);

function svhToken(name: string): number {
  const m = CSS.match(new RegExp(`${name}:\\s*([\\d.]+)svh;`));
  if (!m) throw new Error(`${name} is not declared in svh in thoughtform-workshop.css`);
  return Number(m[1]);
}

describe("the flow's lengths are the sheet's (lockstep)", () => {
  it("declares the dwell, the run, the era overlap and the mount weld as the clock does", () => {
    expect(svhToken("--tw-about-dwell")).toBe(ABOUT_DWELL_SVH);
    expect(svhToken("--tw-about-run")).toBe(ABOUT_RUN_SVH);
    expect(svhToken("--tw-era-overlap")).toBe(ERA_OVERLAP_SVH);
    expect(svhToken("--tw-era-weld")).toBe(ERA_WELD_SVH);
  });

  it("the About's runway is the viewport plus the dwell and the run", () => {
    expect(CSS).toMatch(
      /height:\s*calc\(100svh \+ var\(--tw-about-dwell\) \+ var\(--tw-about-run\)\)/
    );
  });

  it("welds the corridor mount and the era by the tokens, keyed on the writer's stamp", () => {
    expect(CSS).toMatch(
      /\.tw-root\[data-tw-flow\] \[data-home-corridor-mount\]\s*\{\s*margin-top:\s*calc\(-1 \* var\(--tw-era-weld\)\);/
    );
    expect(CSS).toMatch(
      /\.tw-root\[data-tw-flow\] #voidwalker\[data-vw-mode="hologram"\]\[data-vw-handoff="ready"\]\.station\s*\{\s*margin-top:\s*calc\(-1 \* var\(--tw-era-overlap\)\);/
    );
  });

  it("the era overlap is the homepage's own (voidwalker.css)", () => {
    const m = VOIDWALKER_CSS.match(/margin-top:\s*-(\d+)svh/);
    expect(m, "voidwalker.css carries the era's -Nsvh weld").not.toBeNull();
    expect(Number(m![1])).toBe(ERA_OVERLAP_SVH);
  });

  it("gates the flow on the era hook's own capable rung", () => {
    expect(CSS).toMatch(
      /@media \(min-width: 1101px\) and \(prefers-reduced-motion: no-preference\)/
    );
  });
});

describe("the windows are ordered", () => {
  const inUnit = (w: readonly [number, number]) => {
    expect(w[0]).toBeGreaterThanOrEqual(0);
    expect(w[1]).toBeLessThanOrEqual(1);
    expect(w[1]).toBeGreaterThan(w[0]);
  };

  it("every window is a proper interval of its clock", () => {
    for (const w of [
      A_OUT,
      A_BOX_OUT,
      LABELS_OUT,
      RINGS_CLOSE,
      DECK_SQUARE,
      CARD_FLIGHT,
      NAME_GLIDE,
    ]) {
      inUnit(w);
    }
    for (const w of [TRAVEL, FOLD, OPEN]) inUnit(w);
  });

  it("the era pins at u 0.8, and the card and the name are seated by then", () => {
    expect(ABOUT_ERA_PIN_U).toBeCloseTo(
      (100 + ABOUT_RUN_SVH - ERA_OVERLAP_SVH) / ABOUT_RUN_SVH,
      12
    );
    expect(ABOUT_ERA_PIN_U).toBeCloseTo(0.8, 12);
    expect(CARD_FLIGHT[1]).toBeLessThanOrEqual(ABOUT_ERA_PIN_U);
    expect(NAME_GLIDE[1]).toBeLessThanOrEqual(ABOUT_ERA_PIN_U);
  });

  it("the deck squares up before the card flies, and the copy has left first", () => {
    expect(DECK_SQUARE[1]).toBeGreaterThanOrEqual(CARD_FLIGHT[0]);
    expect(DECK_SQUARE[0]).toBeLessThan(CARD_FLIGHT[0]);
    expect(A_OUT[1]).toBeLessThanOrEqual(CARD_FLIGHT[0]);
  });

  it("the About hands over after the era's own morph ([0, 0.08] of its progress)", () => {
    // The era's progress over the About's run: it pins at u 0.8 and its
    // pinned travel is 160svh, so its morph ends at u 0.8 + 0.08 · 1.6.
    const morphEndU = ABOUT_ERA_PIN_U + (0.08 * 160) / ABOUT_RUN_SVH;
    expect(ABOUT_HANDOFF_U).toBeGreaterThan(morphEndU);
    expect(ABOUT_HANDOFF_U).toBeLessThan(1);
  });

  it("the seam is TRAVEL, then FOLD, then OPEN, and all of it after the era band", () => {
    expect(TRAVEL[0]).toBeGreaterThanOrEqual(0.72);
    expect(FOLD[0]).toBeGreaterThanOrEqual(TRAVEL[0]);
    expect(FOLD[1]).toBeGreaterThanOrEqual(TRAVEL[1]);
    expect(OPEN[0]).toBeGreaterThanOrEqual(FOLD[0]);
    expect(OPEN[0]).toBeLessThan(FOLD[1] + 1e-9);
    expect(OPEN[1]).toBe(1);
  });
});

describe("the clock's functions", () => {
  it("easeInOutCubic is 0, ½ and 1 at its ends and midpoint, and clamps", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 12);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(-3)).toBe(0);
    expect(easeInOutCubic(4)).toBe(1);
  });

  it("windowOf clamps to [0, 1]", () => {
    expect(windowOf(0.74, TRAVEL)).toBe(0);
    expect(windowOf(0.88, TRAVEL)).toBe(1);
    expect(windowOf(0.81, TRAVEL)).toBeCloseTo(0.5, 12);
    expect(windowOf(-1, TRAVEL)).toBe(0);
    expect(windowOf(2, TRAVEL)).toBe(1);
  });

  it("aboutU is 0 at the dwell's end and 1 at the run's end, and unclamped", () => {
    const vh = 900;
    expect(aboutU(-0.5 * vh, vh)).toBeCloseTo(0, 12);
    expect(aboutU(-1.5 * vh, vh)).toBeCloseTo(1, 12);
    expect(aboutU(0, vh)).toBeLessThan(0);
    expect(aboutU(0, 0)).toBe(0);
  });

  it("aboutState holds through the dwell, runs, and is done at the handoff", () => {
    expect(aboutState(-0.2)).toBe("hold");
    expect(aboutState(0)).toBe("hold");
    expect(aboutState(0.01)).toBe("run");
    expect(aboutState(ABOUT_HANDOFF_U - 1e-6)).toBe("run");
    expect(aboutState(ABOUT_HANDOFF_U)).toBe("done");
    expect(aboutState(Number.NaN)).toBe("hold");
  });

  it("flowState reads about → era → seam → done off the era's progress", () => {
    expect(flowState(0)).toBe("about");
    expect(flowState(0.3)).toBe("era");
    expect(flowState(TRAVEL[0])).toBe("seam");
    expect(flowState(0.99)).toBe("seam");
    expect(flowState(1)).toBe("done");
  });

  it("cardFlight is identity at 0 and lands the card's centre and width on the seat at 1", () => {
    const card = { x: 900, y: 200, w: 300, h: 486 };
    const seat = { x: 700, y: 120, w: 420, h: 680 };
    const start = cardFlight(card, seat, 0);
    expect(Math.abs(start.dx)).toBe(0);
    expect(Math.abs(start.dy)).toBe(0);
    expect(start.s).toBe(1);
    const end = cardFlight(card, seat, 1);
    expect(card.x + card.w / 2 + end.dx).toBeCloseTo(seat.x + seat.w / 2, 9);
    expect(card.y + card.h / 2 + end.dy).toBeCloseTo(seat.y + seat.h / 2, 9);
    expect(card.w * end.s).toBeCloseTo(seat.w, 9);
  });

  it("the aperture clears the frame's farthest corner at OPEN's end, and is shut before it", () => {
    const max = apertureHalfMax(1000, 400, 1440, 900);
    expect(max).toBe(1000 + 8);
    expect(apertureHalf(OPEN[0], max)).toBe(0);
    expect(apertureHalf(1, max)).toBe(max);
    expect(apertureInset(0)).toBe(50);
    expect(apertureInset(1)).toBe(0);
  });

  it("the soft edge is a share of the frame's height, and the final square clears it", () => {
    expect(APERTURE_FEATHER_VH).toBe(8);
    expect(apertureFeather(900)).toBeCloseTo(72, 9);
    expect(apertureFeather(-5)).toBe(0);
    // At OPEN's end the corners must be past the ramp, not in it.
    const f = apertureFeather(900);
    expect(apertureHalfMax(1000, 400, 1440, 900, f)).toBeCloseTo(1000 + f + 8, 9);
  });

  it("featherStops is transparent everywhere when shut, and opaque over the frame when open", () => {
    const shut = featherStops(0, 0, 1000, 400, 0, 72);
    expect(new Set(shut.x).size).toBe(1);
    expect(new Set(shut.y).size).toBe(1);
    const f = apertureFeather(900);
    const max = apertureHalfMax(1000, 400, 1440, 900, f);
    const open = featherStops(0, 0, 1000, 400, max, f);
    // The opaque run covers the whole 1440 × 900 frame.
    expect(open.x[1]).toBeLessThanOrEqual(0);
    expect(open.x[2]).toBeGreaterThanOrEqual(1440);
    expect(open.y[1]).toBeLessThanOrEqual(0);
    expect(open.y[2]).toBeGreaterThanOrEqual(900);
  });

  it("featherStops ramps over the feather, in the element's own coordinates, and never folds", () => {
    const mid = featherStops(900, 300, 1000, 400, 100, 30);
    expect(mid.x).toEqual([0, 30, 170, 200]);
    expect(mid.y).toEqual([0, 30, 170, 200]);
    // A square smaller than its feather peaks at the centre.
    const small = featherStops(0, 0, 1000, 400, 10, 72);
    expect(small.x[1]).toBeCloseTo(1000, 9);
    expect(small.x[2]).toBeCloseTo(1000, 9);
    for (const s of [mid, small]) {
      for (const axis of [s.x, s.y]) {
        for (let i = 1; i < 4; i++) expect(axis[i]).toBeGreaterThanOrEqual(axis[i - 1]!);
      }
    }
  });
});
