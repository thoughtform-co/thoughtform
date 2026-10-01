/**
 * curveGeom — THE CURVE as world-space data for the live stage (ADR-140).
 *
 * `framing/curveSurface.ts` is already a three-dimensional object drawn flat:
 * Moira's floor is the stage's own 22° parallel basis (`ISO_BASIS_STAGE` at
 * `k = 1`), and `surface(t, v)` lifts a floor point by the curve's height.
 * So the hologram is a LIFT, not a redraw — every number here is read from
 * that module (`world`, `floor`, the edges, the lanes' `T`), never restated,
 * and `holo-stage-geom` asserts that a world point projected through the
 * stage camera lands on `surface(t, v)` to the unit.
 *
 * ⚠ THREE-FREE AND PURE, like `stageGeom`: a `HoloStageSpec` the one renderer
 * paints. The dense structure is BATCHED (one draw call); the own curve on the
 * front edge is the one drei donor run, the beat's one gold object with bloom.
 *
 * ⚠ THE EFFORT SURFACE IS A REVEAL GROUP. `ArcCurveSteps` writes `data-step`
 * 0 / 1 / 2 on the figure; the mount reads it and hands the canvas
 * `{ effort: step >= 2 }`, so the second dial rises out of the front edge when
 * its button is pressed and folds back when it is pressed again — the SVG's
 * own `.arc-cv__depth` opacity, as geometry.
 *
 * ⚠ THE WORLD IS SCALED BY `STAGE_K`. The curve's floor edges are 460 and 150
 * viewbox px; at one world unit per px the drawing would sit beyond the
 * camera's far plane (30 units off, far 100). `k = 40`, the stage's own, puts
 * it at 11.5 × 3.75 — the stages' twelve-unit floor — so one camera distance
 * serves both drawings.
 */

import {
  AXIS_TOP,
  BAND_PAD,
  DH,
  DW,
  END_T,
  FLOOR_EDGES,
  LEVELS,
  MESH_T,
  ORIGIN,
  T,
  V_LINES,
  floor,
  world,
  type CurveLane,
} from "@/components/arcs/framing/curveSurface";
import { STAGE_K } from "@/components/arcs/framing/floor";
import { ISO_BASIS_STAGE, ISO_SEED, type IsoFrame } from "@/components/arcs/framing/iso";

import { stageCameraBasis, toThree, type Vec3 } from "./stageFit";
import {
  motes,
  specBounds,
  sweepReaches,
  type HoloStageSpec,
  type StageDust,
  type StageFace,
  type StageLine,
  type StageStrip,
  type StageSweep,
} from "./stageGeom";

/** Viewbox px per world unit — the stage's own, so one camera distance serves both drawings. */
export const CURVE_K = STAGE_K;
/** Viewbox px of height per world unit of `z` (the basis's own foreshortening). */
const Z_UNIT = -ISO_BASIS_STAGE.Z[1];
const { UL, VL } = FLOOR_EDGES;

/** The SVG's own crop, as the camera's frame: the drawing and the hologram are one picture. */
export const CURVE_FRAME: IsoFrame = {
  w: DW,
  h: DH,
  ox: ORIGIN.OX,
  oy: ORIGIN.OY,
  k: CURVE_K,
  basis: ISO_BASIS_STAGE,
};

/** The one reveal group: the second dial. */
export const CURVE_GROUP_EFFORT = "effort";

/** The surface at (t, v), in the stage's world. */
export function curveWorld(t: number, v: number, series: "own" | "other" = "own"): Vec3 {
  const w = world(t, v, series);
  return toThree(w.a / CURVE_K, w.b / CURVE_K, w.h / (CURVE_K * Z_UNIT));
}

/** A point of the floor at (u, v), both 0..1. */
export function curveFloor(u: number, v: number): Vec3 {
  return toThree((u * UL) / CURVE_K, (v * VL) / CURVE_K, 0);
}

const N = 40;
const run = (v: number, series: "own" | "other" = "own"): Vec3[] =>
  Array.from({ length: N + 1 }, (_, i) => curveWorld((END_T * i) / N, v, series));
const riserPts = (t: number): Vec3[] => Array.from({ length: 11 }, (_, i) => curveWorld(t, i / 10));

