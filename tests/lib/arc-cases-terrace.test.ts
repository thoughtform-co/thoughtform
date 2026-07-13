// Pins for the Arc Cases Terrace pure math (ADR-034). The band +
// epilogue-kill contract (and its services-ring exclusivity) carries
// over verbatim from the retired ADR-033 orbit — those pins MUST NOT
// die with the ring.

import { describe, expect, it } from "vitest";
import {
  ARC_BAND_IN,
  ARC_CAM_SHIFT_X,
  ARC_EPILOGUE_KILL,
  CASE_COUNT,
  TERRACE_RISE_DEPTH,
  arcBandFactor,
  arcCameraShiftX,
  dampLevel,
  stepSlot,
  terraceRealmTarget,
  terraceRiseEnvelope,
} from "@/lib/arc-cases/terraceMath";

describe("dampLevel", () => {
  it("converges monotonically toward the target", () => {
    let level = 0;
    let prev = 0;
    for (let i = 0; i < 60; i++) {
      level = dampLevel(level, 1, 1 / 60);
      expect(level).toBeGreaterThanOrEqual(prev);
      expect(level).toBeLessThanOrEqual(1);
      prev = level;
    }
    expect(level).toBeGreaterThan(0.85); // ~1s at rate 2.2
  });

  it("is frame-rate independent (many small steps ≈ few large steps)", () => {
    let fine = 0;
    for (let i = 0; i < 120; i++) fine = dampLevel(fine, 1, 1 / 120);
    let coarse = 0;
    for (let i = 0; i < 30; i++) coarse = dampLevel(coarse, 1, 1 / 30);
    expect(Math.abs(fine - coarse)).toBeLessThan(1e-9);
  });

  it("clamps negative dt to a no-op", () => {
    expect(dampLevel(0.5, 1, -0.1)).toBe(0.5);
  });
});

describe("arcBandFactor (the ADR-033 gate, carried over)", () => {
  it("is 0 before the Build band opens", () => {
    expect(arcBandFactor(0.8, 0)).toBe(0);
    expect(arcBandFactor(ARC_BAND_IN[0], 0)).toBe(0);
  });

  it("is fully open at the Build park (paintProgress ≈ 0.9225)", () => {
    expect(arcBandFactor(0.9225, 0)).toBe(1);
    expect(arcBandFactor(1, 0)).toBe(1);
  });

  it("is fully killed past the first tenth of the epilogue", () => {
    expect(arcBandFactor(1, ARC_EPILOGUE_KILL[1])).toBe(0);
    expect(arcBandFactor(1, 0.5)).toBe(0);
  });

  it("EXCLUSIVITY: dies long before the corridor-exit dissipate admits the services ring", () => {
    // The services ring's entrance needs dissipate ≥ 0.6, which needs
    // epilogueProgress ≥ 0.72. The terrace must be gone well before.
    expect(ARC_EPILOGUE_KILL[1]).toBeLessThan(0.72);
  });
});

describe("arcCameraShiftX", () => {
  it("is EXACTLY 0 at level 0 (no flag-off / disarmed residue)", () => {
    expect(arcCameraShiftX(0)).toBe(0);
  });

  it("reaches the full shift at level 1", () => {
    expect(arcCameraShiftX(1)).toBe(ARC_CAM_SHIFT_X);
  });

  it("is linear and monotonic", () => {
    expect(arcCameraShiftX(0.5)).toBeCloseTo(ARC_CAM_SHIFT_X / 2, 12);
    let prev = -Infinity;
    for (let l = 0; l <= 1.0001; l += 0.1) {
      const v = arcCameraShiftX(l);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("terraceRiseEnvelope", () => {
  it("is EXACTLY buried + invisible at level 0", () => {
    const env = terraceRiseEnvelope(0);
    expect(env.riseT).toBe(0);
    expect(env.opacity).toBe(0);
  });

  it("is EXACTLY parked + opaque at level 1", () => {
    const env = terraceRiseEnvelope(1);
    expect(env.riseT).toBe(1);
    expect(env.opacity).toBe(1);
  });

  it("fade leads the rise (the slab is visible while still emerging)", () => {
    const mid = terraceRiseEnvelope(0.45);
    expect(mid.opacity).toBeGreaterThan(mid.riseT);
  });

  it("both channels are monotonic in the level", () => {
    let prevRise = -Infinity;
    let prevOp = -Infinity;
    for (let l = 0; l <= 1.0001; l += 0.05) {
      const env = terraceRiseEnvelope(Math.min(1, l));
      expect(env.riseT).toBeGreaterThanOrEqual(prevRise);
      expect(env.opacity).toBeGreaterThanOrEqual(prevOp);
      prevRise = env.riseT;
      prevOp = env.opacity;
    }
  });

  it("rise depth is positive (the screen starts under the ground)", () => {
    expect(TERRACE_RISE_DEPTH).toBeGreaterThan(0);
  });
});

describe("terraceRealmTarget", () => {
  it("never sinks below the scroll envelope (max semantics)", () => {
    expect(terraceRealmTarget(0.72, 0)).toBe(0.72);
    expect(terraceRealmTarget(0.72, 0.5)).toBe(0.72);
    expect(terraceRealmTarget(0.72, 1)).toBe(1);
  });

  it("returns scroll ownership at level 0 (reversible)", () => {
    expect(terraceRealmTarget(0.3, 0)).toBe(0.3);
    expect(terraceRealmTarget(1, 0)).toBe(1);
  });
});

describe("stepSlot", () => {
  it("wraps forward 3 → 0", () => {
    expect(stepSlot(3, 1)).toBe(0);
  });

  it("wraps back 0 → 3", () => {
    expect(stepSlot(0, -1)).toBe(CASE_COUNT - 1);
  });

  it("steps normally inside the range", () => {
    expect(stepSlot(1, 1)).toBe(2);
    expect(stepSlot(2, -1)).toBe(1);
  });
});
