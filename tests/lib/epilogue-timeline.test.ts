import { describe, expect, it } from "vitest";

import {
  DISSIPATE_BANDS,
  DISSIPATE_INTERIOR_OPACITY_FLOOR,
  DISSIPATE_SHELL_SCATTER_AMP,
  DOCKED_INSTRUMENT_EPILOGUE_POSE,
  EPILOGUE_BANDS,
  band,
  corridorExitSpeedRamp,
  dissipateAtmosphereEnvelope,
  dissipateBand,
  dissipateCoreMultiplier,
  dissipateInteriorOpacityMultiplier,
  dissipateOpacityMultiplier,
  dissipateShellScatter,
  epilogueBand,
  getEpiloguePlanetScale,
} from "@/lib/home-v2/epilogueTimeline";

/**
 * Pure timing helpers for the corridor's post-Build epilogue (ADR-018
 * v3 "planet landing") and the corridor → services dissipate clock
 * (ADR-021). Painters across the home-v2 R3F scene read these helpers
 * directly, so the band edges, ramp shapes, and saturating endpoints
 * must stay byte-identical when surrounding code is moved.
 */

describe("epilogue/dissipate — band primitive", () => {
  it("is a smoothstep that saturates outside [edge0, edge1]", () => {
    expect(band(-1, 0.2, 0.8)).toBe(0);
    expect(band(0.2, 0.2, 0.8)).toBe(0);
    expect(band(0.8, 0.2, 0.8)).toBe(1);
    expect(band(2, 0.2, 0.8)).toBe(1);
    expect(band(0.5, 0.2, 0.8)).toBeCloseTo(0.5, 5);
  });

  it("returns a step (0 below, 1 above) when edge1 <= edge0", () => {
    expect(band(0.4, 0.5, 0.5)).toBe(0);
    expect(band(0.5, 0.5, 0.5)).toBe(1);
    expect(band(0.6, 0.5, 0.5)).toBe(1);
  });
});

describe("epilogueBand", () => {
  it("returns 0 before each band and 1 at/after its end", () => {
    for (const key of Object.keys(EPILOGUE_BANDS) as (keyof typeof EPILOGUE_BANDS)[]) {
      const w = EPILOGUE_BANDS[key];
      expect(epilogueBand(0, key)).toBe(0);
      expect(epilogueBand(w.start, key)).toBe(0);
      expect(epilogueBand(w.end, key)).toBe(1);
      expect(epilogueBand(1, key)).toBe(1);
    }
  });

  it("BUILD_OUT, APPROACH, LAND, TITLE_IN bands sit inside [0,1]", () => {
    for (const key of Object.keys(EPILOGUE_BANDS) as (keyof typeof EPILOGUE_BANDS)[]) {
      const w = EPILOGUE_BANDS[key];
      expect(w.start).toBeGreaterThanOrEqual(0);
      expect(w.end).toBeLessThanOrEqual(1);
      expect(w.start).toBeLessThan(w.end);
    }
  });
});

describe("getEpiloguePlanetScale", () => {
  it("returns 1 inside the calibrated corridor (no epilogue scrub yet)", () => {
    expect(getEpiloguePlanetScale(0)).toBe(1);
  });

  it("ramps monotonically with the APPROACH band", () => {
    let last = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const v = getEpiloguePlanetScale(p);
      expect(v).toBeGreaterThanOrEqual(last - 1e-6);
      last = v;
    }
    expect(getEpiloguePlanetScale(1)).toBeGreaterThan(1);
  });

  it("DOCKED_INSTRUMENT_EPILOGUE_POSE sits inside the epilogue scrub", () => {
    expect(DOCKED_INSTRUMENT_EPILOGUE_POSE).toBeGreaterThan(0);
    expect(DOCKED_INSTRUMENT_EPILOGUE_POSE).toBeLessThan(1);
  });
});

