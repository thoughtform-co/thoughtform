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
  CONNECTORS_DRAW,
  CORE_IN,
  LABELS_GLIDE,
  NODES_MORPH,
  ORBIT_OUT_AT,
  PARTICLES_IN,
  RINGS_MORPH,
  SVG_TEXT_OUT,
  TICKS_MORPH,
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
  angleDelta,
  circleAtAngles,
  closedPath,
  lerpRect,
  quadCentre,
  reseat,
  sampleQuad,
  spiralPoint,
  turnState,
  turnU,
} from "@/app/(marketing)/arcs/thoughtform-workshop/about-turn/aboutTurnClock";
import {
  COMPASS_GATE_DAWN,
  COMPASS_GATE_GOLD,
  COMPASS_RING_DASH,
  compassGateInk,
} from "@/components/landing/home-v2/compassGateScreenRef";

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
      SVG_TEXT_OUT,
      FLIP_FRONT,
      FLIP_BACK,
      PARTICLES_IN,
      RINGS_MORPH,
      CORE_IN,
      TICKS_MORPH,
      NODES_MORPH,
      LABELS_GLIDE,
      CONNECTORS_DRAW,
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

  it("the back face follows the front, and the orbit is spent before it hides", () => {
    expect(FLIP_BACK[0]).toBe(FLIP_FRONT[1]);
    for (const [, end] of [FLIP_FRONT, PARTICLES_IN, SVG_TEXT_OUT]) {
      expect(end).toBeLessThanOrEqual(ORBIT_OUT_AT);
    }
  });

  it("every part of the drawing lands BEFORE the ground opens, since the opening is the hand-over", () => {
    // The morph layer shares the ground's mask: the live gate shows inside
    // the opening, so a part still travelling when the opening reaches it
    // would show the live gate at rest beside a drawing still in motion.
    for (const [, end] of [RINGS_MORPH, CORE_IN, TICKS_MORPH, NODES_MORPH, CONNECTORS_DRAW]) {
      expect(end).toBeLessThanOrEqual(GATE_OPEN[0]);
    }
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

  it("a point on the spiral starts and ends exactly where it should", () => {
    const c0 = [100, 100] as const;
    const c1 = [300, 50] as const;
    const p0 = [150, 100] as const;
    const p1 = [300, 130] as const;
    expect(spiralPoint(c0, p0, c1, p1, 0)).toEqual([150, 100]);
    expect(spiralPoint(c0, p0, c1, p1, 1)).toEqual([300, 130]);
    const mid = spiralPoint(c0, p0, c1, p1, 0.5, 0.4);
    expect(Number.isFinite(mid[0]) && Number.isFinite(mid[1])).toBe(true);
  });

  it("turns the short way round", () => {
    expect(angleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(angleDelta(Math.PI * 0.9, -Math.PI * 0.9)).toBeCloseTo(Math.PI * 0.2);
  });

  it("samples a quad clockwise FROM ITS TOP-LEFT, where the gate's dashes start", () => {
    const q = [0, 0, 10, 0, 10, 10, 0, 10];
    const pts = sampleQuad(q, 4);
    expect(pts).toHaveLength(16);
    expect(pts[0]).toEqual([0, 0]);
    expect(pts[4]).toEqual([10, 0]);
    expect(pts[8]).toEqual([10, 10]);
    expect(pts[12]).toEqual([0, 10]);
    expect(quadCentre(q)).toEqual([5, 5]);
    expect(
      closedPath([
        [0, 0],
        [1, 2],
      ])
    ).toBe("M0.00 0.00L1.00 2.00Z");
  });

  it("re-starts a closed loop along its own perimeter, keeping its shape and its point count", () => {
    // A dashed ring's pattern wraps at its path's start, so moving the start
    // is how the seam travels from the SVG circle's 3 o'clock to the gate's
    // top-left corner. The loop itself may not change while it does.
    const q = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ] as const;
    const perimeter = (pts: readonly (readonly [number, number])[]) =>
      pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]), 0);
    expect(reseat(q, 0)[0]).toEqual([0, 0]);
    expect(reseat(q, 1)[0]).toEqual([0, 0]);
    expect(reseat(q, 0.125)[0]).toEqual([5, 0]);
    expect(reseat(q, 0.5)[0]).toEqual([10, 10]);
    expect(reseat(q, -0.25)[0]).toEqual([0, 10]);
    for (const f of [0, 0.125, 0.37, 0.5, 0.99]) {
      const out = reseat(q, f);
      expect(out).toHaveLength(q.length + 1);
      // Closed back onto its own start: the next corner round, then the rest.
      expect(perimeter([...out, out[0]!])).toBeCloseTo(40);
    }
  });

  it("the start circle's point k sits at end point k's angle, less the twist", () => {
    const q = [0, 0, 10, 0, 10, 10, 0, 10];
    const ends = sampleQuad(q, 4);
    const circle = circleAtAngles([50, 50], 20, ends, quadCentre(q), 0);
    circle.forEach((p, k) => {
      const e = ends[k]!;
      const aEnd = Math.atan2(e[1] - 5, e[0] - 5);
      const aStart = Math.atan2(p[1] - 50, p[0] - 50);
      expect(angleDelta(aEnd, aStart)).toBeCloseTo(0);
      expect(Math.hypot(p[0] - 50, p[1] - 50)).toBeCloseTo(20);
    });
    const twisted = circleAtAngles([50, 50], 20, ends, quadCentre(q), 0.3);
    const a0 = Math.atan2(ends[0]![1] - 5, ends[0]![0] - 5);
    expect(angleDelta(a0, Math.atan2(twisted[0]![1] - 50, twisted[0]![0] - 50))).toBeCloseTo(-0.3);
  });

  it("the aperture is open at 1 and a centre slit at 0", () => {
    expect(apertureInset(1)).toBe(0);
    expect(apertureInset(0)).toBe(50);
  });
});

describe("the compass gate's ink (compassGateScreenRef)", () => {
  it("multiplies the colour by alpha, as the canvas composites it", () => {
    const k = compassGateInk(COMPASS_GATE_DAWN, 0.5);
    expect(k.a).toBe(0.5);
    expect(k.rgb[0]).toBeCloseTo(0xeb * 0.5);
    expect(k.rgb[1]).toBeCloseTo(0xe3 * 0.5);
    expect(k.rgb[2]).toBeCloseTo(0xd6 * 0.5);
    expect(compassGateInk(COMPASS_GATE_GOLD, 1).rgb).toEqual([0xca, 0xa5, 0x54]);
  });

  it("the gate reads its inks and dashes from the three-free module", () => {
    const gate = readFileSync(
      path.join(
        process.cwd(),
        "components/landing/home-v2/DepthGatewayScene/gates/ThoughtformCompassGate.tsx"
      ),
      "utf8"
    );
    expect(gate).toMatch(/const DAWN_HEX = COMPASS_GATE_DAWN;/);
    expect(gate).toMatch(/const GOLD_HEX = COMPASS_GATE_GOLD;/);
    expect(gate).toMatch(/const RING_DASH = COMPASS_RING_DASH;/);
    expect(COMPASS_RING_DASH).toHaveLength(4);
    // The publish is opt-in: one boolean read on every route that never asks.
    expect(gate).toMatch(/if \(compassGateScreenRef\.wanted\) \{/);
  });
});
