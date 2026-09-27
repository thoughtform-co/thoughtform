/**
 * stageGeom — the workshop's four framing beats as WORLD-SPACE DATA.
 *
 * ⚠ THREE-FREE AND PURE. A scene here is a `HoloStageSpec` — polylines, faces,
 * seeded motes and label anchors in the drawing's own `(a, b, z)` units — and
 * `HoloStageScene` is the one component that knows how to paint one. That is
 * the shape ADR-080 arrived at the hard way: its scene is a component per
 * drawing, so the lab and the page drifted into two compositions with every
 * guard green. Four beats cannot afford four of those.
 *
 * ⚠ THE WORLD NUMBERS ARE IMPORTED FROM THE SVG LAYOUTS, NOT RESTATED. The
 * static drawing is the fallback every reader without WebGL gets, and ADR-130
 * U1's law is that the two are ONE drawing. A copied constant is a second
 * place for the record's geometry to be wrong; `stageFit`'s pose is chosen so
 * the projection agrees as well.
 *
 * ⚠ NOTHING IS DRAWN THAT HAS NO NUMBER BEHIND IT. Moira's own rule for this
 * register, and the reason a hologram reads as an instrument rather than as a
 * lava lamp with a legend: a line is here because the record says so, and a
 * composition that would look better balanced is simply unavailable.
 */

import {
  AGENT_LANE,
  GATE,
  FLOOR as HZ_FLOOR,
  OPERATED_LANE,
  RUN,
  along,
  checksAt,
} from "@/components/arcs/framing/horizonLayout";
import { ISO_SEED, mulberry32 } from "@/components/arcs/framing/iso";
import {
  DEPTH as CURVE_DEPTH,
  NOW_A,
  TREADS,
  YEAR_A,
  profile,
  treadZ,
  yearA,
} from "@/components/arcs/framing/curveLayout";
import {
  PLATE,
  PLATE_CUT,
  plateZ,
} from "@/components/arcs/framing/explodedLayout";
import {
  AXIS_TOP,
  FLOOR as STAGE_FLOOR,
  STAGE_PRISMS,
} from "@/components/arcs/framing/stagesLayout";
import type { StageBounds, Vec3 } from "./stageFit";
import { toThree } from "./stageFit";

/* ── The vocabulary ───────────────────────────────────────────────────── */

/**
 * ⚠ THREE ROLES, AND GOLD BUYS ONE THING PER DRAWING (ADR-130 U1). `gold` is
 * the record's one lit object, `green` is the human and nothing else, and
 * every structure on the plate is the dawn/ink ramp at two weights. `machine`
 * is the quiet half of that ramp — the shells and dust the record sits in —
 * and `grid` is the datum.
 */
export type StageRole = "structure" | "machine" | "gold" | "green" | "grid";

export interface StageLine {
  id: string;
  points: readonly Vec3[];
  role: StageRole;
  /** Screen width in `drei/Line` units. The ladder: grid 0.85 · hidden 0.9 ·
   *  tie 1 · edge 1.5 · run 1.9 (ADR-130 U1's five rungs, one rung apart). */
  width: number;
  opacity: number;
  /** Drawn as segments, never `LineDashedMaterial` (which renders nothing
   *  without line distances and cannot be revealed by draw range). */
  dashed?: boolean;
  /** The intro window, in normalised progress. */
  reveal: readonly [number, number];
  /** Additive, and the thing bloom lifts. At most one run per spec. */
  donor?: boolean;
}

export interface StageFace {
  id: string;
  /** Four coplanar corners, in order. */
  quad: readonly [Vec3, Vec3, Vec3, Vec3];
  role: StageRole;
  opacity: number;
  reveal: readonly [number, number];
}

export interface StageDust {
  id: string;
  points: readonly Vec3[];
  opacity: number;
}

export interface StageAnchor {
  id: string;
  /** Where the leader lands, in world. */
  p: Vec3;
  /** A second world point the anchor leans AWAY from, so the label's stand-off
   *  direction survives a turn. ⚠ Without it a leader stops pointing at
   *  anything the moment the reader drags (ADR-080 U3). */
  from: Vec3;
  side: "up" | "dn";
  kind: "field" | "callout" | "person" | "axis";
  /** Lowest goes first when the board is full (Moira's drop rule). */
  priority: number;
}

export interface HoloStageSpec {
  id: string;
  bounds: StageBounds;
  lines: readonly StageLine[];
  faces: readonly StageFace[];
  dust: readonly StageDust[];
  anchors: readonly StageAnchor[];
}

