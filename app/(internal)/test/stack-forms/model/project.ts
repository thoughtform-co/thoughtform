/* From the stack's own space to a picture. PURE.

   A FRAME is a parallel projection stated as four vectors: where the origin
   lands and where one unit of x, of y and of z goes. That is enough for SVG,
   for a canvas lattice and for a grid of characters alike, and it survives a
   camera that is not the isometric (the proposal turns the stack to face the
   reader). `isoFrame` is the proposal's projection, restated: +x runs
   down-right, +y down-left, +z up, at 30 degrees. */

import { type Box, PLATES, type Pose, type Pt, SIDE } from "./stack";

export interface Frame {
  o: Pt;
  ex: Pt;
  ey: Pt;
  ez: Pt;
}

const C30 = Math.cos(Math.PI / 6);

/** The proposal's isometric at `u` px a unit, the back corner at (ox, oy). */
export function isoFrame(u: number, ox: number, oy: number): Frame {
  return { o: [ox, oy], ex: [C30 * u, 0.5 * u], ey: [-C30 * u, 0.5 * u], ez: [0, -u] };
}

export function project(f: Frame, x: number, y: number, z: number): Pt {
  return [
    f.o[0] + x * f.ex[0] + y * f.ey[0] + z * f.ez[0],
    f.o[1] + x * f.ex[1] + y * f.ey[1] + z * f.ez[1],
  ];
}

/** The same frame, its origin moved up by `dz`: a plate's own frame. */
export function lifted(f: Frame, dz: number): Frame {
  return { ...f, o: [f.o[0] + dz * f.ez[0], f.o[1] + dz * f.ez[1]] };
}

/** Plate `i`'s frame in a pose. */
export const plateFrame = (f: Frame, pose: Pose, i: 0 | 1 | 2): Frame => lifted(f, pose.lift[i]);

/** Solve `a * p + b * q = r` for (p, q). */
function solve(a: Pt, b: Pt, r: Pt): Pt {
  const det = a[0] * b[1] - a[1] * b[0];
  return [(r[0] * b[1] - r[1] * b[0]) / det, (a[0] * r[1] - a[1] * r[0]) / det];
}

/** A screen point back onto the horizontal plane at height `z` of a frame. */
export function unproject(f: Frame, sx: number, sy: number, z: number): Pt {
  return solve(f.ex, f.ey, [sx - f.o[0] - z * f.ez[0], sy - f.o[1] - z * f.ez[1]]);
}

/** The SVG matrix that lays flat artwork (1 drawing unit = `k` plate units,
    its origin at (x, y)) on the horizontal plane at height z. */
export function planeMatrix(f: Frame, x: number, y: number, z: number, k = 1): string {
  const [e, g] = project(f, x, y, z);
  return `matrix(${f.ex[0] * k} ${f.ex[1] * k} ${f.ey[0] * k} ${f.ey[1] * k} ${e} ${g})`;
}

/** Artwork onto the left wall (the face at y = y1): its x runs along the
    plate's x, its y runs down the wall. */
export function leftMatrix(f: Frame, x: number, y: number, z: number, k = 1): string {
  const [e, g] = project(f, x, y, z);
  return `matrix(${f.ex[0] * k} ${f.ex[1] * k} ${-f.ez[0] * k} ${-f.ez[1] * k} ${e} ${g})`;
}

/** Artwork onto the right wall (the face at x = x1): its x runs back along
    the plate's y (so it reads left to right on screen), its y runs down. */
export function rightMatrix(f: Frame, x: number, y: number, z: number, k = 1): string {
  const [e, g] = project(f, x, y, z);
  return `matrix(${-f.ey[0] * k} ${-f.ey[1] * k} ${-f.ez[0] * k} ${-f.ez[1] * k} ${e} ${g})`;
}

/* -- solids ---------------------------------------------------------------- */

export interface Faces {
  top: Pt[];
  /** The wall at y = y1, facing down-left. */
  left: Pt[];
  /** The wall at x = x1, facing down-right. */
  right: Pt[];
  /** The whole silhouette. */
  outline: Pt[];
}

/** The three faces a viewer above and in front sees, and the silhouette. */
export function boxFaces(f: Frame, b: Box): Faces {
  const p = (x: number, y: number, z: number) => project(f, x, y, z);
  return {
    top: [p(b.x0, b.y0, b.z1), p(b.x1, b.y0, b.z1), p(b.x1, b.y1, b.z1), p(b.x0, b.y1, b.z1)],
    left: [p(b.x0, b.y1, b.z1), p(b.x1, b.y1, b.z1), p(b.x1, b.y1, b.z0), p(b.x0, b.y1, b.z0)],
    right: [p(b.x1, b.y0, b.z1), p(b.x1, b.y1, b.z1), p(b.x1, b.y1, b.z0), p(b.x1, b.y0, b.z0)],
    outline: [
      p(b.x0, b.y0, b.z1),
      p(b.x1, b.y0, b.z1),
      p(b.x1, b.y0, b.z0),
      p(b.x1, b.y1, b.z0),
      p(b.x0, b.y1, b.z0),
      p(b.x0, b.y1, b.z1),
    ],
  };
}

