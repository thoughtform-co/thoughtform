import { describe, expect, it } from "vitest";

import {
  ABOUT_BG_IN_WINDOW,
  ABOUT_COPY_WINDOW,
  ABOUT_FLIP_WINDOW,
  ABOUT_SHIFT_WINDOW,
  DECK_ANCHORS_OFF_EXIT,
  DECK_CARD_SCALE,
  DECK_DEPTH_WRITE_OFF_EXIT,
  DECK_OFFSETS,
  DECK_PHI_TARGETS,
  DECK_PIVOT_LOCAL,
  DECK_PLACEMENTS,
  DECK_RADIUS_MUL,
  DECK_RENDER_PITCH,
  DECK_RENDER_REBASE_EXIT,
  DECK_SETTLED_ROTATION,
  DECK_Z,
  DECK_Z_PITCH,
  FLIP_RAMP_D,
  aboutBgInT,
  aboutCopyT,
  aboutFlipLinearT,
  aboutFlipT,
  aboutShiftT,
  deckFlip,
  deckFlipFromT,
  deckOrder,
  flipRamp,
  deckPhiDelta,
  deckPhiTarget,
  deckStackEnvelope,
} from "@/lib/services-ring/aboutDeckMath";
import {
  RING_CARD_ORBIT_GEOMETRY,
  RING_CONTENT_LIFT,
  RING_COUNT,
  RING_EXIT_WINDOWS,
  RING_SCALE_RANGE,
  RING_SLAB_DEPTH,
  RING_STEP_COUNT,
  basePhi,
  exitProgressForRunway,
  placeCardOnOrbit,
} from "@/lib/services-ring/ringMath";

const TAU = Math.PI * 2;

describe("deckStackEnvelope — identity pin (the ADR-030/047 guardrail)", () => {
  it("returns EXACT identity at exit = 0 for every card", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const env = deckStackEnvelope(0, i);
      expect(env.t).toBe(0);
      expect(env.phiDelta).toBe(0);
      expect(env.radiusMul).toBe(1);
      expect(env.flattenT).toBe(0);
      expect(env.glowMul).toBe(1);
      expect(env.settle).toBe(0);
    }
  });

  it("stays identity through every reading beat (exit clock is 0 there)", () => {
    // The exit beat is the final beat; every earlier (reading) beat keeps
    // the exit clock at 0. Expressed via RING_STEP_COUNT so it tracks the
    // beat count (5 since the 2026-07-17 lead-in removal) instead of a
    // hardcoded 6-beat boundary.
    const lastReadingBeatEnd = (RING_STEP_COUNT - 1) / RING_STEP_COUNT;
    for (const p of [0, 0.2, 0.5, lastReadingBeatEnd - 0.001, lastReadingBeatEnd]) {
      const exit = exitProgressForRunway(p);
      const env = deckStackEnvelope(exit, 0);
      expect(env.phiDelta).toBe(0);
      expect(env.radiusMul).toBe(1);
      expect(env.settle).toBe(0);
    }
  });
});

describe("deckStackEnvelope — the sweep", () => {
  it("is monotonic per card over the exit clock", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      let lastT = -1;
      let lastAbsPhi = -1;
      let lastFlatten = -1;
      for (let s = 0; s <= 100; s++) {
        const env = deckStackEnvelope(s / 100, i);
        expect(env.t).toBeGreaterThanOrEqual(lastT);
        expect(Math.abs(env.phiDelta)).toBeGreaterThanOrEqual(lastAbsPhi - 1e-12);
        expect(env.flattenT).toBeGreaterThanOrEqual(lastFlatten);
        lastT = env.t;
        lastAbsPhi = Math.abs(env.phiDelta);
        lastFlatten = env.flattenT;
      }
    }
  });

  it("honours the RING_EXIT_WINDOWS stagger", () => {
    // At exit 0.55 card 0's window ([0, 0.5]) is done; card 3's ([0.36,
    // 0.9]) is mid-travel.
    expect(deckStackEnvelope(0.55, 0).t).toBe(1);
    expect(deckStackEnvelope(0.55, 3).t).toBeGreaterThan(0);
    expect(deckStackEnvelope(0.55, 3).t).toBeLessThan(1);
    expect(RING_EXIT_WINDOWS[3][1]).toBeLessThanOrEqual(DECK_RENDER_REBASE_EXIT);
  });

  it("converges every card onto the precomputed deck placements at exit 1", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const env = deckStackEnvelope(1, i);
      expect(env.t).toBe(1);
      expect(env.settle).toBe(1);
      const placed = placeCardOnOrbit(
        i,
        DECK_SETTLED_ROTATION + env.phiDelta,
        RING_CARD_ORBIT_GEOMETRY[i],
        { yOffset: 0, radiusMul: env.radiusMul }
      );
      expect(placed.x).toBeCloseTo(DECK_PLACEMENTS[i].x, 12);
      expect(placed.y).toBeCloseTo(DECK_PLACEMENTS[i].y, 12);
      expect(placed.z).toBeCloseTo(DECK_PLACEMENTS[i].z, 12);
      // nz = cos(full turn) = 1 exactly — depth opacity/scale at ceiling.
      expect(placed.nz).toBeCloseTo(1, 12);
    }
  });
});

