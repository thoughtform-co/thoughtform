import { describe, expect, it } from "vitest";

import {
  PULSAR,
  angleBetween,
  beamDir,
  crossing,
  firstCrossingS,
  phaseAt,
  pulsarFrame,
  rotateAbout,
  starPosition,
  type Vec3,
} from "@/lib/latent-flight/pulsar";
import { buildDust, buildStars } from "@/lib/latent-flight/starCatalog";
import { buildNoise } from "@/lib/latent-flight/noiseTexture";

const deg = (r: number) => (r * 180) / Math.PI;

describe("pulsar geometry", () => {
  const d: Vec3 = [0.3, 0.2, 0.93];
  const frame = pulsarFrame(d);

  it("leans the spin axis off the line of sight by exactly the tilt", () => {
    expect(deg(angleBetween(frame.spin, frame.d))).toBeCloseTo(PULSAR.tiltDeg, 6);
    expect(deg(angleBetween(frame.m0, frame.spin))).toBeCloseTo(PULSAR.tiltDeg, 6);
  });

  it("points the beam at the camera at phase 0 and away at half a turn", () => {
    expect(crossing(frame, 0)).toBeCloseTo(1, 9);
    expect(crossing(frame, Math.PI)).toBe(0);
    expect(crossing(frame, PULSAR.parkPhase)).toBe(0);
  });

  it("crosses exactly once per turn", () => {
    let maxima = 0;
    const n = 720;
    const vals = Array.from({ length: n }, (_, i) => crossing(frame, (i / n) * 2 * Math.PI));
    for (let i = 0; i < n; i++) {
      const prev = vals[(i - 1 + n) % n];
      const next = vals[(i + 1) % n];
      if (vals[i] > 0.5 && vals[i] >= prev && vals[i] > next) maxima++;
    }
    expect(maxima).toBe(1);
  });

  it("keeps the beam on a cone of half-angle α around the spin axis", () => {
    for (let i = 0; i < 12; i++) {
      const b = beamDir(frame, (i / 12) * 2 * Math.PI);
      expect(deg(angleBetween(b, frame.spin))).toBeCloseTo(PULSAR.tiltDeg, 6);
    }
  });

  it("parks in profile and pulses first at three quarters of a period", () => {
    expect(phaseAt(0)).toBe(PULSAR.parkPhase);
    expect(firstCrossingS()).toBeCloseTo(0.75 * PULSAR.periodS, 9);
    expect(crossing(frame, phaseAt(firstCrossingS()))).toBeCloseTo(1, 6);
  });

  it("rotates by Rodrigues: a quarter turn about Z sends X to Y", () => {
    const r = rotateAbout([1, 0, 0], [0, 0, 1], Math.PI / 2);
    expect(r[0]).toBeCloseTo(0, 9);
    expect(r[1]).toBeCloseTo(1, 9);
    expect(r[2]).toBeCloseTo(0, 9);
  });

  it("places the star in the upper-right third at the authored distance", () => {
    const p = starPosition(PULSAR.ndcX, PULSAR.ndcY, PULSAR.distance, 38, 16 / 9);
    expect(Math.hypot(...p)).toBeCloseTo(PULSAR.distance, 6);
    expect(p[0]).toBeGreaterThan(0);
    expect(p[1]).toBeGreaterThan(0);
    expect(p[2]).toBeLessThan(0);
  });
});

describe("star catalogue and noise", () => {
  it("is deterministic and keeps stars on the shell", () => {
    const a = buildStars(200, 3, 300, 300);
    const b = buildStars(200, 3, 300, 300);
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
    for (let i = 0; i < a.count; i++) {
      const r = Math.hypot(a.positions[i * 3], a.positions[i * 3 + 1], a.positions[i * 3 + 2]);
      expect(r).toBeCloseTo(300, 3);
      expect(a.mag[i]).toBeGreaterThanOrEqual(0);
      expect(a.mag[i]).toBeLessThanOrEqual(1);
    }
  });

  it("keeps the dust off the boresight in the near field", () => {
    const d = buildDust(400, 11, 20, 13, 40);
    for (let i = 0; i < d.count; i++) {
      const x = d.positions[i * 3];
      const y = d.positions[i * 3 + 1];
      const z = d.positions[i * 3 + 2];
      expect(z).toBeLessThanOrEqual(0);
      expect(z).toBeGreaterThanOrEqual(-40);
      if (-z < 6) expect(Math.abs(x) >= 1 || Math.abs(y) >= 1).toBe(true);
    }
  });

  it("builds a tileable RGBA field with a dither channel", () => {
    const n = buildNoise(7, 32);
    expect(n.length).toBe(32 * 32 * 4);
    let distinctB = new Set<number>();
    for (let i = 2; i < n.length; i += 4) distinctB.add(n[i]);
    expect(distinctB.size).toBeGreaterThan(100);
    // Tileable: the FBM at the last column is continuous with the first.
    const row = 5;
    const left = n[(row * 32 + 0) * 4];
    const right = n[(row * 32 + 31) * 4];
    expect(Math.abs(left - right)).toBeLessThan(64);
    distinctB = new Set();
  });
});
