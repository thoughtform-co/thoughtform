/**
 * The machine-mind lab's shared surface (owner, 2026-10-17: "right now it
 * just feels like plateaus … make it look like an actual machine mind while
 * still retaining the beautiful 3D shape").
 *
 * The keynote brain's own hemispheres, brainIso's superellipse and lobe
 * ripple on its axes and through its camera, lofted into ONE smooth hull
 * instead of nineteen extruded plates. The anatomy kit names what the plates
 * did ("shaded as a staircase of flat tone blocks … read as broken. Shade
 * curved surfaces smoothly", `craft.md`): here every facet's tone comes from
 * its vertices' light, cut into the kit's bands along the band's own
 * iso-line, so a tone boundary runs smooth across the dome and never steps.
 *
 *   hullPoint    a point on the hull; fold 1, carve 0 is brainIso's
 *                `contourPoint` at the dome's scale, exactly
 *   makeHull     the hull of one hemisphere seen from a view: vertices,
 *                normals, light, facets with facing and depth
 *   hullSvg      the hull painted back to front in a ramp of tones
 *   at / onHull  a point, or a routed trace, on the surface: traces are
 *                routed in (u, w) = (t × T_UNIT, z), level, plumb or 45°,
 *                then wrapped onto the hull
 *
 * Brain axes as brainIso's: L across (+ right), F toward the viewer at the
 * isometric, z up; t runs round a hemisphere's contour (0 lateral, π/2 the
 * front, π the medial wall, 3π/2 the back).
 *
 * ⚠ PURE: strings and numbers, like brainIso. A direction's picture is drawn
 * once per pose and theme and painted through a canvas.
 */