describe("deck geometry tables", () => {
  it("seats the converged cards on evenly-pitched deck depths", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      expect(DECK_PLACEMENTS[i].z).toBeCloseTo(DECK_Z[i], 12);
    }
    for (let i = 1; i < RING_COUNT; i++) {
      expect(DECK_Z[i] - DECK_Z[i - 1]).toBeCloseTo(DECK_Z_PITCH, 12);
    }
  });

  it("keeps adjacent cards clear of each other's content/veil overhang", () => {
    // Each card's furthest sub-plane sits at ±(slab/2 + lift + 0.002 veil).
    const overhang = RING_SLAB_DEPTH / 2 + RING_CONTENT_LIFT + 0.002;
    for (let i = 1; i < RING_COUNT; i++) {
      const gap = DECK_PLACEMENTS[i].z - DECK_PLACEMENTS[i - 1].z;
      expect(gap).toBeGreaterThan(2 * overhang);
    }
  });

  it("pivot is the placement mean and offsets sum to zero", () => {
    const mean = DECK_PLACEMENTS.reduce(
      (acc, p) => ({
        x: acc.x + p.x / RING_COUNT,
        y: acc.y + p.y / RING_COUNT,
        z: acc.z + p.z / RING_COUNT,
      }),
      { x: 0, y: 0, z: 0 }
    );
    expect(DECK_PIVOT_LOCAL.x).toBeCloseTo(mean.x, 12);
    expect(DECK_PIVOT_LOCAL.y).toBeCloseTo(mean.y, 12);
    expect(DECK_PIVOT_LOCAL.z).toBeCloseTo(mean.z, 12);
    const sum = DECK_OFFSETS.reduce(
      (acc, o) => ({ x: acc.x + o.x, y: acc.y + o.y, z: acc.z + o.z }),
      { x: 0, y: 0, z: 0 }
    );
    expect(sum.x).toBeCloseTo(0, 12);
    expect(sum.y).toBeCloseTo(0, 12);
    expect(sum.z).toBeCloseTo(0, 12);
  });

  it("radius multipliers stay positive and bounded", () => {
    for (const mul of DECK_RADIUS_MUL) {
      expect(mul).toBeGreaterThan(0.5);
      expect(mul).toBeLessThan(1.5);
    }
    expect(DECK_CARD_SCALE).toBe(RING_SCALE_RANGE[1]);
  });
});

describe("deckPhiTarget — deterministic sweep targets", () => {
  it("rounds each settled azimuth to a full turn ([-2π, -2π, 0, 0])", () => {
    expect(deckPhiTarget(0)).toBeCloseTo(-TAU, 12);
    expect(deckPhiTarget(1)).toBeCloseTo(-TAU, 12);
    expect(deckPhiTarget(2)).toBeCloseTo(0, 12);
    expect(deckPhiTarget(3)).toBeCloseTo(0, 12);
    for (let i = 0; i < RING_COUNT; i++) {
      expect(DECK_PHI_TARGETS[i]).toBe(deckPhiTarget(i));
      expect(Math.abs(deckPhiTarget(i) % TAU)).toBeCloseTo(0, 12);
      // Never more than a half-turn of sweep.
      expect(Math.abs(deckPhiDelta(i))).toBeLessThanOrEqual(Math.PI + 1e-9);
    }
  });

  it("breaks card 1's exact half-turn tie toward the orbit direction", () => {
    const settled = basePhi(1) + DECK_SETTLED_ROTATION;
    expect(settled).toBeCloseTo(-Math.PI, 12);
    expect(deckPhiTarget(1)).toBeCloseTo(-TAU, 12);
  });
});

describe("deckFlip", () => {
  it("is identity at aboutP = 0 and reaches exactly π by the window end", () => {
    const zero = deckFlip(0);
    expect(zero.theta).toBe(0);
    expect(zero.posBlend).toBe(0);
    expect(zero.flipped).toBe(false);
    const done = deckFlip(ABOUT_FLIP_WINDOW[1]);
    expect(done.theta).toBe(Math.PI);
    expect(done.posBlend).toBe(1);
    expect(done.flipped).toBe(true);
    expect(deckFlip(1).theta).toBe(Math.PI);
  });

  it("theta and posBlend are monotone over the about clock", () => {
    let lastTheta = -1;
    let lastBlend = -1;
    for (let s = 0; s <= 100; s++) {
      const f = deckFlip(s / 100);
      expect(f.theta).toBeGreaterThanOrEqual(lastTheta);
      expect(f.posBlend).toBeGreaterThanOrEqual(lastBlend);
      lastTheta = f.theta;
      lastBlend = f.posBlend;
    }
  });
});

