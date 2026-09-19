import { describe, expect, it } from "vitest";

import {
  CLOUD_N,
  FIGURE_SLOTS,
  MESH_REACH,
  ROUTE_STEP_CAP,
  TABLE_SEATS,
  figureCloud,
  figureFor,
  isFigureSlot,
} from "@/lib/services-ring/serviceFigures";

/**
 * The figure record the three materials draw (2026-09-19 lab pass). Every
 * assertion here is about the RECORD — the raster, the cloud and the wire
 * each read it, so a structure that broke its own rule would break on all
 * three cards at once, in three different ways, with nothing to point at.
 */
describe("serviceFigures — one estate, four structures", () => {
  it("is deterministic and shares one cloud", () => {
    const a = figureFor("keynote");
    const b = figureFor("keynote");
    expect(a).toBe(b);
    const cloud = figureCloud();
    expect(cloud).toHaveLength(CLOUD_N);
    for (const slot of FIGURE_SLOTS) expect(figureFor(slot).points).toBe(cloud);
  });

  it("keeps every node on the unit sphere, canvas-handed", () => {
    for (const p of figureCloud()) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.z)).toBeLessThanOrEqual(1);
      expect(p.x * p.x + p.y * p.y + p.z * p.z).toBeCloseTo(1, 9);
    }
  });

  it("radiant — one source, rays to a room, no edges between receivers", () => {
    const fig = figureFor("keynote");
    expect(fig.kind).toBe("radiant");
    expect(fig.source).toBeGreaterThanOrEqual(0);
    const pts = fig.points;
    for (let i = 0; i < pts.length; i++) expect(pts[i].z).toBeLessThanOrEqual(pts[fig.source].z);
    expect(fig.edges.length).toBeGreaterThan(20);
    for (const e of fig.edges) {
      expect(e.kind).toBe("ray");
      expect(e.a).toBe(fig.source);
      expect(fig.lit[e.b]).toBe(true);
    }
    expect(fig.marks).toEqual([{ i: fig.source, r: 9 }]);
    expect(fig.unlinked).toHaveLength(0);
  });

  it("route — one path, each step capped, both ends marked", () => {
    const fig = figureFor("workshop");
    expect(fig.kind).toBe("route");
    expect(fig.path.length).toBeGreaterThanOrEqual(10);
    expect(new Set(fig.path).size).toBe(fig.path.length);
    expect(fig.edges).toHaveLength(fig.path.length - 1);
    fig.edges.forEach((e, k) => {
      expect(e.kind).toBe("route");
      expect(e.a).toBe(fig.path[k]);
      expect(e.b).toBe(fig.path[k + 1]);
      const a = fig.points[e.a];
      const b = fig.points[e.b];
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThanOrEqual(ROUTE_STEP_CAP);
    });
    expect(fig.lit.filter(Boolean)).toHaveLength(fig.path.length);
    expect(fig.marks).toEqual([
      { i: fig.path[0], r: 7 },
      { i: fig.path[fig.path.length - 1], r: 8 },
    ]);
  });

  it("mesh — three seats in order and growing, and the person-led work left open", () => {
    const fig = figureFor("embedded");
    expect(fig.kind).toBe("mesh");
    expect(fig.marks).toHaveLength(3);
    const xs = fig.marks.map((m) => fig.points[m.i].x);
    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
    expect(fig.marks.map((m) => m.r)).toEqual([6, 7, 8]);
    // The advisory claim, absorbed: a handful of front nodes joined to nothing.
    expect(fig.unlinked.length).toBeGreaterThanOrEqual(4);
    expect(fig.unlinked.length).toBeLessThanOrEqual(12);
    const open = new Set(fig.unlinked);
    for (const m of fig.marks) expect(open.has(m.i)).toBe(false);
    for (const i of fig.unlinked) {
      expect(fig.points[i].z).toBeGreaterThan(0.05);
      expect(fig.lit[i]).toBe(false);
    }
    for (const e of fig.edges) {
      expect(e.kind).toBe("chord");
      expect(open.has(e.a)).toBe(false);
      expect(open.has(e.b)).toBe(false);
      const a = fig.points[e.a];
      const b = fig.points[e.b];
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThanOrEqual(MESH_REACH);
    }
    expect(fig.edges.length).toBeGreaterThan(100);
  });

  it("table — eight seats around the front pole, every pair joined, nothing else touched", () => {
    const fig = figureFor("guided-build");
    expect(fig.kind).toBe("table");
    expect(fig.path).toHaveLength(TABLE_SEATS);
    const seats = new Set(fig.path);
    expect(fig.lit.filter(Boolean)).toHaveLength(TABLE_SEATS);
    expect(fig.edges).toHaveLength((TABLE_SEATS * (TABLE_SEATS - 1)) / 2);
    for (const e of fig.edges) {
      expect(e.kind).toBe("table");
      expect(seats.has(e.a)).toBe(true);
      expect(seats.has(e.b)).toBe(true);
    }
    expect(fig.marks.map((m) => m.i).sort()).toEqual([...seats].sort());
    // The seats are spread: no two within 30° of bearing.
    const bearings = fig.path
      .map((i) => Math.atan2(fig.points[i].y, fig.points[i].x))
      .sort((a, b) => a - b);
    for (let k = 1; k < bearings.length; k++) {
      expect(bearings[k] - bearings[k - 1]).toBeGreaterThan(Math.PI / 6);
    }
  });

  it("names its slots and nothing else", () => {
    expect(FIGURE_SLOTS).toEqual(["keynote", "workshop", "embedded", "guided-build"]);
    expect(isFigureSlot("embedded")).toBe(true);
    expect(isFigureSlot("advisory")).toBe(false);
  });
});