import { BRAIN_VIEW_ISO, brainIsoBox, brainIsoStyle, HEMI, LC, W, projOf, upScale, downScale, type BrainIsoBox, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { cameraOf, depthOf, iso, type Flat, type Projection } from "@/components/arcs/figures/foundation/isoKit";

export type Side = -1 | 1;
export type V3 = [number, number, number];

// ─── vectors ────────────────────────────────────────────────────────────────

export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const unit3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// ─── the shape ──────────────────────────────────────────────────────────────

const sgnPow = (v: number, p: number) => Math.sign(v) * Math.abs(v) ** p;

/** The lateral half of brainIso's lobe ripple (the gyri; 0 on the medial
    wall), whose phase drifts with height. Range about ±0.075. */
export function gyriAt(t: number, z: number): number {
  const ph = z * 0.045;
  return Math.max(0, Math.cos(t)) * (0.045 * Math.sin(5 * t + ph) + 0.03 * Math.sin(9 * t - ph * 1.7));
}

/** The whole ripple brainIso folds its contours with (`contourPoint`'s lobe,
    less one). */
export const rippleAt = (t: number, z: number) => gyriAt(t, z) + 0.025 * Math.sin(3 * t + 0.6);

/** The fold at (t, z) as −1 … 1: positive on a gyrus' crest, negative in a
    sulcus. Every direction folds on this one anatomy. */
export const foldAt = (t: number, z: number) => gyriAt(t, z) / 0.075;

/** The dome's scale at height z: brainIso's, above the equator and under it. */
export const scaleAt = (z: number) => (z >= 0 ? upScale(z) : downScale(z));

/** The floor and the crown of the hull. */
export const Z_FLOOR = -HEMI.down;
export const Z_CROWN = HEMI.up;

export interface HullShape {
  /** How deep the gyri fold, as a share of brainIso's ripple (1). */
  fold?: number;
  /** Sulci cut inward along the ripple's troughs: the radius lost at a
      trough's floor, as a share (0.04 is four per cent). */
  carve?: number;
  /** A brain's anatomy over brainIso's outline (owner, 2026-10-17: "let's
      make sure it looks a bit more like a brain"), 0 none … 1 whole: a
      brain's proportions (longer and lower, widest behind the middle), the
      temporal lobe swelling under a Sylvian fissure that rises toward the
      back, the frontal lobe's underside tucked over the temporal pole. */
  brain?: number;
  /** With `brain`, the sulci cut into the surface along `sulcusAt`'s zero
      line: the radius lost at a sulcus' floor, as a share. Needs a fine
      grid (`BRAIN_GRID`); at the default grid draw `sulciPaths` instead. */
  sulci?: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const bell = (x: number, at: number, w: number) => Math.exp(-(((x - at) / w) ** 2));

/** The anatomy `brain` adds at (t, z), as factors on the contour: `width`
    on the lateral reach, `length` front to back, `groove` the Sylvian
    fissure's cut, `drop` how far the point sinks (the temporal lobe hangs
    lower), `height` the dome's scale. `fb` is −1 at the back, +1 at the
    front. */
export function anatomyAt(t: number, z: number, fb: number, k: number) {
  const lat = Math.max(0, Math.cos(t));
  // the temporal lobe: the lateral belly, front and middle, swelling under the fissure
  const temporal = lat ** 1.4 * bell(fb, 0.22, 0.42) * bell(z, -22, 28);
  // the Sylvian fissure: from the temporal pole, rising toward the back
  const zf = 6 + 40 * clamp01((0.62 - fb) / 1.05);
  const span = smooth(-0.5, -0.22, fb) * (1 - smooth(0.62, 0.82, fb));
  const groove = lat ** 1.2 * span * bell(z, zf, 6.5);
  // the frontal lobe's orbital underside, tucked up over the temporal pole
  const orbital = smooth(0.4, 0.85, fb) * smooth(-4, -30, z) * (1 - 0.6 * lat);
  return {
    width: 1 + k * (-0.16 + 0.07 * -fb + 0.1 * temporal - 0.08 * orbital),
    length: 1 + k * (0.06 - 0.05 * orbital),
    groove: k * groove,
    height: 1 - k * (z >= 0 ? 0.22 : 0.12),
    drop: k * (5 * temporal - 4 * orbital),
  };
}

/** The sulci's field on a brain hull: a smooth meander, warped in three
    dimensions so its zero line wanders the way a cortex's sulci do (closed
    loops and long folds, no grid). Negative and positive are gyri; the
    sulcus is where it crosses zero. Read on the hull's unfolded point, so
    both hemispheres and every grid see the same anatomy. */
export function sulcusAt(side: Side, t: number, z: number): number {
  const [l, f, h] = hullPoint(side, t, z, { fold: 0, brain: 1 });
  const x = f / 34;
  const y = h / 30;
  const w = (l - side * LC) / 30 + side * 0.7;
  const x2 = x + 0.85 * Math.sin(1.6 * y + 0.7 * w + 1.3);
  const y2 = y + 0.85 * Math.sin(1.4 * x + 0.9 * w + 0.4);
  const w2 = w + 0.6 * Math.sin(1.1 * x + 1.2 * y + 2.2);
  return (Math.sin(1.9 * x2 + 0.6 * y2) * Math.cos(1.3 * y2 - 0.7 * w2) + 0.55 * Math.sin(2.6 * w2 + 1.1 * x2 - 0.8 * y2)) / 1.55;
}

/** A point on the hull at contour angle t and height z, in brain axes
    [l, f, z]. With `fold` 1 and `carve` 0 it is brainIso's
    `contourPoint(side, scaleAt(z), t, z)`. */
export function hullPoint(side: Side, t: number, z: number, { fold = 1, carve = 0, brain = 0, sulci = 0 }: HullShape = {}): V3 {
  const s = scaleAt(z);
  let u = HEMI.a * sgnPow(Math.cos(t), 2 / HEMI.n);
  const sv = sgnPow(Math.sin(t), 2 / HEMI.n);
  let v = HEMI.b * sv;
  const g = gyriAt(t, z);
  let lobe = 1 + fold * g + 0.025 * Math.sin(3 * t + 0.6);
  if (carve > 0) lobe -= carve * Math.max(0, -g / 0.075) ** 3;
  if (u < 0) u *= HEMI.medial;
  const fb = v / HEMI.b;
  u *= (1 - 0.12 * fb) * lobe;
  v *= lobe;
  if (brain <= 0) return [side * (LC + u * s), v * s, z];
  const a = anatomyAt(t, z, fb, brain);
  let cut = 1 - 0.1 * a.groove;
  if (sulci > 0) cut -= sulci * bell(sulcusAt(side, t, z), 0, 0.13);
  u *= a.width * cut;
  v *= a.length * (1 - 0.35 * (1 - cut));
  return [side * (LC + u * s), v * s, z * a.height - a.drop];
}

/** The grid a carved brain (`sulci`) needs so its grooves are drawn, not
    aliased. */
export const BRAIN_GRID = { cols: 280, lower: 18, upper: 72 };

// ─── the camera and the light ───────────────────────────────────────────────

/** Toward the viewer, in the kit's world. */
export function viewVector(view: BrainView): V3 {
  const { sinA, cosA, sinE, cosE } = cameraOf(projOf(view));
  return [cosA * cosE, sinA * cosE, sinE];
}

/** A light set relative to the screen: `side` −1 from the left, +1 from the
    right; `up` how far it comes from above; `toward` how far from the
    viewer's side. The kit's own light is (−1, 1.2, 0): from the upper left,
    the light every extruded wall in brainIso is shaded by. */
export function lightVector(view: BrainView, side = -1, up = 1.2, toward = 0): V3 {
  const { sinA, cosA, sinE, cosE } = cameraOf(projOf(view));
  const right: V3 = [sinA, -cosA, 0];
  const viewer: V3 = [cosA * cosE, sinA * cosE, sinE];
  return unit3(add3(add3(mul3(right, side), [0, 0, up]), mul3(viewer, toward)));
}

/** The far hemisphere first: the order two hemispheres are painted in. */
export function sidesFarFirst(view: BrainView = BRAIN_VIEW_ISO): Side[] {
  const p = projOf(view);
  return ([-1, 1] as Side[]).sort((a, b) => depthOf(W(a * LC, 0, 0), p) - depthOf(W(b * LC, 0, 0), p));
}

// ─── the hull ───────────────────────────────────────────────────────────────

export interface HullGrid {
  /** Columns round the contour. */
  cols: number;
  /** Rows under the equator. */
  lower: number;
  /** Rows over it, closing on the crown. */
  upper: number;
}
export const HULL_GRID: HullGrid = { cols: 168, lower: 10, upper: 40 };

/** The rows' heights, floor to crown: denser where the hull turns fastest
    (the belly's floor, the dome's crown). */
export function rowHeights({ lower, upper }: HullGrid = HULL_GRID): number[] {
  const zs: number[] = [];
  for (let i = 0; i < lower; i++) zs.push(Z_FLOOR * Math.cos((Math.PI / 2) * (i / lower)));
  for (let i = 0; i <= upper; i++) zs.push(Z_CROWN * Math.sin((Math.PI / 2) * (i / upper)));
  return zs;
}

export interface Vertex {
  t: number;
  z: number;
  /** Brain axes. */
  b: V3;
  /** The kit's world. */
  w: V3;
  /** Outward unit normal, world. */
  n: V3;
  xy: Flat;
  /** Light on it: the unit normal against the unit light. */
  lit: number;
}

export interface Facet {
  r: number;
  c: number;
  /** Corners in winding order: (r, c), (r, c+1), (r+1, c+1), (r+1, c). */
  v: [Vertex, Vertex, Vertex, Vertex];
  facing: boolean;
  depth: number;
  /** Outward unit normal, world. */
  n: V3;
  lit: number;
}

export interface Hull {
  side: Side;
  view: BrainView;
  P: Projection;
  shape: HullShape;
  light: V3;
  toward: V3;
  zs: number[];
  cols: number;
  /** vertices[row][col], col wrapping at `cols`. */
  vertices: Vertex[][];
  facets: Facet[];
  /** A point on the surface (not on the grid). */
  at(t: number, z: number): SurfacePoint;
}

export interface SurfacePoint {
  t: number;
  z: number;
  b: V3;
  w: V3;
  n: V3;
  xy: Flat;
  facing: boolean;
  depth: number;
  lit: number;
}

export interface HullOptions {
  view?: BrainView;
  shape?: HullShape;
  grid?: HullGrid;
  /** The light, world (default the kit's: `lightVector(view)`). */
  light?: V3;
  /** The shape the LIGHT is computed from, when it is not the shape drawn:
      `{ fold: 0.25 }` shades the brain as a smooth turned form while its
      outline and its folds stay the real ones, so the tone bands sweep the
      dome instead of breaking into blotches over every gyrus. Facing, depth
      and the silhouette always come from the drawn shape. It inherits the
      drawn shape's `brain` unless it sets its own. */
  lightShape?: HullShape;
}

/** The outward normal at (t, z), world, by central differences on the
    analytic surface. The crown is a pole: its normal is straight up. */
export function hullNormal(side: Side, t: number, z: number, shape: HullShape = {}): V3 {
  return normalAt(side, t, z, shape);
}

function normalAt(side: Side, t: number, z: number, shape: HullShape): V3 {
  if (z >= Z_CROWN - 1e-6) return [0, 0, 1];
  const et = 1e-3;
  const ez = 0.05;
  const z0 = Math.max(Z_FLOOR, z - ez);
  const z1 = Math.min(Z_CROWN - 1e-4, z + ez);
  const dt = sub3(W(...hullPoint(side, t + et, z, shape)), W(...hullPoint(side, t - et, z, shape)));
  const dz = sub3(W(...hullPoint(side, t, z1, shape)), W(...hullPoint(side, t, z0, shape)));
  let n = unit3(cross3(dt, dz));
  const p = W(...hullPoint(side, t, z, shape));
  const c = W(side * LC, 0, 20);
  if (dot3(n, sub3(p, c)) < 0) n = mul3(n, -1);
  return n;
}

/** The hull of one hemisphere, seen from `view`. */
export function makeHull(side: Side, { view = BRAIN_VIEW_ISO, shape = {}, grid = HULL_GRID, light, lightShape }: HullOptions = {}): Hull {
  const P = projOf(view);
  const L = light ?? lightVector(view);
  const V = viewVector(view);
  const zs = rowHeights(grid);
  const C = grid.cols;
  // the light's shape inherits the drawn one's anatomy (`brain`) unless it says otherwise
  const lit = lightShape ? { brain: shape.brain, ...lightShape } : null;
  const litAt = (t: number, z: number, n: V3) => dot3(lit ? normalAt(side, t, z, lit) : n, L);
  const vertex = (t: number, z: number): Vertex => {
    const b = hullPoint(side, t, z, shape);
    const w = W(...b);
    const n = normalAt(side, t, z, shape);
    return { t, z, b, w, n, xy: iso(w, P), lit: litAt(t, z, n) };
  };
  const vertices = zs.map((z) => Array.from({ length: C }, (_, c) => vertex((c / C) * Math.PI * 2, z)));
  const facets: Facet[] = [];
  for (let r = 0; r < zs.length - 1; r++) {
    for (let c = 0; c < C; c++) {
      const c1 = (c + 1) % C;
      const v: Facet["v"] = [vertices[r][c], vertices[r][c1], vertices[r + 1][c1], vertices[r + 1][c]];
      const avg = unit3(add3(add3(v[0].n, v[1].n), add3(v[2].n, v[3].n)));
      // the geometric normal decides facing; at the crown a quad is a
      // triangle, so take whichever diagonal pair is not degenerate
      let n = cross3(sub3(v[2].w, v[0].w), sub3(v[3].w, v[1].w));
      if (Math.hypot(...n) < 1e-9) n = avg;
      n = unit3(n);
      if (dot3(n, avg) < 0) n = mul3(n, -1);
      const centre: V3 = mul3(add3(add3(v[0].w, v[1].w), add3(v[2].w, v[3].w)), 0.25);
      facets.push({ r, c, v, facing: dot3(n, V) > 1e-6, depth: depthOf(centre, P), n, lit: (v[0].lit + v[1].lit + v[2].lit + v[3].lit) / 4 });
    }
  }
  const at = (t: number, z: number): SurfacePoint => {
    const zc = Math.max(Z_FLOOR, Math.min(Z_CROWN, z));
    const b = hullPoint(side, t, zc, shape);
    const w = W(...b);
    const n = normalAt(side, t, zc, shape);
    return { t, z: zc, b, w, n, xy: iso(w, P), facing: dot3(n, V) > 0, depth: depthOf(w, P), lit: litAt(t, zc, n) };
  };
  return { side, view, P, shape, light: L, toward: V, zs, cols: C, vertices, facets, at };
}

// ─── painting the hull ──────────────────────────────────────────────────────

const tenth = (value: number) => {
  const text = (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, "");
  return text === "-0" ? "0" : text;
};

/** A closed polygon as path data, at the kit's tenth of a unit. */
export const polyD = (pts: readonly Flat[]) => (pts.length ? pts.map(([x, y], i) => `${i ? "L" : "M"}${tenth(x)} ${tenth(y)}`).join("") + "Z" : "");

/** An open polyline as path data. */
export const lineD = (pts: readonly Flat[]) => (pts.length > 1 ? pts.map(([x, y], i) => `${i ? "L" : "M"}${tenth(x)} ${tenth(y)}`).join("") : "");

/** Mix two hex colours: 0 is `a`, 1 is `b`. */
export function mix(a: string, b: string, k: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * k);
  return `#${((1 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)).toString(16).slice(1)}`;
}

/** `n` tones from `dark` to `light`, evenly (or by `curve`, < 1 opening the
    lit end). */
export function rampOf(dark: string, light: string, n: number, curve = 1): string[] {
  return Array.from({ length: n }, (_, i) => mix(dark, light, (i / Math.max(1, n - 1)) ** curve));
}

/** The kit's band thresholds on light · normal (`lathe.mjs` `BANDS`), for
    five tones; any other count spreads them over the same span. */
export function bandsFor(tones: number): number[] {
  if (tones === 5) return [0, 0.2, 0.42, 0.62];
  return Array.from({ length: tones - 1 }, (_, i) => -0.05 + (0.75 * (i + 1)) / tones);
}

export interface HullPaint {
  /** A tone per band, least lit first. */
  ramp: readonly string[];
  /** Thresholds on light · normal, ascending; one fewer than the ramp
      (default `bandsFor(ramp.length)`). */
  bands?: readonly number[];
  /** The silhouette's stroke; absent, none. */
  edge?: string;
  edgeWidth?: number;
  /** The hairline each piece is stroked with in its own fill, so no seam
      shows between facets. */
  seam?: number;
  /** Paint the back faces too (a glass shell's far wall); default no. */
  back?: boolean;
  /** Only these facets (after facing). */
  filter?: (f: Facet) => boolean;
  /** Depth slab, in units: inside one slab the pieces are grouped by tone,
      so a hemisphere is a few hundred paths and no seams, not one path per
      change of tone (default 4; 0 paints strictly facet by facet). */
  slab?: number;
}

interface Cut {
  x: number;
  y: number;
  s: number;
}

/** One side of a threshold on a polygon whose corners carry a value
    (Sutherland–Hodgman on a scalar): the part with s ≥ th, or s ≤ th. */
function clipAt(poly: Cut[], th: number, above: boolean): Cut[] {
  const out: Cut[] = [];
  const inside = (p: Cut) => (above ? p.s >= th : p.s <= th);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ia = inside(a);
    const ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) {
      const k = (th - a.s) / (b.s - a.s);
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, s: th });
    }
  }
  return out;
}

