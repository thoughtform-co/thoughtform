/**
 * RELIEF — the frontier as a landscape.
 *
 * From the owner's reference of a wireframe terrain on a stacked slab: a
 * height field in wire mesh, contour lines, a route across it, a beacon.
 * The reading is Moira's — more intelligence finishes more and costs more
 * per token, and every model has a second dial — but the figure is a RELIEF:
 * the surface drawn as a dense mesh with CONTOURS of equal capability, on a
 * slab whose stacked edges are the floor's depth; every model a BEACON
 * standing on the ridge with its price hanging from its drop to the floor;
 * the step change a FAULT — two translucent walls from floor to ridge; the
 * other vendor a second path along the front edge. The surface is also a
 * point cloud: motes seeded on the relief itself.
 *
 * The heights are Moira's own (`curveSurface.world`), so nothing about the
 * record moved; what moved is everything the record is drawn with.
 */

import {
  BAND_PAD,
  END_T,
  FLOOR_EDGES,
  T,
  world,
  type CurveLane,
} from "@/components/arcs/framing/curveSurface";
import { STAGE_K } from "@/components/arcs/framing/floor";
import { ISO_BASIS_STAGE, ISO_SEED, mulberry32 } from "@/components/arcs/framing/iso";
import { FRONTIER_CURVE } from "@/lib/arcs/content/shared/frontierCurve";

import type { StageView, Vec3 } from "../stageFit";
import {
  specBounds,
  sweepReaches,
  type HoloStageSpec,
  type StageDust,
  type StageFace,
  type StageLine,
  type StageStrip,
  type StageSweep,
} from "../stageGeom";
import { abz, collector, frameFor, run, type ABZ, type DirLabel, type Direction } from "./shared";

const K = STAGE_K;
const Z_UNIT = -ISO_BASIS_STAGE.Z[1];
const { UL, VL } = FLOOR_EDGES;
const EA = UL / K;
const EB = VL / K;

/** The surface at (t, v) in the stage's world. */
const S = (t: number, v: number, series: "own" | "other" = "own"): ABZ => {
  const w = world(t, v, series);
  return abz(w.a / K, w.b / K, w.h / (K * Z_UNIT));
};
const F = (u: number, v: number): ABZ => abz(u * EA, v * EB, 0);
const V = (p: ABZ): Vec3 => [p.a, p.z, -p.b];

const SWEEP: StageSweep = { axis: 0, from: -0.4, to: EA + 0.4, window: [0.04, 0.7], width: 0.26 };
const at = (a: number) => sweepReaches(SWEEP, a);

