import { describe, expect, it } from "vitest";

import { halfExtentsAt } from "@/lib/latent-flight/camera/fov";
import { WAYPOINTS } from "@/lib/latent-flight/content/waypoints";
import {
  COURSE,
  WAYPOINT_S,
  buildCourse,
  courseAt,
  headingOf,
  localAt,
  sectorAt,
  waypointS,
} from "@/lib/latent-flight/flight/course";
import {
  AUTOPILOT,
  SHIP,
  SHIP_AT_REST,
  autopilotThrottle,
  integrateShip,
} from "@/lib/latent-flight/flight/flightModel";
import { cross, dot } from "@/lib/latent-flight/pulsar";
import {
  GLASS_DEPTH,
  TICKS,
  buildLattice,
  latticeExtents,
  tickY,
} from "@/lib/latent-flight/rail/railLattice";

describe("the course", () => {
  it("passes through every waypoint in order, with s derived and increasing", () => {
    expect(WAYPOINT_S.length).toBe(WAYPOINTS.length);
    for (let i = 1; i < WAYPOINT_S.length; i++) expect(WAYPOINT_S[i]).toBeGreaterThan(WAYPOINT_S[i - 1]);
    expect(WAYPOINT_S[WAYPOINT_S.length - 1]).toBeCloseTo(1, 9);
    expect(WAYPOINT_S[0]).toBe(0);
    // HOME is the station's own marker beside the lead-out; every other
    // waypoint is a point the curve passes through — on a STRAIGHT pass, so
    // the frame two units ahead of the mark is the frame at the mark.
    for (let i = 1; i < WAYPOINTS.length; i++) {
      const at = courseAt(COURSE, WAYPOINT_S[i]);
      const w = WAYPOINTS[i].position;
      expect(Math.hypot(at.p[0] - w[0], at.p[1] - w[1], at.p[2] - w[2])).toBeLessThan(0.05);
      const ahead = courseAt(COURSE, WAYPOINT_S[i] + 2 / COURSE.length);
      expect(dot(at.t, ahead.t)).toBeGreaterThan(1 - 1e-6);
      expect(dot(at.n, ahead.n)).toBeGreaterThan(1 - 1e-6);
    }
  });

  it("carries orthonormal, continuous, RIGHT-HANDED frames (no roll flips, no mirror)", () => {
    for (let i = 1; i < COURSE.samples.length; i++) {
      const a = COURSE.samples[i - 1];
      const c = COURSE.samples[i];
      expect(Math.abs(dot(c.t, c.n))).toBeLessThan(1e-6);
      expect(Math.abs(dot(c.n, c.b))).toBeLessThan(1e-6);
      expect(dot(a.n, c.n)).toBeGreaterThan(0.9);
      // (n, b, −t) is the camera's (right, up, back): n × b must be −t.
      expect(dot(cross(c.n, c.b), c.t)).toBeCloseTo(-1, 6);
    }
    // At the station: right is +X, up is +Y, forward is −Z.
    const start = courseAt(COURSE, 0);
    expect(start.n[0]).toBeCloseTo(1, 6);
    expect(start.b[1]).toBeCloseTo(1, 6);
    expect(start.t[2]).toBeCloseTo(-1, 6);
  });

  it("starts at the station looking down −Z and reads a real heading", () => {
    const start = courseAt(COURSE, 0);
    expect(start.p[2]).toBeCloseTo(0, 6);
    expect(headingOf([0, 0, -1])).toBe(0);
    expect(headingOf([1, 0, 0])).toBe(90);
    // The lead-out is straight: the vessel at rest looks exactly down −Z.
    const h = headingOf(start.t);
    expect(Math.min(h, 360 - h)).toBeLessThan(0.01);
    expect(Math.abs(start.t[1])).toBeLessThan(1e-6);
  });

  it("names the sector and the local progress from s", () => {
    expect(sectorAt(0)).toBe("home");
    expect(sectorAt(waypointS("proof") + 0.01)).toBe("proof");
    expect(sectorAt(1)).toBe("voidwalker");
    expect(localAt(waypointS("proof"))).toBeCloseTo(0, 6);
    const mid = (waypointS("proof") + waypointS("services")) / 2;
    expect(localAt(mid)).toBeCloseTo(0.5, 6);
  });

  it("re-parameterises by arc length", () => {
    const c = buildCourse([
      [0, 0, 0],
      [0, 0, -10],
      [0, 0, -30],
    ]);
    const p1 = courseAt(c, 0.25).p;
    const p2 = courseAt(c, 0.5).p;
    expect(Math.abs(p1[2] + 7.5)).toBeLessThan(0.2);
    expect(Math.abs(p2[2] + 15)).toBeLessThan(0.2);
  });
});