const bandOf = (s: number, bands: readonly number[]) => {
  let b = 0;
  while (b < bands.length && s >= bands[b]) b++;
  return b;
};

/** A facet cut into its bands: each piece with its band. A facet wholly in
    one band is one piece. It bands on the light unless `value` names
    another number per corner (a stratum's height, an edge-on angle, a
    region's distance). */
export function facetBands(f: Facet, bands: readonly number[], value: (v: Vertex) => number = (v) => v.lit): { band: number; pts: Flat[] }[] {
  const poly: Cut[] = f.v.map((v) => ({ x: v.xy[0], y: v.xy[1], s: value(v) }));
  const lo = Math.min(...poly.map((p) => bandOf(p.s, bands)));
  const hi = Math.max(...poly.map((p) => bandOf(p.s, bands)));
  if (lo === hi) return [{ band: lo, pts: poly.map((p) => [p.x, p.y]) }];
  const out: { band: number; pts: Flat[] }[] = [];
  for (let b = lo; b <= hi; b++) {
    let piece = poly;
    if (b > 0) piece = clipAt(piece, bands[b - 1], true);
    if (b < bands.length && piece.length) piece = clipAt(piece, bands[b], false);
    if (piece.length >= 3) out.push({ band: b, pts: piece.map((p) => [p.x, p.y]) });
  }
  return out;
}

