// Pins for the Arc Cases pure math. The band + epilogue-kill contract
// (and its services-ring exclusivity) carries over verbatim from the
// retired ADR-033 orbit — those pins MUST NOT die with the ring.

import { describe, expect, it } from "vitest";
import {
  ARC_BAND_IN,
  ARC_CARD_PHASE,
  ARC_EPILOGUE_KILL,
  ARC_FOLD_DONE,
  ARC_LABEL_FADE_OUT,
  ARC_SIGIL_SETTLE,
  CASE_COUNT,
  arcBandFactor,
  arcCardPresence,
  arcFoldInput,
  arcLabelFade,
  dampLevel,
  sigilSettle,
  stepSlot,
} from "@/lib/arc-cases/arcCasesMath";
import { arcLatchEnvelope } from "@/lib/arc-cases/streamLatchMath";

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

describe("reveal phasing (ADR-041) — the fold lands BEFORE the card emerges", () => {
  it("arcFoldInput is a clamped ratio: 0 at rest, 1 by ARC_FOLD_DONE, held above", () => {
    expect(arcFoldInput(0)).toBe(0);
    expect(arcFoldInput(ARC_FOLD_DONE)).toBe(1);
    expect(arcFoldInput(1)).toBe(1);
    expect(arcFoldInput(ARC_FOLD_DONE / 2)).toBeCloseTo(0.5, 6);
  });

  it("arcFoldInput is monotonically non-decreasing and clamped to [0, 1]", () => {
    let prev = -1;
    for (let level = -0.2; level <= 1.2001; level += 0.05) {
      const fold = arcFoldInput(level);
      expect(fold).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(fold).toBeGreaterThanOrEqual(0);
      expect(fold).toBeLessThanOrEqual(1);
      prev = fold;
    }
  });

  it("arcCardPresence is 0 until the fold is done, 1 at full arm, monotonic", () => {
    expect(arcCardPresence(0)).toBe(0);
    expect(arcCardPresence(ARC_CARD_PHASE[0])).toBe(0);
    expect(arcCardPresence(1)).toBe(1);
    let prev = -1;
    for (let level = 0; level <= 1.0001; level += 0.05) {
      const presence = arcCardPresence(level);
      expect(presence).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(presence).toBeGreaterThanOrEqual(0);
      expect(presence).toBeLessThanOrEqual(1);
      prev = presence;
    }
  });

  // THE ORDERING INVARIANT — the whole point of the phase split. The card
  // must have ZERO presence at every level where the node fold has not yet
  // completed, so the screen can never lead the nodes it hangs from.
  it("ORDERING: the card has zero presence while the fold is still running", () => {
    expect(ARC_CARD_PHASE[0]).toBeGreaterThanOrEqual(ARC_FOLD_DONE);
    for (let level = 0; level < ARC_FOLD_DONE; level += 0.01) {
      expect(arcFoldInput(level)).toBeLessThan(1);
      expect(arcCardPresence(level)).toBe(0);
    }
  });

  it("ORDERING: the labels are gone before the fold lands", () => {
    expect(ARC_LABEL_FADE_OUT[1]).toBeLessThanOrEqual(ARC_FOLD_DONE);
  });

  it("the fold envelope is fully latched exactly when the card begins", () => {
    expect(arcLatchEnvelope(arcFoldInput(ARC_CARD_PHASE[0]))).toBe(1);
  });
});

describe("sigilSettle (ADR-041) — the trigger waits for the notes", () => {
  it("is 0 before the notes move and 1 once they've landed", () => {
    expect(sigilSettle(0)).toBe(0);
    expect(sigilSettle(ARC_SIGIL_SETTLE[0])).toBe(0);
    expect(sigilSettle(ARC_SIGIL_SETTLE[1])).toBe(1);
    expect(sigilSettle(1)).toBe(1);
  });

  it("is monotonically non-decreasing in the stack reveal", () => {
    let prev = -1;
    for (let stack = 0; stack <= 1.0001; stack += 0.05) {
      const settle = sigilSettle(stack);
      expect(settle).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = settle;
    }
  });

  it("only opens well after the stack accretion is underway", () => {
    expect(ARC_SIGIL_SETTLE[0]).toBeGreaterThan(0.5);
    expect(ARC_SIGIL_SETTLE[0]).toBeLessThan(ARC_SIGIL_SETTLE[1]);
  });
});

// (ADR-042) The `SIGIL_Z` front-pole placement pin is retired with the sphere
// sigil — the trigger is now `ArcCasesCue`, a DOM label under the Build title
// with no place on the sphere's optical axis. The settle gate that arms it
// (`sigilSettle` / `ARC_SIGIL_SETTLE`) is still pinned above.

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
