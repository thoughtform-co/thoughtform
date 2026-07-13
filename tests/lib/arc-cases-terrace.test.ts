// Pins for the Arc Cases Terrace pure math (ADR-034). The band +
// epilogue-kill contract (and its services-ring exclusivity) carries
// over verbatim from the retired ADR-033 orbit — those pins MUST NOT
// die with the ring.

import { describe, expect, it } from "vitest";
import {
  ARC_BAND_IN,
  ARC_EPILOGUE_KILL,
  CASE_COUNT,
  TERRACE_RISE_DEPTH,
  arcBandFactor,
  dampLevel,
  stepSlot,
  terraceRealmTarget,
  terraceRiseEnvelope,
} from "@/lib/arc-cases/terraceMath";
import {
  arcCameraShiftX,
  getTerraceViewportLayout,
  TERRACE_DISPLAY_RIGHT_LIMIT,
  TERRACE_DISPLAY_VIEWPORT_X,
  TERRACE_SURFACES_VIEWPORT_X,
  terraceViewportHalfWidth,
} from "@/components/landing/home-v2/arc-cases/terraceLayout";
import {
  buildTerraceContourField,
  isInsideTerraceAperture,
  TERRACE_CONTOUR_BANDS,
  TERRACE_CONTOUR_POINT_COUNT,
  TERRACE_CONTOUR_SAMPLES,
} from "@/components/landing/home-v2/arc-cases/terraceContourField";
import {
  PARK_CAM_Z,
  REALM_Z_FAR,
  terrainGroundY,
} from "@/components/landing/home-v2/DepthGatewayScene/substrateTerrain";

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
    expect(arcCameraShiftX(0, 16 / 9)).toBe(0);
  });

  it("reaches the aspect-aware full shift at level 1", () => {
    const layout = getTerraceViewportLayout(16 / 9);
    expect(arcCameraShiftX(1, 16 / 9)).toBe(layout.cameraShiftX);
  });

  it("uses the leading camera envelope and stays monotonic", () => {
    const full = arcCameraShiftX(1, 16 / 9);
    expect(arcCameraShiftX(0.5, 16 / 9)).toBeGreaterThan(full * 0.5);
    let prev = -Infinity;
    for (let l = 0; l <= 1.0001; l += 0.1) {
      const v = arcCameraShiftX(l, 16 / 9);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("getTerraceViewportLayout", () => {
  const desktopAspects = [1.45, 1.6, 16 / 9, 2048 / 920];

  it.each(desktopAspects)("keeps the framed targets at aspect %f", (aspect) => {
    const layout = getTerraceViewportLayout(aspect);
    expect(layout.surfacesViewportX).toBeCloseTo(TERRACE_SURFACES_VIEWPORT_X, 8);
    expect(layout.displayViewportX).toBeCloseTo(TERRACE_DISPLAY_VIEWPORT_X, 8);
    expect(layout.displayRightViewportX).toBeLessThanOrEqual(TERRACE_DISPLAY_RIGHT_LIMIT);
    // A 0.72-radius substrate sphere is a narrow left-edge sliver here.
    expect(layout.sphereCentreViewportX).toBeLessThan(0.08);
  });

  it.each(desktopAspects)("covers the fully shifted right frustum at aspect %f", (aspect) => {
    const layout = getTerraceViewportLayout(aspect);
    expect(layout.terrainRightExtent).toBeGreaterThan(layout.screenX + layout.screenWidth / 2);
    expect(layout.terrainLeftExtent).toBeLessThan(layout.cameraShiftX);
    const farRight =
      layout.cameraShiftX + terraceViewportHalfWidth(aspect, PARK_CAM_Z - REALM_Z_FAR) + 1;
    expect(layout.terrainRightExtent).toBeGreaterThanOrEqual(farRight);
  });
});

describe("terrace contour field", () => {
  const layout = getTerraceViewportLayout(2048 / 920);

  it("is deterministic and stays under the combined terrain point budget", () => {
    const a = buildTerraceContourField(layout);
    const b = buildTerraceContourField(layout);
    expect(a.count).toBe(TERRACE_CONTOUR_POINT_COUNT);
    expect(a.count).toBe(TERRACE_CONTOUR_BANDS * TERRACE_CONTOUR_SAMPLES);
    // 38 rows, capped at 246 samples each, plus the 18 contour bands.
    expect(a.count + 38 * 246).toBeLessThan(16_000);
    expect(Array.from(a.targetPositions.slice(0, 120))).toEqual(
      Array.from(b.targetPositions.slice(0, 120))
    );
  });

  it("keeps every target on or above terrain and grounds the outer fold exactly", () => {
    const field = buildTerraceContourField(layout);
    for (let i = 0; i < field.count; i++) {
      const offset = i * 3;
      const x = field.targetPositions[offset];
      const y = field.targetPositions[offset + 1];
      const z = field.targetPositions[offset + 2];
      expect(y).toBeGreaterThanOrEqual(terrainGroundY(x, z) - 1e-6);
    }
    const outerStart = (TERRACE_CONTOUR_BANDS - 1) * TERRACE_CONTOUR_SAMPLES;
    for (let i = outerStart; i < field.count; i++) {
      const offset = i * 3;
      expect(field.targetPositions[offset + 1]).toBeCloseTo(field.basePositions[offset + 1], 6);
    }
  });

  it("has no particles inside the display aperture", () => {
    const field = buildTerraceContourField(layout);
    const inside: Array<[number, number, number]> = [];
    for (let i = 0; i < field.count; i++) {
      const offset = i * 2;
      if (
        isInsideTerraceAperture(
          field.localPositions[offset],
          field.localPositions[offset + 1],
          layout
        )
      ) {
        inside.push([i, field.localPositions[offset], field.localPositions[offset + 1]]);
      }
    }
    expect(inside).toEqual([]);
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