/** The facets to paint, back to front. */
export function paintOrder(h: Hull, { back = false, filter }: { back?: boolean; filter?: (f: Facet) => boolean } = {}): Facet[] {
  return h.facets.filter((f) => (back || f.facing) && (!filter || filter(f))).sort((a, b) => a.depth - b.depth);
}

/** The hull painted back to front in the ramp's tones, then its silhouette.
    Pieces are grouped by tone inside thin depth slabs (`slab`), each group
    one path stroked in its own fill, so no seam shows between facets. */
export function hullSvg(h: Hull, { ramp, bands = bandsFor(ramp.length), edge, edgeWidth = 0.6, seam = 0.5, back = false, filter, slab = 4 }: HullPaint): string {
  const out: string[] = [];
  const emit = (tone: number, d: string) => {
    if (d) out.push(`<path fill="${ramp[tone]}" stroke="${ramp[tone]}" stroke-width="${seam}" stroke-linejoin="round" d="${d}"/>`);
  };
  let key = Number.NaN;
  let groups: string[] = [];
  const flush = () => {
    groups.forEach((d, tone) => emit(tone, d));
    groups = [];
  };
  for (const f of paintOrder(h, { back, filter })) {
    const k = slab > 0 ? Math.floor(f.depth / slab) : f.r * h.cols + f.c;
    if (k !== key) {
      flush();
      key = k;
    }
    for (const piece of facetBands(f, bands)) {
      const b = Math.min(ramp.length - 1, piece.band);
      groups[b] = (groups[b] ?? "") + polyD(piece.pts);
    }
  }
  flush();
  if (edge) out.push(`<path fill="none" stroke="${edge}" stroke-width="${edgeWidth}" stroke-linecap="round" d="${silhouetteD(h)}"/>`);
  return `<g class="mm-hull">${out.join("")}</g>`;
}

