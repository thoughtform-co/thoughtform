// Pins for the Arc Cases pure math. The band + epilogue-kill contract
// (and its services-ring exclusivity) carries over verbatim from the
// retired ADR-033 orbit — those pins MUST NOT die with the ring.

import { describe, expect, it } from "vitest";
import {
  ARC_BAND_IN,
  ARC_EPILOGUE_KILL,
  ARC_LABEL_FADE_OUT,
  CASE_COUNT,
  arcBandFactor,
  arcLabelFade,
  dampLevel,
  stepSlot,
} from "@/lib/arc-cases/arcCasesMath";

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
    // epilogueProgress ≥ 0.72. The cases reveal must be gone well before.
    expect(ARC_EPILOGUE_KILL[1]).toBeLessThan(0.72);
  });
});

describe("arcLabelFade (ADR-035 label fade)", () => {
  it("is fully present at rest (level 0) and fully gone by the window end", () => {
    expect(arcLabelFade(0)).toBe(1);
    expect(arcLabelFade(ARC_LABEL_FADE_OUT[1])).toBe(0);
    expect(arcLabelFade(1)).toBe(0);
  });

  it("is monotonically non-increasing in the arm level", () => {
    let prev = arcLabelFade(0);
    for (let level = 0; level <= 1.0001; level += 0.05) {
      const fade = arcLabelFade(level);
      expect(fade).toBeLessThanOrEqual(prev + 1e-9);
      expect(fade).toBeGreaterThanOrEqual(0);
      expect(fade).toBeLessThanOrEqual(1);
      prev = fade;
    }
  });

  it("labels are gone by mid-arm — before the halves meet (fade end < 0.6)", () => {
    expect(ARC_LABEL_FADE_OUT[1]).toBeLessThan(0.6);
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
