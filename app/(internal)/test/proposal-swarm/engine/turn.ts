/* The stack's turn into the network. PURE.

   The owner, 2026-10-14, on the second hop: "When you scroll into the
   Marketing First and Every Team section, I don't think we need that
   particle transition because we get a frontal view, so they stack. I think
   the three stacks should stack and then rotate a bit on the x-axis and a
   bit on the z-axis so they come toward you. That creates an elegant
   transition to their final position."

   So the second hop is not a flight. The closed stack turns as one object,
   through a true orthographic camera whose yaw runs from the lattice's 45
   degrees to none and whose pitch from the lattice's own to a few degrees,
   while it crosses to the bars' place and its plates part to the courses'
   pitch: the network section's own turn (`NetworkOrg`, `camIso`), played by
   the dots. Every dot keeps its place on its plate in three dimensions, read
   back through the lattice, so the turn's first frame is the stack as it
   stood, to the pixel, and its last is the three plates face on, each over
   its bar.

   The owner again, the same day, on the plates becoming bars: "I love the
   stack but then I see them transform … it feels like it's transforming
   into another rectangular shape." So nothing is reshuffled at the end.
   While the stack turns, each plate's dots gather on the plate itself, in
   three dimensions, to the lines its bar's cells stand on: a column a site
   across, a row a unit from back to front. The turn ends at the pitch that
   sets those rows at the bar's own row pitch, so the plate face on is its
   bar, cell for cell. */

import type { Cells, Lattice } from "../../stack-forms/swarm/dots";

import type { Rect } from "./formations";
import type { Pool } from "./pool";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** A box of sites: a plate, or a solid on the agents' board. */
export interface Box {
  plate: 0 | 1 | 2;
  i0: number;
  i1: number;
  j0: number;
  j1: number;
  /** Its floor and its top, in rows over the plate's floor. */
  k0: number;
  k1: number;
}

/** The camera at one end of the turn. */
export interface Cam {
  yaw: number;
  pitch: number;
  /** Device px a site. */
  s: number;
  /** A row of height, in sites. */
  zr: number;
  /** Where the layer's middle stands on the canvas, device px. */
  cx: number;
  cy: number;
  /** Each plate's middle over the layer's, in sites, team first. */
  z: [number, number, number];
}

export interface Turn {
  /** Each dot on its plate, in sites: across from the left corner (i), from
      the back (j), and up from the plate's floor (k, in rows). */
  i: Float32Array;
  j: Float32Array;
  k: Float32Array;
  /** Where each dot gathers to on its plate's top, in sites: its cell's
      column, and its cell's row from the back. */
  gi: Float32Array;
  gj: Float32Array;
  /** Sites a side. */
  m: number;
  /** Each plate's height in rows, team first. */
  tall: [number, number, number];
  /** Every segment's box, for what it hides; null for the riders'. */
  boxes: (Box | null)[];
  /** The closed stack where the steps left it, and the three plates face on
      over their bars. */
  from: Cam;
  to: Cam;
}

/** The camera `e` of the way through the turn, its sines worked out. */
export interface Lens {
  cx: number;
  cy: number;
  s: number;
  zr: number;
  z: [number, number, number];
  cw: number;
  sw: number;
  cp: number;
  sp: number;
}

export function lensAt(R: Turn, e: number): Lens {
  const a = R.from;
  const b = R.to;
  const yaw = lerp(a.yaw, b.yaw, e);
  const pitch = lerp(a.pitch, b.pitch, e);
  return {
    cx: lerp(a.cx, b.cx, e),
    cy: lerp(a.cy, b.cy, e),
    s: lerp(a.s, b.s, e),
    zr: lerp(a.zr, b.zr, e),
    z: [lerp(a.z[0], b.z[0], e), lerp(a.z[1], b.z[1], e), lerp(a.z[2], b.z[2], e)],
    cw: Math.cos(yaw),
    sw: Math.sin(yaw),
    cp: Math.cos(pitch),
    sp: Math.sin(pitch),
  };
}

