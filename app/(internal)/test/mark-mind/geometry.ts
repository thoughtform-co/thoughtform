/* The mark is the mind: the drum's geometry. PURE.

   One drum of stacked slices, cut by the Thoughtform brand mark into four
   sectors (round six of the machine-mind lab, owner's pick 2026-10-19,
   `docs/plans/mark-is-the-mind-build.md`). Everything lives on the drum's top
   plane in plane units (u right, v toward the viewer, the drum's radius 100),
   measured from the mark's own viewBox (`lib/brandmark/brandmarkPaths.ts`,
   430.99 × 436, y down) at 4 px a unit:

     slanted bar   centre line through (238.75, 20) and (169.5, 400): 79.7° from
                   level, 23.1 wide across
     level bar     y 219.0 – 236.2, from x 29.8 out past the ring to 431
     ring          inner edge a circle r ≈ 183 round (209.3, 229.4); outer edge
                   r ≈ 203 round (208.2, 228.0): the crescent is the offset
     stepped block the crossing outline of the bar path (index 5), below

   The camera is the anatomy kit's (`iso`): with the plane laid along the
   kit's screen-right and toward-viewer axes, a point (u, v, z) lands at
   x = ox + k·u, y = oy + k·(v·sinE − z·cosE), so the mark's own paths map onto
   any level of the drum with one affine transform. */

export type P2 = [number, number];

/** Mark units per plane unit, and the mark's centre (the ring's inner circle). */
export const MARK = { cx: 209.3, cy: 229.4, unit: 2.1 } as const;

export const R = 100; // the drum's radius
export const SLICE = 4.5; // one contour slice
export const H = SLICE * 12; // the drum's height
export const BASE = SLICE * 3; // the channel floor: the mark is cut down to here

export const toPlane = ([mx, my]: P2): P2 => [(mx - MARK.cx) / MARK.unit, (my - MARK.cy) / MARK.unit];

/** The level bar's band, plane v. */
export const LEVEL = { v0: (219.0 - MARK.cy) / MARK.unit, v1: (236.2 - MARK.cy) / MARK.unit } as const;

const slantA = toPlane([238.75, 20]);
const slantB = toPlane([169.5, 400]);
const slantLen = Math.hypot(slantB[0] - slantA[0], slantB[1] - slantA[1]);
/** The slanted bar: its direction (down the bar), its normal (toward the
    machine side, +u) and half its width, plane units. */
export const SLANT = {
  at: slantA,
  dir: [(slantB[0] - slantA[0]) / slantLen, (slantB[1] - slantA[1]) / slantLen] as P2,
  normal: [(slantB[1] - slantA[1]) / slantLen, -(slantB[0] - slantA[0]) / slantLen] as P2,
  half: 23.12 / 2 / MARK.unit,
};
/** Signed distance across the slanted bar, + toward the machine side. */
export const across = ([u, v]: P2) => (u - SLANT.at[0]) * SLANT.normal[0] + (v - SLANT.at[1]) * SLANT.normal[1];

/** Where the bars cross, plane units. */
export const CROSSING: P2 = (() => {
  const v = (LEVEL.v0 + LEVEL.v1) / 2;
  // the point on the slanted centre line at that v
  const t = (v - SLANT.at[1]) / SLANT.dir[1];
  return [SLANT.at[0] + SLANT.dir[0] * t, v];
})();

/** The stepped block, the well at the crossing: the bar path's own outline
    there (mark units), so the cut is the mark's. */
export const WELL: P2[] = (
  [
    [174, 205.1],
    [192.5, 205.1],
    [230.1, 203.9],
    [247.1, 203.9],
    [244.3, 218.9],
    [240.8, 236.6],
    [230.5, 236.6],
    [228, 250.4],
    [209.5, 250.4],
    [175.9, 250.4],
    [155.2, 250.4],
    [157.7, 236.6],
    [161.2, 218.9],
    [171.5, 218.8],
  ] as P2[]
).map(toPlane);

/** Keep the part of a polygon where f(p) <= 0 (Sutherland–Hodgman). */
export function clip(poly: P2[], f: (p: P2) => number): P2[] {
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const fa = f(a);
    const fb = f(b);
    if (fa <= 0) out.push(a);
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) {
      const t = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

export const circle = (r: number, steps = 180, cx = 0, cy = 0): P2[] =>
  Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P2;
  });

/** A convex polygon cut to a disc (by its tangents, so it stays convex). */
export const clipToDisc = (poly: P2[], r: number, steps = 120) => {
  let out = poly;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    out = clip(out, ([u, v]) => u * c + v * s - r);
  }
  return out;
};

export type Side = "people" | "machine";

export interface Floor {
  poly: P2[];
  /** its top, plane z */
  z: number;
  /** its bottom */
  z0: number;
}

export interface Sector {
  key: "ul" | "ll" | "ur" | "lr";
  side: Side;
  upper: boolean;
  poly: P2[];
  /** the prisms it is built of, bottom first (one, or the terraces) */
  floors: Floor[];
  /** painter's key: far first */
  depth: number;
}

const DISC = circle(R);

const sectorPoly = (side: Side, upper: boolean) => {
  let p = DISC;
  p = clip(p, upper ? ([, v]) => v - LEVEL.v0 : ([, v]) => LEVEL.v1 - v);
  p = clip(p, side === "people" ? (q) => across(q) + SLANT.half : (q) => SLANT.half - across(q));
  return p;
};

/** Terraces step the people's floors down toward the slanted bar, one slice
    a step: three convex prisms, the outermost the tallest. */
const TERRACE_STEP = 22;

export function sectorsOf(floorsMode: "section" | "terrace"): Sector[] {
  const keys = [
    ["ul", "people", true],
    ["ll", "people", false],
    ["ur", "machine", true],
    ["lr", "machine", false],
  ] as const;
  return keys
    .map(([key, side, upper]) => {
      const poly = sectorPoly(side, upper);
      let floors: Floor[] = [{ poly, z0: BASE, z: H }];
      if (side === "people" && floorsMode === "terrace") {
        floors = [0, 1, 2].map((k) => ({
          poly: k === 0 ? poly : clip(poly, (q) => across(q) + SLANT.half + TERRACE_STEP * k),
          z0: k === 0 ? BASE : H - SLICE * (3 - k),
          z: H - SLICE * (2 - k),
        }));
      }
      const c = poly.reduce((a, q) => [a[0] + q[0] / poly.length, a[1] + q[1] / poly.length] as P2, [0, 0] as P2);
      return { key, side, upper, poly, floors, depth: c[1] } as Sector;
    })
    .sort((a, b) => a.depth - b.depth);
}

/** True when an edge of a sector lies along a cut (not on the rim). */
export const isCut = (a: P2, b: P2) => Math.hypot((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) < R - 0.5;

/** Point in a convex polygon (either winding). */
export function inside(poly: P2[], [x, y]: P2) {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (Math.abs(c) < 1e-9) continue;
    const s = c > 0 ? 1 : -1;
    if (!sign) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/** Outward normal of edge a→b of a polygon, given its winding. */
export function outward(poly: P2[], a: P2, b: P2): P2 {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    area += p[0] * q[1] - q[0] * p[1];
  }
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return area > 0 ? [dy / l, -dx / l] : [-dy / l, dx / l];
}