/* ── Primitives ───────────────────────────────────────────────────────── */

const V = (a: number, b: number, z: number): Vec3 => toThree(a, b, z);

export interface Box {
  a: number;
  b: number;
  w: number;
  d: number;
  z: number;
  h: number;
}

/** A ruled datum: `along` runs and `across` runs, as one dashed set. */
export function gridLines(
  id: string,
  f: { a: number; b: number; w: number; d: number; pitch: number },
  z = 0
): StageLine[] {
  const out: StageLine[] = [];
  const nA = Math.round(f.w / f.pitch);
  const nB = Math.round(f.d / f.pitch);
  for (let i = 0; i <= nA; i++) {
    const a = f.a + i * f.pitch;
    out.push({
      id: `${id}-a${i}`,
      points: [V(a, f.b, z), V(a, f.b + f.d, z)],
      role: "grid",
      width: 0.85,
      opacity: 0.08,
      reveal: [0, 0.18],
    });
  }
  for (let j = 0; j <= nB; j++) {
    const b = f.b + j * f.pitch;
    out.push({
      id: `${id}-b${j}`,
      points: [V(f.a, b, z), V(f.a + f.w, b, z)],
      role: "grid",
      width: 0.85,
      opacity: 0.08,
      reveal: [0, 0.18],
    });
  }
  return out;
}

/**
 * A box's twelve edges: the top ring, the bottom ring, the four uprights.
 *
 * ⚠ ALL TWELVE ARE DRAWN. The SVG hides three of them behind a dash because a
 * flat drawing has no other way to say "far side"; in three dimensions the
 * pose does that work, and omitting them would leave a wireframe the reader
 * can turn and find holes in.
 */
export function boxEdges(
  id: string,
  box: Box,
  o: { role: StageRole; width: number; opacity: number; reveal: readonly [number, number] }
): StageLine[] {
  const { a, b, w, d, z, h } = box;
  const ring = (zz: number, tag: string): StageLine => ({
    id: `${id}-${tag}`,
    points: [V(a, b, zz), V(a + w, b, zz), V(a + w, b + d, zz), V(a, b + d, zz), V(a, b, zz)],
    ...o,
  });
  const post = (aa: number, bb: number, tag: string): StageLine => ({
    id: `${id}-${tag}`,
    points: [V(aa, bb, z), V(aa, bb, z + h)],
    ...o,
    width: o.width * 0.92,
  });
  return [
    ring(z, "base"),
    ring(z + h, "top"),
    post(a, b, "p0"),
    post(a + w, b, "p1"),
    post(a + w, b + d, "p2"),
    post(a, b + d, "p3"),
  ];
}

/**
 * The three faces a box shows at this pose: its top, its near side (b) and its
 * far-right side (a + w).
 *
 * ⚠ THREE, NOT SIX. The material is unlit and `depthWrite: false`, so a full
 * cube stacks six translucent quads and the volume reads as a solid slab —
 * which is the opposite of a wireframe machine. These three are the ones the
 * camera can see at rest and through the whole azimuth band.
 */
export function boxFaces(
  id: string,
  box: Box,
  o: { role: StageRole; opacity: number; reveal: readonly [number, number] }
): StageFace[] {
  const { a, b, w, d, z, h } = box;
  return [
    {
      id: `${id}-top`,
      quad: [V(a, b, z + h), V(a + w, b, z + h), V(a + w, b + d, z + h), V(a, b + d, z + h)],
      ...o,
    },
    {
      id: `${id}-near`,
      quad: [V(a, b, z), V(a + w, b, z), V(a + w, b, z + h), V(a, b, z + h)],
      ...o,
      opacity: o.opacity * 0.72,
    },
    {
      id: `${id}-side`,
      quad: [V(a + w, b, z), V(a + w, b + d, z), V(a + w, b + d, z + h), V(a + w, b, z + h)],
      ...o,
      opacity: o.opacity * 0.5,
    },
  ];
}

/** A chamfered plate: the exploded stack's slab, cut TR + BL in WORLD. */
export function platePolygon(a: number, b: number, w: number, d: number, z: number, cut: number) {
  return [
    V(a + cut, b, z),
    V(a + w, b, z),
    V(a + w, b + d - cut, z),
    V(a + w - cut, b + d, z),
    V(a, b + d, z),
    V(a, b + cut, z),
    V(a + cut, b, z),
  ] as const;
}

