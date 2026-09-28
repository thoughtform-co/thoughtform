/**
 * floor — the one stage the workshop's three framing drawings stand on
 * (ADR-130 U4).
 *
 * The owner, 2026-09-28: the three beats were "all different", and he asked
 * for visuals "logically built on top of each other". So all three are drawn
 * on this module: one projection (`ISO_BASIS_STAGE`, the Moira workshop's
 * symmetric parallel view), one scale, and one time axis along the floor's
 * front-RIGHT edge — minutes at the front corner, half a day at the right
 * tip — so the prompt, the tool and the agent (02), the staircase of the
 * models (03) and the two lanes (05) are read against the same edge.
 *
 * ⚠ THE CROP IS DERIVED, NEVER TUNED BY HAND. Every layout lists the world
 * points it draws and the room its words need, and `frameAround` returns the
 * crop that holds them. U1's crops were typed numbers, and U2's live lens was
 * solved against a model of the drawing — the stages beat printed its agent
 * prism 85px past the canvas at 1920×1247 with every guard green. The canvas
 * now frames THIS crop exactly (`stageFit.ts`), so a point inside the crop is
 * a point on screen, and `holo-stage-geom` asserts every point is inside it.
 *
 * ⚠ PURE, zero imports but `iso`.
 */

import { ISO_BASIS_STAGE, type IsoFrame, type Pt, isoProject } from "./iso";

/** Viewbox units per world unit — one scale for all three drawings. */
export const STAGE_K = 40;
/** The shared time axis: `a` from the front corner (minutes) to 12 (half a day). */
export const TIME_A = 12;
/** The datum is ruled every three units, Moira's thirds on a twelve-unit edge. */
export const GRID_PITCH = 3;

export interface WorldPt {
  a: number;
  b: number;
  z: number;
}

export interface Pads {
  l: number;
  r: number;
  t: number;
  b: number;
}

const UNIT: IsoFrame = { w: 1, h: 1, ox: 0, oy: 0, k: 1, basis: ISO_BASIS_STAGE };

/** The crop that holds every point, with `pad` viewbox units of room around it. */
export function frameAround(points: readonly WorldPt[], pad: Pads, k = STAGE_K): IsoFrame {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    const q = isoProject(p.a, p.b, p.z, UNIT);
    x0 = Math.min(x0, q.x);
    x1 = Math.max(x1, q.x);
    y0 = Math.min(y0, q.y);
    y1 = Math.max(y1, q.y);
  }
  const w = Math.ceil((x1 - x0) * k + pad.l + pad.r);
  const h = Math.ceil((y1 - y0) * k + pad.t + pad.b);
  return { w, h, ox: pad.l - x0 * k, oy: pad.t - y0 * k, k, basis: ISO_BASIS_STAGE };
}

/** The four corners of a floor `w` x `d` at the origin. */
export function floorCorners(w: number, d: number): WorldPt[] {
  return [
    { a: 0, b: 0, z: 0 },
    { a: w, b: 0, z: 0 },
    { a: w, b: d, z: 0 },
    { a: 0, b: d, z: 0 },
  ];
}

/**
 * A seat BESIDE a floor edge, `d` viewbox units out from it — Moira's
 * `besideRight` / `besideLeft`. The `a` edge (b = 0) faces down and to the
 * right; the `b` edge (a = 0) down and to the left.
 */
export function besideEdge(edge: "a" | "b", t: number, d: number, f: IsoFrame): Pt {
  const s = Math.sin((22 * Math.PI) / 180);
  const c = Math.cos((22 * Math.PI) / 180);
  if (edge === "a") {
    const p = isoProject(t, 0, 0, f);
    return { x: p.x + d * s, y: p.y + d * c };
  }
  const p = isoProject(0, t, 0, f);
  return { x: p.x - d * s, y: p.y + d * c };
}
