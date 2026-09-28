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

import { ISO_SEED, mulberry32, type IsoFrame } from "@/components/arcs/framing/iso";
import { GRID_PITCH } from "@/components/arcs/framing/floor";
import {
  FLOOR as STAGE_FLOOR,
  STAGES_FRAME,
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
  /**
   * Which face of a block it is. ⚠ THE FACES ARE OPAQUE AND SHADED (ADR-130
   * U4): the fallback's own top-lightest shading, mixed off the ground, so a
   * nearer block covers a farther one and no hidden edge prints through —
   * the first live shoot's translucent faces read as X-ray, not as a stage.
   */
  shade?: "top" | "left" | "right";
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
  /**
   * ⚠ THE CANVAS FRAMES EXACTLY THIS CROP (ADR-130 U4): the SVG fallback's
   * own frame, so the hologram and the drawing are one picture and the DOM
   * words seated over the drawing land on the hologram too.
   */
  frame: IsoFrame;
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
 * The three faces a box shows at this pose: its top, its front-right side (the
 * face at `b`) and its front-left side (the face at `a`).
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
      shade: "top",
    },
    {
      id: `${id}-near`,
      quad: [V(a, b, z), V(a + w, b, z), V(a + w, b, z + h), V(a, b, z + h)],
      ...o,
      shade: "right",
    },
    {
      id: `${id}-side`,
      quad: [V(a, b, z), V(a, b + d, z), V(a, b + d, z + h), V(a, b, z + h)],
      ...o,
      shade: "left",
    },
  ];
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

const EDGE = { width: 1.4, opacity: 0.85 } as const;
const GOLD_EDGE = { width: 1.9, opacity: 1 } as const;

/** The floor's two front edges — the drawing's axes — a rung above the grid. */
function frontEdges(w: number, d: number, withB: boolean): StageLine[] {
  const out: StageLine[] = [
    {
      id: "axis-a",
      points: [V(0, 0, 0), V(w, 0, 0)],
      role: "structure",
      width: 1.1,
      opacity: 0.5,
      reveal: [0.02, 0.22],
    },
  ];
  if (withB)
    out.push({
      id: "axis-b",
      points: [V(0, 0, 0), V(0, d, 0)],
      role: "structure",
      width: 1.1,
      opacity: 0.5,
      reveal: [0.04, 0.24],
    });
  return out;
}

/* ── 02 · drie-manieren: three blocks on the stage ────────────────────── */

export interface StagesData {
  stages: readonly { id: string; lit?: boolean }[];
}

export function stagesSpec(data: StagesData): HoloStageSpec {
  const lines: StageLine[] = [
    ...gridLines("grid", { a: 0, b: 0, w: STAGE_FLOOR.w, d: STAGE_FLOOR.d, pitch: GRID_PITCH }),
    ...frontEdges(STAGE_FLOOR.w, STAGE_FLOOR.d, true),
  ];
  const faces: StageFace[] = [];
  const dust: StageDust[] = [];

  data.stages.forEach((s, i) => {
    const prism = STAGE_PRISMS[i];
    if (!prism) return;
    const box: Box = { ...prism };
    const lit = s.lit === true;
    /* The build-up, in the order the argument makes it: prompt, tool, agent. */
    const t0 = 0.18 + i * 0.16;
    lines.push(
      ...boxEdges(`prism-${s.id}`, box, {
        role: lit ? "gold" : "structure",
        ...(lit ? GOLD_EDGE : EDGE),
        reveal: [t0, t0 + 0.24],
      })
    );
    faces.push(
      ...boxFaces(`prism-${s.id}`, box, {
        role: lit ? "gold" : "machine",
        opacity: lit ? 0.12 : 0.06,
        reveal: [t0 + 0.06, t0 + 0.3],
      })
    );
    /* The lit block's top rim is the one bloom donor. */
    if (lit) {
      lines.push({
        id: `crest-${s.id}`,
        points: [
          V(box.a, box.b + box.d, box.z + box.h),
          V(box.a, box.b, box.z + box.h),
          V(box.a + box.w, box.b, box.z + box.h),
        ],
        role: "gold",
        width: 2.6,
        opacity: 0.95,
        reveal: [t0 + 0.14, t0 + 0.4],
        donor: true,
      });
    }
  });

  /* The motes hang over the floor, not inside the blocks: the blocks are
     solid now, and dust inside a solid is dust nobody sees. */
  dust.push({
    id: "dust",
    points: motes(ISO_SEED + 977, 260, {
      a: 0,
      b: 0,
      w: STAGE_FLOOR.w,
      d: STAGE_FLOOR.d,
      z: 0,
      h: 2.6,
    }),
    opacity: 0.3,
  });

  return {
    id: "stages",
    frame: STAGES_FRAME,
    bounds: specBounds(lines, faces),
    lines,
    faces,
    dust,
    anchors: [],
  };
}