/** A diamond in the rail's own horizontal plane — the house mark, never a
 *  circle (the register's rule, and here it also carries meaning). */
export function diamond(a: number, b: number, z: number, r: number): Vec3[] {
  return [V(a - r, b, z), V(a, b, z + r), V(a + r, b, z), V(a, b, z - r), V(a - r, b, z)];
}

/** Seeded motes inside a volume. ⚠ `mulberry32` and `ISO_SEED`, the SVG's own
 *  seed law, so the fallback's dust and the hologram's are one cloud. */
export function motes(seed: number, count: number, box: Box): Vec3[] {
  const rnd = mulberry32(seed);
  const out: Vec3[] = [];
  for (let i = 0; i < count; i++) {
    out.push(
      V(box.a + rnd() * box.w, box.b + rnd() * box.d, box.z + rnd() * Math.max(0.001, box.h))
    );
  }
  return out;
}

/**
 * The bounding box of every point a spec draws — AND every anchor it hangs a
 * label from.
 *
 * ⚠ THE ANCHORS ARE IN THE BOX. The lens is solved from these bounds, so an
 * anchor outside them is a leader whose origin the fit never promised to keep
 * on screen. Three of them were: the two axis ends on the stages' floor sit
 * outboard of its own graticule, and the agent lane's name was moved a unit
 * forward in depth to separate it from the person standing at the same vertex.
 * Nothing failed — the labels simply drifted toward the canvas edge at the
 * narrow shapes, which is the class of defect ADR-070 keeps finding: a guard
 * measuring a MODEL of the drawing rather than the drawing.
 */
export function specBounds(
  lines: readonly StageLine[],
  faces: readonly StageFace[] = [],
  anchors: readonly StageAnchor[] = []
): StageBounds {
  let lo: Vec3 = [Infinity, Infinity, Infinity];
  let hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  const eat = (p: Vec3) => {
    lo = [Math.min(lo[0], p[0]), Math.min(lo[1], p[1]), Math.min(lo[2], p[2])];
    hi = [Math.max(hi[0], p[0]), Math.max(hi[1], p[1]), Math.max(hi[2], p[2])];
  };
  for (const l of lines) for (const p of l.points) eat(p);
  for (const f of faces) for (const p of f.quad) eat(p);
  for (const a of anchors) eat(a.p);
  return { min: lo, max: hi };
}

const EDGE = { width: 1.5, opacity: 0.9 } as const;
const GOLD_EDGE = { width: 1.9, opacity: 1 } as const;

/* ── 02 · drie-manieren: three housings on the floor ──────────────────── */

export interface StagesData {
  stages: readonly { id: string; lit?: boolean }[];
}

