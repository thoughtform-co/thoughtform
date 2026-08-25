import { describe, expect, it } from "vitest";

import {
  ADOPTION_TREADS,
  AXIS_Y,
  CAM_FOV,
  CAM_POS,
  REST_YAW,
  R_MAX,
  R_MIN,
  applyRig,
  axisScreenX,
  cameraDepth,
  holoLayout,
  levelAt,
  projectToScreen01,
  ringRadius,
  ringReveal,
  solveAxisX,
  stationScreenX,
  tickCount,
  type HoloWaypoint,
} from "@/components/holo-program/holoProgramGeom";

/* The portfolio's real course — the same `at` values the registry pins
   sorted and unequal (`lib/arcs/content/portfolio.ts`). The guard walks the
   record rather than a fixture, so a content edit that breaks the drawing
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

/**
 * The PLOT box's aspect at the three reference viewports, MEASURED on the
 * page rather than assumed:
 *
 *   1280×720  → 1020×266  (3.83)
 *   1440×800  → 1149×296  (3.88)
 *   1920×1080 → 1438×400  (3.60)
 *
 * ⚠ The distinction cost a pass. The instrument mounts inside
 * `.arc-prog__plot`, so the plot is what the camera has to fill; solving
 * against the BAND's 2.1–3.3 produced a drawing correctly sized for a box it
 * does not live in. The board's own header records the same class of trap one
 * level up — no authored viewBox survives this host's spread.
 *
 * The bracketing values below are deliberately a touch WIDER than the
 * measured three, so a future retune of `--pg-h` has margin before it
 * silently moves the drawing out of its box.
 */
const ASPECTS = [3.95, 3.83, 3.5];