/** The hull's open floor ring (its belly ends at z −58 on a half-scale
    rim): the part of it that is seen. A shell seen face on shows it as its
    lower edge; `silhouetteD` leaves it out. */
export function mouthD(h: Hull): string {
  const ring = h.vertices[0];
  const hidden = occluder(h);
  const segs: string[] = [];
  for (let c = 0; c < ring.length; c++) {
    const a = ring[c];
    const b = ring[(c + 1) % ring.length];
    const mid: Flat = [(a.xy[0] + b.xy[0]) / 2, (a.xy[1] + b.xy[1]) / 2];
    if (!hidden(mid, depthOf(mul3(add3(a.w, b.w), 0.5), h.P))) segs.push(lineD([a.xy, b.xy]));
  }
  return segs.join("");
}

/** Whether a screen point lies inside a polygon (even-odd). */
export function inside([x, y]: Flat, poly: readonly Flat[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

const occluders = new WeakMap<Hull, (xy: Flat, depth: number) => boolean>();
const BIN = 8;

/** A test for whether a point of the hull at `depth` is hidden behind a
    nearer facet that faces the viewer (a fold in front of it). Built once
    per hull, its facets binned on the screen. */
export function occluder(h: Hull): (xy: Flat, depth: number) => boolean {
  const known = occluders.get(h);
  if (known) return known;
  // a facet hides a point only when even its farthest corner is nearer than
  // the point, so a facet never hides its own edges or its neighbours'
  const bins = new Map<string, { near: number; q: Flat[] }[]>();
  for (const f of h.facets) {
    if (!f.facing) continue;
    const q = f.v.map((v) => v.xy);
    const near = Math.min(...f.v.map((v) => depthOf(v.w, h.P)));
    const xs = q.map((p) => p[0]);
    const ys = q.map((p) => p[1]);
    for (let bx = Math.floor(Math.min(...xs) / BIN); bx <= Math.floor(Math.max(...xs) / BIN); bx++) {
      for (let by = Math.floor(Math.min(...ys) / BIN); by <= Math.floor(Math.max(...ys) / BIN); by++) {
        const k = `${bx},${by}`;
        const list = bins.get(k);
        if (list) list.push({ near, q });
        else bins.set(k, [{ near, q }]);
      }
    }
  }
  const test = (xy: Flat, depth: number) => (bins.get(`${Math.floor(xy[0] / BIN)},${Math.floor(xy[1] / BIN)}`) ?? []).some((o) => o.near > depth + 0.5 && inside(xy, o.q));
  occluders.set(h, test);
  return test;
}

/** Whether a point of the surface is seen: it faces the viewer and no nearer
    fold covers it. */
export const seen = (h: Hull, s: SurfacePoint) => s.facing && !occluder(h)(s.xy, s.depth);

/** The hull's silhouette: every grid edge between a facet that faces the
    viewer and one that does not, less what a nearer fold hides. */
export function silhouetteD(h: Hull): string {
  const C = h.cols;
  const R = h.zs.length - 1;
  const F = (r: number, c: number) => h.facets[r * C + ((c + C) % C)];
  const hidden = occluder(h);
  const segs: string[] = [];
  const seg = (a: Vertex, b: Vertex) => {
    const mid: Flat = [(a.xy[0] + b.xy[0]) / 2, (a.xy[1] + b.xy[1]) / 2];
    if (!hidden(mid, depthOf(mul3(add3(a.w, b.w), 0.5), h.P))) segs.push(lineD([a.xy, b.xy]));
  };
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const f = F(r, c);
      const right = F(r, c + 1);
      if (f.facing !== right.facing) seg(f.v[1], f.v[2]);
      if (r + 1 < R) {
        const up = F(r + 1, c);
        if (f.facing !== up.facing) seg(f.v[3], f.v[2]);
      }
    }
  }
  return segs.join("");
}

