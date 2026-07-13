import { describe, expect, it } from "vitest";

import {
  ARC_BAND_IN,
  ARC_ENTRANCE_WINDOWS,
  ARC_EPILOGUE_KILL,
  ARC_RING_COUNT,
  arcBandFactor,
  armEnvelope,
  caseSlot,
  dampLevel,
  rotationForCaseIndex,
  shortestCaseDelta,
} from "@/lib/arc-cases/orbitMath";
import { frontCardIndex } from "@/lib/services-ring/ringMath";

describe("arc cases orbit math (ADR-033)", () => {
  describe("rotationForCaseIndex ↔ frontCardIndex", () => {
    it("lands the front card on index mod 4 for any cumulative index", () => {
      for (let i = -9; i <= 9; i++) {
        expect(frontCardIndex(rotationForCaseIndex(i))).toBe(caseSlot(i));
      }
    });
  });

  describe("shortestCaseDelta", () => {
    it("steps 0 / ±1 and resolves the opposite card forward (+2)", () => {
      expect(shortestCaseDelta(0, 0)).toBe(0);
      expect(shortestCaseDelta(0, 1)).toBe(1);
      expect(shortestCaseDelta(0, 3)).toBe(-1);
      expect(shortestCaseDelta(0, 2)).toBe(2);
      expect(shortestCaseDelta(3, 0)).toBe(1);
      expect(shortestCaseDelta(1, 0)).toBe(-1);
    });

    it("cumulative stepping always reaches the requested slot", () => {
      let caseIndex = 0;
      const targets = [2, 3, 1, 0, 2, 1, 3];
      for (const slot of targets) {
        caseIndex += shortestCaseDelta(caseSlot(caseIndex), slot);
        expect(caseSlot(caseIndex)).toBe(slot);
        expect(frontCardIndex(rotationForCaseIndex(caseIndex))).toBe(slot);
      }
    });

    it("never steps more than 2 quarters", () => {
      for (let from = 0; from < ARC_RING_COUNT; from++) {
        for (let to = 0; to < ARC_RING_COUNT; to++) {
          expect(Math.abs(shortestCaseDelta(from, to))).toBeLessThanOrEqual(2);
        }
      }
    });
  });

  describe("armEnvelope", () => {
    it("is exactly hidden at level 0 for every card (flag-off residue guard)", () => {
      for (let i = 0; i < ARC_RING_COUNT; i++) {
        expect(armEnvelope(0, i).opacity).toBe(0);
      }
    });

    it("is exactly identity at level 1 for every card", () => {
      for (let i = 0; i < ARC_RING_COUNT; i++) {
        const env = armEnvelope(1, i);
        expect(env.opacity).toBe(1);
        expect(env.radiusMul).toBe(1);
      }
    });

    it("staggers: later cards lag earlier ones through the arm", () => {
      const mid = 0.5;
      for (let i = 1; i < ARC_RING_COUNT; i++) {
        expect(armEnvelope(mid, i).opacity).toBeLessThanOrEqual(armEnvelope(mid, i - 1).opacity);
      }
      expect(ARC_ENTRANCE_WINDOWS).toHaveLength(ARC_RING_COUNT);
    });

    it("flies in from a wider radius while fading", () => {
      const env = armEnvelope(0.4, 0);
      expect(env.opacity).toBeGreaterThan(0);
      expect(env.opacity).toBeLessThan(1);
      expect(env.radiusMul).toBeGreaterThan(1);
    });
  });

  describe("arcBandFactor", () => {
    it("is 0 before the Build band opens", () => {
      expect(arcBandFactor(0, 0)).toBe(0);
      expect(arcBandFactor(ARC_BAND_IN[0], 0)).toBe(0);
      expect(arcBandFactor(0.5, 0)).toBe(0);
    });

    it("is 1 at the Build park (band open, no epilogue)", () => {
      expect(arcBandFactor(ARC_BAND_IN[1], 0)).toBe(1);
      expect(arcBandFactor(0.9225, 0)).toBe(1); // the park
      expect(arcBandFactor(1, 0)).toBe(1);
    });

    it("is 0 once the epilogue kill completes", () => {
      expect(arcBandFactor(1, ARC_EPILOGUE_KILL[1])).toBe(0);
      expect(arcBandFactor(1, 0.5)).toBe(0);
      expect(arcBandFactor(1, 1)).toBe(0);
    });

    it("kills well before the services ring's dissipate window (exclusivity)", () => {
      // The corridor dock (which raises dissipate, admitting the services
      // ring) cannot begin before epilogueProgress ≈ 0.72 — by then the
      // cases ring has been dead for over half the epilogue.
      expect(ARC_EPILOGUE_KILL[1]).toBeLessThan(0.72);
      expect(arcBandFactor(1, 0.72)).toBe(0);
    });
  });

  describe("dampLevel", () => {
    it("converges monotonically toward the target", () => {
      let level = 0;
      let previous = level;
      for (let step = 0; step < 60; step++) {
        level = dampLevel(level, 1, 1 / 60);
        expect(level).toBeGreaterThanOrEqual(previous);
        previous = level;
      }
      expect(level).toBeGreaterThan(0.75);
      expect(level).toBeLessThanOrEqual(1);
    });

    it("is frame-rate independent to first order (same wall time ≈ same level)", () => {
      let at60 = 0;
      for (let i = 0; i < 60; i++) at60 = dampLevel(at60, 1, 1 / 60);
      let at30 = 0;
      for (let i = 0; i < 30; i++) at30 = dampLevel(at30, 1, 1 / 30);
      expect(Math.abs(at60 - at30)).toBeLessThan(0.02);
    });
  });
});