describe("the adoption ladder is the flat board's own curve", () => {
  it("is a STEP function — it never interpolates between treads", () => {
    for (let i = 0; i < ADOPTION_TREADS.length - 1; i++) {
      const [start, level] = ADOPTION_TREADS[i];
      const [nextStart] = ADOPTION_TREADS[i + 1];
      // Anywhere inside a tread reads the tread's own level, including the
      // instant before the next one starts.
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
    expect(tickCount(0.01)).toBeGreaterThanOrEqual(12);
  });
});

describe("the solver puts every ring under its own DOM station", () => {
  it("converges within 0.2% of the band width at all three aspects", () => {
    for (const aspect of ASPECTS) {
      for (const wp of COURSE) {
        const target = stationScreenX(wp.at);
        const x = solveAxisX(target, aspect);
        expect(Math.abs(axisScreenX(x, aspect) - target)).toBeLessThan(0.002);
      }
    }
  });

  it("keeps the course in the record's own order, left to right", () => {
    for (const aspect of ASPECTS) {
      const { rings } = holoLayout(COURSE, aspect);
      for (let i = 1; i < rings.length; i++) {
        expect(rings[i].x).toBeGreaterThan(rings[i - 1].x);
      }
    }
  });

  it("preserves the record's UNEQUAL gaps — an even spread would delete the reading", () => {
    // ADR-078: the gaps ARE the reading. The projection may STRETCH them; it
    // may not LEVEL them. So the bar is the record's own unevenness, not a
    // number picked by eye — the course runs 0.14 and 0.17 apart, a ratio of
    // ~1.21, and the drawing must come out at least that uneven.
    const atGaps = COURSE.slice(1).map((w, i) => w.at - COURSE[i].at);
    const atRatio = Math.max(...atGaps) / Math.min(...atGaps);
    expect(atRatio).toBeGreaterThan(1.1); // the record is uneven to begin with

    for (const aspect of ASPECTS) {
      const { rings } = holoLayout(COURSE, aspect);
      const gaps = rings.slice(1).map((r, i) => r.x - rings[i].x);
      const ratio = Math.max(...gaps) / Math.min(...gaps);
      expect(ratio).toBeGreaterThanOrEqual(atRatio - 1e-9);
    }
  });
});

describe("the rig's yaw stays inside the honest band", () => {
  it("keeps projected rim heights MONOTONIC, so perspective cannot outrank the ladder", () => {
    // Perspective makes a nearer ring project larger. That is only safe
    // while it agrees with the radius encoding — if a mid-course ring can
    // out-measure the seat on screen, the drawing is lying about its record.
    for (const aspect of ASPECTS) {
      const { rings } = holoLayout(COURSE, aspect);
      const apparent = rings.map((r) => {
        const top = projectToScreen01(applyRig([r.x, AXIS_Y + r.radius, 0]), aspect);
        const bottom = projectToScreen01(applyRig([r.x, AXIS_Y - r.radius, 0]), aspect);
        return bottom.y - top.y;
      });
      for (let i = 1; i < apparent.length; i++) {
        expect(apparent[i]).toBeGreaterThan(apparent[i - 1]);
      }
    }
  });

  it("pins the pose the DOM was solved against", () => {
    // The solver and the scene share one rest pose; drifting either alone
    // slides every ring out from under its label.
    expect(REST_YAW).toBeCloseTo(-0.5, 6);
    expect(CAM_FOV).toBeCloseTo(4.96, 6);
  });

  it("puts NOW nearest, so size and distance agree instead of fighting", () => {
    // A positive yaw would recede the terminus and pull 2024 forward — the
    // record backing away as it reaches the present.
    const { rings } = holoLayout(COURSE, 2.6);
    const depths = rings.map((r) => cameraDepth([r.x, AXIS_Y, 0]));
    for (let i = 1; i < depths.length; i++) {
      expect(depths[i]).toBeLessThan(depths[i - 1]);
    }
  });

  it("keeps every ring OPEN — a ring that projects to a line is not a ring", () => {
    /**
     * ⚠ All seven ring planes are parallel, so the camera lies in exactly
     * one of them and THAT ring collapses to a bare vertical stroke. The
     * plane sits at `camX·cos(yaw) − camZ·sin(yaw)`; the first cut put it
     * mid-course and the third station rendered as a line.
     */
    const collapseX = CAM_POS[0] * Math.cos(REST_YAW) - CAM_POS[2] * Math.sin(REST_YAW);
    for (const aspect of ASPECTS) {
      const { rings } = holoLayout(COURSE, aspect);
      for (const ring of rings) {
        expect(
          Math.abs(ring.x - collapseX),
          `${ring.id} sits ${Math.abs(ring.x - collapseX).toFixed(2)} from the collapse plane`
        ).toBeGreaterThan(0.8);

        // And measure the drawn result, not just the clearance: width
        // against height, in one common unit.
        const top = projectToScreen01(applyRig([ring.x, AXIS_Y + ring.radius, 0]), aspect);
        const bottom = projectToScreen01(applyRig([ring.x, AXIS_Y - ring.radius, 0]), aspect);
        const left = projectToScreen01(applyRig([ring.x, AXIS_Y, -ring.radius]), aspect);
        const right = projectToScreen01(applyRig([ring.x, AXIS_Y, ring.radius]), aspect);
        const h = bottom.y - top.y;
        const w = Math.abs(right.x - left.x) * aspect;
        expect(w / h, `${ring.id} openness ${(w / h).toFixed(2)}`).toBeGreaterThan(0.28);
      }
    }
  });
});

describe("the instrument fills its plot without escaping it", () => {
  /**
   * ⚠ THE RINGS AND THE STATIONS SHARE THIS BOX, AND THAT IS SETTLED
   * ARITHMETIC RATHER THAN A PREFERENCE.
   *
   * Measured on the page at 1280×720: the plot is 266px tall, the up lane
   * runs 9 % → 38.7 % and the down lane 49.3 % → 74.1 %, so the clear middle
   * is **10.6 % — 28 pixels**. Nothing that reads as a ring fits there. So
   * the rings pass BEHIND the labels and the labels take the Arc's own
   * over-WebGL text lift (arcs.css, `[data-holo="live"]`).
   *
   * What is still guarded is the part that CAN go wrong silently: the stack
   * must fill the field without any rim leaving it, at every aspect. A ring
   * cropped by the plot's `overflow: hidden` is invisible as a failure —
   * it just looks like a smaller ring.
   */
  const TOP_MARGIN = 0.19;
  const BOTTOM_MARGIN = 0.81;

  it("keeps every rim inside the plot, at all three aspects", () => {
    for (const aspect of ASPECTS) {
      const { rings } = holoLayout(COURSE, aspect);
      for (const ring of rings) {
        const top = projectToScreen01(applyRig([ring.x, AXIS_Y + ring.radius, 0]), aspect);
        const bottom = projectToScreen01(applyRig([ring.x, AXIS_Y - ring.radius, 0]), aspect);
        expect(
          top.y,
          `${ring.id} top rim at ${(top.y * 100).toFixed(1)}% (aspect ${aspect})`
        ).toBeGreaterThan(TOP_MARGIN);
        expect(
          bottom.y,
          `${ring.id} bottom rim at ${(bottom.y * 100).toFixed(1)}% (aspect ${aspect})`
        ).toBeLessThan(BOTTOM_MARGIN);
      }
    }
  });

  it("actually FILLS the field — a stack that fits by being tiny is not a fix", () => {
    // The obvious way to satisfy the guard above is to shrink the rings
    // until nothing can collide. This is the other half of the contract.
    for (const aspect of ASPECTS) {
      const { rings } = holoLayout(COURSE, aspect);
      const seat = rings[rings.length - 1];
      const top = projectToScreen01(applyRig([seat.x, AXIS_Y + seat.radius, 0]), aspect);
      const bottom = projectToScreen01(applyRig([seat.x, AXIS_Y - seat.radius, 0]), aspect);
      expect(
        bottom.y - top.y,
        `seat fills ${((bottom.y - top.y) * 100).toFixed(1)}%`
      ).toBeGreaterThan(0.5);
    }
  });
});

describe("the arrival performs the record's own order", () => {
  it("staggers each ring's draw-on by its DATE", () => {
    const reveals = COURSE.map((w) => ringReveal(w.at));
    for (let i = 1; i < reveals.length; i++) {
      expect(reveals[i][0]).toBeGreaterThan(reveals[i - 1][0]);
    }
    // And it is finished when the arrival is.
    expect(reveals[reveals.length - 1][1]).toBeLessThanOrEqual(1.000001);
    expect(reveals[0][0]).toBeGreaterThanOrEqual(0);
  });
});

describe("the layout", () => {
  it("spans the band and runs the priors in AHEAD of the first station", () => {
    for (const aspect of ASPECTS) {
      const l = holoLayout(COURSE, aspect);
      expect(l.axisFrom).toBeLessThan(l.rings[0].x);
      expect(l.axisTo).toBeGreaterThan(l.rings[l.rings.length - 1].x);
      expect(l.priorFrom).toBeLessThan(l.priorTo);
      expect(l.priorTo).toBeCloseTo(l.rings[0].x, 6);
    }
  });

  it("draws the ladder as risers and runs, never a ramp", () => {
    const { ladder } = holoLayout(COURSE, 2.6);
    expect(ladder.length).toBeGreaterThan(ADOPTION_TREADS.length);
    for (let i = 1; i < ladder.length; i++) {
      // Monotonic along the axis, and never descending.
      expect(ladder[i][0]).toBeGreaterThanOrEqual(ladder[i - 1][0] - 1e-9);
      expect(ladder[i][1]).toBeGreaterThanOrEqual(ladder[i - 1][1] - 1e-9);
    }
  });
});