/** Where the own surface at effort `v` reaches height `z`, by bisection on t; null if never. */
function contourT(z: number, v: number): number | null {
  let lo = 0;
  let hi = END_T;
  if (S(hi, v).z < z) return null;
  if (S(lo, v).z > z) return null;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (S(mid, v).z < z) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The direction's own vantage; the lab may turn it. */
export const CURVERELIEF_VIEW: StageView = { azimuthDeg: 33, elevationDeg: 20 };

export function curveRelief(view: StageView = CURVERELIEF_VIEW): Direction {
  const pts = collector();
  const lines: StageLine[] = [];
  const faces: StageFace[] = [];
  const strips: StageStrip[] = [];
  const dust: StageDust[] = [];
  const labels: DirLabel[] = [];
  const C = FRONTIER_CURVE;

  /* ── The slab: the floor outline, stacked three times below itself ───── */
  const corners = [F(0, 0), F(1, 0), F(1, 1), F(0, 1)];
  for (let s = 0; s < 4; s++) {
    const dz = -s * 0.11;
    const o = corners.map((c) => abz(c.a, c.b, dz));
    lines.push(
      run(`slab-${s}`, [...o, o[0]].map(V), {
        role: "structure",
        width: s === 0 ? 1.1 : 0.9,
        opacity: s === 0 ? 0.55 : 0.28 - s * 0.05,
        reveal: [0.02, 0.4],
      })
    );
  }
  for (const c of [F(0, 0), F(1, 0), F(1, 1)]) {
    lines.push(
      run(`slab-edge-${c.a.toFixed(1)}-${c.b.toFixed(1)}`, [V(c), V(abz(c.a, c.b, -0.33))], {
        role: "structure",
        width: 0.9,
        opacity: 0.35,
        reveal: [0.02, 0.4],
      })
    );
  }
  pts.add(...corners.map((c) => abz(c.a, c.b, -0.4)));
  /* The floor's thirds. */
  for (const k of [1 / 3, 2 / 3])
    lines.push(
      run(`grid-${k.toFixed(2)}`, [V(F(k, 0)), V(F(k, 1))], {
        role: "grid",
        width: 0.85,
        opacity: 0.16,
        reveal: [0, 0.3],
      })
    );
  lines.push(
    run("grid-mid", [V(F(0, 0.5)), V(F(1, 0.5))], {
      role: "grid",
      width: 0.85,
      opacity: 0.16,
      reveal: [0, 0.3],
    })
  );

  /* The vertical axis at the back-left corner. */
  const axisTop = abz(0, EB, S(END_T, 1).z + 0.5);
  lines.push(
    run("axis-y", [V(F(0, 1)), V(axisTop)], {
      role: "structure",
      width: 1,
      opacity: 0.5,
      reveal: [0.02, 0.26],
    })
  );
  pts.add(axisTop);

  /* ── The relief: a dense mesh, as wire ───────────────────────────────── */
  const NT = 32;
  const NV = 10;
  for (let j = 0; j <= NV; j++) {
    const v = j / NV;
    const row: Vec3[] = [];
    for (let i = 0; i <= NT; i++) row.push(V(S((END_T * i) / NT, v)));
    lines.push(
      run(`iso-${j}`, row, {
        role: "structure",
        width: j === 0 ? 1.1 : 0.85,
        opacity: j === 0 ? 0.6 : 0.2,
        reveal: [0.06, 0.78],
      })
    );
  }
  for (let i = 0; i <= NT; i += 2) {
    const t = (END_T * i) / NT;
    const col: Vec3[] = [];
    for (let j = 0; j <= NV; j++) col.push(V(S(t, j / NV)));
    lines.push(
      run(`riser-${i}`, col, {
        role: "structure",
        width: 0.85,
        opacity: 0.18,
        reveal: [at(S(t, 0).a) - 0.02, at(S(t, 0).a) + 0.1],
      })
    );
  }
  pts.add(S(END_T, 1), S(END_T, 0), S(0, 1));

  /* ── Contours of equal capability ────────────────────────────────────── */
  const zMax = S(END_T, 1).z;
  for (let k = 1; k <= 6; k++) {
    const z = (zMax * k) / 7;
    const line: Vec3[] = [];
    for (let j = 0; j <= 24; j++) {
      const v = j / 24;
      const t = contourT(z, v);
      if (t === null) {
        if (line.length > 1)
          lines.push(
            run(`contour-${k}-${j}`, line.splice(0), {
              role: "gold",
              width: 1,
              opacity: 0.42,
              reveal: [0.2, 0.86],
            })
          );
        else line.length = 0;
        continue;
      }
      line.push(V(S(t, v)));
    }
    if (line.length > 1)
      lines.push(
        run(`contour-${k}`, line, { role: "gold", width: 1, opacity: 0.42, reveal: [0.2, 0.86] })
      );
  }

  /* ── The surface as a point cloud ────────────────────────────────────── */
  {
    const rnd = mulberry32(ISO_SEED + 1201);
    const motes: Vec3[] = [];
    for (let i = 0; i < 520; i++) {
      const t = rnd() * END_T;
      const v = rnd();
      motes.push(V(S(t, v)));
    }
    dust.push({ id: "relief", points: motes, opacity: 0.42, role: "gold", size: 5 });
  }

  /* ── The step change: a fault, two walls floor → ridge ───────────────── */
  const frontierTs = [
    T.frontier,
    ...C.others.flatMap((s) => s.points.filter((p) => p.t >= T.frontier - 0.06).map((p) => p.t)),
  ];
  const bandT = [Math.min(...frontierTs) - BAND_PAD, Math.max(...frontierTs) + BAND_PAD] as const;
  for (const [i, t] of bandT.entries()) {
    const floorRail: Vec3[] = [];
    const ridgeRail: Vec3[] = [];
    for (let j = 0; j <= 12; j++) {
      const v = j / 12;
      floorRail.push(V(F(t / END_T, v)));
      ridgeRail.push(V(S(t, v)));
    }
    strips.push({
      id: `fault-${i}`,
      left: floorRail,
      right: ridgeRail,
      role: "gold",
      opacity: 0.09,
      reveal: [at(S(t, 0).a), at(S(t, 0).a) + 0.14],
    });
    lines.push(
      run(`fault-edge-${i}`, floorRail, {
        role: "gold",
        width: 0.9,
        opacity: 0.4,
        reveal: [at(S(t, 0).a), at(S(t, 0).a) + 0.12],
      })
    );
  }
  faces.push({
    id: "band",
    quad: [
      V(F(bandT[0] / END_T, 0)),
      V(F(bandT[1] / END_T, 0)),
      V(F(bandT[1] / END_T, 1)),
      V(F(bandT[0] / END_T, 1)),
    ],
    role: "gold",
    opacity: 0.08,
    reveal: [at(S(bandT[0], 0).a), at(S(bandT[1], 0).a) + 0.08],
  });

  /* ── The two vendors on the front edge; the own ridge is the donor ───── */
  if (C.others.length) {
    const other: Vec3[] = [];
    for (let i = 0; i <= NT; i++) other.push(V(S((END_T * i) / NT, 0, "other")));
    lines.push(
      run("other", other, { role: "structure", width: 1.3, opacity: 0.8, reveal: [0.12, 0.76] })
    );
  }
  const own: Vec3[] = [];
  for (let i = 0; i <= NT; i++) own.push(V(S((END_T * i) / NT, 0)));
  lines.push(
    run("own", own, { role: "gold", width: 2.2, opacity: 1, reveal: [0.14, 0.82], donor: true })
  );

  /* ── Beacons: a wire pyramid on the ridge, a drop to the floor ───────── */
  const beacon = (
    id: string,
    p: ABZ,
    role: "gold" | "structure",
    reveal: readonly [number, number]
  ) => {
    const h = 0.42;
    const w = 0.17;
    const apex = abz(p.a, p.b, p.z + h);
    const base = [
      abz(p.a - w, p.b - w, p.z),
      abz(p.a + w, p.b - w, p.z),
      abz(p.a + w, p.b + w, p.z),
      abz(p.a - w, p.b + w, p.z),
    ];
    lines.push(
      run(`${id}-base`, [...base, base[0]].map(V), { role, width: 1.2, opacity: 0.9, reveal })
    );
    for (const [i, b] of base.entries())
      lines.push(run(`${id}-e${i}`, [V(b), V(apex)], { role, width: 1.2, opacity: 0.9, reveal }));
    lines.push(
      run(`${id}-drop`, [V(p), V(abz(p.a, p.b, 0))], {
        role: "grid",
        width: 0.85,
        opacity: 0.45,
        reveal,
      })
    );
    pts.add(apex, abz(p.a, p.b, 0));
    return apex;
  };
  const lanes: readonly {
    id: CurveLane;
    label: string;
    models: readonly { name: string; input: number; output: number }[];
  }[] = C.lanes;
  for (const lane of lanes) {
    const p = S(T[lane.id], 0);
    const apex = beacon(`beacon-${lane.id}`, p, "gold", [at(p.a), at(p.a) + 0.14]);
    labels.push({
      id: `lane-${lane.id}`,
      text: lane.label,
      at: abz(apex.a, apex.b, apex.z + 0.18),
      anchor: "middle",
      kind: "name",
      lit: true,
      dy: -8,
    });
    /* The names and prices hang under the slab, staggered a row per lane so no two collide. */
    const row = lane.id === "fast" ? 0 : lane.id === "everyday" ? 1 : 2;
    labels.push({
      id: `models-${lane.id}`,
      text: lane.models.map((m) => m.name).join(" · "),
      at: abz(p.a, p.b, -0.5),
      anchor: "middle",
      kind: "note",
      dy: 14 + row * 34,
    });
    labels.push({
      id: `prices-${lane.id}`,
      text: lane.models.map((m) => `$${m.input} in · $${m.output} out`).join("  "),
      at: abz(p.a, p.b, -0.5),
      anchor: "middle",
      kind: "end",
      dy: 30 + row * 34,
    });
    lines.push(
      run(`drop-ext-${lane.id}`, [V(abz(p.a, p.b, 0)), V(abz(p.a, p.b, -0.5 - row * 0.42))], {
        role: "grid",
        width: 0.85,
        opacity: 0.35,
        reveal: [at(p.a), at(p.a) + 0.14],
      })
    );
    pts.add(abz(p.a, p.b, -0.9 - row * 0.5));
  }
  C.others.forEach((s, si) =>
    s.points.forEach((pt, pi) => {
      const p = S(pt.t, 0, "other");
      const apex = beacon(`beacon-other-${si}-${pi}`, p, "structure", [at(p.a), at(p.a) + 0.14]);
      labels.push({
        id: `other-${si}-${pi}`,
        text: pt.model.name,
        at: abz(apex.a, apex.b, apex.z + 0.18),
        anchor: "middle",
        kind: "name",
        dy: -8 - 18 * (pi + 1),
      });
      labels.push({
        id: `other-price-${si}-${pi}`,
        text: `$${pt.model.input} in · $${pt.model.output} out`,
        at: abz(apex.a, apex.b, apex.z + 0.18),
        anchor: "middle",
        kind: "end",
        dy: 6 - 18 * (pi + 1),
      });
    })
  );

  /* ── The words ───────────────────────────────────────────────────────── */
  labels.push(
    {
      id: "axis-y",
      text: C.axes.y.toUpperCase(),
      at: abz(axisTop.a, axisTop.b, axisTop.z + 0.25),
      anchor: "start",
      kind: "axis",
      dx: 8,
    },
    {
      id: "axis-x",
      text: `${C.axes.x.toUpperCase()} →`,
      at: abz(EA * 0.72, -1.7, 0),
      anchor: "middle",
      rot: -16,
      kind: "axis",
    },
    {
      id: "axis-effort",
      text: `← ${C.effort.axis.toUpperCase()}`,
      at: abz(-1.6, EB * 0.5, 0),
      anchor: "middle",
      rot: 14,
      kind: "axis",
    },
    {
      id: "lvl-low",
      text: C.effort.levels[0].toUpperCase(),
      at: abz(-0.5, 0, 0),
      anchor: "end",
      kind: "end",
      dy: 10,
    },
    {
      id: "lvl-high",
      text: C.effort.levels[1].toUpperCase(),
      at: abz(-0.5, EB * 0.5, 0),
      anchor: "end",
      kind: "end",
    },
    {
      id: "lvl-max",
      text: C.effort.levels[2].toUpperCase(),
      at: abz(-0.5, EB, 0),
      anchor: "end",
      kind: "end",
      dy: -10,
    },
    {
      id: "step",
      text: C.step.toUpperCase(),
      at: abz((S(bandT[0], 1).a + S(bandT[1], 1).a) / 2, EB, S(bandT[1], 1).z + 0.6),
      anchor: "middle",
      kind: "end",
      lit: true,
    }
  );
  pts.add(
    abz(EA + 0.6, -1.2, 0),
    abz(-2.4, EB * 0.5, 0),
    abz(EA * 0.7, -2.2, 0),
    abz(0, EB + 0.7, 0),
    abz(EA * 0.3, 0, -1.1),
    abz(EA * 0.5, EB, S(END_T, 1).z + 0.9)
  );

  const frame = frameFor(pts.all, { l: 80, r: 80, t: 28, b: 84 }, view);
  const spec: HoloStageSpec = {
    id: "curve-relief",
    frame,
    view,
    bounds: specBounds(lines, faces),
    lines,
    faces,
    strips,
    dust,
    anchors: [],
    sweep: SWEEP,
  };
  return {
    id: "relief",
    figure: "curve",
    name: "Relief",
    reference: "the wireframe terrain on a stacked slab",
    claim:
      "The frontier is a landscape: a ridge in wire mesh with contours of equal capability, beacons on it for the models, a fault where the step is.",
    spec,
    labels,
  };
}