/** A node: a ring facing the camera, in world — never a disc (ADR-106's open mark). */
function ring(c: Vec3, r: number, n = 16): Vec3[] {
  const b = stageCameraBasis("stage");
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * Math.PI * 2;
    const cx = Math.cos(th) * r;
    const sy = Math.sin(th) * r;
    out.push([
      c[0] + cx * b.x[0] + sy * b.y[0],
      c[1] + cx * b.x[1] + sy * b.y[1],
      c[2] + cx * b.x[2] + sy * b.y[2],
    ]);
  }
  return out;
}

export interface CurveData {
  /** The three lanes, cheapest first. */
  lanes: readonly { id: CurveLane }[];
  /** The other vendor's points. */
  others: readonly { points: readonly { t: number }[] }[];
}

const EDGE_A = UL / CURVE_K;

/** The arrival: one front along intelligence, front corner to the far tip. */
export const CURVE_SWEEP: StageSweep = {
  axis: 0,
  from: -0.25,
  to: EDGE_A + 0.25,
  window: [0.04, 0.72],
  width: 0.26,
};

export function curveSpec(data: CurveData): HoloStageSpec {
  const G = CURVE_GROUP_EFFORT;
  const lines: StageLine[] = [];
  const faces: StageFace[] = [];
  const strips: StageStrip[] = [];
  const dust: StageDust[] = [];

  /* ── The floor ─────────────────────────────────────────────────────── */
  lines.push({
    id: "floor",
    points: [
      curveFloor(0, 0),
      curveFloor(1, 0),
      curveFloor(1, 1),
      curveFloor(0, 1),
      curveFloor(0, 0),
    ],
    role: "structure",
    width: 1,
    opacity: 0.5,
    reveal: [0, 0.3],
    batch: true,
  });
  for (const k of [1 / 3, 2 / 3]) {
    lines.push({
      id: `grid-u${k.toFixed(2)}`,
      points: [curveFloor(k, 0), curveFloor(k, 1)],
      role: "grid",
      width: 0.85,
      opacity: 0.14,
      reveal: [0, 0.3],
      batch: true,
    });
  }
  lines.push({
    id: "grid-v",
    points: [curveFloor(0, 0.5), curveFloor(1, 0.5)],
    role: "grid",
    width: 0.85,
    opacity: 0.14,
    reveal: [0, 0.3],
    batch: true,
  });

  /* The vertical axis, at the floor's back-left corner, up to AXIS_TOP. */
  const cornerPx = floor(0, 1);
  const axisZ = (cornerPx.y - AXIS_TOP) / (CURVE_K * Z_UNIT);
  const corner = curveFloor(0, 1);
  lines.push({
    id: "axis-y",
    points: [corner, [corner[0], corner[1] + axisZ, corner[2]]],
    role: "structure",
    width: 1,
    opacity: 0.5,
    reveal: [0.02, 0.26],
    batch: true,
  });

  /* ── The step change: a strip of floor the full depth of the dial ──── */
  const frontierTs = [
    T.frontier,
    ...data.others.flatMap((s) => s.points.filter((p) => p.t >= T.frontier - 0.06).map((p) => p.t)),
  ];
  const bandT = [Math.min(...frontierTs) - BAND_PAD, Math.max(...frontierTs) + BAND_PAD] as const;
  const [u0, u1] = [bandT[0] / END_T, bandT[1] / END_T];
  const bandA0 = (u0 * UL) / CURVE_K;
  const bandA1 = (u1 * UL) / CURVE_K;
  faces.push({
    id: "band",
    quad: [curveFloor(u0, 0), curveFloor(u1, 0), curveFloor(u1, 1), curveFloor(u0, 1)],
    role: "gold",
    opacity: 0.1,
    reveal: [sweepReaches(CURVE_SWEEP, bandA0) - 0.02, sweepReaches(CURVE_SWEEP, bandA1) + 0.08],
  });
  for (const [i, u] of [u0, u1].entries()) {
    lines.push({
      id: `band-edge-${i}`,
      points: [curveFloor(u, 0), curveFloor(u, 1)],
      role: "gold",
      width: 0.9,
      opacity: 0.42,
      reveal: [0.1, 0.6],
      batch: true,
    });
  }

  /* ── The second dial: the surface, on its own clock ────────────────── */
  const levels = LEVELS as readonly number[];
  V_LINES.slice(1).forEach((v, i) => {
    const level = levels.includes(v);
    lines.push({
      id: `iso-${i}`,
      points: run(v),
      role: "structure",
      width: level ? 1.3 : 0.9,
      opacity: level ? 0.62 : 0.3,
      reveal: [0.05 + i * 0.05, 0.45 + i * 0.07],
      group: G,
      batch: true,
    });
    strips.push({
      id: `sheet-${i}`,
      left: run(V_LINES[i]),
      right: run(v),
      role: "gold",
      opacity: 0.12 - (0.09 * i) / (V_LINES.length - 2),
      reveal: [0.1 + i * 0.05, 0.55 + i * 0.06],
      group: G,
    });
  });
  MESH_T.forEach((t, i) => {
    lines.push({
      id: `riser-${i}`,
      points: riserPts(t),
      role: "structure",
      width: 0.9,
      opacity: 0.28,
      reveal: [0.2 + i * 0.04, 0.6 + i * 0.05],
      group: G,
      batch: true,
    });
  });
  for (const lane of data.lanes) {
    lines.push({
      id: `lane-riser-${lane.id}`,
      points: riserPts(T[lane.id]),
      role: "gold",
      width: 1.1,
      opacity: 0.55,
      reveal: [0.35, 0.85],
      group: G,
      batch: true,
    });
    lines.push({
      id: `tip-${lane.id}`,
      points: ring(curveWorld(T[lane.id], 1), 0.1),
      role: "gold",
      width: 1.1,
      opacity: 0.8,
      reveal: [0.7, 1],
      group: G,
      batch: true,
    });
  }
  for (const level of levels) {
    lines.push({
      id: `level-${level}`,
      points: ring(curveFloor(0, level), 0.07, 10),
      role: "structure",
      width: 1,
      opacity: 0.6,
      reveal: [0.4, 0.8],
      group: G,
      batch: true,
    });
  }

  /* ── The two vendors on the front edge ─────────────────────────────── */
  const front = run(0);
  strips.push({
    id: "wall",
    left: front,
    right: Array.from({ length: N + 1 }, (_, i) => curveFloor(i / N, 0)),
    role: "gold",
    opacity: 0.07,
    reveal: [0.25, 0.85],
  });
  if (data.others.length > 0) {
    lines.push({
      id: "other",
      points: run(0, "other"),
      role: "structure",
      width: 1.3,
      opacity: 0.78,
      reveal: [0.14, 0.76],
      batch: true,
    });
  }
  /* The own curve: the one donor, bloom's one object. */
  lines.push({
    id: "own",
    points: front,
    role: "gold",
    width: 2.2,
    opacity: 1,
    reveal: [0.18, 0.84],
    donor: true,
  });

  /* The nodes — rings; the frontier's the one filled chip in the SVG, here the
     thickest ring, so the mark's grammar survives the material. */
  for (const lane of data.lanes) {
    const c = curveWorld(T[lane.id], 0);
    const at = sweepReaches(CURVE_SWEEP, c[0]);
    lines.push({
      id: `node-${lane.id}`,
      points: ring(c, lane.id === "frontier" ? 0.15 : 0.12),
      role: "gold",
      width: lane.id === "frontier" ? 2.4 : 1.4,
      opacity: 1,
      reveal: [Math.max(0.3, at), Math.min(1, Math.max(0.3, at) + 0.18)],
      batch: true,
    });
  }
  data.others.forEach((s, si) =>
    s.points.forEach((p, pi) => {
      const c = curveWorld(p.t, 0, "other");
      const at = sweepReaches(CURVE_SWEEP, c[0]);
      lines.push({
        id: `node-other-${si}-${pi}`,
        points: ring(c, 0.12),
        role: "structure",
        width: 1.3,
        opacity: 0.9,
        reveal: [Math.max(0.3, at), Math.min(1, Math.max(0.3, at) + 0.18)],
        batch: true,
      });
    })
  );

  /* ── The dust: motes over the floor, per unit of area ──────────────── */
  dust.push({
    id: "dust",
    points: motes(ISO_SEED + 541, 150, { a: 0, b: 0, w: EDGE_A, d: VL / CURVE_K, z: 0, h: 1.4 }),
    opacity: 0.22,
  });

  const stripPts: StageLine[] = strips.map((s) => ({
    id: s.id,
    points: [...s.left, ...s.right],
    role: s.role,
    width: 0,
    opacity: 0,
    reveal: [0, 1],
  }));

  return {
    id: "curve",
    frame: CURVE_FRAME,
    bounds: specBounds([...lines, ...stripPts], faces),
    lines,
    faces,
    strips,
    dust,
    anchors: [],
    sweep: CURVE_SWEEP,
    groups: [G],
  };
}