describe("flipRamp — the Update 4 speed ramp", () => {
  it("pins exact endpoints (byte-identity at the seams)", () => {
    expect(flipRamp(0)).toBe(0);
    expect(flipRamp(1)).toBe(1);
    expect(flipRamp(-0.5)).toBe(0);
    expect(flipRamp(1.5)).toBe(1);
  });

  it("is monotone and symmetric (θ = π/2 lands at the window midpoint)", () => {
    let last = -1;
    for (let s = 0; s <= 200; s++) {
      const x = s / 200;
      const y = flipRamp(x);
      expect(y).toBeGreaterThanOrEqual(last);
      // Symmetry: ramp(x) + ramp(1 − x) = 1 → flipped switches mid-window.
      expect(y + flipRamp(1 - x)).toBeCloseTo(1, 12);
      last = y;
    }
    expect(flipRamp(0.5)).toBeCloseTo(0.5, 12);
  });

  it("is continuous at the cruise joins", () => {
    const eps = 1e-6;
    for (const j of [FLIP_RAMP_D, 1 - FLIP_RAMP_D]) {
      expect(flipRamp(j + eps) - flipRamp(j - eps)).toBeLessThan(1e-4);
    }
  });

  it("cruises flatter than smootherstep's peak (the whole point)", () => {
    // Numeric slope at mid-window: the cruise velocity 1/(1 − D) ≈ 1.39
    // must stay well under smootherstep's 1.875 peak.
    const h = 1e-4;
    const cruiseSlope = (flipRamp(0.5 + h) - flipRamp(0.5 - h)) / (2 * h);
    expect(cruiseSlope).toBeCloseTo(1 / (1 - FLIP_RAMP_D), 6);
    expect(cruiseSlope).toBeLessThan(1.6);
    // Ends start/stop at rest: near-zero slope at both ends.
    expect((flipRamp(2 * h) - flipRamp(0)) / (2 * h)).toBeLessThan(0.01);
    expect((flipRamp(1) - flipRamp(1 - 2 * h)) / (2 * h)).toBeLessThan(0.01);
  });

  it("deckFlipFromT mirrors deckFlip through the ramp", () => {
    for (const p of [0, 0.1, 0.15, 0.2, 0.26, 0.5]) {
      const viaClock = deckFlip(p);
      const viaT = deckFlipFromT(flipRamp(aboutFlipLinearT(p)));
      expect(viaT.theta).toBe(viaClock.theta);
      expect(viaT.posBlend).toBe(viaClock.posBlend);
      expect(viaT.flipped).toBe(viaClock.flipped);
    }
  });
});

describe("deckOrder", () => {
  it("is a bijection that reverses under the flip", () => {
    const forward = [0, 1, 2, 3].map((i) => deckOrder(i, false));
    const flipped = [0, 1, 2, 3].map((i) => deckOrder(i, true));
    expect([...forward].sort()).toEqual([0, 1, 2, 3]);
    expect([...flipped].sort()).toEqual([0, 1, 2, 3]);
    for (let i = 0; i < RING_COUNT; i++) {
      expect(flipped[i]).toBe(RING_COUNT - 1 - forward[i]);
    }
    // The rebased span stays under the mark's point pass (renderOrder 1).
    expect(DECK_RENDER_PITCH * 3 + 0.12).toBeLessThan(1);
  });
});

describe("about beat windows", () => {
  it("orders the beats and keeps gates inside the first exit window", () => {
    expect(ABOUT_FLIP_WINDOW[1]).toBeLessThan(ABOUT_SHIFT_WINDOW[0]);
    expect(ABOUT_SHIFT_WINDOW[0]).toBeLessThan(ABOUT_COPY_WINDOW[0]);
    expect(ABOUT_COPY_WINDOW[1]).toBeLessThan(ABOUT_BG_IN_WINDOW[0]);
    expect(DECK_DEPTH_WRITE_OFF_EXIT).toBeLessThan(DECK_ANCHORS_OFF_EXIT);
    expect(DECK_ANCHORS_OFF_EXIT).toBeLessThan(RING_EXIT_WINDOWS[0][1]);
  });

  it("window helpers are 0 at their starts and 1 at their ends", () => {
    expect(aboutFlipT(ABOUT_FLIP_WINDOW[0])).toBe(0);
    expect(aboutFlipT(ABOUT_FLIP_WINDOW[1])).toBe(1);
    expect(aboutShiftT(ABOUT_SHIFT_WINDOW[0])).toBe(0);
    expect(aboutShiftT(ABOUT_SHIFT_WINDOW[1])).toBe(1);
    expect(aboutCopyT(ABOUT_COPY_WINDOW[0])).toBe(0);
    expect(aboutCopyT(ABOUT_COPY_WINDOW[1])).toBe(1);
    expect(aboutBgInT(ABOUT_BG_IN_WINDOW[0])).toBe(0);
    expect(aboutBgInT(1)).toBe(1);
  });
});