export function stagesSpec(data: StagesData): HoloStageSpec {
  const lines: StageLine[] = [...gridLines("grid", STAGE_FLOOR)];
  const faces: StageFace[] = [];
  const dust: StageDust[] = [];
  const anchors: StageAnchor[] = [];

  /* The two axes, on the datum's own near edge and its origin. */
  lines.push({
    id: "axis-time",
    points: [V(STAGE_FLOOR.a, STAGE_FLOOR.b, 0), V(STAGE_FLOOR.a + STAGE_FLOOR.w, STAGE_FLOOR.b, 0)],
    role: "structure",
    width: 1.1,
    opacity: 0.5,
    reveal: [0.02, 0.22],
  });
  lines.push({
    id: "axis-work",
    points: [V(STAGE_FLOOR.a, STAGE_FLOOR.b, 0), V(STAGE_FLOOR.a, STAGE_FLOOR.b, AXIS_TOP)],
    role: "structure",
    width: 1.1,
    opacity: 0.5,
    reveal: [0.04, 0.24],
  });
  /* The time rail's graduation — the reference boards' tick ring, run flat. */
  for (let i = 1; i <= Math.round(STAGE_FLOOR.w); i++) {
    const major = i % 4 === 0;
    lines.push({
      id: `tick-${i}`,
      points: [V(i, STAGE_FLOOR.b, 0), V(i, STAGE_FLOOR.b - (major ? 0.26 : 0.14), 0)],
      role: "structure",
      width: 0.9,
      opacity: major ? 0.46 : 0.26,
      reveal: [0.06, 0.26],
    });
  }

  data.stages.forEach((s, i) => {
    const prism = STAGE_PRISMS[i];
    if (!prism) return;
    const box: Box = { ...prism };
    const lit = s.lit === true;
    const t0 = 0.2 + i * 0.12;
    const reveal: readonly [number, number] = [t0, t0 + 0.26];
    lines.push(
      ...boxEdges(`prism-${s.id}`, box, {
        role: lit ? "gold" : "structure",
        ...(lit ? GOLD_EDGE : EDGE),
        reveal,
      })
    );
    faces.push(
      ...boxFaces(`prism-${s.id}`, box, {
        role: lit ? "gold" : "machine",
        opacity: lit ? 0.09 : 0.05,
        reveal: [t0 + 0.06, t0 + 0.3],
      })
    );
    /* ⚠ DENSITY IS PER UNIT VOLUME (ADR-070 U24's finding, in three
       dimensions). A fixed count per prism makes the SMALLEST volume read as
       the densest material — the encoded quantity a third time, backwards. */
    const vol = box.w * box.d * box.h;
    dust.push({
      id: `dust-${s.id}`,
      points: motes(ISO_SEED + i * 977, Math.round(vol * 26), box),
      opacity: lit ? 0.5 : 0.32,
    });
    /* The lit prism's top rim is the one bloom donor. */
    if (lit) {
      lines.push({
        id: `crest-${s.id}`,
        points: [
          V(box.a, box.b, box.z + box.h),
          V(box.a + box.w, box.b, box.z + box.h),
          V(box.a + box.w, box.b + box.d, box.z + box.h),
        ],
        role: "gold",
        width: 2.6,
        opacity: 0.95,
        reveal: [t0 + 0.12, t0 + 0.38],
        donor: true,
      });
    }
    /* ⚠ THE TAG LEANS OFF THE TOP FACE'S FAR EDGE, NOT ITS CENTRE. Anchored
       at the centre with the lean straight down, the stand-off pushed the
       block up the screen and — because a prism here is as tall as the label
       is far — it landed ON the volume it names, which is the one thing this
       register forbids. From the far edge the lean is up AND right, off the
       object entirely. */
    anchors.push({
      id: s.id,
      p: V(box.a + box.w / 2, box.b + box.d, box.z + box.h),
      from: V(box.a + box.w / 2, box.b, box.z),
      side: "up",
      kind: "field",
      priority: 0,
    });
  });

  anchors.push(
    {
      id: "near",
      p: V(STAGE_FLOOR.a + 0.2, STAGE_FLOOR.b - 0.3, 0),
      from: V(STAGE_FLOOR.a + 2, STAGE_FLOOR.b, 0),
      side: "dn",
      kind: "axis",
      priority: 3,
    },
    {
      /* ⚠ ON THE RAIL'S END, NOT INSIDE IT. At w − 0.2 this sat over the
         agent's prism, which runs to 11.6 of the floor's 12. */
      id: "far",
      p: V(STAGE_FLOOR.a + STAGE_FLOOR.w, STAGE_FLOOR.b - 0.5, 0),
      from: V(STAGE_FLOOR.a + STAGE_FLOOR.w - 2, STAGE_FLOOR.b, 0),
      side: "dn",
      kind: "axis",
      priority: 3,
    },
    {
      id: "top",
      p: V(STAGE_FLOOR.a, STAGE_FLOOR.b, AXIS_TOP),
      from: V(STAGE_FLOOR.a, STAGE_FLOOR.b, AXIS_TOP - 1.4),
      side: "up",
      kind: "axis",
      priority: 2,
    }
  );

  return { id: "stages", bounds: specBounds(lines, faces, anchors), lines, faces, dust, anchors };
}

/* ── 03 · de-curve: the doubling, as terrain ──────────────────────────── */

export interface CurveData {
  years: readonly string[];
  reference: { tread: number };
}

/** ⚠ NINE PROFILES ACROSS THE DEPTH, and the contrast law does the rest: the
 *  front one is the record at full ink, the ones behind run at a third and
 *  fall away. That is what turns a step ladder into a relief without inventing
 *  a second quantity — every profile is the SAME curve. */
const CURVE_RIBS = 9;

