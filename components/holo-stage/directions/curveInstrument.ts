/**
 * CURVE · INSTRUMENT — the frontier, plotted, on an instrument bed (ADR-140,
 * round four).
 *
 * Round three's graph (`curveGraph`) kept — "it needs to be a curve and look
 * like a graph", and it does — and re-cut: the floor of graph paper becomes
 * the BED that runs to the glass's edges, the graticule stands on the back
 * and side walls, the beaded axis carries its levels, the ruler ticks along
 * the front; the frontier is a RIBBON twice as dense with a wide halo of
 * sparkle and its beads FLOW toward the frontier; every lane is a filled
 * DISC in a ring (the artifact's own lane dots) with a drop to the floor;
 * the second dial is the membrane. The three lanes read out in a framed
 * column at the right: the lane, its models, their prices — the record.
 *
 * The heights are Moira's own (`curveSurface.world`); nothing about the
 * record moved.
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
  dotsAlongT,
  flowing,
  motesAround,
  motesIn,
  population,
  ribbonT,
  ticksAlongA,
  W,
  V,
  type ParticlePopulation,
  type WorldPt,
} from "../stageParticles";
import { instrumentBed } from "./instrument";
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

const SEED = 5201;
const SWEEP: StageSweep = { axis: 0, from: -1.4, to: EA + 1.5, window: [0.06, 0.82], width: 0.34 };

export const CURVEINSTRUMENT_VIEW: StageView = "stage";

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

export function curveInstrument(view: StageView = CURVEINSTRUMENT_VIEW): Direction {
  const C = FRONTIER_CURVE;
  const pops: ParticlePopulation[] = [];
  const lines: StageLine[] = [];
  const labels: DirLabel[] = [];
  const anchors: ABZ[] = [];

  /* The curve itself, and the stage's ceiling. */
  const N = 96;
  const curve: WorldPt[] = [];
  const other: WorldPt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * END_T;
    curve.push(S(t, 0));
    other.push(S(t, 0, "other"));
  }
  const zTop = Math.max(S(END_T, 1).z, S(END_T, 0).z) * 1.12;

  /* ── The bed, with the figure's floor on it ──────────────────────────── */
  const bed = instrumentBed({
    seed: SEED,
    floor: { a0: 0, a1: EA, b0: 0, b1: EB },
    ext: { a0: 1.1, a1: 1.3, b0: 0.9, b1: 0.7 },
    pitch: 0.48,
    major: 2,
    slab: { layers: 5, step: 0.085 },
    reveal: [0, 0.38],
  });
  pops.push(...bed.pops);
  lines.push(...bed.lines);

  /* ── The graticule on the back and side walls ────────────────────────── */
  const ZN = 5;
  const NA = 12;
  const NB = 6;
  const wallRules: WorldPt[] = [];
  for (let k = 1; k <= ZN; k++) {
    const z = (k / ZN) * zTop * 0.92;
    wallRules.push(...dotsAlong(SEED + 90 + k, [W(0, EB, z), W(EA, EB, z)], 0.06));
    wallRules.push(...dotsAlong(SEED + 100 + k, [W(0, 0, z), W(0, EB, z)], 0.06));
  }
  for (let i = 2; i <= NA; i += 2)
    wallRules.push(
      ...dotsAlong(
        SEED + 110 + i,
        [W((i / NA) * EA, EB, 0), W((i / NA) * EA, EB, zTop * 0.92)],
        0.06
      )
    );
  for (let j = 2; j <= NB; j += 2)
    wallRules.push(
      ...dotsAlong(SEED + 120 + j, [W(0, (j / NB) * EB, 0), W(0, (j / NB) * EB, zTop * 0.92)], 0.06)
    );
  pops.push(
    population("wall-rules", wallRules, {
      role: "grid",
      shape: "dot",
      size: 2.6,
      opacity: 0.32,
      reveal: [0, 0.4],
    })
  );

  /* ── The axes: beaded, with their levels and the time ruler ──────────── */
  const yTicks: WorldPt[] = [];
  for (const l of LEVELS)
    yTicks.push(
      ...dotsAlong(SEED + 2, [W(0, 0, l * zTop * 0.92), W(0, -0.4, l * zTop * 0.92)], 0.05)
    );
  pops.push(
    population("y-axis", dotsAlong(SEED + 3, [W(0, 0, 0), W(0, 0, zTop)], 0.04), {
      role: "structure",
      shape: "dot",
      size: 3.8,
      opacity: 0.85,
      reveal: [0, 0.3],
    }),
    population("y-ticks", yTicks, {
      role: "structure",
      shape: "dot",
      size: 3.4,
      opacity: 0.8,
      reveal: [0, 0.3],
    }),
    population("x-axis", dotsAlong(SEED + 4, [W(0, 0, 0), W(EA, 0, 0)], 0.04), {
      role: "structure",
      shape: "dot",
      size: 3.4,
      opacity: 0.7,
      reveal: [0, 0.4],
    }),
    population("b-axis", dotsAlong(SEED + 5, [W(0, 0, 0), W(0, EB, 0)], 0.04), {
      role: "structure",
      shape: "dot",
      size: 3.2,
      opacity: 0.6,
      reveal: [0, 0.4],
    }),
    population("time-ticks", ticksAlongA(0, EA, 0, 0, EA / 12, 0.36), {
      role: "structure",
      shape: "dot",
      size: 3.2,
      opacity: 0.7,
      reveal: [0, 0.4],
    })
  );

  /* ── The effort surface: a membrane, its isolines, its risers (group) ─── */
  const fill: WorldPt[] = [];
  const NT = 60;
  const NV = 16;
  for (let i = 0; i <= NT; i++) {
    for (let j = 1; j <= NV; j++) {
      const t = ((i + (j % 2) * 0.5) / NT) * END_T;
      const v = j / NV;
      if (t <= END_T) fill.push(S(t, v));
    }
  }
  const iso: WorldPt[] = [];
  for (const v of V_LINES) {
    if (v === 0) continue;
    const line: WorldPt[] = [];
    for (let i = 0; i <= N; i++) line.push(S((i / N) * END_T, v));
    iso.push(...dotsAlong(SEED + 6, line, 0.055));
  }
  const risers: WorldPt[] = [];
  for (const t of MESH_T) {
    const line: WorldPt[] = [];
    for (let j = 0; j <= 12; j++) line.push(S(t, j / 12));
    risers.push(...dotsAlong(SEED + 7, line, 0.055));
  }
  pops.push(
    population("surface-fill", fill, {
      role: "structure",
      shape: "dot",
      size: 2.6,
      opacity: 0.26,
      reveal: [0, 1],
      group: CURVE_GROUP_EFFORT,
      sizeVar: 0.5,
      twinkle: 0.3,
    }),
    population("surface-iso", iso, {
      role: "structure",
      shape: "dot",
      size: 3.2,
      opacity: 0.55,
      reveal: [0, 1],
      group: CURVE_GROUP_EFFORT,
    }),
    population("surface-risers", risers, {
      role: "structure",
      shape: "dot",
      size: 2.8,
      opacity: 0.38,
      reveal: [0, 1],
      group: CURVE_GROUP_EFFORT,
    })
  );

  /* ── The frontier: a ribbon of light that flows; the other vendor beside ── */
  const rib = ribbonT(
    SEED + 8,
    curve,
    { pitch: 0.012, spread: 0.012 },
    { perUnit: 300, sigma: 0.14 }
  );
  const flowCore = {
    points: rib.core.points,
    tangents: rib.core.tangents.map((t) => ({ a: t.a * 2.5, b: t.b * 2.5, z: t.z * 2.5 })),
  };
  pops.push(
    flowing("frontier-core", flowCore, {
      role: "gold",
      shape: "dot",
      size: 4.8,
      opacity: 0.95,
      reveal: [0, 0.3],
      lit: true,
      twinkle: 0.12,
      flow: { period: 0.45 },
    }),
    population("frontier-halo", rib.halo, {
      role: "accent",
      shape: "dot",
      size: 3.0,
      opacity: 0.5,
      reveal: [0, 0.3],
      sizeVar: 0.9,
      twinkle: 0.65,
      order: 0,
      drift: 0.05,
    }),
    flowing("other", dotsAlongT(SEED + 9, other, 0.07, 0, 0.14), {
      role: "structure",
      shape: "dot",
      size: 3.4,
      opacity: 0.72,
      reveal: [0, 0.3],
      flow: { period: 0.6 },
    })
  );

  /* ── The step: a lit patch of floor under the rise ───────────────────── */
  const t0 = T.everyday + 0.045;
  const t1 = T.frontier - 0.015;
  const a0 = S(t0, 0).a;
  const a1 = S(t1, 0).a;
  const stepPatch: WorldPt[] = [];
  for (let a = a0; a <= a1; a += 0.19)
    for (let b = 0.08; b <= EB - 0.08; b += 0.19) stepPatch.push(W(a, b, 0.004));
  pops.push(
    population("step", stepPatch, {
      role: "gold",
      shape: "voxel",
      size: 4.4,
      opacity: 0.34,
      reveal: [0, 0.35],
    })
  );
  labels.push({
    id: "step",
    text: C.step.toUpperCase(),
    /* At the patch's front, under the x-axis beads — behind the curve it sat
       on the EVERYDAY node's own name. */
    at: W((a0 + a1) / 2, 0.08, 0),
    dy: 16,
    anchor: "middle",
    kind: "note",
    lit: true,
  });

  /* ── The lanes: a filled disc in a ring on the curve, a drop, a foot ── */
  const laneIds = ["fast", "everyday", "frontier"] as const;
  const { rect } = bed;
  /* The readout column stacks in SCREEN px from one anchor (a world-z step
     of 0.6 was 23 px at 1920 and the three plates overprinted each other). */
  const READOUT_AT = W(rect.a1 + 0.55, 0, 2.2);
  const readoutDy = [128, 64, 0];
  laneIds.forEach((id, i) => {
    const lane = C.lanes.find((l) => l.id === id);
    if (!lane) return;
    const p = S(T[id], 0);
    const frontier = id === "frontier";
    pops.push(
      population(`node-${id}`, [p], {
        role: frontier ? "gold" : "structure",
        shape: "ring",
        size: frontier ? 34 : 26,
        opacity: 0.95,
        reveal: [0, 0.3],
        lit: frontier,
      }),
      population(`node-disc-${id}`, [p], {
        role: frontier ? "gold" : "structure",
        shape: "disc",
        size: frontier ? 20 : 13,
        opacity: 0.95,
        reveal: [0, 0.3],
        lit: frontier,
      }),
      population(`node-core-${id}`, motesAround(SEED + 20 + i, p, 0.05, frontier ? 50 : 26), {
        role: frontier ? "gold" : "structure",
        shape: "dot",
        size: 3.4,
        opacity: 0.9,
        reveal: [0, 0.3],
        lit: frontier,
      }),
      population(`drop-${id}`, dotsAlong(SEED + 30 + i, [p, W(p.a, p.b, 0)], 0.06), {
        role: "structure",
        shape: "dot",
        size: 2.9,
        opacity: 0.46,
        reveal: [0, 0.3],
      }),
      population(`foot-${id}`, [W(p.a, p.b, 0.004)], {
        role: "structure",
        shape: "cross",
        size: 15,
        opacity: 0.75,
        reveal: [0, 0.3],
      })
    );
    labels.push({
      id: `lane-${id}`,
      text: lane.label,
      at: p,
      dy: frontier ? -44 : -38,
      anchor: "middle",
      kind: "name",
      lit: frontier,
    });
    /* The readout column at the right: the lane, its models, their prices. */
    labels.push({
      id: `readout-${id}`,
      key: lane.label,
      /* The artifact's own format: the model, then `$in / $out`. */
      text: lane.models.map((m) => `${m.name} $${m.input} / $${m.output}`).join(" · "),
      at: READOUT_AT,
      dy: readoutDy[i],
      anchor: "start",
      kind: "readout",
      lit: frontier,
    });
  });
  anchors.push(W(rect.a1 + 6.4, 0, 2.2), W(rect.a1 + 0.55, 0, 3.3), W(rect.a1 + 0.55, 0, -1.6));

  /* The other vendor's points: open nodes on its own trace, named above the ceiling. */
  C.others.forEach((s, si) => {
    const last = s.points[s.points.length - 1];
    if (last) {
      const p = S(last.t, 0, "other");
      labels.push({
        id: `other-${si}`,
        text: s.label.toUpperCase(),
        at: p,
        dx: 24,
        dy: -14,
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
          size: 16,
          opacity: 0.85,
          reveal: [0, 0.3],
        })
      );
      labels.push({
        id: `other-model-${si}-${pi}`,
        text: pt.model.name,
        at: p,
        dx: 24,
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
        { a: -0.9, b: -0.7, z: 0.05, w: EA + 2.2, d: EB + 1.5, h: zTop * 1.05 },
        700
      ),
      {
        role: "structure",
        shape: "dot",
        size: 2.6,
        opacity: 0.2,
        reveal: [0.05, 0.6],
        sizeVar: 1,
        order: 0,
        drift: 0.09,
        twinkle: 0.55,
      }
    )
  );

  /* ── The floor's outline, crisp ──────────────────────────────────────── */
  lines.push({
    ...run(
      "floor-outline",
      [abz(0, 0, 0), abz(EA, 0, 0), abz(EA, EB, 0), abz(0, EB, 0), abz(0, 0, 0)].map((p) => V(p)),
      { role: "structure", width: 1.2, opacity: 0.55, reveal: [0.02, 0.4] }
    ),
    batch: true,
  });

  /* ── The words, in the bed's margins ────────────────────────────────── */
  labels.push(
    {
      id: "axis-y",
      text: C.axes.y.toUpperCase(),
      at: W(0, 0, zTop),
      dx: -10,
      dy: -24,
      anchor: "end",
      kind: "axis",
    },
    {
      id: "axis-x",
      text: C.axes.x.toUpperCase(),
      at: W(EA * 0.5, rect.b0 - 0.45, 0),
      rot: -22,
      anchor: "middle",
      kind: "axis",
    },
    {
      id: "axis-effort",
      text: `← ${C.effort.axis.replace("←", "").trim().toUpperCase()}`,
      at: W(rect.a0 - 0.5, EB * 0.5, 0),
      rot: 22,
      anchor: "middle",
      kind: "axis",
    },
    {
      id: "effort-lo",
      text: C.effort.levels[0].toUpperCase(),
      at: W(-0.4, 0.1, 0),
      anchor: "end",
      kind: "end",
    },
    {
      id: "effort-hi",
      text: C.effort.levels[1].toUpperCase(),
      at: W(-0.4, EB * 0.5, 0),
      anchor: "end",
      kind: "end",
    },
    {
      id: "effort-max",
      text: C.effort.levels[2].toUpperCase(),
      at: W(-0.4, EB - 0.1, 0),
      anchor: "end",
      kind: "end",
    },
    {
      id: "key-own",
      text: C.key.own.toUpperCase(),
      at: S(END_T, 0),
      dx: 24,
      dy: -30,
      anchor: "start",
      kind: "name",
      lit: true,
    }
  );
  anchors.push(W(rect.a0 - 2.2, EB * 0.5, 0), W(EA * 0.5, rect.b0 - 1.2, 0), W(0, 0, zTop + 0.5));

  /* ── The crop, from every home and every word's seat ─────────────────── */
  const all: ABZ[] = [...anchors, ...bed.corners];
  for (const p of pops) for (const v of p.points) all.push({ a: v[0], b: -v[2], z: v[1] });
  const frame = frameFor(all, { l: 40, r: 40, t: 40, b: 60 }, view);
  const points = pops.flatMap((p) => p.points);

  const spec: HoloStageSpec = {
    id: "curve-instrument",
    frame,
    bounds: boundsOf(points),
    lines,
    faces: [],
    dust: [],
    anchors: [],
    view,
    sweep: SWEEP,
    groups: [CURVE_GROUP_EFFORT],
    particles: { populations: pops, scatter: 2.6 },
  };

  return {
    id: "curve-instrument",
    figure: "curve",
    name: "Instrument",
    reference: "round three's graph, on the bed, the ribbon flowing",
    claim:
      "Graph paper to the glass's edges, a graticule on the walls, a beaded axis with its levels. The frontier is a dense ribbon of gold whose beads flow toward the frontier; each lane a filled disc in a ring with a drop to the floor; the lanes read out in a framed column with their models and prices.",
    spec,
    labels,
  };
}
