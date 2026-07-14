// Pins for the Arc Cases stream-latch pure math (ADR-035 Update 1). The
// fold's screen-exactness is proved visually against the running dev
// server; these pin the properties the R3F component leans on — exact
// endpoints, monotonic envelope, no-cross row ordering, sample-count
// parity, and NaN-safety on a degenerate rect.

import { describe, expect, it } from "vitest";
import {
  type Vec3Like,
  arcLatchEnvelope,
  attachFractionForRow,
  buildDockedPath,
  cubicBezierPoint,
} from "@/lib/arc-cases/streamLatchMath";

const v = (x: number, y: number, z: number): Vec3Like => ({ x, y, z });
const alloc = (n: number): Vec3Like[] => Array.from({ length: n }, () => v(0, 0, 0));
const finite = (p: Vec3Like) =>
  Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);

describe("attachFractionForRow", () => {
  it("keeps every fraction inside the panel (0..1)", () => {
    for (const n of [5, 6]) {
      for (let i = 0; i < n; i++) {
        const f = attachFractionForRow(i, n);
        expect(f).toBeGreaterThan(0);
        expect(f).toBeLessThan(1);
      }
    }
  });

  it("descends with the row index so higher rows latch nearer the top (no crossings)", () => {
    // Row index rises with world Y (row 0 = bottom); screen Y grows
    // downward, so the fraction MUST strictly decrease with the index.
    for (const n of [5, 6]) {
      for (let i = 1; i < n; i++) {
        expect(attachFractionForRow(i, n)).toBeLessThan(attachFractionForRow(i - 1, n));
      }
    }
  });

  it("is symmetric about the panel mid-line (cell-centre spacing)", () => {
    const n = 6;
    for (let i = 0; i < n; i++) {
      expect(attachFractionForRow(i, n) + attachFractionForRow(n - 1 - i, n)).toBeCloseTo(1, 12);
    }
  });

  it("degenerate row count → mid panel", () => {
    expect(attachFractionForRow(0, 0)).toBe(0.5);
  });
});

describe("arcLatchEnvelope", () => {
  it("pins the endpoints (0 → rest, 1 → fully latched)", () => {
    expect(arcLatchEnvelope(0)).toBe(0);
    expect(arcLatchEnvelope(1)).toBe(1);
  });

  it("clamps out-of-range levels", () => {
    expect(arcLatchEnvelope(-0.4)).toBe(0);
    expect(arcLatchEnvelope(1.7)).toBe(1);
  });

  it("is monotonically non-decreasing (clean reverse on close / scroll-away)", () => {
    let prev = arcLatchEnvelope(0);
    for (let level = 0; level <= 1.0001; level += 0.02) {
      const e = arcLatchEnvelope(level);
      expect(e).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(e).toBeGreaterThanOrEqual(0);
      expect(e).toBeLessThanOrEqual(1);
      prev = e;
    }
  });
});

describe("cubicBezierPoint", () => {
  it("hits p0 at s=0 and p3 at s=1", () => {
    const p0 = v(-2, 1, 0);
    const p1 = v(-1, 1, 0);
    const p2 = v(1, 0.5, 0);
    const p3 = v(2, -1, 0);
    const out = v(0, 0, 0);
    cubicBezierPoint(p0, p1, p2, p3, 0, out);
    expect([out.x, out.y, out.z]).toEqual([p0.x, p0.y, p0.z]);
    cubicBezierPoint(p0, p1, p2, p3, 1, out);
    expect([out.x, out.y, out.z]).toEqual([p3.x, p3.y, p3.z]);
  });
});

describe("buildDockedPath", () => {
  const SAMPLES = 37; // parity with the rest stream (approach + wrap + 1)

  it("welds the pip end and lands the terminus exactly on the border", () => {
    const pip = v(-2.2, 0.4, 0);
    const tangent = v(1, 0.1, 0);
    const attach = v(-1.6, 0.2, 0);
    const arrival = v(1, 0, 0);
    const out = alloc(SAMPLES);
    buildDockedPath(pip, tangent, attach, arrival, SAMPLES, out);
    expect([out[0].x, out[0].y, out[0].z]).toEqual([pip.x, pip.y, pip.z]);
    const last = out[SAMPLES - 1];
    expect([last.x, last.y, last.z]).toEqual([attach.x, attach.y, attach.z]);
  });

  it("fills exactly the requested sample count (parity with the rest builder)", () => {
    const out = alloc(SAMPLES);
    buildDockedPath(v(0, 0, 0), v(1, 0, 0), v(3, 1, 0), v(-1, 0, 0), SAMPLES, out);
    expect(out).toHaveLength(SAMPLES);
    for (const p of out) expect(finite(p)).toBe(true);
  });

  it("leaves the pip along the initial tangent", () => {
    const pip = v(-2.2, 0.4, 0);
    const tangent = v(1, 0, 0);
    const attach = v(-1.6, 0.9, 0);
    const arrival = v(1, 0, 0);
    const out = alloc(SAMPLES);
    buildDockedPath(pip, tangent, attach, arrival, SAMPLES, out);
    // The first step off the pip should have a positive component along
    // the tangent direction.
    const dx = out[1].x - out[0].x;
    const dy = out[1].y - out[0].y;
    expect(dx * tangent.x + dy * tangent.y).toBeGreaterThan(0);
  });

  it("is NaN-safe on a degenerate rect (pip === attach)", () => {
    const p = v(1.5, -0.3, 0);
    const out = alloc(SAMPLES);
    buildDockedPath(p, v(1, 0, 0), p, v(-1, 0, 0), SAMPLES, out);
    for (const q of out) expect(finite(q)).toBe(true);
    expect([out[0].x, out[0].y, out[0].z]).toEqual([p.x, p.y, p.z]);
    expect([out[SAMPLES - 1].x, out[SAMPLES - 1].y, out[SAMPLES - 1].z]).toEqual([p.x, p.y, p.z]);
  });
});
