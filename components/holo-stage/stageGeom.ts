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
import type { StageBounds, StageView, Vec3 } from "./stageFit";
import type { StageParticleSpec } from "./stageParticles";
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
  /**
   * The intro window, in normalised progress — of the INTRO, or of the line's
   * `group` when it has one (ADR-140: the curve's effort surface draws on when
   * its button is pressed, on the group's own clock).
   */
  reveal: readonly [number, number];
  /** Additive, and the thing bloom lifts. At most one run per spec. */
  donor?: boolean;
  /**
   * A reveal group (ADR-140). Ungrouped lines ride the intro and the sweep;
   * a grouped line rides its group's progress, which the canvas is handed as
   * `groups` and eases toward. At most four groups per spec (a `vec4`).
   */
  group?: string;
  /**
   * Drawn through the GPU segment batch (ADR-140) — one draw call for every
   * batched line in the spec, swept and drawn on in the shader. The dense
   * structure (graticule, isolines, risers, rings) goes here; the few lit
   * donor runs keep drei's fat `Line`, whose draw-range reveal and bloom
   * lift already work. A width here is CSS px, as drei's is.
   */
  batch?: boolean;
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
  group?: string;
}

/**
 * A ribbon between two rails of equal length — a sheet of the curve's effort
 * surface, or the wall under its front edge — drawn as ONE triangle strip
 * (ADR-140). Forty quads as forty faces would be forty draw calls.
 */
export interface StageStrip {
  id: string;
  left: readonly Vec3[];
  right: readonly Vec3[];
  role: StageRole;
  opacity: number;
  reveal: readonly [number, number];
  group?: string;
}

export interface StageDust {
  id: string;
  points: readonly Vec3[];
  opacity: number;
  /** The motes' colour. `machine` (the quiet half of the ramp) unless said. */
  role?: StageRole;
  group?: string;
  /**
   * Per mote, 0..1: how far it is a CLOUD rather than a LATTICE (ADR-140, the
   * spectrum's one argument — software is deterministic, intelligence is
   * probabilistic). 0 = a square mote frozen on its home; 1 = a soft mote
   * drifting around it. Absent = every mote a cloud mote at rest.
   */
  order?: readonly number[];
  /** CSS px of a mote at order 0; the dust shader jitters it per mote. */
  size?: number;
  /** How far a cloud mote drifts off its home, in world units. 0 = still. */
  drift?: number;
  /**
   * A multiplier on the palette's `dustScale` IN LIGHT ONLY. The stage's
   * atmosphere wants a fraction of its alpha as dark motes on paper
   * (`HOLO_LIGHT.dustScale`); a field that IS the drawing — the spectrum's
   * lattice and cloud — needs its ink back. 1 unless said.
   */
  inkScale?: number;
}

/**
 * The arrival SWEEP (ADR-140): a gold hairline front that crosses the object
 * once along one world axis and reveals the batched structure and the dust
 * behind it — the Tokyo-3 scanning line, ADR-097 U12's centre-out aperture
 * in three dimensions. No fade: what is behind the front is drawn, what is
 * ahead of it is not. `axis` indexes the THREE vector (`toThree`: 0 = `a`,
 * 1 = `z`, 2 = `−b`; flat: 0 = `x`, 1 = `−y`).
 */
export interface StageSweep {
  axis: 0 | 1 | 2;
  from: number;
  to: number;
  /** The intro window the front spends crossing `from → to`. */
  window: readonly [number, number];
  /** The glow band's half-width around the front, in world units. */
  width: number;
}

/** Where the front is at intro progress `p`. */
export function sweepAt(s: StageSweep, p: number): number {
  const [t0, t1] = s.window;
  const k = t1 <= t0 ? 1 : Math.min(1, Math.max(0, (p - t0) / (t1 - t0)));
  return s.from + (s.to - s.from) * k;
}

/**
 * The intro progress at which the front passes a coordinate — what a face
 * or a donor run that should arrive AFTER the sweep sets its reveal from.
 */
export function sweepReaches(s: StageSweep, coord: number): number {
  const [t0, t1] = s.window;
  const span = s.to - s.from;
  const k = span === 0 ? 1 : Math.min(1, Math.max(0, (coord - s.from) / span));
  return t0 + (t1 - t0) * k;
}

/**
 * An ATMOSPHERE (ADR-140, round four): the Arc sphere's own Fresnel shell
 * around a globe — bright at the silhouette, clear at the centre — drawn
 * additive on dark and NOT AT ALL on paper (additive cannot ink). The
 * reference's "soft halo rather than a thin ring": `uPower` 2.5.
 */
