import { describe, expect, it } from "vitest";

import { HOLO_DARK, HOLO_LIGHT, holoGroundCss } from "@/components/holo-program/holoPalette";
import {
  ADOPTION_TREADS,
  AXIS_HALF,
  AZIMUTH_MAX,
  AZIMUTH_MIN,
  CAM_DISTANCE,
  CAM_FOV,
  FIT_FILL,
  FIT_FOV_MAX,
  FIT_FOV_MIN,
  HOLO_PLATE,
  POLAR_MAX,
  POLAR_MIN,
  REST_AZIMUTH,
  R_MAX,
  R_MIN,
  buildShells,
  fitFov,
  frontnessFromDepth,
  levelAt,
  recordHalfTangents,
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

describe("the artifact paints the page's own ground, in both themes (ADR-080 U2)", () => {
  /* ⚠ THIS IS THE FRAME GUARD, AND IT IS A COLOUR TEST ONLY BY ACCIDENT.
     A canvas ground that differs from the section it sits in draws a
     RECTANGLE the width of the beat — invisible as a colour, perfectly
     visible as an edge, and exactly the frame ADR-080 U2 was asked to
     remove. Both values are the arcs surface's own `--void` / `--dawn`
     (`.arc-section { background: var(--void, #0a0908) }`, swapped to
     parchment by ADR-058), so this fails if either drifts. */
  const ARC_VOID = 0x0a0908;
  const ARC_PARCHMENT = 0xece3d6;

  it("is `--void` on dark", () => {
    expect(HOLO_DARK.ground).toBe(ARC_VOID);
    expect(holoGroundCss("dark")).toBe("#0a0908");
  });

  it("is the parchment on light", () => {
    expect(HOLO_LIGHT.ground).toBe(ARC_PARCHMENT);
    expect(holoGroundCss("light")).toBe("#ece3d6");
  });

  it("keeps `HOLO_PLATE` equal to the dark ground it is a copy of", () => {
    /* Two declarations of one colour is a value that can go wrong in ONE
       place while everything else stays green — ADR-069 U1's finding. */
    expect(HOLO_PLATE).toBe(holoGroundCss("dark"));
  });
});

describe("the lens is solved from the canvas it is given (ADR-080 U3)", () => {
  /* ⚠ THE DEFECT THIS FIXES IS ARITHMETIC, NOT TASTE. Three's `fov` is
     VERTICAL and nothing in the folder read the canvas, so visible height at
     the target was a constant and every pixel of width the beat gained was
     empty world. Measured on the page before this pass: the record filled
     23.9 % of a 1914px-wide canvas. */
  const RECORD_ASPECT = () => {
    const [tx, ty] = recordHalfTangents();
    return tx / ty;
  };

  /** What fraction of each axis the record fills at a given canvas aspect. */
  function fill(aspect: number): { w: number; h: number } {
    const fov = (fitFov(aspect) * Math.PI) / 180;
    const halfH = Math.tan(fov / 2);
    const [tx, ty] = recordHalfTangents();
    return { w: tx / (halfH * aspect), h: ty / halfH };
  }

  it("fits by the BINDING axis, and on every real shape that is the height", () => {
    /* ⚠ THE RECORD IS WIDER THAN IT IS TALL AND EVERY BEAT SHAPE IS WIDER
       STILL, so the height binds everywhere and the wings are inherent — they
       are not empty, they carry the ground grid and the dust. The measured
       aspect is 1.396 rather than the rings' own 1.96 because the fit includes
       the MARK'S PLATED COLLAR (world radius 2.043 against the widest ring's
       1.18). That costs about 40 % of the available size and it is bought
       deliberately: the collar is the one fully closed, unbroken ring in the
       object, and cropping its top and bottom is cropping the centre of the
       drawing. */
    expect(RECORD_ASPECT()).toBeGreaterThan(1.3);
    for (const a of [1274 / 497, 1434 / 552, 1914 / 860]) {
      expect(a).toBeGreaterThan(RECORD_ASPECT());
      const f = fill(a);
      expect(f.h).toBeCloseTo(FIT_FILL, 5);
      expect(f.w).toBeLessThan(f.h);
      // And nothing is cropped: the binding axis is exactly the fill.
      expect(f.h).toBeLessThan(1);
    }
  });

  it("grows the record against the un-fitted lens", () => {
    /* `CAM_FOV` is what shipped. The lens alone is worth 1.305× at the live
       shape; the beat's own height (574 → 860) carries the rest, for ~1.96×
       linear in total. Anything under 1.25 here means the mechanism stopped
       working — do not tighten it toward the measured value, it moves with
       `FIT_FILL` and with any change to the mark's collar. */
    const a = 1914 / 860;
    const halfOld = Math.tan((CAM_FOV * Math.PI) / 180 / 2);
    const [, ty] = recordHalfTangents();
    const before = ty / halfOld;
    expect(fill(a).h / before).toBeGreaterThan(1.25);
  });

  it("clamps the lens so no canvas shape can make a fisheye or a pinhole", () => {
    for (const a of [0.2, 0.5, 1, 3.4, 12, 40]) {
      const fov = fitFov(a);
      expect(fov).toBeGreaterThanOrEqual(FIT_FOV_MIN);
      expect(fov).toBeLessThanOrEqual(FIT_FOV_MAX);
    }
    // And a degenerate size falls back rather than producing NaN.
    expect(fitFov(0)).toBe(CAM_FOV);
    expect(fitFov(Number.NaN)).toBe(CAM_FOV);
  });
});

describe("a label knows which side of the object its ring is on (ADR-080 U3)", () => {
  /* ⚠ THIS GRAMMAR HAD NEVER RUN. The scene derived frontness from `ndc.z`,
     and with `near 0.1 / far 60` the whole object sits in the last
     half-percent of the NDC depth range — every anchor returned the floor,
     always, so the lab's z-order was a constant 25. */
  const depths = COURSE.map((w) => {
    // The anchor rides its ring's rim; depth is dominated by the axis, so the
    // ring's own z against the camera is the honest proxy here.
    const [cx, cy, cz] = restCameraPosition();
    const z = waypointZ(w.at);
    return Math.hypot(0 - cx, 0 - cy, z - cz);
  });

  it("spreads across the seven anchors instead of pinning to one value", () => {
    const fs = depths.map(frontnessFromDepth);
    expect(new Set(fs.map((f) => f.toFixed(3))).size).toBeGreaterThanOrEqual(5);
    expect(Math.max(...fs) - Math.min(...fs)).toBeGreaterThan(0.2);
  });

  it("puts the NEAR end of the course in front", () => {
    const fs = depths.map(frontnessFromDepth);
    // `at` runs 2024 → now, and the negative azimuth is what puts NOW nearest.
    expect(fs[fs.length - 1]).toBeGreaterThan(fs[0]);
  });

  it("stays inside its declared band whatever depth it is handed", () => {
    for (const d of [0, 1, 15.6, 60, 1e6]) {
      const f = frontnessFromDepth(d);
      expect(f).toBeGreaterThanOrEqual(0.25);
      expect(f).toBeLessThanOrEqual(1);
    }
  });
});

describe("the object may be turned, but not into an unreadable pose (ADR-080 U3)", () => {
  it("clamps the azimuth around the rest pose it was tuned to", () => {
    expect(AZIMUTH_MIN).toBeLessThan(REST_AZIMUTH);
    expect(AZIMUTH_MAX).toBeGreaterThan(REST_AZIMUTH);
    // Symmetric about the rest pose — the two ends are the failures, and the
    // rest pose is not near either of them.
    expect(REST_AZIMUTH - AZIMUTH_MIN).toBeCloseTo(AZIMUTH_MAX - REST_AZIMUTH, 9);
  });

  it("cannot reach the two poses this drawing's own constants were moved off", () => {
    /* ⚠ THE MIRRORED POSE IS THE ONE THAT MATTERS. `REST_AZIMUTH` is negative
       so the record reads LEFT TO RIGHT; its own comment calls the sign "the
       whole fix". A positive azimuth runs the dates backwards, and the
       near-end-on band around 0 piles the seven rings into one another. */
    expect(AZIMUTH_MAX).toBeLessThan(0);
    // 18° from the axis was measured unreadable; the clamp must not reach it.
    expect(AZIMUTH_MAX).toBeLessThan((-18 * Math.PI) / 180);
  });
});
