/* The Thoughtform mark on the layer, in dots. PURE.

   The owner, 2026-10-14: "the middle layer is the Thoughtform layer but it
   now shows a circle. I want to have a super clean particle version of our
   Thoughtform logo. Maybe it can be created with negative space or white
   space."

   S4·E's layer is concentric: a white-hot core, a lit ring, a second ring.
   Here its top face carries the brandmark instead (`lib/brandmark`, the one
   record of the mark's paths), set on the plate's own lattice so every dot
   of it is a dot the layer already has. Only a dot's look changes, never its
   place. The mark lies on the plate, square to the screen in the stack's own
   view: its level bar runs left to right across the plate, and it is
   foreshortened as anything lying on the plate is.

     lit   the mark in white dots, a clear site round it (the white space),
           on the layer's gold field
     cut   the mark as negative space: a lit gold disc with the mark left
           out of it */

import { brandmarkPolylines } from "@/lib/brandmark/brandmarkPaths";

import { STYLE } from "../../stack-forms/swarm/dots";

import type { Pool } from "./pool";

export type Mark = "lit" | "cut";
export const MARKS: readonly Mark[] = ["lit", "cut"];

type Pt = [number, number];
interface Shape {
  pts: Pt[];
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** The share of a site's own patch the mark must cover for the site to be
    the mark's. Its finest stroke, the ring's thin side, is under a site
    wide, so a site counts once a third of it is covered. */
const COVER = 0.34;
/** How much of the plate the mark spans, by the reach of its furthest point
    from its middle against the plate's edge. */
const REACH = 0.86;
/** Points sampled across a site's patch, a side. */
const SUB = 5;

let shapes: Shape[] | null = null;
function markShapes(): Shape[] {
  if (shapes) return shapes;
  shapes = brandmarkPolylines(8).map((pts) => ({
    pts,
    x0: Math.min(...pts.map((p) => p[0])),
    x1: Math.max(...pts.map((p) => p[0])),
    y0: Math.min(...pts.map((p) => p[1])),
    y1: Math.max(...pts.map((p) => p[1])),
  }));
  return shapes;
}

function inShape(s: Shape, x: number, y: number): boolean {
  if (x < s.x0 || x > s.x1 || y < s.y0 || y > s.y1) return false;
  let inside = false;
  const p = s.pts;
  for (let a = 0, b = p.length - 1; a < p.length; b = a++) {
    if (p[a][1] > y !== p[b][1] > y) {
      const cross = p[a][0] + ((y - p[a][1]) * (p[b][0] - p[a][0])) / (p[b][1] - p[a][1]);
      if (x < cross) inside = !inside;
    }
  }
  return inside;
}

/**
 * How much of each site's patch the mark covers, 0..1, for a plate of `m`
 * sites a side: `cover[i * (m + 1) + j]`. The mark's middle is its ring's,
 * on the plate's middle.
 */
export function markCover(m: number): Float32Array {
  const S = markShapes();
  /* the ring is the second path; its box's middle is the mark's */
  const ring = S[1];
  const cx = (ring.x0 + ring.x1) / 2;
  const cy = (ring.y0 + ring.y1) / 2;
  /* a plate's top, turned square to the screen, is a diamond whose points
     are m over root two from its middle, |u| + |v| at most that */
  let reach = 0;
  for (const s of S)
    for (const [x, y] of s.pts) reach = Math.max(reach, Math.abs(x - cx) + Math.abs(y - cy));
  const k = (REACH * m) / Math.SQRT2 / reach;
  const cover = new Float32Array((m + 1) * (m + 1));
  for (let i = 0; i <= m; i++)
    for (let j = 0; j <= m; j++) {
      let hit = 0;
      for (let a = 0; a < SUB; a++)
        for (let b = 0; b < SUB; b++) {
          const di = i - m / 2 + (a + 0.5) / SUB - 0.5;
          const dj = j - m / 2 + (b + 0.5) / SUB - 0.5;
          /* square to the screen: across is i - j, down is i + j */
          const x = cx + (di - dj) / Math.SQRT2 / k;
          const y = cy + (di + dj) / Math.SQRT2 / k;
          if (S.some((s) => inShape(s, x, y))) hit++;
        }
      cover[i * (m + 1) + j] = hit / (SUB * SUB);
    }
  return cover;
}

/**
 * Set the mark on the layer's top face, in place: each dot standing on the
 * top (`k` at `top`, read back by `turn.ts`) and off its rim takes the look
 * the mark gives its site. `n` is sites a unit.
 */
export function setMark(
  P: Pool,
  place: { i: Float32Array; j: Float32Array; k: Float32Array },
  m: number,
  n: number,
  top: number,
  mark: Mark
): void {
  const cover = markCover(m);
  const at = (i: number, j: number) =>
    i < 0 || j < 0 || i > m || j > m ? 0 : cover[i * (m + 1) + j];
  const on = (i: number, j: number) => at(i, j) >= COVER;
  /* the mark's own reach, in units from the plate's middle: the lit disc of
     the cut takes it in */
  let far = 0;
  for (let i = 0; i <= m; i++)
    for (let j = 0; j <= m; j++)
      if (on(i, j)) far = Math.max(far, Math.hypot(i - m / 2, j - m / 2));
  for (let d = 0; d < P.own; d++) {
    if (P.plate[d] !== 1 || Math.abs(place.k[d] - top) > 1e-3) continue;
    const i = Math.round(place.i[d]);
    const j = Math.round(place.j[d]);
    if (i <= 0 || j <= 0 || i >= m || j >= m) continue;
    const r = Math.hypot(i - m / 2, j - m / 2);
    const mine = on(i, j);
    const near =
      !mine &&
      (on(i - 1, j) ||
        on(i + 1, j) ||
        on(i, j - 1) ||
        on(i, j + 1) ||
        on(i - 1, j - 1) ||
        on(i + 1, j + 1) ||
        on(i - 1, j + 1) ||
        on(i + 1, j - 1));
    let tier: number;
    let style: number;
    if (mark === "lit") {
      if (mine) [tier, style] = [3, STYLE.layerHot];
      else if (near) [tier, style] = [0, STYLE.layerDim];
      else [tier, style] = [r < 3.5 * n ? 2 : 1, STYLE.layer];
    } else if (mine) [tier, style] = [0, STYLE.layerDim];
    else if (r <= far + 1.5) [tier, style] = [near ? 3 : 2, STYLE.layerLit];
    else [tier, style] = [1, STYLE.layer];
    P.tier[d] = tier;
    P.style[d] = style;
  }
}
