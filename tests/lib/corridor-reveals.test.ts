import { describe, expect, it } from "vitest";

import { BEAT_PARK_CENTRES } from "@/lib/home-v2/corridorMap";
import {
  BUILD_FADE_IN,
  ENCODE_FADE_IN,
  ENCODE_FADE_OUT,
  NAVIGATE_FADE_IN,
  NAVIGATE_FADE_OUT,
  overlayToggleOpacity,
  resolveOverlayAuto,
  resolveRevealStage,
  stageBandOpacity,
} from "@/lib/home-v2/corridorReveals";

/**
 * Arc detail overlays (ADR-032 + Update 1) — the pure band + toggle +
 * auto-collapse kernel `CorridorProgressRail`'s rAF reads. Everything here
 * is a function of paintProgress + epilogueProgress; no DOM.
 */

describe("stage fade bands", () => {
  it("are ordered and non-overlapping, Navigate → Encode → Build", () => {
    // Each band is [lo, hi] with lo < hi.
    for (const band of [
      NAVIGATE_FADE_IN,
      NAVIGATE_FADE_OUT,
      ENCODE_FADE_IN,
      ENCODE_FADE_OUT,
      BUILD_FADE_IN,
    ]) {
      expect(band[0]).toBeLessThan(band[1]);
    }
    // Fade-out of a stage sits before the next stage completes fading in.
    expect(NAVIGATE_FADE_IN[1]).toBeLessThanOrEqual(NAVIGATE_FADE_OUT[0]);
    expect(NAVIGATE_FADE_OUT[1]).toBeLessThanOrEqual(ENCODE_FADE_IN[0]);
    expect(ENCODE_FADE_IN[1]).toBeLessThanOrEqual(ENCODE_FADE_OUT[0]);
    expect(ENCODE_FADE_OUT[1]).toBeLessThanOrEqual(BUILD_FADE_IN[0]);
  });
});

describe("resolveRevealStage", () => {
  it("resolves to each stage at its beat park centre, with a visible chip", () => {
    const cases: Array<["navigate" | "encode" | "build", number]> = [
      ["navigate", BEAT_PARK_CENTRES.navigate ?? 0.4],
      ["encode", BEAT_PARK_CENTRES.diagnostic ?? 0.636],
      ["build", BEAT_PARK_CENTRES.intelligence ?? 0.923],
    ];
    for (const [stage, park] of cases) {
      const res = resolveRevealStage(park, 0, true);
      expect(res.stage).toBe(stage);
      expect(res.opacity).toBeGreaterThan(0);
    }
  });

  it("shows nothing while the corridor is not engaged", () => {
    expect(resolveRevealStage(0.636, 0, false)).toEqual({ stage: null, opacity: 0 });
  });

  it("shows nothing in the travel legs between stages", () => {
    // Before Navigate fades in, at the Navigate→Encode handoff, and in the
    // Encode→Build gap — every band is ~0.
    for (const p of [0.2, 0.54, 0.835]) {
      expect(resolveRevealStage(p, 0, true).stage).toBeNull();
    }
  });

  it("suppresses the Build chip once the epilogue BUILD_OUT band runs", () => {
    // Parked at Build (paintProgress 1): visible before the epilogue…
    expect(resolveRevealStage(1, 0, true).stage).toBe("build");
    // …gone once epilogueProgress passes BUILD_OUT (ends at 0.22).
    expect(resolveRevealStage(1, 0.3, true).stage).toBeNull();
  });

  it("build opacity decreases monotonically as the epilogue opens", () => {
    const atPark = stageBandOpacity("build", 1, 0);
    const midOut = stageBandOpacity("build", 1, 0.12);
    const doneOut = stageBandOpacity("build", 1, 0.3);
    expect(atPark).toBeGreaterThan(midOut);
    expect(midOut).toBeGreaterThan(doneOut);
    expect(doneOut).toBe(0);
  });
});

describe("overlayToggleOpacity", () => {
  const navPark = BEAT_PARK_CENTRES.navigate ?? 0.4;
  const encPark = BEAT_PARK_CENTRES.diagnostic ?? 0.636;
  const bldPark = BEAT_PARK_CENTRES.intelligence ?? 0.923;

  it("is hidden through Navigate, present at Encode + Build parks", () => {
    expect(overlayToggleOpacity(navPark, 0, true)).toBe(0);
    expect(overlayToggleOpacity(encPark, 0, true)).toBeGreaterThan(0.9);
    expect(overlayToggleOpacity(bldPark, 0, true)).toBeGreaterThan(0.9);
  });

  it("stays present across the Encode→Build travel gap (no blink)", () => {
    // Between Encode fade-out and Build fade-in the argmax chip dips; the
    // toggle rides Encode-fade-in only, so it holds.
    expect(overlayToggleOpacity(0.835, 0, true)).toBeGreaterThan(0.9);
  });

  it("leaves with the Build chapter and is 0 while disengaged", () => {
    expect(overlayToggleOpacity(1, 0.3, true)).toBe(0);
    expect(overlayToggleOpacity(bldPark, 0, false)).toBe(0);
  });
});

describe("resolveOverlayAuto", () => {
  const encPark = BEAT_PARK_CENTRES.diagnostic ?? 0.636;
  const bldPark = BEAT_PARK_CENTRES.intelligence ?? 0.923;

  it("keeps expanded detail while its stage is parked", () => {
    expect(resolveOverlayAuto(true, false, encPark, 0, true)).toEqual({
      collapseCardinal: false,
      collapseSurface: false,
      reset: false,
    });
    expect(resolveOverlayAuto(false, true, bldPark, 0, true).collapseSurface).toBe(false);
  });

  it("collapses a cardinal once the Encode band falls below the re-arm floor", () => {
    // Deep in Build, the Encode band is 0 → an open cardinal collapses,
    // but an open Build cascade does not.
    const auto = resolveOverlayAuto(true, false, bldPark, 0, true);
    expect(auto.collapseCardinal).toBe(true);
    expect(auto.collapseSurface).toBe(false);
  });

  it("collapses everything on epilogue start", () => {
    const auto = resolveOverlayAuto(true, true, bldPark, 0.02, true);
    expect(auto.collapseCardinal).toBe(true);
    expect(auto.collapseSurface).toBe(true);
    expect(auto.reset).toBe(false);
  });

  it("requests a full reset on disengage, and no-ops when nothing is open", () => {
    expect(resolveOverlayAuto(true, true, 0.4, 0, false)).toEqual({
      collapseCardinal: true,
      collapseSurface: true,
      reset: true,
    });
    expect(resolveOverlayAuto(false, false, encPark, 0, true)).toEqual({
      collapseCardinal: false,
      collapseSurface: false,
      reset: false,
    });
  });
});