// ─── on the surface ─────────────────────────────────────────────────────────

/** Units of u per radian of t: the circumference a trace is routed along,
    so a step in u is about a step in z on the hull's flank. */
export const T_UNIT = 120;
/** u at the contour's lateral point, front, medial wall and back. */
export const U_LATERAL = 0;
export const U_FRONT = (Math.PI / 2) * T_UNIT;
export const U_MEDIAL = Math.PI * T_UNIT;
export const U_BACK = (Math.PI * 3 / 2) * T_UNIT;
export const U_ROUND = Math.PI * 2 * T_UNIT;

export type UW = readonly [number, number];

/** (u, w) to (t, z). */
export const tzOf = ([u, w]: UW): [number, number] => [u / T_UNIT, w];

/** A routed polyline in (u, w) wrapped onto the hull, sampled every `step`
    units: the runs that face the viewer, in screen points. */
export function onHull(h: Hull, pts: readonly UW[], step = 2): Flat[][] {
  const runs: Flat[][] = [];
  let run: Flat[] = [];
  const take = (u: number, w: number) => {
    const s = h.at(u / T_UNIT, w);
    if (seen(h, s)) run.push(s.xy);
    else if (run.length) {
      runs.push(run);
      run = [];
    }
  };
  for (let i = 0; i < pts.length - 1; i++) {
    const [u0, w0] = pts[i];
    const [u1, w1] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, w1 - w0) / step));
    for (let k = i ? 1 : 0; k <= n; k++) take(u0 + ((u1 - u0) * k) / n, w0 + ((w1 - w0) * k) / n);
  }
  if (run.length) runs.push(run);
  return runs.filter((r) => r.length > 1);
}

/** The same, as path data. */
export const hullPathD = (h: Hull, pts: readonly UW[], step = 2) =>
  onHull(h, pts, step)
    .map((r) => lineD(r))
    .join("");

/** Whether (u, w) is seen: facing the viewer, behind no nearer fold. */
export const facingAt = (h: Hull, u: number, w: number) => seen(h, h.at(u / T_UNIT, w));

/** A closed region of the surface (a pour, a die block, a pad), its outline
    in (u, w) sampled every `step` units; null unless every sample faces the
    viewer, so a region never wraps past the silhouette. */
export function patchOnHull(h: Hull, poly: readonly UW[], step = 2): Flat[] | null {
  const pts: Flat[] = [];
  for (let i = 0; i < poly.length; i++) {
    const [u0, w0] = poly[i];
    const [u1, w1] = poly[(i + 1) % poly.length];
    const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, w1 - w0) / step));
    for (let k = 0; k < n; k++) {
      const s = h.at((u0 + ((u1 - u0) * k) / n) / T_UNIT, w0 + ((w1 - w0) * k) / n);
      if (!seen(h, s)) return null;
      pts.push(s.xy);
    }
  }
  return pts;
}

/** A round pad on the surface at (u, w), radius `r` in (u, w) units; null
    when it faces away. */
export function padOnHull(h: Hull, u: number, w: number, r: number, n = 12): Flat[] | null {
  const ring: UW[] = Array.from({ length: n }, (_, i) => [u + r * Math.cos((i / n) * Math.PI * 2), w + r * Math.sin((i / n) * Math.PI * 2)] as const);
  return patchOnHull(h, ring, r);
}

/** The sulci as lines in (t, z): where `sulcusAt` crosses `level`, traced
    by marching squares over a param grid and chained into polylines. View
    free: map them with `sulciPaths`. */
