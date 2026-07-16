import { describe, expect, it } from "vitest";

import {
  PARKED_SCALE_BOOST_MAX,
  getParkedInstrumentScaleMul,
} from "@/lib/home-v2/parkedInstrumentScale";

const mul = (w: number, h: number) => getParkedInstrumentScaleMul(w / h, h);

describe("getParkedInstrumentScaleMul", () => {
  it("boosts MacBook-class viewports to the full 1.15", () => {
    expect(mul(1440, 900)).toBeCloseTo(1 + PARKED_SCALE_BOOST_MAX, 5);
    expect(mul(1280, 800)).toBeCloseTo(1 + PARKED_SCALE_BOOST_MAX, 5);
    expect(mul(1512, 982)).toBeCloseTo(1 + PARKED_SCALE_BOOST_MAX, 5);
  });

  it("leaves wide monitors byte-identical (mul = 1)", () => {
    expect(mul(1920, 1080)).toBe(1);
    expect(mul(2560, 1440)).toBe(1);
  });

  it("leaves tall 16:10 monitors byte-identical (height gate)", () => {
    expect(mul(2560, 1600)).toBe(1);
  });

  it("ramps smoothly mid-height (1680×1050 sits mid-boost)", () => {
    const v = mul(1680, 1050);
    expect(v).toBeGreaterThan(1.05);
    expect(v).toBeLessThan(1.1);
  });

  it("returns 1 for portrait and near-square aspects", () => {
    expect(getParkedInstrumentScaleMul(0.5, 812)).toBe(1);
    expect(getParkedInstrumentScaleMul(0.999, 800)).toBe(1);
    // At/below the square guard the boost is fully off.
    expect(getParkedInstrumentScaleMul(1.3, 800)).toBe(1);
  });

  it("returns 1 for invalid input", () => {
    expect(getParkedInstrumentScaleMul(NaN, 900)).toBe(1);
    expect(getParkedInstrumentScaleMul(Infinity, 900)).toBe(1);
    expect(getParkedInstrumentScaleMul(1.6, NaN)).toBe(1);
  });

  it("is bounded by 1 + PARKED_SCALE_BOOST_MAX everywhere", () => {
    for (let w = 900; w <= 3840; w += 120) {
      for (let h = 600; h <= 2160; h += 90) {
        const v = mul(w, h);
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(1 + PARKED_SCALE_BOOST_MAX);
      }
    }
  });

  it("is monotone in height for a fixed MacBook aspect (no resize pops)", () => {
    let prev = Infinity;
    for (let h = 700; h <= 1300; h += 10) {
      const v = getParkedInstrumentScaleMul(1.6, h);
      expect(v).toBeLessThanOrEqual(prev + 1e-9);
      prev = v;
    }
  });
});