export function curveSpec(data: CurveData): HoloStageSpec {
  const steps = profile();
  const lines: StageLine[] = [];
  const faces: StageFace[] = [];
  const anchors: StageAnchor[] = [];
  const span = (data.years.length - 1) * YEAR_A;
  const wide = Math.max(span, NOW_A);

  lines.push(
    ...gridLines("grid", { a: 0, b: 0, w: Math.ceil(wide), d: Math.ceil(CURVE_DEPTH * 3), pitch: 1 })
  );

  /** The stepped crest at depth `b`. */
  const crestAt = (b: number): Vec3[] => {
    const pts: Vec3[] = [];
    steps.forEach((s, k) => {
      if (k > 0) pts.push(V(s.a, b, steps[k - 1].z));
      pts.push(V(s.a, b, s.z));
    });
    pts.push(V(NOW_A, b, steps[steps.length - 1].z));
    return pts;
  };

  for (let i = 0; i < CURVE_RIBS; i++) {
    const b = (i / (CURVE_RIBS - 1)) * (CURVE_DEPTH * 3);
    const front = i === 0;
    lines.push({
      id: `rib-${i}`,
      points: crestAt(b),
      role: front ? "structure" : "machine",
      width: front ? 1.9 : 0.95,
      /* ⚠ DECORATIVE RUNS AT A THIRD OF STRUCTURAL (Moira's contrast law).
         At equal weight nine profiles read as hatching, not as a ridge. */
      opacity: front ? 0.92 : 0.3 - i * 0.025,
      reveal: front ? [0.1, 0.62] : [0.12 + i * 0.02, 0.5 + i * 0.03],
    });
  }
  /* The risers joined across the depth, so the steps read as one landform. */
  steps.forEach((s, k) => {
    if (k === 0) return;
    lines.push({
      id: `riser-${k}`,
      points: [V(s.a, 0, s.z), V(s.a, CURVE_DEPTH * 3, s.z)],
      role: "machine",
      width: 0.95,
      opacity: 0.3,
      reveal: [0.2 + k * 0.03, 0.5 + k * 0.03],
    });
  });

  /* The year posts, on the near foot. */
  data.years.forEach((_, i) => {
    const a = yearA(i);
    lines.push({
      id: `post-${i}`,
      points: [V(a, 0, 0), V(a, 0, 0.36)],
      role: "structure",
      width: 1,
      opacity: 0.42,
      dashed: true,
      reveal: [0.04, 0.24],
    });
    anchors.push({
      id: `year-${i}`,
      p: V(a, 0, 0),
      from: V(a, 0, 0.6),
      side: "dn",
      kind: "axis",
      priority: 4,
    });
  });

  /* The reference plane: the length of work this room hands over. */
  const rz = treadZ(data.reference.tread);
  lines.push({
    id: "reference",
    points: [V(0, 0, rz), V(wide, 0, rz), V(wide, CURVE_DEPTH * 3, rz), V(0, CURVE_DEPTH * 3, rz)],
    role: "structure",
    width: 1,
    opacity: 0.4,
    dashed: true,
    reveal: [0.55, 0.78],
  });
  anchors.push({
    id: "reference",
    p: V(wide, CURVE_DEPTH * 1.5, rz),
    from: V(wide * 0.5, CURVE_DEPTH * 1.5, rz),
    side: "up",
    kind: "callout",
    priority: 1,
  });

  /* NOW — the one gold object, and the only bloom donor. */
  const topZ = steps[steps.length - 1].z;
  lines.push({
    id: "now",
    points: [V(NOW_A, 0, topZ), V(NOW_A, CURVE_DEPTH * 3, topZ)],
    role: "gold",
    width: 2.6,
    opacity: 1,
    reveal: [0.66, 0.9],
    donor: true,
  });
  lines.push({
    id: "now-post",
    points: [V(NOW_A, 0, 0), V(NOW_A, 0, topZ)],
    role: "gold",
    width: 1.3,
    opacity: 0.55,
    reveal: [0.68, 0.92],
  });
  anchors.push({
    id: "now",
    p: V(NOW_A, 0, topZ),
    from: V(NOW_A - 1.2, 0, topZ),
    side: "up",
    kind: "field",
    priority: 0,
  });
  anchors.push({
    id: "axis-y",
    p: V(0, 0, topZ),
    from: V(1.4, 0, topZ),
    side: "up",
    kind: "axis",
    priority: 2,
  });

  /* Treads letter every second step (the SVG's own `LETTERED_TREADS`). */
  for (const k of [0, 2, 4, 6]) {
    if (k >= TREADS) continue;
    anchors.push({
      id: `tread-${k}`,
      p: V(0, 0, treadZ(k)),
      from: V(1.2, 0, treadZ(k)),
      side: "dn",
      kind: "callout",
      priority: 3,
    });
  }

  const bounds = specBounds(lines, faces, anchors);
  const dust: StageDust[] = [
    {
      id: "dust",
      points: motes(ISO_SEED + 401, 260, {
        a: 0,
        b: 0,
        w: wide,
        d: CURVE_DEPTH * 3,
        z: 0,
        h: topZ + 0.4,
      }),
      opacity: 0.3,
    },
  ];
  return { id: "curve", bounds, lines, faces, dust, anchors };
}

