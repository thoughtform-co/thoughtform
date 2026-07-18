import { describe, expect, it } from "vitest";

import {
  BAND_BASE_GAIN,
  BAND_GAIN_WINDOW,
  BAND_HALF,
  BAND_SOFT,
  BAND_SWING_MAX,
  BAND_SWING_MIN,
  BAND_TRAIL_GAIN,
  BAND_TRAIL_LEN,
  BAND_X_HALF,
  BAND_Y,
  MARK_HALF_EXTENT,
  bandGainT,
  bandPendulumDir,
  bandPendulumX,
} from "@/lib/services-ring/continuumBandMath";

describe("band gain — identity pin (the ADR-030/047/049 guardrail)", () => {
  it("is EXACTLY 0 at formT = 0 (pre-continuum frames byte-identical)", () => {
    expect(bandGainT(0)).toBe(0);
  });

  it("clamps outside [0, 1] and settles at 1", () => {
    expect(bandGainT(-1)).toBe(0);
    expect(bandGainT(2)).toBe(1);
    expect(bandGainT(1)).toBe(1);
    expect(bandGainT(BAND_GAIN_WINDOW[0])).toBe(0);
    expect(bandGainT(BAND_GAIN_WINDOW[1])).toBe(1);
  });

  it("is monotone non-decreasing", () => {
    let prev = -Infinity;
    for (let f = 0; f <= 1.0001; f += 0.02) {
      const v = bandGainT(f);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });
});

describe("pendulum — left ↔ right swing, eased at the turnarounds", () => {
  it("sits at the Tool end at whole phases, Collaborator at half phases", () => {
    expect(bandPendulumX(0)).toBeCloseTo(BAND_SWING_MIN, 12);
    expect(bandPendulumX(0.5)).toBeCloseTo(BAND_SWING_MAX, 12);
    expect(bandPendulumX(1)).toBeCloseTo(BAND_SWING_MIN, 12);
    expect(bandPendulumX(2.5)).toBeCloseTo(BAND_SWING_MAX, 12);
  });

  it("stays within the swing span at all phases", () => {
    for (let ph = 0; ph <= 3; ph += 0.013) {
      const x = bandPendulumX(ph);
      expect(x).toBeGreaterThanOrEqual(BAND_SWING_MIN - 1e-9);
      expect(x).toBeLessThanOrEqual(BAND_SWING_MAX + 1e-9);
    }
  });

  it("is symmetric — the return swing retraces the outbound path", () => {
    for (const p of [0.05, 0.17, 0.3, 0.42]) {
      expect(bandPendulumX(p)).toBeCloseTo(bandPendulumX(1 - p), 12);
    }
  });

  it("respects a custom span", () => {
    expect(bandPendulumX(0, 0.2, 0.8)).toBeCloseTo(0.2, 12);
    expect(bandPendulumX(0.5, 0.2, 0.8)).toBeCloseTo(0.8, 12);
  });

  it("eases at the turnarounds (pendulum profile: slow at ends, fast mid)", () => {
    const speed = (p: number) => Math.abs(bandPendulumX(p + 0.005) - bandPendulumX(p - 0.005));
    // Near the left turnaround the head barely moves; through the middle of
    // the outbound swing it moves fastest.
    expect(speed(0.02)).toBeLessThan(speed(0.25) * 0.25);
    expect(speed(0.48)).toBeLessThan(speed(0.25) * 0.25);
  });
});

describe("pendulum direction — the trail's anchor", () => {
  it("is +1 (rightward) through the first half-cycle, −1 through the second", () => {
    expect(bandPendulumDir(0)).toBe(1);
    expect(bandPendulumDir(0.25)).toBe(1);
    expect(bandPendulumDir(0.499)).toBe(1);
    expect(bandPendulumDir(0.5)).toBe(-1);
    expect(bandPendulumDir(0.75)).toBe(-1);
    expect(bandPendulumDir(0.999)).toBe(-1);
    expect(bandPendulumDir(2.25)).toBe(1);
  });

  it("matches the numerical derivative sign away from the turnarounds", () => {
    for (const p of [0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9]) {
      const d = bandPendulumX(p + 0.004) - bandPendulumX(p - 0.004);
      expect(Math.sign(d)).toBe(bandPendulumDir(p));
    }
  });
});

describe("band slab + look defaults — sane mark-local geometry", () => {
  it("slab sits inside the mark and spans its width", () => {
    expect(Math.abs(BAND_Y) + BAND_HALF + BAND_SOFT).toBeLessThan(MARK_HALF_EXTENT);
    expect(BAND_X_HALF).toBeLessThanOrEqual(MARK_HALF_EXTENT + 1e-9);
    expect(BAND_HALF).toBeGreaterThan(0);
    expect(BAND_SOFT).toBeGreaterThan(0);
  });

  it("swing span is inset within the band (labels dock beyond the ends)", () => {
    expect(BAND_SWING_MIN).toBeGreaterThan(0);
    expect(BAND_SWING_MAX).toBeLessThan(1);
    expect(BAND_SWING_MIN).toBeLessThan(BAND_SWING_MAX);
  });

  it("trail + base are recessive (the head stays the focal element)", () => {
    expect(BAND_TRAIL_LEN).toBeGreaterThan(0);
    expect(BAND_TRAIL_GAIN).toBeLessThan(1);
    expect(BAND_BASE_GAIN).toBeLessThan(1);
  });
});
