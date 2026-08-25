import { describe, expect, it } from "vitest";

import {
  ADOPTION_TREADS,
  AXIS_HALF,
  CAM_DISTANCE,
  POLAR_MAX,
  POLAR_MIN,
  R_MAX,
  R_MIN,
  buildShells,
  levelAt,
  mulberry32,
  restCameraPosition,
  ringRadius,
  ringReveal,
  tickCount,
  waypointZ,
  type HoloWaypoint,
} from "@/components/holo-program/holoProgramGeom";

/* The portfolio's real course — the same `at` values the registry pins
   sorted and unequal (`lib/arcs/content/portfolio.ts`). The guard walks the
   record rather than a fixture, so a content edit that breaks the object
   fails here rather than on screen. */
const COURSE: readonly HoloWaypoint[] = [
  { id: "embedded", label: "Embedded in marketing", sub: "2024", at: 0.04 },
  { id: "studio", label: "The studio brief", sub: "2025", at: 0.21 },
  { id: "films", label: "The films", sub: "Sept 2025", at: 0.38 },
  { id: "vesper", label: "Tools for the process", sub: "Oct 2025", at: 0.52 },
  { id: "process", label: "Tools around it", sub: "Feb 2026", at: 0.69 },
  { id: "company", label: "Company-wide", sub: "Q2 2026", at: 0.83 },
  { id: "architect", label: "Intelligence architecture", sub: "Now", at: 1, seat: true },
];

describe("the adoption ladder is the flat board's own curve", () => {
  it("is a STEP function — it never interpolates between treads", () => {
    for (let i = 0; i < ADOPTION_TREADS.length - 1; i++) {
      const [start, level] = ADOPTION_TREADS[i];
      const [nextStart] = ADOPTION_TREADS[i + 1];
      expect(levelAt(start)).toBe(level);
      expect(levelAt((start + nextStart) / 2)).toBe(level);
      expect(levelAt(nextStart - 1e-6)).toBe(level);
    }
  });

  it("rises and never falls — adoption is monotonic on this record", () => {
    for (let i = 1; i < ADOPTION_TREADS.length; i++) {
      expect(ADOPTION_TREADS[i][1]).toBeGreaterThan(ADOPTION_TREADS[i - 1][1]);
      expect(ADOPTION_TREADS[i][0]).toBeGreaterThan(ADOPTION_TREADS[i - 1][0]);
    }
    expect(ADOPTION_TREADS[0][1]).toBe(0);
    expect(ADOPTION_TREADS[ADOPTION_TREADS.length - 1][1]).toBe(1);
  });

  it("maps the course onto radii that grow with the record", () => {
    const radii = COURSE.map((w) => ringRadius(w.at));
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeGreaterThanOrEqual(radii[i - 1]);
    }
    expect(radii[0]).toBeCloseTo(R_MIN, 6);
    expect(radii[radii.length - 1]).toBeCloseTo(R_MAX, 6);
    // The seat is strictly the widest — the terminus is the one that arrived.
    expect(radii[radii.length - 1]).toBeGreaterThan(radii[radii.length - 2]);
  });

  it("graduates a bigger ring with more ticks, and never fewer than a floor", () => {
    expect(tickCount(R_MAX)).toBeGreaterThan(tickCount(R_MIN));
    expect(tickCount(0.01)).toBeGreaterThanOrEqual(16);
  });
});

describe("the record's spacing survives into the object", () => {
  it("places the course in order down the axis, inside its own span", () => {
    const zs = COURSE.map((w) => waypointZ(w.at));
    for (let i = 1; i < zs.length; i++) expect(zs[i]).toBeGreaterThan(zs[i - 1]);
    expect(zs[0]).toBeGreaterThanOrEqual(-AXIS_HALF - 1e-9);
    expect(zs[zs.length - 1]).toBeLessThanOrEqual(AXIS_HALF + 1e-9);
  });

  it("keeps the gaps UNEQUAL — an even spread would delete the reading", () => {
    /* ADR-078: the gaps ARE the reading. `at` maps linearly to depth, so the
       record's own unevenness must come through exactly, not merely survive
       approximately. */
    const atGaps = COURSE.slice(1).map((w, i) => w.at - COURSE[i].at);
    const zGaps = COURSE.slice(1).map((w, i) => waypointZ(w.at) - waypointZ(COURSE[i].at));
    const atRatio = Math.max(...atGaps) / Math.min(...atGaps);
    const zRatio = Math.max(...zGaps) / Math.min(...zGaps);
    expect(atRatio).toBeGreaterThan(1.1);
    expect(zRatio).toBeCloseTo(atRatio, 6);
  });

  it("staggers the intro by DATE, so the object builds in the record's order", () => {
    const reveals = COURSE.map((w) => ringReveal(w.at));
    for (let i = 1; i < reveals.length; i++) {
      expect(reveals[i][0]).toBeGreaterThan(reveals[i - 1][0]);
    }
    expect(reveals[0][0]).toBeGreaterThanOrEqual(0);
    expect(reveals[reveals.length - 1][1]).toBeLessThanOrEqual(1.000001);
  });
});

describe("the machine around the record is SEEDED, never random", () => {
  /**
   * ⚠ A random draw in a render is a hydration mismatch and a screenshot that
   * never reproduces — the flat board's own SCATTER comment says the same
   * thing, and the reference seeds its whole cluster from one integer.
   */
  it("builds byte-identical shells on every call", () => {
    const a = buildShells();
    const b = buildShells();
    expect(a.length).toBe(b.length);
    expect(a).toEqual(b);
  });

  it("gives a different seed a different machine", () => {
    expect(buildShells(22, 368)).not.toEqual(buildShells(22, 369));
  });

  it("keeps every shell DIMMER than the record's own rings", () => {
    // The eye must be able to separate the record from the machine it lives
    // in, at any angle. The record's resting floor is 0.72 (O_RING).
    for (const s of buildShells()) {
      expect(s.opacity).toBeLessThan(0.4);
    }
  });

  it("has a PRNG that is deterministic and in range", () => {
    const r1 = mulberry32(368);
    const r2 = mulberry32(368);
    for (let i = 0; i < 50; i++) {
      const v = r1();
      expect(v).toBe(r2());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("the camera can be orbited, but only into dignified poses", () => {
  it("rests at the derived distance", () => {
    const [x, y, z] = restCameraPosition();
    expect(Math.hypot(x, y, z)).toBeCloseTo(CAM_DISTANCE, 6);
  });

  it("rests ABOVE the object, which is what opens the rings", () => {
    /* ⚠ THE POSE IS THE WHOLE DIFFERENCE from round 1. Coaxial rings viewed
       from their own level project to lines; viewed from above they open
       into ellipses and the stack gains an interior. */
    const [, y] = restCameraPosition();
    expect(y).toBeGreaterThan(0.5);
  });

  it("clamps the polar range so it can never be viewed from under the floor", () => {
    expect(POLAR_MIN).toBeGreaterThan(0);
    expect(POLAR_MAX).toBeLessThan(Math.PI);
    expect(POLAR_MAX).toBeGreaterThan(POLAR_MIN);
    // And the rest pose has to sit inside the band the reader is held to.
    const [x, y, z] = restCameraPosition();
    const polar = Math.acos(y / Math.hypot(x, y, z));
    expect(polar).toBeGreaterThanOrEqual(POLAR_MIN);
    expect(polar).toBeLessThanOrEqual(POLAR_MAX);
  });
});