export function sulciLines(side: Side, { cols = 320, rows = 150, zMin = Z_FLOOR + 6, zMax = Z_CROWN - 6, level = 0 }: { cols?: number; rows?: number; zMin?: number; zMax?: number; level?: number } = {}): [number, number][][] {
  const T = cols;
  const zs = Array.from({ length: rows + 1 }, (_, i) => zMin + ((zMax - zMin) * i) / rows);
  const ts = Array.from({ length: T }, (_, j) => (j / T) * Math.PI * 2);
  const n = zs.map((z) => ts.map((t) => sulcusAt(side, t, z) - level));
  // a crossing on an edge, keyed by the edge: "h i j" from (i, j) to (i, j+1), "v i j" from (i, j) to (i+1, j)
  const cross = new Map<string, [number, number]>();
  const at = (key: string): [number, number] | null => {
    const known = cross.get(key);
    if (known) return known;
    const [kind, si, sj] = key.split(" ");
    const i = Number(si);
    const j = Number(sj);
    const j1 = (j + 1) % T;
    const [a, b, ta, tb, za, zb] = kind === "h" ? [n[i][j], n[i][j1], ts[j], j1 ? ts[j1] : Math.PI * 2, zs[i], zs[i]] : [n[i][j], n[i + 1][j], ts[j], ts[j], zs[i], zs[i + 1]];
    if (a > 0 === b > 0) return null;
    const k = a / (a - b);
    const p: [number, number] = [(ta + (tb - ta) * k) % (Math.PI * 2), za + (zb - za) * k];
    cross.set(key, p);
    return p;
  };
  const links = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    links.set(a, [...(links.get(a) ?? []), b]);
    links.set(b, [...(links.get(b) ?? []), a]);
  };
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < T; j++) {
      const edges = [`h ${i} ${j}`, `v ${i} ${(j + 1) % T}`, `h ${i + 1} ${j}`, `v ${i} ${j}`].filter((e) => at(e));
      if (edges.length === 2) link(edges[0], edges[1]);
      else if (edges.length === 4) {
        // a saddle: pair by the cell's centre
        const j1 = (j + 1) % T;
        const c = (n[i][j] + n[i][j1] + n[i + 1][j1] + n[i + 1][j]) / 4;
        if (c > 0 === n[i][j] > 0) {
          link(edges[0], edges[1]);
          link(edges[2], edges[3]);
        } else {
          link(edges[0], edges[3]);
          link(edges[1], edges[2]);
        }
      }
    }
  }
  const used = new Set<string>();
  const lines: [number, number][][] = [];
  const walk = (start: string) => {
    const keys = [start];
    used.add(start);
    for (let dir = 0; dir < 2; dir++) {
      let cur = start;
      for (;;) {
        const next = (links.get(cur) ?? []).find((k) => !used.has(k));
        if (!next) break;
        used.add(next);
        if (dir === 0) keys.push(next);
        else keys.unshift(next);
        cur = next;
      }
    }
    // a loop closes on its first point
    if (keys.length > 2 && (links.get(keys[keys.length - 1]) ?? []).includes(keys[0])) keys.push(keys[0]);
    return keys.map((k) => cross.get(k)!);
  };
  // open chains first (ends with one link), then the closed loops
  for (const [k, v] of links) if (!used.has(k) && v.length === 1) lines.push(walk(k));
  for (const k of links.keys()) if (!used.has(k)) lines.push(walk(k));
  return lines.filter((l) => l.length > 2);
}

/** The sulci of a brain hull, seen: `sulciLines` wrapped onto the hull,
    split wherever a line faces away or a nearer fold covers it, as screen
    polylines. */
export function sulciPaths(h: Hull, opts: Parameters<typeof sulciLines>[1] = {}): Flat[][] {
  const runs: Flat[][] = [];
  for (const line of sulciLines(h.side, opts)) {
    let run: Flat[] = [];
    for (const p of line) {
      const s = h.at(p[0], p[1]);
      if (seen(h, s)) run.push(s.xy);
      else {
        if (run.length > 1) runs.push(run);
        run = [];
      }
    }
    if (run.length > 1) runs.push(run);
  }
  return runs;
}

// ─── layers: level sections and routed edges ───────────────────────────────

/** The hull's point on contour angle `t` at WORLD height `H` (the parameter
    solved by bisection; height rises monotonically along a meridian even
    through the temporal lobe's drop). Clamped to the floor and the crown. */
export function atHeight(side: Side, t: number, H: number, shape: HullShape = {}): { p: V3; z: number } {
  let lo: number = Z_FLOOR;
  let hi: number = Z_CROWN;
  if (H <= hullPoint(side, t, lo, shape)[2]) return { p: hullPoint(side, t, lo, shape), z: lo };
  if (H >= hullPoint(side, t, hi, shape)[2]) return { p: hullPoint(side, t, hi, shape), z: hi };
  for (let k = 0; k < 22; k++) {
    const m = (lo + hi) / 2;
    if (hullPoint(side, t, m, shape)[2] < H) lo = m;
    else hi = m;
  }
  const z = (lo + hi) / 2;
  return { p: hullPoint(side, t, z, shape), z };
}

/** The world height range of a shape: its floor (the lowest point of the
    belly) and its crown. */
export function heightRange(shape: HullShape = {}): [number, number] {
  let floor = Infinity;
  for (let i = 0; i < 48; i++) floor = Math.min(floor, hullPoint(1, (i / 48) * Math.PI * 2, Z_FLOOR, shape)[2]);
  return [floor, hullPoint(1, 0, Z_CROWN, shape)[2]];
}

/** The hull's level section at world height `H`: a closed ring of brain-axis
    [l, f] points, one per contour angle, with each point's parameter height.
    A layer, a wafer or a board is this ring extruded. */
export function sectionAt(side: Side, H: number, shape: HullShape = {}, steps = 240): { ring: [number, number][]; zs: number[] } {
  const ring: [number, number][] = [];
  const zs: number[] = [];
  for (let i = 0; i < steps; i++) {
    const { p, z } = atHeight(side, (i / steps) * Math.PI * 2, H, shape);
    ring.push([p[0], p[1]]);
    zs.push(z);
  }
  return { ring, zs };
}

type P2 = [number, number];

