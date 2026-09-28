/**
 * curveSurface — THE CURVE, ported from the Moira workshop (ADR-130 U5).
 *
 * The owner, 2026-09-28: the staircase "doesn't show the models … use that
 * graph and copy the functionalities" — Moira's "Each release finishes longer
 * work, and each costs more per token" (`loop-moira/lib/workshops/depth.ts`
 * over `lib/intelligence/curve.ts`). So this is that figure's geometry,
 * COPIED, never imported across repos (ADR-106's law): two vendors climbing
 * one curve, the lanes as points on the front edge, a warm strip of floor for
 * the step change, and behind the front edge the same curve at every effort
 * level, a little higher — the second dial.
 *
 * THE PROJECTION IS MOIRA'S OWN: a parallel view with both floor edges at 22
 * degrees, intelligence along the floor's front-right edge and effort along
 * its front-left one. No camera, no vanishing point.
 *
 * A PICTURE OF THE ARGUMENT, NOT A MEASUREMENT. The vertical axis has no
 * scale, the lanes' positions give their order and not a value, and the
 * effort lift is chosen so the idea reads. Pure: no DOM, no React.
 */

export type CurveLane = "fast" | "everyday" | "frontier";

/* ── The explainer's curve (Moira `lib/intelligence/curve.ts`) ─────────── */

const L = 44;
const R = 600;
const BASE = 300;
/** Where each lane sits along the curve, as a fraction of its run. */
export const T: Record<CurveLane, number> = { fast: 0.18, everyday: 0.47, frontier: 0.74 };
export const END_T = 0.82;
/** The step change's pad either side of the frontier points, in curve units. */
export const BAND_PAD = 20 / (R - L);

const rise = (t: number) => Math.pow(t, 2.4) / Math.pow(END_T, 2.4);
const yAt = (t: number) => BASE - 36 - 134 * rise(t);
/** The other vendor's arc: the same climb, a little under until the frontier. */
const yOther = (t: number) => yAt(t) + 18 * Math.max(0, 1 - t / T.frontier);

/* ── The surface (Moira `lib/workshops/depth.ts`) ──────────────────────── */

/** The drawing's own box. Every point on it stays at least MARGIN inside. */
export const DW = 780;
export const DH = 425;
export const MARGIN = 16;
/** The floor's angle to the horizontal. */
export const ANG = 22;
/** The front corner of the floor: no intelligence, the lowest effort. */
const OX = 190;
const OY = 385;
/** The floor's two edges, before the projection. */
const UL = 460;
const VL = 150;
/** How tall the surface stands, and how much the highest effort lifts it. */
const HS = 0.62;
const LIFT = 0.3;

/** The effort levels drawn on the floor's effort edge: low, high, max. */
export const LEVELS = [0, 0.5, 1] as const;
/** The lines of constant effort in the mesh, front to back. */
export const V_LINES = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1] as const;
/** The mesh's lines across effort. */
export const MESH_T = [1, 2, 3, 4, 5, 6].map((k) => (END_T * k) / 6);
/** Where the vertical axis stops, at the floor's back-left corner. */
export const AXIS_TOP = 34;

const COS = Math.cos((ANG * Math.PI) / 180);
const SIN = Math.sin((ANG * Math.PI) / 180);

export type Point = { x: number; y: number };

/** A point on the floor: u along intelligence, v along effort, both 0..1. */
export function floor(u: number, v: number): Point {
  return { x: OX + (u * UL - v * VL) * COS, y: OY - (u * UL + v * VL) * SIN };
}

function height(t: number, series: "own" | "other"): number {
  return BASE - (series === "own" ? yAt(t) : yOther(t));
}

/** A point on the surface: t is the curve parameter, v the effort. */
export function surface(t: number, v: number, series: "own" | "other" = "own"): Point {
  const f = floor(t / END_T, v);
  return { x: f.x, y: f.y - height(t, series) * (1 + LIFT * v) * HS };
}

export const fix = (p: Point) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

/** The curve at one effort level, from no intelligence to the frontier. */
export function effortLine(v: number, series: "own" | "other" = "own"): string {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i += 1) {
    const t = (END_T * i) / 40;
    pts.push(`${i === 0 ? "M" : "L"}${fix(surface(t, v, series))}`);
  }
  return pts.join(" ");
}

/** The band between two effort lines, closed, for its fill. */
export function effortBand(v0: number, v1: number): string {
  const front: string[] = [];
  const back: string[] = [];
  for (let i = 0; i <= 40; i += 1) {
    const t = (END_T * i) / 40;
    front.push(fix(surface(t, v0)));
    back.unshift(fix(surface(t, v1)));
  }
  return `M${front.join(" L")} L${back.join(" L")} Z`;
}

/** A riser: one point of intelligence, from the lowest effort to the highest. */
export function riser(t: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 10; i += 1) pts.push(`${i === 0 ? "M" : "L"}${fix(surface(t, i / 10))}`);
  return pts.join(" ");
}

/** The floor's outline: front, right, back, left corner. */
export function floorOutline(): string {
  const c = [floor(0, 0), floor(1, 0), floor(1, 1), floor(0, 1)];
  return `M${c.map(fix).join(" L")} Z`;
}

/** Hairlines across the floor: two across intelligence, one at the middle effort. */
export function floorGrid(): string[] {
  const lines = [1 / 3, 2 / 3].map((k) => `M${fix(floor(k, 0))} L${fix(floor(k, 1))}`);
  lines.push(`M${fix(floor(0, 0.5))} L${fix(floor(1, 0.5))}`);
  return lines;
}

/** Beside the effort edge, pushed d out from the floor, for a label. */
export function besideSide(v: number, d: number): Point {
  const p = floor(0, v);
  return { x: p.x - d * SIN, y: p.y + d * COS };
}

/** A strip of floor under a stretch of intelligence, the full depth. */
export function floorPatch(t0: number, t1: number): string {
  const [u0, u1] = [t0 / END_T, t1 / END_T];
  const c = [floor(u0, 0), floor(u1, 0), floor(u1, 1), floor(u0, 1)];
  return `M${c.map(fix).join(" L")} Z`;
}

/** Every point the drawing uses, for the test that keeps it in its box. */
export function extent(): Point[] {
  const pts: Point[] = [floor(0, 0), floor(1, 0), floor(1, 1), floor(0, 1)];
  for (const v of V_LINES) for (let i = 0; i <= 40; i += 1) pts.push(surface((END_T * i) / 40, v));
  return pts;
}