export type Seg = readonly [Pt, Pt];

/** A box's twelve edges: the nine a viewer sees and the three behind it. */
export function boxEdges(f: Frame, b: Box): { visible: Seg[]; hidden: Seg[] } {
  const p = (x: number, y: number, z: number) => project(f, x, y, z);
  const { x0, x1, y0, y1, z0, z1 } = b;
  return {
    visible: [
      [p(x0, y0, z1), p(x1, y0, z1)],
      [p(x1, y0, z1), p(x1, y1, z1)],
      [p(x1, y1, z1), p(x0, y1, z1)],
      [p(x0, y1, z1), p(x0, y0, z1)],
      [p(x1, y0, z1), p(x1, y0, z0)],
      [p(x1, y1, z1), p(x1, y1, z0)],
      [p(x0, y1, z1), p(x0, y1, z0)],
      [p(x1, y0, z0), p(x1, y1, z0)],
      [p(x1, y1, z0), p(x0, y1, z0)],
    ],
    hidden: [
      [p(x0, y0, z1), p(x0, y0, z0)],
      [p(x0, y0, z0), p(x1, y0, z0)],
      [p(x0, y0, z0), p(x0, y1, z0)],
    ],
  };
}

export function pointInPoly(p: Pt, poly: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/** What a screen point lands on: which plate, which of its faces, and where
    on the plate. The plate in front wins, so the answer is what is seen. */
export interface Hit {
  plate: 0 | 1 | 2;
  face: "top" | "left" | "right";
  x: number;
  y: number;
  z: number;
}

export function hit(f: Frame, pose: Pose, sx: number, sy: number): Hit | null {
  const at: Pt = [sx, sy];
  for (const i of [0, 1, 2] as const) {
    const pf = plateFrame(f, pose, i);
    const plate = PLATES[i];
    /* the plate's own solids, highest first: the upper one hides the lower */
    for (let n = plate.body.length - 1; n >= 0; n--) {
      const b = plate.body[n];
      const faces = boxFaces(pf, b);
      if (pointInPoly(at, faces.top)) {
        const [x, y] = unproject(pf, sx, sy, b.z1);
        return { plate: i, face: "top", x, y, z: b.z1 };
      }
      if (pointInPoly(at, faces.left)) {
        /* on the wall y = y1: solve for x along it and z up it */
        const [x, z] = solve(pf.ex, pf.ez, [
          sx - pf.o[0] - b.y1 * pf.ey[0],
          sy - pf.o[1] - b.y1 * pf.ey[1],
        ]);
        return { plate: i, face: "left", x, y: b.y1, z };
      }
      if (pointInPoly(at, faces.right)) {
        const [y, z] = solve(pf.ey, pf.ez, [
          sx - pf.o[0] - b.x1 * pf.ex[0],
          sy - pf.o[1] - b.x1 * pf.ex[1],
        ]);
        return { plate: i, face: "right", x: b.x1, y, z };
      }
    }
  }
  return null;
}

/* -- fitting --------------------------------------------------------------- */

export interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** The stack's own extent through a frame, in a pose: every plate's slab. */
export function stackBounds(f: Frame, pose: Pose): Bounds {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const i of [0, 1, 2] as const) {
    const pf = plateFrame(f, pose, i);
    const out = boxFaces(pf, { x0: 0, x1: SIDE, y0: 0, y1: SIDE, z0: 0, z1: PLATES[i].top });
    for (const [x, y] of out.outline) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return { x0, y0, x1, y1 };
}

/**
 * The isometric frame that seats the stack, in `pose`, inside a `w` by `h`
 * box with `pad` clear all round: as large as fits (no larger than `uMax` a
 * unit), centred on (`cx`, `cy`) of the box (default its middle).
 */
export function fitFrame(
  w: number,
  h: number,
  pose: Pose,
  o: { pad?: number; uMax?: number; cx?: number; cy?: number } = {}
): Frame {
  const pad = o.pad ?? 0;
  const unit = stackBounds(isoFrame(1, 0, 0), pose);
  const u = Math.min(
    o.uMax ?? Infinity,
    (w - 2 * pad) / (unit.x1 - unit.x0),
    (h - 2 * pad) / (unit.y1 - unit.y0)
  );
  const cx = o.cx ?? w / 2;
  const cy = o.cy ?? h / 2;
  return isoFrame(u, cx - ((unit.x0 + unit.x1) / 2) * u, cy - ((unit.y0 + unit.y1) / 2) * u);
}

/** The unit of a frame made by `isoFrame`: px a unit of z. */
export const unitOf = (f: Frame) => -f.ez[1];