describe("the flight model", () => {
  const bounds = { x: 1, y: 0.5 };
  const L = 100;

  it("ramps the throttle, never jumps it, and is deterministic", () => {
    const a = integrateShip(SHIP_AT_REST, { throttleCmd: 1, lateral: 0, vertical: 0 }, 1 / 60, L, bounds);
    const b = integrateShip(SHIP_AT_REST, { throttleCmd: 1, lateral: 0, vertical: 0 }, 1 / 60, L, bounds);
    expect(a).toEqual(b);
    expect(a.throttle).toBeCloseTo(SHIP.throttleRate / 60, 9);
    let st = SHIP_AT_REST;
    let last = 0;
    for (let i = 0; i < 120; i++) {
      st = integrateShip(st, { throttleCmd: 1, lateral: 0, vertical: 0 }, 1 / 60, L, bounds);
      expect(st.throttle).toBeGreaterThanOrEqual(last);
      last = st.throttle;
    }
    expect(st.throttle).toBe(1);
    expect(st.v).toBeGreaterThan(SHIP.vMax * 0.9);
    expect(st.s).toBeGreaterThan(0);
  });

  it("stops at the far end and never goes below the station", () => {
    let st = SHIP_AT_REST;
    for (let i = 0; i < 2000; i++) st = integrateShip(st, { throttleCmd: 1, lateral: 0, vertical: 0 }, 1 / 30, L, bounds);
    expect(st.s).toBe(1);
    expect(st.v).toBe(0);
    expect(st.throttle).toBe(0);
  });

  it("holds the lateral offset inside the lattice and returns to centre without overshoot", () => {
    let st = SHIP_AT_REST;
    for (let i = 0; i < 600; i++) st = integrateShip(st, { throttleCmd: 0, lateral: 1, vertical: -1 }, 1 / 60, L, bounds);
    expect(st.x).toBeCloseTo(bounds.x * SHIP.latUse, 6);
    expect(st.y).toBeCloseTo(-bounds.y * SHIP.latUse, 6);
    let lastX = st.x;
    for (let i = 0; i < 300; i++) {
      st = integrateShip(st, { throttleCmd: 0, lateral: 0, vertical: 0 }, 1 / 60, L, bounds);
      expect(st.x).toBeGreaterThanOrEqual(0);
      expect(st.x).toBeLessThanOrEqual(lastX);
      lastX = st.x;
    }
    expect(st.x).toBeLessThan(0.01);
  });

  it("flies the autopilot to the mark and eases into it", () => {
    const target = 0.5;
    expect(autopilotThrottle(0, target)).toBe(AUTOPILOT.cruise);
    expect(autopilotThrottle(target - AUTOPILOT.approachRange / 2, target)).toBeLessThan(AUTOPILOT.cruise);
    expect(autopilotThrottle(target, target)).toBeNull();
    let st = SHIP_AT_REST;
    let steps = 0;
    while (steps++ < 20000) {
      const cmd = autopilotThrottle(st.s, target);
      if (cmd === null) break;
      st = integrateShip(st, { throttleCmd: cmd, lateral: 0, vertical: 0 }, 1 / 60, 260, bounds);
    }
    expect(steps).toBeLessThan(20000);
    expect(Math.abs(st.s - target)).toBeLessThan(AUTOPILOT.approachRange);
  });
});

describe("the rail lattice", () => {
  const lens = { fovDeg: 38, w: 1600, h: 1000 };
  const rects = { leftX: 55, rightX: 1545, top: 131, bottom: 869 };

  it("derives its cross-section from the chrome at the glass depth, symmetric", () => {
    const e = latticeExtents(rects, lens);
    const { hw, hh } = halfExtentsAt(GLASS_DEPTH, 38, 1.6);
    expect(e.x).toBeCloseTo(((1545 - 55) / 1600) * hw, 9);
    expect(e.y).toBeCloseTo(((869 - 131) / 1000) * hh, 9);
    expect(tickY(0, e.y)).toBeCloseTo(e.y, 9);
    expect(tickY(4, e.y)).toBeCloseTo(e.y - (2 * e.y * 4) / 12, 9);
    expect(tickY(12, e.y)).toBeCloseTo(-e.y, 9);
  });

  it("is the chrome unprojected: the cross-section at the glass re-projects onto the tracks", () => {
    // The round trip. `latticeExtents` unprojects the two tracks and the
    // rail's top and bottom to the glass depth; projecting those extents back
    // through the same lens must return the chrome's own pixels.
    const e = latticeExtents(rects, lens);
    const { hw, hh } = halfExtentsAt(GLASS_DEPTH, 38, 1.6);
    const project = (x: number, y: number): [number, number] => [
      ((x / hw) * 0.5 + 0.5) * lens.w,
      (0.5 - (y / hh) * 0.5) * lens.h,
    ];
    expect(project(-e.x, tickY(0, e.y))[0]).toBeCloseTo(rects.leftX, 6);
    expect(project(e.x, tickY(0, e.y))[0]).toBeCloseTo(rects.rightX, 6);
    expect(project(0, tickY(0, e.y))[1]).toBeCloseTo(rects.top, 6);
    expect(project(0, tickY(TICKS - 1, e.y))[1]).toBeCloseTo(rects.bottom, 6);

    // On a straight course every string vertex sits at ±halfX and on a tick.
    const straight = buildCourse([
      [0, 0, 0],
      [0, 0, -20],
      [0, 0, -40],
    ]);
    const g = buildLattice(straight, e.x, e.y);
    const ticks = Array.from({ length: TICKS }, (_, k) => tickY(k, e.y));
    for (let i = 0; i < g.strings.length / 3; i++) {
      const x = g.strings[i * 3];
      const y = g.strings[i * 3 + 1];
      expect(Math.abs(Math.abs(x) - e.x)).toBeLessThan(1e-6);
      expect(ticks.some((t) => Math.abs(t - y) < 1e-6)).toBe(true);
    }
    expect(g.strings.length / 6).toBe(2 * TICKS * (straight.samples.length - 1));
    // Rungs span the whole cross-section, one per side per spacing.
    expect(g.rungs.length / 6).toBe(g.rungArc.length / 2);
    expect(g.rungs.length / 6 % 2).toBe(0);
  });
});
