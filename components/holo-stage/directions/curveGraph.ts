/**
 * GRAPH — the frontier, plotted (ADR-140, round three).
 *
 * Owner, 2026-10-01: "I really like the curve but we can make it much more
 * interesting. It needs to be a curve and look like a graph." So it IS a
 * graph, in the stage's own isometric: a floor of graph paper (a lattice of
 * cells) on a stacked slab, a graticule standing on the back and side walls,
 * a beaded vertical axis with its three levels, a time ruler ticking along
 * the front edge — and across it the frontier as a RIBBON of light: a dense
 * gold core with a halo of sparkle, the one lit thing on the stage. Every
 * lane is a node ON the curve with a dotted drop to the floor (the graph's
 * x, read), the other vendor a beaded dawn trace beside, the step a lit patch
 * of floor under the rise. The second dial is the SURFACE — a membrane of
 * motes with its isolines and risers — and it rises out of the curve when
 * the button is pressed (the `effort` group).
 *
 * The heights are Moira's own (`curveSurface.world`); nothing about the
 * record moved. What moved is that the record is made of particles now.
 */

import {
  END_T,
  FLOOR_EDGES,
  LEVELS,
  MESH_T,
  T,
  V_LINES,
  world,
} from "@/components/arcs/framing/curveSurface";
import { STAGE_K } from "@/components/arcs/framing/floor";
import { ISO_BASIS_STAGE } from "@/components/arcs/framing/iso";
import { FRONTIER_CURVE } from "@/lib/arcs/content/shared/frontierCurve";

import { CURVE_GROUP_EFFORT } from "../curveGeom";
import type { StageView, Vec3 } from "../stageFit";
import type { HoloStageSpec, StageLine, StageSweep } from "../stageGeom";
import {
  dotsAlong,
  lattice,
  motesAround,
  motesIn,
  population,
  ribbon,
  slabLayers,
  ticksAlongA,
  W,
  V,
  type ParticlePopulation,
  type WorldPt,
} from "../stageParticles";
import { abz, frameFor, run, type ABZ, type DirLabel, type Direction } from "./shared";

const K = STAGE_K;
const Z_UNIT = -ISO_BASIS_STAGE.Z[1];
const { UL, VL } = FLOOR_EDGES;
const EA = UL / K;
const EB = VL / K;

/** The surface at (t, v) in the stage's world. */
const S = (t: number, v: number, series: "own" | "other" = "own"): WorldPt => {
  const w = world(t, v, series);
  return W(w.a / K, w.b / K, w.h / (K * Z_UNIT));
};

const SEED = 5101;
const SWEEP: StageSweep = { axis: 0, from: -0.5, to: EA + 0.5, window: [0.06, 0.8], width: 0.32 };

/** The direction's vantage: the house stage (one basis per surface). */
export const CURVEGRAPH_VIEW: StageView = "stage";

function boundsOf(points: readonly Vec3[]) {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const p of points) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], p[i]);
      max[i] = Math.max(max[i], p[i]);
    }
  }
  return { min: min as Vec3, max: max as Vec3 };
}