/** A point of a plate through the lens, into `out`: `camIso`'s arithmetic. */
export function project(
  V: Lens,
  R: Turn,
  plate: number,
  i: number,
  j: number,
  k: number,
  out: number[]
): void {
  const X = i - R.m / 2;
  const Y = j - R.m / 2;
  const Z = V.z[plate] + (k - R.tall[plate] / 2) * V.zr;
  out[0] = V.cx + V.s * (X * V.cw - Y * V.sw);
  out[1] = V.cy + V.s * ((X * V.sw + Y * V.cw) * V.sp - Z * V.cp);
}

/** The plane of a plate's top face through the lens, as a canvas transform
    (a, b, c, d) about the face's middle: a circle on the plate is drawn
    through it as the ellipse it is on screen. */
export function topPlane(V: Lens): [number, number, number, number] {
  return [V.s * V.cw, V.s * V.sw * V.sp, -V.s * V.sw, V.s * V.cw * V.sp];
}

const corner = [0, 0];

/** What a box hides, through the lens: its silhouette, `pad` px wider all
    round so a dot on its rim is covered whole. */
export function hullOf(V: Lens, R: Turn, b: Box, pad: number): Int32Array {
  const pts: [number, number][] = [];
  for (const i of [b.i0, b.i1])
    for (const j of [b.j0, b.j1])
      for (const k of [b.k0, b.k1]) {
        project(V, R, b.plate, i, j, k, corner);
        for (const dx of [-pad, pad])
          for (const dy of [-pad, pad]) pts.push([corner[0] + dx, corner[1] + dy]);
      }
  /* the convex hull, by the monotone chain */
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o: number[], a: number[], c: number[]) =>
    (a[0] - o[0]) * (c[1] - o[1]) - (a[1] - o[1]) * (c[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (let q = pts.length - 1; q >= 0; q--) {
    const p = pts[q];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  return Int32Array.from(hull.flatMap(([x, y]) => [Math.round(x), Math.round(y)]));
}

/** Each dot's place on its plate in three dimensions, and the boxes. */
export interface Place {
  i: Float32Array;
  j: Float32Array;
  k: Float32Array;
  boxes: (Box | null)[];
}

/**
 * Every dot's place on its plate, for the pool on lattice `L`: `tall` is each
 * plate's height in rows (the agents' to their board), `blocks` the solids
 * on the board in the pool's order.
 */
export function placeOf(
  P: Pool,
  L: Lattice,
  tall: [number, number, number],
  blocks: readonly { cells: Cells; k: number }[]
): Place {
  const m = L.m;
  const step = L.a * L.g;
  const row = L.b * L.g;

  let nb = 0;
  const boxes = P.segs.map((seg): Box | null => {
    if (seg.from >= P.own) return null;
    if (seg.block) {
      const { cells, k } = blocks[nb++];
      return { plate: 2, ...cells, k0: tall[2], k1: k };
    }
    return { plate: seg.plate, i0: 0, i1: m, j0: 0, j1: m, k0: 0, k1: tall[seg.plate] };
  });

  /* a dot's place on its box. On screen x is i - j and y is i + j - k, so a
     dot is read as standing on the box's top; one that reads as standing
     past the box's front edge hangs on the wall below that edge */
  const i = new Float32Array(P.count);
  const j = new Float32Array(P.count);
  const k = new Float32Array(P.count);
  P.segs.forEach((seg, n) => {
    const b = boxes[n];
    if (!b) return;
    for (let d = seg.from; d < seg.to; d++) {
      const s = (P.lx[d] - L.ox) / step;
      const e = (P.ly[d] - L.oy) / row;
      let di = (s + e + b.k1) / 2;
      let dj = (e + b.k1 - s) / 2;
      let dk = b.k1;
      const overI = di - b.i1;
      const overJ = dj - b.j1;
      if (overI > 1e-6 && overI >= overJ) {
        di = b.i1;
        dj = di - s;
        dk = di + dj - e;
      } else if (overJ > 1e-6) {
        dj = b.j1;
        di = s + dj;
        dk = di + dj - e;
      }
      i[d] = di;
      j[d] = dj;
      k[d] = clamp(dk, b.k0, b.k1);
    }
  });
  for (let d = P.own; d < P.count; d++) {
    const host = P.host[d];
    i[d] = i[host];
    j[d] = j[host];
    k[d] = k[host];
  }
  return { i, j, k, boxes };
}

/**
 * The turn, for the pool on lattice `L`, its dots placed by `placeOf`:
 * `seat` is the closed stack where the steps leave it, `bars` the three bars
 * where the network takes it, and `cell` each dot's cell in its bar
 * (`formations.ts`), on a grid of a column a site and a row a unit.
 */
export function buildTurn(
  L: Lattice,
  tall: [number, number, number],
  place: Place,
  cell: Int32Array,
  seat: { ox: number; oy: number; lift: readonly [number, number, number] },
  bars: readonly Rect[]
): Turn {
  const m = L.m;
  const step = L.a * L.g;
  const row = L.b * L.g;
  const { i, j, k, boxes } = place;

  /* where it starts: the lattice's own projection, so a site lands on its
     pixel. The lattice is isometric to the grain: its pitch is the one whose
     sine is b over a, and a row of height is what makes a row b px. */
  const pitch0 = Math.asin(L.b / L.a);
  const s0 = Math.SQRT2 * step;
  const zr0 = row / (s0 * Math.cos(pitch0));
  /* a plate's middle, in rows over the layer's floor */
  const mid = (p: 0 | 1 | 2) => -seat.lift[p] / row + tall[p] / 2;
  const from: Cam = {
    yaw: Math.PI / 4,
    pitch: pitch0,
    s: s0,
    zr: zr0,
    cx: seat.ox + L.ox,
    cy: seat.oy + L.oy + (m - tall[1] / 2) * row + seat.lift[1],
    z: [(mid(0) - mid(1)) * zr0, 0, (mid(2) - mid(1)) * zr0],
  };

  /* where it ends: face on, every dot gathered to its cell's point on its
     plate's top. A site is a column of the bar (`gridOf`), and the pitch is
     the one that sets the plate's rows, a unit apart from back to front, at
     the bar's own row pitch; each plate's top is on its bar's middle. So the
     gathered plate face on IS its bar, cell for cell, and the bars take the
     dots without a step. */
  const mid1 = (r: Rect) => r.y + r.h / 2;
  const s1 = bars[1].w / (m + 1);
  const rowPx = bars[1].h / (L.n + 1);
  const pitch1 = Math.asin(clamp(rowPx / ((m / L.n) * s1), 0.01, 0.5));
  const cp = Math.cos(pitch1);
  const cy = mid1(bars[1]) + (tall[1] / 2) * 0.5 * s1 * cp;
  const lift1 = (p: 0 | 1 | 2) => (cy - mid1(bars[p])) / (s1 * cp) - (tall[p] / 2) * 0.5;
  const to: Cam = {
    yaw: 0,
    pitch: pitch1,
    s: s1,
    zr: 0.5,
    cx: bars[1].x + bars[1].w / 2,
    cy,
    z: [lift1(0), lift1(1), lift1(2)],
  };

  /* each dot's point to gather to: its cell's column and row on its
     plate's top (a solid on the board comes down to the board) */
  const n = L.n;
  const gi = new Float32Array(cell.length);
  const gj = new Float32Array(cell.length);
  for (let d = 0; d < cell.length; d++) {
    gi[d] = cell[d] % (m + 1);
    gj[d] = (Math.floor(cell[d] / (m + 1)) * m) / n;
  }

  return { i, j, k, gi, gj, m, tall, boxes, from, to };
}
