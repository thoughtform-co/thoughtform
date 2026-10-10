import { describe, expect, it } from "vitest";

import { frameAround } from "@/components/arcs/framing/floor";
import {
  ISO_BASIS_STAGE,
  isoBox,
  labelBoxes,
  labelCollisions,
} from "@/components/arcs/framing/iso";
import {
  MAX_COURSES,
  MAX_TILES,
  PLATE,
  SLAB_FRAME,
  SLAB_PATHS,
  SLAB_VIEWBOX,
  courseLines,
  plateBox,
  runEdge,
  stackFrame,
  stackLabels,
  stackPaths,
  stackPoints,
  stackSeats,
  tileBoxes,
  type StackTier,
} from "@/components/arcs/stack/stackLayout";
import { STACK_GROUP_RUN, STACK_GROUP_WRITE, stackSpec } from "@/components/holo-stage/stackGeom";
import { particlePoints } from "@/components/holo-stage/stageParticles";
import { stageToCrop } from "@/components/holo-stage/stageFit";

/**
 * The layer stack (the proposal system, 2026-10-10), the `arc-iso.test.ts`
 * pattern: every point inside its crop, the words' boxes never on one
 * another (with a negative case: a guard that has never failed is a guard
 * nobody checked), the tiers in order, the Slab the same plate.
 */
const CASES: { name: string; tiers: StackTier[]; courses: number; tiles: number }[] = [
  { name: "the approach", tiers: ["host", "layer", "tiles"], courses: 6, tiles: 4 },
  { name: "the leverage", tiers: ["shared", "host", "layer"], courses: 0, tiles: 0 },
  { name: "the engine", tiers: ["host", "layer", "tiles"], courses: 8, tiles: 4 },
];

/* The DOM words render at ~12px over a figure ~300–400px tall whose crop
   is ~570 units: ~20 units at the leverage's size, the binding host. */
const TYPE = 20;

describe("the stack's geometry", () => {
  it("every point the stack draws lands inside its crop", () => {
    for (const c of CASES) {
      const f = stackFrame(c.tiers);
      for (const p of stackPoints(c.tiers)) {
        const q = {
          x: f.ox + f.k * (p.a * f.basis.A[0] + p.b * f.basis.B[0]),
          y: f.oy + f.k * (p.a * f.basis.A[1] + p.b * f.basis.B[1] + p.z * f.basis.Z[1]),
        };
        expect(q.x, `${c.name}: x`).toBeGreaterThanOrEqual(0);
        expect(q.x, `${c.name}: x`).toBeLessThanOrEqual(f.w);
        expect(q.y, `${c.name}: y`).toBeGreaterThanOrEqual(0);
        expect(q.y, `${c.name}: y`).toBeLessThanOrEqual(f.h);
      }
      const g = stackPaths(c.tiers, { tiles: c.tiles, courses: c.courses });
      expect(g.frame).toEqual(f);
      for (const d of [...g.plates.map((p) => p.visible), ...g.courses, g.run]) {
        for (const m of d.matchAll(/([ML])(-?[\d.]+) (-?[\d.]+)/g)) {
          const x = Number(m[2]);
          const y = Number(m[3]);
          expect(x >= -0.5 && x <= f.w + 0.5, `${c.name}: path x ${x}`).toBe(true);
          expect(y >= -0.5 && y <= f.h + 0.5, `${c.name}: path y ${y}`).toBe(true);
        }
      }
    }
  });

  it("the tiers ascend, the courses count, the tiles fit the plate", () => {
    expect(plateBox("shared").z).toBeLessThan(plateBox("host").z);
    expect(plateBox("host").z).toBeLessThan(plateBox("layer").z);
    expect(tileBoxes(4)[0].z).toBeGreaterThan(plateBox("layer").z + PLATE.h);
    for (const t of tileBoxes(MAX_TILES)) {
      expect(t.a).toBeGreaterThanOrEqual(0);
      expect(t.a + t.w).toBeLessThanOrEqual(PLATE.w);
    }
    expect(courseLines(6)).toHaveLength(6);
    expect(courseLines(20)).toHaveLength(MAX_COURSES);
    for (const l of courseLines(5)) {
      expect(l[0].z).toBe(plateBox("layer").z + PLATE.h);
      expect(l[0].b).toBeGreaterThan(0);
      expect(l[0].b).toBeLessThan(PLATE.d);
    }
    const run = runEdge();
    expect(run[0].b).toBe(0);
    expect(run[1].a).toBe(PLATE.w);
  });

  it("every plate hides exactly the three edges at its far-bottom vertex", () => {
    const g = stackPaths(["host", "layer", "tiles"], { tiles: 4, courses: 2 });
    for (const p of [...g.plates, ...g.tiles]) {
      expect((p.hidden.match(/M/g) ?? []).length, p.tier).toBe(3);
      expect((p.visible.match(/M/g) ?? []).length, p.tier).toBe(6);
    }
    expect(g.plates.map((p) => p.tier)).toEqual(["host", "layer"]);
    expect(g.tiles).toHaveLength(4);
  });

  it("the words sit beside their plates and never on one another", () => {
    for (const c of CASES) {
      const f = stackFrame(c.tiers);
      /* Each callout's height in lines: the tiles one line per tile, the
         layer its label and the courses in two columns, a plate its label
         and one line. */
      const words = {
        tiles: { text: "ON THE LAYER", lines: c.tiles },
        layer: { text: "YOUR LAYER", lines: 1 + Math.ceil(c.courses / 2) },
        host: { text: "X-BIONIC'S CLAUDE ENTERPRISE", lines: 2 },
        shared: { text: "THE MODELS", lines: 2 },
      } as const;
      const labels = stackLabels(c.tiers, words);
      expect(labels, c.name).toHaveLength(c.tiers.length);
      const boxes = labelBoxes(labels, TYPE, f);
      expect(labelCollisions(boxes), c.name).toEqual([]);
      const seats = stackSeats(c.tiers);
      for (const t of c.tiers) {
        expect(seats[t].at, `${c.name}: ${t}`).toBeGreaterThan(0);
        expect(seats[t].at, `${c.name}: ${t}`).toBeLessThan(1);
      }
    }
  });

  it("the guard can fail: two words at one seat collide", () => {
    const f = stackFrame(["host", "layer"]);
    const labels = stackLabels(
      ["host", "layer"],
      { host: { text: "ONE", lines: 30 }, layer: { text: "TWO", lines: 30 } },
      { host: "right" }
    );
    expect(labelCollisions(labelBoxes(labels, TYPE, f)).length).toBeGreaterThan(0);
  });

  it("the Slab is one plate of the stack, in the stage's projection", () => {
    const p = isoBox({ a: 0, b: 0, w: PLATE.w, d: PLATE.d, z: 0, h: PLATE.h }, SLAB_FRAME);
    expect(SLAB_PATHS.top).toBe(p.top);
    expect(SLAB_PATHS.left).toBe(p.left);
    expect(SLAB_PATHS.right).toBe(p.right);
    expect(SLAB_FRAME.basis).toBe(ISO_BASIS_STAGE);
    /* Inside its own box, with air. */
    for (const m of SLAB_PATHS.top.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(0);
      expect(Number(m[1])).toBeLessThanOrEqual(SLAB_VIEWBOX.w);
      expect(Number(m[2])).toBeGreaterThanOrEqual(0);
      expect(Number(m[2])).toBeLessThanOrEqual(SLAB_VIEWBOX.h);
    }
    /* The crop solver and the hand frame agree on the plate's extent. */
    const f = frameAround(stackPoints(["host"]), { l: 0, r: 0, t: 0, b: 0 }, SLAB_FRAME.k);
    expect(f.w).toBeLessThanOrEqual(SLAB_VIEWBOX.w);
    expect(f.h).toBeLessThanOrEqual(SLAB_VIEWBOX.h);
  });
});