/* ── 05 · de-horizon: two rails and the gates ─────────────────────────── */

export interface HorizonData {
  operated: { steps: number };
  agent: { gates: readonly { kind: string; at: number }[] };
}

export function horizonSpec(data: HorizonData): HoloStageSpec {
  const lines: StageLine[] = [...gridLines("grid", HZ_FLOOR)];
  const faces: StageFace[] = [];
  const anchors: StageAnchor[] = [];

  /* The operated lane: far and above, one short run per step, each on a pylon
     down to the datum — eight repetitions, which is the reading. */
  const checks = checksAt(data.operated.steps);
  let prev: number = RUN.a0;
  checks.forEach((a, i) => {
    lines.push({
      id: `op-run-${i}`,
      points: [V(prev, OPERATED_LANE.b, OPERATED_LANE.z), V(a - 0.1, OPERATED_LANE.b, OPERATED_LANE.z)],
      role: "structure",
      width: 1.3,
      opacity: 0.6,
      reveal: [0.14 + i * 0.03, 0.4 + i * 0.03],
    });
    lines.push({
      id: `op-pylon-${i}`,
      points: [V(a, OPERATED_LANE.b, 0), V(a, OPERATED_LANE.b, OPERATED_LANE.z)],
      role: "machine",
      width: 0.9,
      opacity: 0.22,
      dashed: true,
      reveal: [0.16 + i * 0.03, 0.42 + i * 0.03],
    });
    /* ⚠ THE EIGHT HAND-OFFS ARE DRAWN, NOT ONLY LABELLED. Only the last one
       letters (a repeated plaque is the map city's defect in a new place), so
       without a mark per check the far lane reads as one dashed line and the
       repetition — which IS the argument of this lane — is simply not there. */
    lines.push({
      id: `op-mark-${i}`,
      points: diamond(a, OPERATED_LANE.b, OPERATED_LANE.z, 0.07),
      role: "structure",
      width: 1.4,
      opacity: 0.85,
      reveal: [0.18 + i * 0.03, 0.44 + i * 0.03],
    });
    anchors.push({
      id: `check-${i}`,
      p: V(a, OPERATED_LANE.b, OPERATED_LANE.z),
      from: V(a, OPERATED_LANE.b, OPERATED_LANE.z - 0.5),
      side: "up",
      kind: "person",
      priority: 6,
    });
    prev = a;
  });
  anchors.push({
    id: "operated",
    p: V(RUN.a0, OPERATED_LANE.b, OPERATED_LANE.z),
    from: V(RUN.a0 + 1.4, OPERATED_LANE.b, OPERATED_LANE.z),
    side: "up",
    kind: "field",
    priority: 0,
  });

  /* The agent's lane: near, on the plane, gold — one long run, the donor. */
  lines.push({
    id: "agent-run",
    points: [V(RUN.a0, AGENT_LANE.b, AGENT_LANE.z), V(RUN.a1, AGENT_LANE.b, AGENT_LANE.z)],
    role: "gold",
    width: 2.6,
    opacity: 1,
    reveal: [0.2, 0.72],
    donor: true,
  });
  anchors.push(
    /* ⚠ THE LANE'S NAME AND THE PERSON AT ITS START ARE DIFFERENT POINTS.
       Both were the rail's first vertex, so they projected to one pixel and
       the declutter had nothing to separate — measured as a real collision at
       1920×1080 and 1920×1247, with `Jij zet het doel en de checks` printing
       through `Een agent op een lange taak`. The name steps forward in DEPTH,
       which at this pose is a move down and left on screen. */
    {
      id: "agent",
      p: V(RUN.a0, AGENT_LANE.b - 0.7, AGENT_LANE.z),
      from: V(RUN.a0 + 1.4, AGENT_LANE.b - 0.7, AGENT_LANE.z),
      side: "dn",
      kind: "field",
      priority: 0,
    },
    {
      id: "start",
      p: V(RUN.a0, AGENT_LANE.b, AGENT_LANE.z),
      from: V(RUN.a0, AGENT_LANE.b, AGENT_LANE.z + 0.6),
      side: "dn",
      kind: "person",
      priority: 1,
    },
    {
      id: "end",
      p: V(RUN.a1, AGENT_LANE.b, AGENT_LANE.z),
      from: V(RUN.a1, AGENT_LANE.b, AGENT_LANE.z + 0.6),
      side: "dn",
      kind: "person",
      priority: 1,
    }
  );

  /* Three gate frames STANDING on the floor, in the depth-height plane, with
     dashed drops so they read as standing rather than floating. */
  data.agent.gates.forEach((g, i) => {
    const a = along(g.at);
    const b0 = AGENT_LANE.b - GATE.d / 2 + GATE.b;
    const b1 = b0 + GATE.d;
    const z0 = AGENT_LANE.z - GATE.z;
    const z1 = z0 + GATE.h;
    lines.push({
      id: `gate-${g.kind}`,
      points: [V(a, b0, z0), V(a, b0, z1), V(a, b1, z1), V(a, b1, z0), V(a, b0, z0)],
      role: "structure",
      width: 1.4,
      opacity: 0.72,
      reveal: [0.34 + i * 0.08, 0.58 + i * 0.08],
    });
    lines.push({
      id: `gate-drop-${g.kind}`,
      points: [V(a, b0, z0), V(a, b0, 0)],
      role: "machine",
      width: 0.9,
      opacity: 0.24,
      dashed: true,
      reveal: [0.36 + i * 0.08, 0.6 + i * 0.08],
    });
    lines.push({
      id: `gate-drop2-${g.kind}`,
      points: [V(a, b1, z0), V(a, b1, 0)],
      role: "machine",
      width: 0.9,
      opacity: 0.24,
      dashed: true,
      reveal: [0.36 + i * 0.08, 0.6 + i * 0.08],
    });
    faces.push({
      id: `gate-face-${g.kind}`,
      quad: [V(a, b0, z0), V(a, b1, z0), V(a, b1, z1), V(a, b0, z1)],
      role: "machine",
      opacity: 0.05,
      reveal: [0.38 + i * 0.08, 0.62 + i * 0.08],
    });
    anchors.push({
      id: g.kind,
      p: V(a, b0, z1),
      from: V(a, b0, z0),
      side: "up",
      kind: "callout",
      priority: 2,
    });
    /* The retry's loop: back through the gate, IN THE PLANE of the rail. */
    if (g.kind === "retry") {
      const back = along(Math.max(0, g.at - 0.14));
      /* ⚠ THE LOOP RISES, IT DOES NOT SWING SIDEWAYS. Run in the rail's own
         horizontal plane it sat inside the gate's face and was invisible at
         every pose in the azimuth band; lifted, it reads as the step back it
         is and clears the frame it returns through. */
      lines.push({
        id: "retry-loop",
        points: [
          V(a, AGENT_LANE.b, AGENT_LANE.z),
          V(a, AGENT_LANE.b, AGENT_LANE.z + 0.38),
          V(back, AGENT_LANE.b, AGENT_LANE.z + 0.38),
          V(back, AGENT_LANE.b, AGENT_LANE.z),
        ],
        role: "gold",
        width: 1.4,
        opacity: 0.7,
        reveal: [0.6, 0.82],
      });
    }
  });

  anchors.push(
    {
      id: "from",
      p: V(RUN.a0, HZ_FLOOR.b, 0),
      from: V(RUN.a0 + 1.4, HZ_FLOOR.b, 0),
      side: "dn",
      kind: "axis",
      priority: 5,
    },
    {
      id: "to",
      p: V(RUN.a1, HZ_FLOOR.b, 0),
      from: V(RUN.a1 - 1.4, HZ_FLOOR.b, 0),
      side: "dn",
      kind: "axis",
      priority: 5,
    }
  );

  const dust: StageDust[] = [
    {
      id: "dust",
      points: motes(ISO_SEED + 911, 300, {
        a: HZ_FLOOR.a,
        b: HZ_FLOOR.b,
        w: HZ_FLOOR.w,
        d: HZ_FLOOR.d,
        z: 0,
        h: OPERATED_LANE.z + 0.6,
      }),
      opacity: 0.28,
    },
  ];
  return { id: "horizon", bounds: specBounds(lines, faces, anchors), lines, faces, dust, anchors };
}