describe("dissipate clock", () => {
  it("dissipateBand returns the smoothstep for each named band", () => {
    for (const key of Object.keys(DISSIPATE_BANDS) as (keyof typeof DISSIPATE_BANDS)[]) {
      const w = DISSIPATE_BANDS[key];
      expect(dissipateBand(w.start, key)).toBe(0);
      expect(dissipateBand(w.end, key)).toBe(1);
    }
  });

  it("opacity multiplier holds at 1 before PARTICLE_FADE and bottoms out by ~0.95", () => {
    expect(dissipateOpacityMultiplier(0)).toBe(1);
    expect(dissipateOpacityMultiplier(DISSIPATE_BANDS.PARTICLE_FADE.start)).toBe(1);
    expect(dissipateOpacityMultiplier(0.99)).toBeCloseTo(0, 1);
  });

  it("keeps SIGNAL_OUT as a late tail fade after movement has started", () => {
    expect(DISSIPATE_BANDS.SIGNAL_OUT.start).toBeGreaterThanOrEqual(0.85);
    expect(DISSIPATE_BANDS.SIGNAL_OUT.end).toBeGreaterThanOrEqual(0.99);
    expect(DISSIPATE_BANDS.SIGNAL_OUT.end).toBeLessThan(1);
  });

  it("core multiplier sheds early (CORE_SHED) and atmosphere envelope ends at 0", () => {
    expect(dissipateCoreMultiplier(0)).toBe(1);
    expect(dissipateCoreMultiplier(DISSIPATE_BANDS.CORE_SHED.end)).toBeCloseTo(0, 5);
    expect(dissipateAtmosphereEnvelope(0)).toBe(1);
    expect(dissipateAtmosphereEnvelope(1)).toBe(0);
    // Atmosphere blooms to a peak above 1 before fading.
    expect(dissipateAtmosphereEnvelope(0.35)).toBeGreaterThan(1);
  });

  it("shell-scatter ramps from 1 to 1 + DISSIPATE_SHELL_SCATTER_AMP across the dissipate", () => {
    expect(dissipateShellScatter(0)).toBe(1);
    expect(dissipateShellScatter(1)).toBeCloseTo(1 + DISSIPATE_SHELL_SCATTER_AMP, 5);
    // Monotonic across [0, 1].
    let last = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const v = dissipateShellScatter(p);
      expect(v).toBeGreaterThanOrEqual(last - 1e-6);
      last = v;
    }
  });

  it("interior opacity multiplier holds at 1 before PARTICLE_FADE and settles on the floor", () => {
    expect(dissipateInteriorOpacityMultiplier(0)).toBe(1);
    expect(dissipateInteriorOpacityMultiplier(DISSIPATE_BANDS.PARTICLE_FADE.start)).toBe(1);
    // At PARTICLE_FADE.end the band saturates → multiplier === floor.
    expect(dissipateInteriorOpacityMultiplier(DISSIPATE_BANDS.PARTICLE_FADE.end)).toBeCloseTo(
      DISSIPATE_INTERIOR_OPACITY_FLOOR,
      5
    );
    expect(dissipateInteriorOpacityMultiplier(1)).toBeCloseTo(DISSIPATE_INTERIOR_OPACITY_FLOOR, 5);
  });

  it("interior opacity multiplier never drops below `dissipateOpacityMultiplier`", () => {
    // The interior helper is a relaxation of the surface helper — at every
    // dissipate sample its output must be >= the surface output, so
    // routing the interior cloud through it can only INCREASE visible
    // alpha vs. the previous full-fade behavior (and never make the
    // interior dimmer than the dissipating shell).
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const interior = dissipateInteriorOpacityMultiplier(p);
      const surface = dissipateOpacityMultiplier(p);
      expect(interior).toBeGreaterThanOrEqual(surface - 1e-6);
    }
  });

  it("interior opacity multiplier accepts a custom floor", () => {
    expect(dissipateInteriorOpacityMultiplier(1, 0)).toBeCloseTo(0, 5);
    expect(dissipateInteriorOpacityMultiplier(1, 0.5)).toBeCloseTo(0.5, 5);
    // Out-of-range floors are clamped so callers can't accidentally
    // brighten the cloud above the parked alpha.
    expect(dissipateInteriorOpacityMultiplier(0, 1.5)).toBe(1);
    expect(dissipateInteriorOpacityMultiplier(1, 1.5)).toBeCloseTo(1, 5);
    expect(dissipateInteriorOpacityMultiplier(1, -0.2)).toBeCloseTo(0, 5);
  });
});

describe("corridorExitSpeedRamp", () => {
  it("is a strictly monotonic ease-in-out (smootherstep) over [0, 1]", () => {
    expect(corridorExitSpeedRamp(0)).toBe(0);
    expect(corridorExitSpeedRamp(1)).toBeCloseTo(1, 10);
    let last = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const v = corridorExitSpeedRamp(p);
      expect(v).toBeGreaterThanOrEqual(last - 1e-6);
      last = v;
    }
    // Ease-in-out: symmetric S — below the diagonal in the first half,
    // above it in the second, with the midpoint exactly at 0.5.
    expect(corridorExitSpeedRamp(0.5)).toBeCloseTo(0.5, 6);
    expect(corridorExitSpeedRamp(0.25)).toBeLessThan(0.25);
    expect(corridorExitSpeedRamp(0.75)).toBeGreaterThan(0.75);
  });

  it("has a gentle (near zero-velocity) onset — no harsh leap as #services enters", () => {
    // smootherstep'(0) === 0, so a tiny input maps to a far smaller
    // output than the previous ease-out cubic (slope 3 at the origin),
    // which is what removed the abrupt onset of the sphere fly-in.
    expect(corridorExitSpeedRamp(0.02)).toBeLessThan(0.02);
  });

  it("clamps inputs outside [0, 1]", () => {
    expect(corridorExitSpeedRamp(-1)).toBe(0);
    expect(corridorExitSpeedRamp(2)).toBeCloseTo(1, 10);
  });
});