describe("the stack on the live stage", () => {
  const data = {
    tiers: ["host", "layer", "tiles"] as StackTier[],
    courses: { skills: 4, evals: 2 },
    tiles: [{ id: "production", lit: true }, { id: "ops" }, { id: "review" }, { id: "strategy" }],
  };

  it("frames the SVG's own crop and lands every point in it", () => {
    const spec = stackSpec(data);
    expect(spec.frame).toEqual(stackFrame(data.tiers));
    const pts = [
      ...spec.lines.flatMap((l) => l.points),
      ...spec.faces.flatMap((f) => f.quad),
      ...particlePoints(spec.particles!),
      ...spec.dust.flatMap((d) => d.points),
    ];
    let out = 0;
    for (const p of pts) {
      const c = stageToCrop(p, spec.frame, "stage");
      if (c.x < -1 || c.x > spec.frame.w + 1 || c.y < -1 || c.y > spec.frame.h + 1) out++;
    }
    /* The datum under the host runs past the plate on purpose; nothing else may. */
    const grid = spec.lines.filter((l) => l.role === "grid").flatMap((l) => l.points).length;
    expect(out, "points outside the crop").toBeLessThanOrEqual(grid);
    const nonGrid = pts.length - grid;
    expect(nonGrid).toBeGreaterThan(100);
  });

  it("names two groups, lights one donor and one population, and is deterministic", () => {
    const a = stackSpec(data);
    const b = stackSpec(data);
    expect(a.groups).toEqual([STACK_GROUP_WRITE, STACK_GROUP_RUN]);
    const named = new Set(a.groups);
    for (const l of a.lines) if (l.group) expect(named.has(l.group), l.id).toBe(true);
    for (const p of a.particles!.populations)
      if (p.group) expect(named.has(p.group), p.id).toBe(true);
    expect(
      a.lines.filter((l) => l.donor),
      "one donor"
    ).toHaveLength(1);
    const lit = a.particles!.populations.filter((p) => p.lit);
    expect(lit).toHaveLength(1);
    expect(lit[0].role).toBe("gold");
    expect(lit[0].group).toBe(STACK_GROUP_RUN);
    expect(lit[0].flow?.mode).toBe("run");
    expect(lit[0].tangents?.length).toBe(lit[0].points.length);
    expect(a.particles!.populations.map((p) => p.points)).toEqual(
      b.particles!.populations.map((p) => p.points)
    );
    expect(a.view).toBe("stage");
  });

  it("the beads ride the layer's front edge at its top", () => {
    const spec = stackSpec(data);
    const beads = spec.particles!.populations.find((p) => p.id === "beads")!;
    const top = plateBox("layer").z + PLATE.h;
    for (const p of beads.points) {
      expect(p[1]).toBeCloseTo(top + 0.12, 5);
      expect(p[2]).toBeCloseTo(0, 5);
    }
    for (const t of beads.tangents!) {
      expect(t[0]).toBeGreaterThan(0);
      expect(t[1]).toBeCloseTo(0, 9);
    }
  });
});
