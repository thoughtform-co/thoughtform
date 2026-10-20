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
export const SLICE = 9.75; // one contour slice, one storey
export const H = SLICE * 10; // ten storeys: at the default 38° camera the whole drum's
// silhouette is a circle (2R(1 − sin e)/cos e), the circle the mark's ring hugs
export const BASE = 0; // the bars are cut through the whole drum: black voids

export const toPlane = ([mx, my]: P2): P2 => [(mx - MARK.cx) / MARK.unit, (my - MARK.cy) / MARK.unit];

/** The channels are the bars a little widened, so the cut faces read at an
    angle (1 is the mark exact). */
export const GAP = 0.04; // the slots are cut in screen space now (paint.ts, screenMark); these only part the prisms

const levelMid = ((219.0 + 236.2) / 2 - MARK.cy) / MARK.unit;
const levelHalf = ((236.2 - 219.0) / 2 / MARK.unit) * GAP;
/** The level bar's band, plane v; it runs out past the rim to the mark's x 431. */
export const LEVEL = { v0: levelMid - levelHalf, v1: levelMid + levelHalf, uEnd: (431 - MARK.cx) / MARK.unit } as const;

const slantA = toPlane([238.75, 20]);
const slantB = toPlane([169.5, 400]);
const slantLen = Math.hypot(slantB[0] - slantA[0], slantB[1] - slantA[1]);
/** The slanted bar: its direction (down the bar), its normal (toward the
    machine side, +u) and half its width, plane units. */
export const SLANT = {
  at: slantA,
  dir: [(slantB[0] - slantA[0]) / slantLen, (slantB[1] - slantA[1]) / slantLen] as P2,
  normal: [(slantB[1] - slantA[1]) / slantLen, -(slantB[0] - slantA[0]) / slantLen] as P2,
  half: (23.12 / 2 / MARK.unit) * GAP,
  /** where it runs out past the rim at the top: the mark's y 0 */
  vEnd: (0 - MARK.cy) / MARK.unit,
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

/** The stepped block at the crossing: the bar path's own outline there (mark
    units), widened with the channels about the crossing. In the mark it is
    solid gold; here it is a gold pillar standing in the channels. */
export const BLOCK: P2[] = (
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
)
  .map(toPlane)
  .map(([u, v]) => [CROSSING[0] + (u - CROSSING[0]) * GAP, CROSSING[1] + (v - CROSSING[1]) * GAP] as P2);

/** The ring of the mark, measured from the logo every 4° round the ring's
    centre (angle from the right, clockwise as seen, y down): its inner and
    outer radius in mark units, 0 where it is broken (where the bars leave). */
const RING: [number, number, number][] = [
  [0, 0, 0], [4, 0, 0], [8, 188.5, 202.8], [12, 189.8, 202.5], [16, 190.8, 202.5], [20, 192, 202.2], [24, 193, 202.2], [28, 194.2, 202.2],
  [32, 195.2, 202.2], [36, 196.2, 202.2], [40, 196.8, 202.5], [44, 197.5, 202.8], [48, 198, 203], [52, 198.5, 203.2], [56, 198.8, 203.8],
  [60, 199, 204], [64, 199, 204.5], [68, 198.8, 204.8], [72, 198.5, 205], [76, 197.5, 205.2], [80, 196.8, 205.5], [84, 195.5, 205.8],
  [88, 194.2, 206.2], [92, 192.5, 206.5], [96, 191.2, 206.8], [100, 189.2, 207], [104, 187.8, 207.5], [108, 186.2, 207.8], [112, 184.8, 207.8],
  [116, 183.5, 208.2], [120, 182.5, 208.5], [124, 181.5, 208.8], [128, 180.8, 208.8], [132, 180.2, 209.2], [136, 179.8, 209.5], [140, 179.8, 209.8],
  [144, 179.8, 209.8], [148, 180, 210], [152, 180.2, 210], [156, 180.8, 210], [160, 181.2, 210], [164, 182.2, 210], [168, 183.5, 209.8],
  [172, 184.5, 209.8], [176, 185.8, 209.5], [180, 187.2, 209.5], [184, 188.5, 208.8], [188, 189.8, 208.5], [192, 191.2, 208.2], [196, 193, 207.8],
  [200, 194, 207.2], [204, 195.2, 206.8], [208, 196.5, 206.2], [212, 197.5, 206], [216, 198.2, 205.8], [220, 198.5, 205.5], [224, 199, 205.2],
  [228, 199.2, 205], [232, 199.2, 205], [236, 199.2, 205.2], [240, 199.2, 205.2], [244, 198.8, 205.2], [248, 198, 205.5], [252, 197.2, 205.5],
  [256, 196, 205.8], [260, 195, 206], [264, 193.5, 206], [268, 192.5, 206.2], [272, 0, 0], [276, 0, 0], [280, 0, 0], [284, 0, 0],
  [288, 186.2, 206.8], [292, 185.2, 206.8], [296, 184.5, 206.8], [300, 183.5, 206.8], [304, 183, 206.8], [308, 182.8, 206.5], [312, 182.2, 206.5],
  [316, 182, 206.2], [320, 182, 206.2], [324, 182, 206], [328, 182, 205.8], [332, 182.2, 205.8], [336, 182.2, 205.2], [340, 182.8, 205],
  [344, 183.2, 204.5], [348, 183.8, 204.2], [352, 186.2, 203.8], [356, 0, 0],
];

/** The crescent as plane polygons, the ring thinned toward its outer edge by
    `thin` (1 is the logo's own band) and set on the drum's rim: one polygon
    per unbroken run, each its outer edge out and its inner edge back. */
export function crescentOf(thin: number): P2[][] {
  const runs: P2[][] = [];
  let outer: P2[] = [];
  let inner: P2[] = [];
  const flush = () => {
    if (outer.length > 1) runs.push([...outer, ...inner.reverse()]);
    outer = [];
    inner = [];
  };
  const scale = R / 206;
  for (let i = 0; i <= RING.length * 4; i++) {
    const deg = i % 360;
    const a = Math.floor(deg / 4);
    const b = (a + 1) % RING.length;
    const f = (deg % 4) / 4;
    const [, i0, o0] = RING[a]!;
    const [, i1, o1] = RING[b]!;
    if (!o0 || !o1) {
      flush();
      if (i >= 360) break;
      continue;
    }
    const ro = Math.min(R, (o0 + (o1 - o0) * f) * scale);
    const ri = (i0 + (i1 - i0) * f) * scale;
    const rIn = ro - (ro - ri) * thin;
    const t = (deg * Math.PI) / 180;
    outer.push([Math.cos(t) * ro, Math.sin(t) * ro]);
    inner.push([Math.cos(t) * rIn, Math.sin(t) * rIn]);
    if (i >= 360 && deg === 8) break;
  }
  flush();
  return runs;
}

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
        // one storey a step
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