export function curveGraph(view: StageView = CURVEGRAPH_VIEW): Direction {
  const C = FRONTIER_CURVE;
  const pops: ParticlePopulation[] = [];
  const lines: StageLine[] = [];
  const labels: DirLabel[] = [];
  const anchors: ABZ[] = [];

  /* The curve itself, and the stage's ceiling. */
  const N = 72;
  const curve: WorldPt[] = [];
  const other: WorldPt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * END_T;
    curve.push(S(t, 0));
    other.push(S(t, 0, "other"));
  }
  const zTop = Math.max(S(END_T, 1).z, S(END_T, 0).z) * 1.12;

  /* ── The graph paper: ruled lines of beads, cells at the crossings ───── */
  const NA = 12;
  const NB = 6;
  const floorRules: WorldPt[] = [];
  for (let i = 0; i <= NA; i++)
    floorRules.push(
      ...dotsAlong(SEED + 60 + i, [W((i / NA) * EA, 0, 0), W((i / NA) * EA, EB, 0)], 0.062)
    );
  for (let j = 0; j <= NB; j++)
    floorRules.push(
      ...dotsAlong(SEED + 80 + j, [W(0, (j / NB) * EB, 0), W(EA, (j / NB) * EB, 0)], 0.062)
    );
  const ZN = 5;
  const wallRules: WorldPt[] = [];
  for (let k = 1; k <= ZN; k++) {
    const z = (k / ZN) * zTop * 0.92;
    wallRules.push(...dotsAlong(SEED + 90 + k, [W(0, EB, z), W(EA, EB, z)], 0.062));
    wallRules.push(...dotsAlong(SEED + 100 + k, [W(0, 0, z), W(0, EB, z)], 0.062));
  }
  for (let i = 2; i <= NA; i += 2)
    wallRules.push(
      ...dotsAlong(
        SEED + 110 + i,
        [W((i / NA) * EA, EB, 0), W((i / NA) * EA, EB, zTop * 0.92)],
        0.062
      )
    );
  for (let j = 2; j <= NB; j += 2)
    wallRules.push(
      ...dotsAlong(
        SEED + 120 + j,
        [W(0, (j / NB) * EB, 0), W(0, (j / NB) * EB, zTop * 0.92)],
        0.062
      )
    );
  pops.push(
    population("floor-rules", floorRules, {
      role: "grid",
      shape: "dot",
      size: 2.2,
      opacity: 0.42,
      reveal: [0, 0.35],
    }),
    population("floor-cells", lattice(0, EA, 0, EB, 0, EA / NA), {
      role: "grid",
      shape: "cell",
      size: 5.2,
      opacity: 0.7,
      reveal: [0, 0.35],
      twinkle: 0.12,
    }),
    population("slab", slabLayers(SEED + 1, 0, EA, 0, EB, 5, 0.085, 0.11), {
      role: "grid",
      shape: "dot",
      size: 2.3,
      opacity: 0.5,
      reveal: [0.04, 0.5],
      sizeVar: 0.3,
    }),
    population("wall-rules", wallRules, {
      role: "grid",
      shape: "dot",
      size: 2.0,
      opacity: 0.3,
      reveal: [0, 0.4],
    })
  );

  /* ── The axes: beaded, with their levels and the time ruler ──────────── */
  const yTicks: WorldPt[] = [];
  for (const l of LEVELS)
    yTicks.push(
      ...dotsAlong(SEED + 2, [W(0, 0, l * zTop * 0.92), W(0, -0.36, l * zTop * 0.92)], 0.05)
    );
  pops.push(
    population("y-axis", dotsAlong(SEED + 3, [W(0, 0, 0), W(0, 0, zTop)], 0.045), {
      role: "structure",
      shape: "dot",
      size: 3.0,
      opacity: 0.8,
      reveal: [0, 0.3],
    }),
    population("y-ticks", yTicks, {
      role: "structure",
      shape: "dot",
      size: 2.8,
      opacity: 0.75,
      reveal: [0, 0.3],
    }),
    population("x-axis", dotsAlong(SEED + 4, [W(0, 0, 0), W(EA, 0, 0)], 0.045), {
      role: "structure",
      shape: "dot",
      size: 2.7,
      opacity: 0.6,
      reveal: [0, 0.4],
    }),
    population("b-axis", dotsAlong(SEED + 5, [W(0, 0, 0), W(0, EB, 0)], 0.045), {
      role: "structure",
      shape: "dot",
      size: 2.5,
      opacity: 0.5,
      reveal: [0, 0.4],
    }),
    population("time-ticks", ticksAlongA(0, EA, 0, 0, EA / 12, 0.32), {
      role: "structure",
      shape: "dot",
      size: 2.7,
      opacity: 0.62,
      reveal: [0, 0.4],
    })
  );

  /* ── The effort surface: a membrane, its isolines, its risers (group) ─── */
  const fill: WorldPt[] = [];
  const NT = 52;
  const NV = 15;
  for (let i = 0; i <= NT; i++) {
    for (let j = 1; j <= NV; j++) {
      const t = ((i + (j % 2) * 0.5) / NT) * END_T;
      const v = j / NV;
      if (t <= END_T) fill.push(S(t, v));
    }
  }
  const iso: WorldPt[] = [];
  const isoAlpha: number[] = [];
  for (const v of V_LINES) {
    if (v === 0) continue;
    const line: WorldPt[] = [];
    for (let i = 0; i <= N; i++) line.push(S((i / N) * END_T, v));
    const dots = dotsAlong(SEED + 6, line, 0.06);
    iso.push(...dots);
    isoAlpha.push(...dots.map(() => 1 - v * 0.5));
  }
  const risers: WorldPt[] = [];
  for (const t of MESH_T) {
    const line: WorldPt[] = [];
    for (let j = 0; j <= 12; j++) line.push(S(t, j / 12));
    risers.push(...dotsAlong(SEED + 7, line, 0.06));
  }
  pops.push(
    population("surface-fill", fill, {
      role: "structure",
      shape: "dot",
      size: 2.0,
      opacity: 0.24,
      reveal: [0, 1],
      group: CURVE_GROUP_EFFORT,
      sizeVar: 0.5,
      twinkle: 0.3,
    }),
    population("surface-iso", iso, {
      role: "structure",
      shape: "dot",
      size: 2.5,
      opacity: 0.5,
      reveal: [0, 1],
      group: CURVE_GROUP_EFFORT,
      order: isoAlpha.map(() => 1),
    }),
    population("surface-risers", risers, {
      role: "structure",
      shape: "dot",
      size: 2.2,
      opacity: 0.34,
      reveal: [0, 1],
      group: CURVE_GROUP_EFFORT,
    })
  );

  /* ── The frontier: a ribbon of light; the other vendor beside it ─────── */
  const rib = ribbon(
    SEED + 8,
    curve,
    { pitch: 0.024, spread: 0.014 },
    { perUnit: 150, sigma: 0.085 }
  );
  pops.push(
    population("frontier-core", rib.core, {
      role: "gold",
      shape: "dot",
      size: 4.4,
      opacity: 0.95,
      reveal: [0, 0.3],
      lit: true,
      twinkle: 0.15,
    }),
    population("frontier-halo", rib.halo, {
      role: "accent",
      shape: "dot",
      size: 2.7,
      opacity: 0.55,
      reveal: [0, 0.3],
      sizeVar: 0.9,
      twinkle: 0.65,
      order: 0,
      drift: 0.05,
    }),
    population("other", dotsAlong(SEED + 9, other, 0.075), {
      role: "structure",
      shape: "dot",
      size: 3.0,
      opacity: 0.7,
      reveal: [0, 0.3],
    })
  );

  /* ── The step: a lit patch of floor under the rise ───────────────────── */
  const t0 = T.everyday + 0.045;
  const t1 = T.frontier - 0.015;
  const a0 = S(t0, 0).a;
  const a1 = S(t1, 0).a;
  pops.push(
    population("step", lattice(a0, a1, 0.08, EB - 0.08, 0.004, 0.21), {
      role: "gold",
      shape: "voxel",
      size: 3.4,
      opacity: 0.3,
      reveal: [0, 0.35],
    })
  );
  labels.push({
    id: "step",
    text: C.step.toUpperCase(),
    at: W((a0 + a1) / 2, EB * 0.86, 0),
    anchor: "middle",
    kind: "note",
    lit: true,
  });

  /* ── The lanes: a node on the curve, a drop to the floor, a foot ─────── */
  const laneIds = ["fast", "everyday", "frontier"] as const;
  laneIds.forEach((id, i) => {
    const lane = C.lanes.find((l) => l.id === id);
    if (!lane) return;
    const p = S(T[id], 0);
    const frontier = id === "frontier";
    pops.push(
      population(`node-${id}`, [p], {
        role: frontier ? "gold" : "structure",
        shape: "ring",
        size: frontier ? 22 : 17,
        opacity: 0.95,
        reveal: [0, 0.3],
        lit: frontier,
      }),
      population(`node-core-${id}`, motesAround(SEED + 20 + i, p, 0.045, frontier ? 36 : 22), {
        role: frontier ? "gold" : "structure",
        shape: "dot",
        size: 3,
        opacity: 0.9,
        reveal: [0, 0.3],
        lit: frontier,
      }),
      population(`drop-${id}`, dotsAlong(SEED + 30 + i, [p, W(p.a, p.b, 0)], 0.07), {
        role: "structure",
        shape: "dot",
        size: 2.3,
        opacity: 0.42,
        reveal: [0, 0.3],
      }),
      population(`foot-${id}`, [W(p.a, p.b, 0.004)], {
        role: "structure",
        shape: "cross",
        size: 13,
        opacity: 0.7,
        reveal: [0, 0.3],
      })
    );
    labels.push({
      id: `lane-${id}`,
      text: lane.label,
      at: p,
      dy: frontier ? -40 : -34,
      anchor: "middle",
      kind: "name",
      lit: frontier,
    });
    /* The names and prices hang under the slab, a row per lane so none collide. */
    labels.push(
      {
        id: `models-${id}`,
        text: lane.models.map((m) => m.name).join(" · "),
        at: W(p.a, 0, -0.62),
        dy: 18 * i,
        anchor: "middle",
        kind: "note",
      },
      {
        id: `prices-${id}`,
        text: lane.models.map((m) => `$${m.input} in · $${m.output} out`).join("   "),
        at: W(p.a, 0, -0.62),
        dy: 18 * i + 15,
        anchor: "middle",
        kind: "end",
      }
    );
    anchors.push(W(p.a, 0, -0.62 - 0.9 - i * 0.35));
  });

  /* The other vendor's points: open nodes on its own trace, named above the ceiling. */
  C.others.forEach((s, si) => {
    const last = s.points[s.points.length - 1];
    if (last) {
      const p = S(last.t, 0, "other");
      labels.push({
        id: `other-${si}`,
        text: s.label.toUpperCase(),
        at: p,
        dx: 22,
        dy: -12,
        anchor: "start",
        kind: "note",
      });
    }
    s.points.forEach((pt, pi) => {
      const p = S(pt.t, 0, "other");
      pops.push(
        population(`other-node-${si}-${pi}`, [p], {
          role: "structure",
          shape: "ring",
          size: 12,
          opacity: 0.8,
          reveal: [0, 0.3],
        })
      );
      labels.push({
        id: `other-model-${si}-${pi}`,
        text: pt.model.name,
        at: p,
        dx: 22,
        dy: 14,
        anchor: "start",
        kind: "end",
      });
    });
  });

  /* ── Dust in the volume ──────────────────────────────────────────────── */
  pops.push(
    population(
      "dust",
      motesIn(
        SEED + 40,
        { a: -0.6, b: -0.4, z: 0.05, w: EA + 1.2, d: EB + 0.9, h: zTop * 1.05 },
        460
      ),
      {
        role: "structure",
        shape: "dot",
        size: 2.0,
        opacity: 0.17,
        reveal: [0.05, 0.6],
        sizeVar: 1,
        order: 0,
        drift: 0.09,
        twinkle: 0.55,
      }
    )
  );

  /* ── The few crisp edges: the floor's outline ────────────────────────── */
  lines.push({
    ...run(
      "floor-outline",
      [abz(0, 0, 0), abz(EA, 0, 0), abz(EA, EB, 0), abz(0, EB, 0), abz(0, 0, 0)].map((p) => V(p)),
      { role: "structure", width: 1.1, opacity: 0.5, reveal: [0.02, 0.4] }
    ),
    batch: true,
  });

  /* ── The words ───────────────────────────────────────────────────────── */
  labels.push(
    {
      id: "axis-y",
      text: C.axes.y.toUpperCase(),
      at: W(0, 0, zTop),
      dx: -8,
      dy: -22,
      anchor: "end",
      kind: "axis",
    },
    {
      id: "axis-x",
      text: `${C.axes.x.toUpperCase()}`,
      at: W(EA * 0.5, -0.62, 0),
      rot: -22,
      anchor: "middle",
      kind: "axis",
    },
    {
      id: "axis-effort",
      text: `← ${C.effort.axis.replace("←", "").trim().toUpperCase()}`,
      at: W(-1.95, EB * 0.5, 0),
      rot: 22,
      anchor: "middle",
      kind: "axis",
    },
    {
      id: "effort-lo",
      text: C.effort.levels[0].toUpperCase(),
      at: W(-0.32, 0.1, 0),
      anchor: "end",
      kind: "end",
    },
    {
      id: "effort-hi",
      text: C.effort.levels[1].toUpperCase(),
      at: W(-0.32, EB * 0.5, 0),
      anchor: "end",
      kind: "end",
    },
    {
      id: "effort-max",
      text: C.effort.levels[2].toUpperCase(),
      at: W(-0.32, EB - 0.1, 0),
      anchor: "end",
      kind: "end",
    },
    {
      id: "key-own",
      text: C.key.own.toUpperCase(),
      at: S(END_T, 0),
      dx: 22,
      dy: -28,
      anchor: "start",
      kind: "name",
      lit: true,
    }
  );
  anchors.push(
    W(-2.8, EB * 0.5, 0),
    W(EA * 0.5, -1.1, 0),
    W(0, 0, zTop + 0.5),
    W(EA + 1.3, 0, S(END_T, 0).z)
  );

  /* ── The crop, from every home and every word's seat ─────────────────── */
  const all: ABZ[] = [...anchors];
  for (const p of pops) for (const v of p.points) all.push({ a: v[0], b: -v[2], z: v[1] });
  const frame = frameFor(all, { l: 70, r: 70, t: 40, b: 110 }, view);
  const points = pops.flatMap((p) => p.points);

  const spec: HoloStageSpec = {
    id: "curve-graph",
    frame,
    bounds: boundsOf(points),
    lines,
    faces: [],
    dust: [],
    anchors: [],
    view,
    sweep: SWEEP,
    groups: [CURVE_GROUP_EFFORT],
    particles: { populations: pops, scatter: 2.4 },
  };

  return {
    id: "graph",
    figure: "curve",
    name: "Graph",
    reference: "the frontier as a graph, made of light",
    claim:
      "Graph paper on a stacked slab, a graticule behind, a beaded axis. The frontier runs across it as a ribbon of gold; every lane is a node with a drop to the floor; the second dial rises as a membrane of motes.",
    spec,
    labels,
  };
}
