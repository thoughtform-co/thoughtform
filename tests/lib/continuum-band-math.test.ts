import { describe, expect, it } from "vitest";

import {
  THUMB_F_MAX,
  THUMB_F_MIN,
  THUMB_TICK_FRACTIONS,
} from "@/lib/services-ring/continuumStageMath";
import {
  BAND_INNER_MUL,
  BAND_LINES_WINDOW,
  BAND_MINOR_TICKS_PER_SPAN,
  BAND_OUTER_MUL,
  BAND_PARTICLES_WINDOW,
  BAND_PARTICLE_Z_JITTER,
  BAND_POLES_WINDOW,
  BAND_TICKS_WINDOW,
  BAND_TRAVELER_WINDOW,
  bandMinorTickFractions,
  bandRevealT,
  bandRingPoint,
  buildBandParticles,
  travelerCentreWeight,
} from "@/lib/services-ring/continuumBandMath";

const WAIST_R = 1.06;
const WAIST_ECC = 0.96;
const ALL_WINDOWS = [
  BAND_LINES_WINDOW,
  BAND_PARTICLES_WINDOW,
  BAND_TICKS_WINDOW,
  BAND_POLES_WINDOW,
  BAND_TRAVELER_WINDOW,
] as const;

describe("band reveal windows — inert off-stage, formed before the end", () => {
  it("every window is a valid [a, b] with 0 ≤ a < b ≤ 1", () => {
    for (const w of ALL_WINDOWS) {
      expect(w[0]).toBeGreaterThanOrEqual(0);
      expect(w[0]).toBeLessThan(w[1]);
      expect(w[1]).toBeLessThanOrEqual(1);
    }
  });

  it("reveals in order: lines → particles → ticks → poles → traveler", () => {
    // Ordered by window START (the beam draws first, the traveler lands last).
    for (let i = 1; i < ALL_WINDOWS.length; i++) {
      expect(ALL_WINDOWS[i - 1][0]).toBeLessThanOrEqual(ALL_WINDOWS[i][0]);
    }
  });

  it("bandRevealT is EXACTLY 0 at formT 0 and 1 at formT 1 for every window", () => {
    for (const w of ALL_WINDOWS) {
      expect(bandRevealT(0, w)).toBe(0);
      expect(bandRevealT(1, w)).toBe(1);
      // Clamps outside [0, 1].
      expect(bandRevealT(-0.5, w)).toBe(0);
      expect(bandRevealT(2, w)).toBe(1);
    }
  });
});

describe("bandRingPoint — locked onto the drawn waist ellipse", () => {
  it("lies exactly on the ellipse for any fraction / radius multiplier", () => {
    for (const f of [0, 1 / 6, 0.3, 0.5, 0.72, 5 / 6, 1]) {
      for (const mul of [BAND_INNER_MUL, 1, BAND_OUTER_MUL]) {
        const [x, y] = bandRingPoint(f, mul, WAIST_R, WAIST_ECC);
        const rx = WAIST_R * mul;
        const ry = WAIST_R * mul * WAIST_ECC;
        expect((x / rx) ** 2 + (y / ry) ** 2).toBeCloseTo(1, 10);
      }
    }
  });

  it("registers Tool left (x<0), Collaborator right (x>0), centre front (x≈0)", () => {
    const [xTool] = bandRingPoint(THUMB_F_MIN, 1, WAIST_R, WAIST_ECC);
    const [xMid] = bandRingPoint(0.5, 1, WAIST_R, WAIST_ECC);
    const [xCollab] = bandRingPoint(THUMB_F_MAX, 1, WAIST_R, WAIST_ECC);
    expect(xTool).toBeLessThan(0);
    expect(Math.abs(xMid)).toBeLessThan(1e-9);
    expect(xCollab).toBeGreaterThan(0);
  });

  it("stays on the FRONT arc (y>0) across the whole Tool→Collaborator span", () => {
    for (let f = THUMB_F_MIN; f <= THUMB_F_MAX + 1e-9; f += 0.02) {
      const [, y] = bandRingPoint(f, 1, WAIST_R, WAIST_ECC);
      expect(y).toBeGreaterThan(0);
    }
  });
});

describe("travelerCentreWeight — bright at centre, dim at the stops, symmetric", () => {
  it("is exactly 1 at the front-centre (over the mark)", () => {
    expect(travelerCentreWeight(0.5)).toBeCloseTo(1, 10);
  });

  it("is small at both Tool and Collaborator stops", () => {
    expect(travelerCentreWeight(THUMB_F_MIN)).toBeLessThan(0.15);
    expect(travelerCentreWeight(THUMB_F_MAX)).toBeLessThan(0.15);
  });

  it("is symmetric about the centre (f ↔ 1 − f)", () => {
    for (const f of [0.1, 0.25, 1 / 6, 0.4]) {
      expect(travelerCentreWeight(f)).toBeCloseTo(travelerCentreWeight(1 - f), 12);
    }
  });
});

describe("bandMinorTickFractions — evenly between the majors, exclusive", () => {
  it("puts perSpan × (majors − 1) ticks strictly inside the span, sorted", () => {
    const minors = bandMinorTickFractions();
    expect(minors.length).toBe(BAND_MINOR_TICKS_PER_SPAN * (THUMB_TICK_FRACTIONS.length - 1));
    for (let i = 1; i < minors.length; i++) {
      expect(minors[i]).toBeGreaterThan(minors[i - 1]);
    }
    for (const m of minors) {
      expect(m).toBeGreaterThan(THUMB_F_MIN);
      expect(m).toBeLessThan(THUMB_F_MAX);
      // None coincides with a major stop.
      for (const major of THUMB_TICK_FRACTIONS) {
        expect(Math.abs(m - major)).toBeGreaterThan(1e-6);
      }
    }
  });

  it("respects a custom perSpan", () => {
    expect(bandMinorTickFractions(2).length).toBe(2 * (THUMB_TICK_FRACTIONS.length - 1));
    expect(bandMinorTickFractions(0).length).toBe(0);
  });
});

describe("buildBandParticles — deterministic annulus with sorted angles", () => {
  it("is byte-identical for the same seed (resume-safe, no Math.random)", () => {
    const a = buildBandParticles(200, WAIST_R, WAIST_ECC);
    const b = buildBandParticles(200, WAIST_R, WAIST_ECC);
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
    expect(Array.from(a.angles)).toEqual(Array.from(b.angles));
    expect(Array.from(a.muls)).toEqual(Array.from(b.muls));
  });

  it("scatters within the radial band, the z-jitter, and sorts angles ascending", () => {
    const { positions, angles, muls } = buildBandParticles(500, WAIST_R, WAIST_ECC);
    expect(positions.length).toBe(500 * 3);
    expect(angles.length).toBe(500);
    expect(muls.length).toBe(500);
    for (let i = 0; i < 500; i++) {
      expect(muls[i]).toBeGreaterThanOrEqual(BAND_INNER_MUL - 1e-9);
      expect(muls[i]).toBeLessThanOrEqual(BAND_OUTER_MUL + 1e-9);
      expect(Math.abs(positions[i * 3 + 2])).toBeLessThanOrEqual(BAND_PARTICLE_Z_JITTER + 1e-9);
      if (i > 0) expect(angles[i]).toBeGreaterThanOrEqual(angles[i - 1]);
    }
  });

  it("respects a governor-shrunk count (down to 1)", () => {
    const { positions, angles } = buildBandParticles(1, WAIST_R, WAIST_ECC);
    expect(positions.length).toBe(3);
    expect(angles.length).toBe(1);
  });
});