export interface StageShell {
  id: string;
  /** The centre, in three-space. */
  c: Vec3;
  r: number;
  role: StageRole;
  opacity: number;
  reveal: readonly [number, number];
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
  /** Ribbons (ADR-140). Absent = none. */
  strips?: readonly StageStrip[];
  /** Atmosphere shells around a globe (ADR-140, round four). Absent = none. */
  shells?: readonly StageShell[];
  /** The camera (ADR-140). Absent = the stage's parallel view. */
  view?: StageView;
  /** The arrival sweep (ADR-140). Absent = draw-on alone, as before. */
  sweep?: StageSweep;
  /**
   * The reveal groups this spec names, in `uGroups` order (≤ 4). A line,
   * face, strip or dust set naming a group not listed here is a defect the
   * geometry guard fails.
   */
  groups?: readonly string[];
  /**
   * The figure's MATERIAL (ADR-140, round three): populations of particles
   * that assemble on arrival through the corridor core's own simulation.
   * Lines, faces and strips stay for the few crisp edges a slab needs.
   */
  particles?: StageParticleSpec;
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
  /**
   * How the lit block is drawn (ADR-140): `cloud` — a translucent gold volume
   * filled with a seeded point cloud — or `solid`, U4's opaque shaded gold
   * faces. The page draws `cloud`; the lab offers both for the owner's read.
   */
  agent?: "cloud" | "solid";
}

/** The arrival (ADR-140): one front along the time edge, front corner to the far tip. */
export const STAGES_SWEEP: StageSweep = {
  axis: 0,
  from: -0.3,
  to: STAGE_FLOOR.w + 0.3,
  window: [0.04, 0.62],
  width: 0.3,
};

/** The time ruler on the floor's front-right edge: a tick every unit, a longer one on the grid. */
function timeRuler(): StageLine[] {
  const out: StageLine[] = [];
  for (let a = 0; a <= STAGE_FLOOR.w; a++) {
    const major = a % GRID_PITCH === 0;
    out.push({
      id: `tick-${a}`,
      points: [V(a, 0, 0), V(a, -(major ? 0.26 : 0.14), 0)],
      role: "structure",
      width: 1,
      opacity: major ? 0.55 : 0.32,
      reveal: [sweepReaches(STAGES_SWEEP, a) - 0.01, sweepReaches(STAGES_SWEEP, a) + 0.04],
      batch: true,
    });
  }
  return out;
}

/**
 * The three stages as WIRE VOLUMES (ADR-140, on U4's floor and pose). The
 * sweep crosses the floor once along time; each block's twelve edges draw on
 * as the front reaches it and its faces resolve just behind the wire — the
 * wire is the hologram, the face is the solid it becomes. The two dark
 * blocks keep U4's OPAQUE shaded faces (translucent ones read as X-ray). The
 * agent's block — the drawing's one gold object, standing at the back with
 * nothing behind it — is a TRANSLUCENT gold volume FILLED with a seeded point
 * cloud, per unit of volume: a thing that runs on its own, drawn as what it
 * is made of. Its top rim is the one bloom donor.
 */
export function stagesSpec(data: StagesData): HoloStageSpec {
  const S = STAGES_SWEEP;
  const lines: StageLine[] = [
    ...gridLines("grid", { a: 0, b: 0, w: STAGE_FLOOR.w, d: STAGE_FLOOR.d, pitch: GRID_PITCH }).map(
      (l) => ({ ...l, batch: true, opacity: 0.11 })
    ),
    ...frontEdges(STAGE_FLOOR.w, STAGE_FLOOR.d, true).map((l) => ({ ...l, batch: true })),
    ...timeRuler(),
  ];
  const faces: StageFace[] = [];
  const dust: StageDust[] = [];

  data.stages.forEach((s, i) => {
    const prism = STAGE_PRISMS[i];
    if (!prism) return;
    const box: Box = { ...prism };
    const lit = s.lit === true;
    /* The block arrives as the front crosses it. */
    const at0 = sweepReaches(S, box.a);
    const at1 = sweepReaches(S, box.a + box.w);
    lines.push(
      ...boxEdges(`prism-${s.id}`, box, {
        role: lit ? "gold" : "structure",
        ...(lit ? GOLD_EDGE : EDGE),
        reveal: [at0, at1 + 0.05],
      }).map((l) => ({ ...l, batch: true }))
    );
    if (lit && data.agent === "solid") {
      faces.push(
        ...boxFaces(`prism-${s.id}`, box, {
          role: "gold",
          opacity: 0.12,
          reveal: [at1 + 0.04, at1 + 0.3],
        })
      );
    }
    if (lit) {
      if (data.agent !== "solid") {
        /* The gold volume: translucent faces, and the cloud inside them. */
        faces.push(
          ...boxFaces(`prism-${s.id}`, box, {
            role: "gold",
            opacity: 0.14,
            reveal: [at1 + 0.04, at1 + 0.3],
          }).map((f) => ({ ...f, shade: undefined }))
        );
        dust.push({
          id: `fill-${s.id}`,
          points: motes(ISO_SEED + 311 + i, Math.round(box.w * box.d * box.h * 14), box),
          opacity: 0.6,
          role: "gold",
          size: 6,
        });
      }
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
        reveal: [at1 + 0.1, at1 + 0.38],
        donor: true,
      });
    } else {
      faces.push(
        ...boxFaces(`prism-${s.id}`, box, {
          role: "machine",
          opacity: 0.06,
          reveal: [at1 + 0.04, at1 + 0.28],
        })
      );
    }
  });

  /* The atmosphere hangs over the floor; the dark blocks are solid, and dust
     inside a solid is dust nobody sees. */
  dust.push({
    id: "dust",
    points: motes(ISO_SEED + 977, 220, {
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
    sweep: S,
  };
}
