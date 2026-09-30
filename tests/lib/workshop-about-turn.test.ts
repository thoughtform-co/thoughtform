import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  A_OUT,
  B_BODY_IN,
  B_TITLE_IN,
  CTA_OPEN,
  FLIP_BACK,
  FLIP_FRONT,
  GATE_OPEN,
  HANDOFF_AT,
  RING_CLOSE,
  TURN_DWELL_SVH,
  TURN_RUN_SVH,
  TURN_WELD_SVH,
  apertureInset,
  backFaceStart,
  easeInOutCubic,
  flipBackDeg,
  flipFrontDeg,
  gateHalf,
  gateHalfMax,
  lerpRect,
  ringRadius,
  turnState,
  turnU,
} from "@/app/(marketing)/arcs/thoughtform-workshop/about-turn/aboutTurnClock";

/**
 * The About → Arc turn on /arcs/thoughtform-workshop (ADR-137 U2): the clock
 * is pure, every channel ends at identity at both ends, and the CSS that must
 * exist before hydration declares the same three lengths the clock reads.
 */

const SHEET = readFileSync(
  path.join(process.cwd(), "app/(marketing)/arcs/thoughtform-workshop/thoughtform-workshop.css"),
  "utf8"
);

function svhToken(name: string): number {
  const m = new RegExp(`${name}:\\s*([\\d.]+)svh`).exec(SHEET);
  if (!m) throw new Error(`${name} is not declared in svh in the route sheet`);
  return Number(m[1]);
}

describe("the turn's runway (lockstep with the route sheet)", () => {
  it("declares the dwell, the run and the weld the clock reads", () => {
    expect(svhToken("--tw-turn-dwell")).toBe(TURN_DWELL_SVH);
    expect(svhToken("--tw-turn-run")).toBe(TURN_RUN_SVH);
    expect(svhToken("--tw-turn-weld")).toBe(TURN_WELD_SVH);
  });

  it("welds the corridor by exactly the run, so About unpins as the corridor pins", () => {
    // The corridor is armed only while its mount's top is inside one
    // viewport; the turn lands on the armed frame, so the run is that viewport.
    expect(TURN_WELD_SVH).toBe(TURN_RUN_SVH);
    expect(TURN_RUN_SVH).toBe(100);
  });

  it("the station's height is 100svh plus the dwell plus the run", () => {
    expect(SHEET).toMatch(
      /height:\s*calc\(100svh \+ var\(--tw-turn-dwell\) \+ var\(--tw-turn-run\)\)/
    );
    expect(SHEET).toMatch(/margin-top:\s*calc\(-1 \* var\(--tw-turn-weld\)\)/);
  });
});

describe("the turn clock", () => {
  const vh = 900;
  it("is 0 when the dwell ends and 1 when the station releases", () => {
    const dwell = (TURN_DWELL_SVH / 100) * vh;
    const run = (TURN_RUN_SVH / 100) * vh;
    expect(turnU(-dwell, vh)).toBe(0);
    expect(turnU(-(dwell + run), vh)).toBe(1);
    expect(turnU(0, vh)).toBeLessThan(0);
  });

  it("holds through the dwell, runs, and hands over at HANDOFF_AT", () => {
    expect(turnState(-0.5)).toBe("hold");
    expect(turnState(0)).toBe("hold");
    expect(turnState(0.01)).toBe("run");
    expect(turnState(HANDOFF_AT - 0.001)).toBe("run");
    expect(turnState(HANDOFF_AT)).toBe("done");
    expect(turnState(1.4)).toBe("done");
  });

  it("every window closes before the hand-over, so the stand-ins are at rest on it", () => {
    for (const [, end] of [
      A_OUT,
      RING_CLOSE,
      FLIP_FRONT,
      FLIP_BACK,
      GATE_OPEN,
      B_TITLE_IN,
      B_BODY_IN,
      CTA_OPEN,
    ]) {
      expect(end).toBeLessThan(HANDOFF_AT);
    }
  });

  it("the About leaves before the Arc's copy lands on the same column", () => {
    expect(A_OUT[1]).toBeLessThanOrEqual(B_TITLE_IN[0]);
  });

  it("the rings are gone before the card is edge-on, and the back face follows the front", () => {
    expect(RING_CLOSE[1]).toBeLessThanOrEqual(FLIP_FRONT[1]);
    expect(FLIP_BACK[0]).toBe(FLIP_FRONT[1]);
  });

  it("the gate opens after the mark has landed, and the button after the gate", () => {
    expect(GATE_OPEN[0]).toBeGreaterThanOrEqual(FLIP_BACK[0]);
    expect(CTA_OPEN[0]).toBeGreaterThan(GATE_OPEN[0]);
  });
});

describe("the channels", () => {
  it("ease in and out through the midpoint", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("the card turns 0 → 90 on its front and −90 → the live tilt on its back", () => {
    expect(flipFrontDeg(0)).toBe(0);
    expect(flipFrontDeg(FLIP_FRONT[1])).toBe(90);
    expect(flipBackDeg(FLIP_BACK[0], -3)).toBe(-90);
    expect(flipBackDeg(FLIP_BACK[1], -3)).toBe(-3);
  });

  it("the back face starts as a square the card's height at its centre, and lands exactly", () => {
    const portrait = { x: 100, y: 50, w: 270, h: 360 };
    const start = backFaceStart(portrait);
    expect(start.w).toBe(360);
    expect(start.h).toBe(360);
    expect(start.x + start.w / 2).toBe(portrait.x + portrait.w / 2);
    expect(start.y + start.h / 2).toBe(portrait.y + portrait.h / 2);
    const live = { x: 952, y: 354, w: 190, h: 192 };
    expect(lerpRect(start, live, 1)).toEqual(live);
    expect(lerpRect(start, live, 0)).toEqual(start);
  });

  it("the gate is shut at rest and clears every corner of the frame when open", () => {
    const max = gateHalfMax(1047, 450, 1440, 900);
    expect(gateHalf(0, max)).toBe(0);
    expect(gateHalf(GATE_OPEN[1], max)).toBe(max);
    expect(max).toBeGreaterThan(1047);
  });

  it("the rings clip nothing at rest and close to nothing", () => {
    expect(ringRadius(0, 368)).toBe(368);
    expect(ringRadius(RING_CLOSE[1], 368)).toBe(0);
  });

  it("the aperture is open at 1 and a centre slit at 0", () => {
    expect(apertureInset(1)).toBe(0);
    expect(apertureInset(0)).toBe(50);
  });
});