/** Douglas–Peucker on a closed ring: the fewest vertices within `eps`. */
function simplifyRing(ring: readonly P2[], eps: number): P2[] {
  const dp = (pts: P2[]): P2[] => {
    if (pts.length < 3) return pts;
    const [a, b] = [pts[0], pts[pts.length - 1]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let worst = 0;
    let at = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / len;
      if (d > worst) {
        worst = d;
        at = i;
      }
    }
    if (worst <= eps) return [a, b];
    const left = dp(pts.slice(0, at + 1));
    return [...left.slice(0, -1), ...dp(pts.slice(at))];
  };
  // split the ring at its two farthest-apart points so both halves are open runs
  let far = 0;
  for (let i = 1; i < ring.length; i++) if (Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]) > Math.hypot(ring[far][0] - ring[0][0], ring[far][1] - ring[0][1])) far = i;
  const one = dp(ring.slice(0, far + 1) as P2[]);
  const two = dp([...ring.slice(far), ring[0]] as P2[]);
  return [...one.slice(0, -1), ...two.slice(0, -1)];
}

/** A closed outline redrawn as a routed board edge: long runs, every one
    level, plumb or at 45° in the plane's own axes (brain axes L and F, so
    squared to the stage), hugging the outline within about `tolerance`
    units. The outline is simplified, each edge's direction snapped to the
    nearest eighth of a turn, and neighbouring edges re-joined at their
    lines' crossing, so a curve becomes the cut, chamfered edge of a board
    (never a pixel staircase). A larger tolerance is blockier. */
export function routedOutline(ring: readonly [number, number][], tolerance: number): [number, number][] {
  const poly = simplifyRing(ring, tolerance);
  type Line = { p: P2; k: number };
  const dirOf = (k: number): P2 => [Math.cos((k * Math.PI) / 4), Math.sin((k * Math.PI) / 4)];
  let lines: Line[] = poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const k = ((Math.round(Math.atan2(b[1] - a[1], b[0] - a[0]) / (Math.PI / 4)) % 8) + 8) % 8;
    return { p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], k };
  });
  // merge neighbours that snapped to one direction (their lines averaged), drop reversals
  for (let pass = 0; pass < 8; pass++) {
    const next: Line[] = [];
    for (const l of lines) {
      const prev = next[next.length - 1];
      if (prev && prev.k === l.k) {
        const d = dirOf(l.k);
        const off = ((l.p[0] - prev.p[0]) * -d[1] + (l.p[1] - prev.p[1]) * d[0]) / 2;
        prev.p = [prev.p[0] - d[1] * off, prev.p[1] + d[0] * off];
      } else if (prev && (prev.k + 4) % 8 === l.k) continue;
      else next.push({ ...l });
    }
    if (next.length > 1 && next[0].k === next[next.length - 1].k) next.pop();
    const done = next.length === lines.length;
    lines = next;
    if (done) break;
  }
  const cross = (a: Line, b: Line): P2 => {
    const da = dirOf(a.k);
    const db = dirOf(b.k);
    const den = da[0] * db[1] - da[1] * db[0];
    if (Math.abs(den) < 1e-9) return [(a.p[0] + b.p[0]) / 2, (a.p[1] + b.p[1]) / 2];
    const s = ((b.p[0] - a.p[0]) * db[1] - (b.p[1] - a.p[1]) * db[0]) / den;
    return [a.p[0] + da[0] * s, a.p[1] + da[1] * s];
  };
  return lines.map((l, i) => cross(lines[(i - 1 + lines.length) % lines.length], l));
}

export type Region = "frontal" | "parietal" | "temporal" | "occipital" | "medial";

/** The lobe a point of the hull lies in, coarsely: enough to give each block
    of a floorplan or each cluster of chips its place. */
export function regionAt(t: number, z: number): Region {
  const c = Math.cos(t);
  const s = Math.sin(t);
  if (c < -0.55) return "medial";
  if (s < -0.5) return "occipital";
  if (s > 0.3 && z > -10) return "frontal";
  if (z < 40) return "temporal";
  return "parietal";
}

// ─── the picture ────────────────────────────────────────────────────────────

export interface MindTones {
  ink: string;
  gold: string;
  lit: string;
  green: string;
  ground: string;
}

/** The lab's tones per theme: the keynote-brain lab's (the act's) own. */
export const TONES: Record<"dark" | "light", MindTones> = {
  dark: { ink: "#ebe3d6", gold: "#caa554", lit: "#f0c86a", green: "rgb(122, 158, 106)", ground: "#0a0908" },
  light: { ink: "#2a2214", gold: "#8a6b20", lit: "#6e5216", green: "rgb(70, 108, 58)", ground: "#efe9dc" },
};

/** A whole standalone SVG document over the brain's own box (the act's
    picture box, so a direction drops in where `brainIsoSvg` was): the kit's
    sheet in the site's tones, then `css`, then `body` inside the kit's
    `.iso` group. */
export function mindSvg({ view = BRAIN_VIEW_ISO, light, tones, body, css = "", box }: { view?: BrainView; light: boolean; tones: MindTones; body: string; css?: string; box?: BrainIsoBox }): string {
  const B = box ?? brainIsoBox(view);
  const w = B.x1 - B.x0;
  const h = B.y1 - B.y0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${B.x0} ${B.y0} ${w} ${h}" width="${w}" height="${h}"><style>${brainIsoStyle({ light, ...tones })}${HULL_CSS}${css}</style><g class="iso iso-svg">${body}</g></svg>`;
}

/** The hull's strokes scale with the drawing (the kit's sheet makes every
    path a non-scaling hairline, which would open the seams once the picture
    is drawn larger than its box). */
const HULL_CSS = `.mm-hull path{vector-effect:none}`;
