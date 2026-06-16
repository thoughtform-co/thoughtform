import { describe, expect, it } from "vitest";

import {
  FADE_IN_FRAC,
  FADE_OUT_FRAC,
  HERO_GUARD_PX,
  HIDDEN_TRANSFORM,
  KEYFRAME_IDS,
  PARK_FRAC,
  substrateMorphProgress,
  substrateShapeBlend,
} from "@/lib/brandmark/journey";

/**
 * Pure helpers from `lib/brandmark/journey.ts`. The full
 * `computeBrandmarkTransform` pipeline is tightly coupled to live DOM
 * + scroll state, so the safer regression coverage here pins the
 * publicly exported pure helpers + canonical constants. They are read
 * by both the global brandmark painter (`BrandmarkParticleStation`)
 * and the R3F intelligence-layer scene, so a silent shape change here
 * would corrupt every dock and every transit.
 */

describe("brandmark journey — constants", () => {
  it("KEYFRAME_IDS is the canonical 5-keyframe table in journey order", () => {
    expect(KEYFRAME_IDS).toEqual(["sigil", "miss", "substrate", "rail", "orbit"]);
  });

  it("PARK_FRAC, FADE_IN_FRAC, FADE_OUT_FRAC are inside [0,1]", () => {
    expect(PARK_FRAC).toBeGreaterThan(0);
    expect(PARK_FRAC).toBeLessThan(0.5);
    expect(FADE_IN_FRAC).toBeGreaterThan(0);
    expect(FADE_OUT_FRAC).toBeGreaterThan(0);
  });

  it("HERO_GUARD_PX is a small positive scrollY threshold", () => {
    expect(HERO_GUARD_PX).toBeGreaterThan(0);
    expect(HERO_GUARD_PX).toBeLessThan(50);
  });

  it("HIDDEN_TRANSFORM exposes a fully-hidden state", () => {
    expect(HIDDEN_TRANSFORM.opacity).toBe(0);
    expect(HIDDEN_TRANSFORM.visible).toBe(false);
    expect(HIDDEN_TRANSFORM.parkedAt).toBeNull();
    expect(HIDDEN_TRANSFORM.rect).toEqual({ left: 0, top: 0, width: 0, height: 0 });
    expect(HIDDEN_TRANSFORM.ringsActive).toBe(false);
    expect(HIDDEN_TRANSFORM.ringProgress).toBe(0);
    expect(HIDDEN_TRANSFORM.shapeBlend).toBe(0);
    expect(HIDDEN_TRANSFORM.silhouetteMorph).toBe(0);
  });
});

describe("substrateShapeBlend", () => {
  it("is 0 at the substrate-window endpoints (full mark on entry/exit)", () => {
    expect(substrateShapeBlend(0)).toBe(0);
    expect(substrateShapeBlend(1)).toBe(0);
  });

  it("holds at 1 across the read beat (the blend plateaus on ring topology)", () => {
    expect(substrateShapeBlend(0.5)).toBeCloseTo(1, 6);
    expect(substrateShapeBlend(0.6)).toBeCloseTo(1, 6);
  });

  it("ramps in/out symmetrically across the blend window", () => {
    const inMid = substrateShapeBlend(0.15); // inside ramp-in
    const outMid = substrateShapeBlend(0.85); // inside ramp-out (mirror)
    expect(inMid).toBeGreaterThan(0);
    expect(inMid).toBeLessThan(1);
    expect(outMid).toBeCloseTo(inMid, 5);
  });
});

describe("substrateMorphProgress", () => {
  it("ramps 0 → 1 over the first ~35% then holds", () => {
    expect(substrateMorphProgress(0)).toBe(0);
    expect(substrateMorphProgress(0.35)).toBeCloseTo(1, 6);
    expect(substrateMorphProgress(0.5)).toBeCloseTo(1, 6);
  });

  it("ramps 1 → 0 over the last ~35% so the cloud collapses back into the brandmark shape", () => {
    expect(substrateMorphProgress(0.65)).toBeCloseTo(1, 6);
    expect(substrateMorphProgress(1)).toBe(0);
    // Symmetric trapezoid: the morph at progress=0.18 inside the ramp-in
    // should equal the morph at progress=0.82 inside the ramp-out.
    expect(substrateMorphProgress(0.18)).toBeCloseTo(substrateMorphProgress(0.82), 5);
  });
});