/* ── 01 · vandaag: the template, exploded ─────────────────────────────── */

export interface ExplodedData {
  layers: readonly { id: string; dashed?: boolean }[];
}

export function explodedSpec(data: ExplodedData): HoloStageSpec {
  const lines: StageLine[] = [];
  const faces: StageFace[] = [];
  const anchors: StageAnchor[] = [];
  const n = data.layers.length;

  lines.push(
    ...gridLines("grid", {
      a: PLATE.a - 0.3,
      b: PLATE.b - 0.3,
      w: PLATE.w + 0.6,
      d: PLATE.d + 0.6,
      pitch: 0.36,
    })
  );

  /* ⚠ BASE FIRST. The record lists the stack top down, as a layer tree reads;
     the drawing builds it bottom up, as the file is composed — and the base
     plate is the one gold object, the thing the setup actually draws. */
  const order = [...data.layers].reverse();
  order.forEach((layer, i) => {
    const z = plateZ(i);
    const base = i === 0;
    const t0 = 0.12 + i * 0.13;
    const reveal: readonly [number, number] = [t0, t0 + 0.3];
    const poly = platePolygon(PLATE.a, PLATE.b, PLATE.w, PLATE.d, z, PLATE_CUT);
    lines.push({
      id: `plate-${layer.id}`,
      points: poly,
      role: base ? "gold" : "structure",
      width: base ? 2.1 : 1.5,
      opacity: base ? 1 : 0.88,
      /* ⚠ A GUIDE IS DASHED AND STAYS DASHED. The free zone is where nothing
         may stand; drawn solid it reads as another layer of ink. */
      dashed: layer.dashed === true,
      reveal,
      donor: base,
    });
    /* The slab's thickness: four short uprights at the plate's corners. */
    if (!layer.dashed) {
      for (const [ca, cb, tag] of [
        [PLATE.a + PLATE_CUT, PLATE.b, "c0"],
        [PLATE.a + PLATE.w, PLATE.b, "c1"],
        [PLATE.a + PLATE.w, PLATE.b + PLATE.d - PLATE_CUT, "c2"],
        [PLATE.a, PLATE.b + PLATE.d, "c3"],
      ] as const) {
        lines.push({
          id: `plate-${layer.id}-${tag}`,
          points: [V(ca, cb, z), V(ca, cb, z - PLATE.t)],
          role: base ? "gold" : "structure",
          width: 1,
          opacity: base ? 0.7 : 0.5,
          reveal,
        });
      }
    }
    faces.push({
      id: `face-${layer.id}`,
      quad: [
        V(PLATE.a, PLATE.b, z),
        V(PLATE.a + PLATE.w, PLATE.b, z),
        V(PLATE.a + PLATE.w, PLATE.b + PLATE.d, z),
        V(PLATE.a, PLATE.b + PLATE.d, z),
      ],
      role: base ? "gold" : "machine",
      opacity: base ? 0.1 : layer.dashed ? 0.03 : 0.055,
      reveal: [t0 + 0.06, t0 + 0.32],
    });
    anchors.push({
      id: layer.id,
      p: V(PLATE.a + PLATE.w, PLATE.b + PLATE.d / 2, z),
      from: V(PLATE.a, PLATE.b + PLATE.d / 2, z),
      side: "up",
      kind: "field",
      priority: i,
    });
  });

  /* The four ties the stack is exploded along. */
  const top = plateZ(n - 1);
  for (const [ca, cb, tag] of [
    [PLATE.a, PLATE.b, "t0"],
    [PLATE.a + PLATE.w, PLATE.b, "t1"],
    [PLATE.a + PLATE.w, PLATE.b + PLATE.d, "t2"],
    [PLATE.a, PLATE.b + PLATE.d, "t3"],
  ] as const) {
    lines.push({
      id: `tie-${tag}`,
      points: [V(ca, cb, 0), V(ca, cb, top + 0.3)],
      role: "machine",
      width: 0.9,
      opacity: 0.22,
      dashed: true,
      reveal: [0.04, 0.3],
    });
  }

  const dust: StageDust[] = [
    {
      id: "dust",
      points: motes(ISO_SEED + 223, 220, {
        a: PLATE.a,
        b: PLATE.b,
        w: PLATE.w,
        d: PLATE.d,
        z: 0,
        h: top + 0.3,
      }),
      opacity: 0.3,
    },
  ];
  return { id: "exploded", bounds: specBounds(lines, faces, anchors), lines, faces, dust, anchors };
}
