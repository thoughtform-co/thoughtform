import { describe, expect, it } from "vitest";

import { BEAT_PARK_CENTRES } from "@/lib/home-v2/corridorMap";
import {
  BUILD_FADE_IN,
  ENCODE_FADE_IN,
  ENCODE_FADE_OUT,
  NAVIGATE_FADE_IN,
  NAVIGATE_FADE_OUT,
  REVEAL_REARM,
  resolveRevealStage,
  shouldForceClose,
  stageBandOpacity,
} from "@/lib/home-v2/corridorReveals";

/**
 * Arc reveal consoles (ADR-032) — the pure band/force-close kernel that
 * the `CorridorRevealLayer` rAF reads. Everything here is a function of
 * paintProgress + epilogueProgress; no DOM.
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

describe("shouldForceClose", () => {
  const build = "build" as const;

  it("keeps an open panel while its stage is parked", () => {
    expect(shouldForceClose(build, BEAT_PARK_CENTRES.intelligence ?? 0.923, 0, true)).toBe(false);
  });

  it("closes when the open stage has faded below the re-arm floor", () => {
    // Well outside the Build band → opacity 0 < REVEAL_REARM.
    expect(shouldForceClose(build, 0.2, 0, true)).toBe(true);
    expect(stageBandOpacity(build, 0.2, 0)).toBeLessThan(REVEAL_REARM);
  });

  it("closes as soon as the epilogue begins", () => {
    expect(shouldForceClose(build, BEAT_PARK_CENTRES.intelligence ?? 0.923, 0.02, true)).toBe(true);
  });

  it("closes when the corridor disengages, and is a no-op when nothing is open", () => {
    expect(shouldForceClose(build, 0.923, 0, false)).toBe(true);
    expect(shouldForceClose(null, 0.923, 0, true)).toBe(false);
  });
});
