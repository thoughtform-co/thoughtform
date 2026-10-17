/**
 * Floorplan's machinery (machine-mind lab, D2). PURE: strings and numbers.
 *
 *   the world plan   the hull painted facet by facet as a floorplan: cuts
 *                    (planes in the brain's space) split each facet, each
 *                    piece takes its region's ramp, its cells (families of
 *                    parallel cuts), its edges along the lanes; strokes go
 *                    over; thin depth slabs keep the painter's order
 *   lanes            a channel as a polyline in two of the three axes, the
 *                    third running through it, its bends mitred
 *   the flank        the lab's (u, w) for the parts drawn on the belly (the
 *                    pad ring): a patch sampled on the surface, whole or not
 */

import { LC, W } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, iso, type Flat } from "@/components/arcs/figures/foundation/isoKit";
import { cross3, dot3, facetBands, hullPoint, lineD, mix, mul3, paintOrder, polyD, seen, sub3, T_UNIT, unit3, Z_CROWN, Z_FLOOR, type Facet, type Hull, type HullShape, type SurfacePoint, type V3 } from "../hull";

export type P2 = readonly [number, number];
/** A convex polygon in (u, w), counter-clockwise. */
export type Poly = readonly P2[];

/** Where a drawing may land, asked of each point of the surface by where it
    stands seen from above (X across, lateral +; Y toward the front) and how
    high. */
export type Zone = (X: number, Y: number, z: number) => boolean;

/** The shape the light is taken from (the lab's `lightShape`): the folds
    eased to a quarter, so the tone bands sweep the dome. */
export const LIGHT_SHAPE: HullShape = { fold: 0.25 };

// ─── polygons in (u, w) ─────────────────────────────────────────────────────

export const rectPoly = (x0: number, x1: number, y0: number, y1: number): Poly => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** A polygon cut to a convex one (Sutherland–Hodgman). */
export function clipPoly(subject: Poly, clip: Poly): P2[] {
  let out: P2[] = [...subject];
  for (let i = 0; i < clip.length && out.length; i++) {
    const p = clip[i];
    const q = clip[(i + 1) % clip.length];
    const input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const a = input[j];
      const b = input[(j + 1) % input.length];
      const ia = cross(p, q, a) >= 0;
      const ib = cross(p, q, b) >= 0;
      if (ia) out.push(a);
      if (ia !== ib) {
        const da = cross(p, q, a);
        const db = cross(p, q, b);
        const k = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
      }
    }
  }
  return out;
}

const bboxOf = (polys: readonly Poly[]) => {
  const xs = polys.flatMap((p) => p.map((q) => q[0]));
  const ys = polys.flatMap((p) => p.map((q) => q[1]));
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

/** A polygon moved in by `d` along every edge (convex). */
export function inset(poly: Poly, d: number): P2[] {
  const n = poly.length;
  const lines = poly.map((p, i) => {
    const q = poly[(i + 1) % n];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const nx = -(q[1] - p[1]) / len;
    const ny = (q[0] - p[0]) / len;
    return { p: [p[0] + nx * d, p[1] + ny * d] as P2, v: [q[0] - p[0], q[1] - p[1]] as P2 };
  });
  return lines.map((l1, i) => {
    const l0 = lines[(i + n - 1) % n];
    const den = l0.v[0] * l1.v[1] - l0.v[1] * l1.v[0];
    if (Math.abs(den) < 1e-12) return l1.p;
    const k = ((l1.p[0] - l0.p[0]) * l1.v[1] - (l1.p[1] - l0.p[1]) * l1.v[0]) / den;
    return [l0.p[0] + l0.v[0] * k, l0.p[1] + l0.v[1] * k] as P2;
  });
}

// ─── sampling the surface ───────────────────────────────────────────────────

interface Sample {
  xy: Flat;
  lit: number;
  /** How squarely the surface faces the viewer (normal · toward). */
  face: number;
  /** Seen, inside the zone. */
  ok: boolean;
}

/** A forward-difference normal (three evaluations of the shape where the
    lab's central one spends five): a floorplan samples the hull tens of
    thousands of times. */
function normalOf(side: Hull["side"], t: number, z: number, shape: HullShape, w: V3): V3 {
  if (z >= Z_CROWN - 1e-6) return [0, 0, 1];
  const up = z + 0.05 <= Z_CROWN - 1e-4;
  const dt = sub3(W(...hullPoint(side, t + 1e-3, z, shape)) as V3, w);
  const dz = mul3(sub3(W(...hullPoint(side, t, up ? z + 0.05 : z - 0.05, shape)) as V3, w), up ? 1 : -1);
  const n = unit3(cross3(dt, dz));
  return dot3(n, sub3(w, W(side * LC, 0, 20) as V3)) < 0 ? mul3(n, -1) : n;
}

/** A point of the surface as `h.at` gives it, its light from `LIGHT_SHAPE`
    (as the hull's own is), and where it stands seen from above. */
function surfaceAt(h: Hull, t: number, z: number): SurfacePoint & { X: number; Y: number } {
  const zc = Math.max(Z_FLOOR, Math.min(Z_CROWN, z));
  const b = hullPoint(h.side, t, zc, h.shape);
  const w = W(...b) as V3;
  const n = normalOf(h.side, t, zc, h.shape, w);
  const ln = normalOf(h.side, t, zc, LIGHT_SHAPE, W(...hullPoint(h.side, t, zc, LIGHT_SHAPE)) as V3);
  return { t, z: zc, b, w, n, xy: iso(w, h.P), facing: dot3(n, h.toward) > 0, depth: depthOf(w, h.P), lit: dot3(ln, h.light), X: h.side * b[0] - LC, Y: b[1] };
}

const sampleOf = (h: Hull, u: number, w: number, zone: Zone): Sample => {
  const s = surfaceAt(h, u / T_UNIT, w);
  return { xy: s.xy, lit: s.lit, face: dot3(s.n, h.toward), ok: zone(s.X, s.Y, s.z) && seen(h, s) };
};

/** A texture fades as the surface turns away (craft: a texture ends on an
    edge or fades), in steps on how squarely it faces the viewer; step 0 is
    gone. */
const FADE = [0.1, 0.2, 0.32] as const;
const FADE_INK = [0, 0.35, 0.68, 1] as const;
const fadeOf = (face: number) => {
  let k = 0;
  while (k < FADE.length && face >= FADE[k]) k++;
  return k;
};

/** A convex (u, w) polygon on the surface as small pieces, about `cell` units
    a side, each with its corners' light; a piece is kept only when all its
    corners are seen and in the zone, split finer where that changes, so a
    patch ends on the silhouette's own turn. */
export function patchPieces(h: Hull, poly: Poly, zone: Zone, cell = 4): Sample[][] {
  const b = bboxOf([poly]);
  const nx = Math.max(1, Math.ceil((b.x1 - b.x0) / cell));
  const ny = Math.max(1, Math.ceil((b.y1 - b.y0) / cell));
  const out: Sample[][] = [];
  // a corner is shared by up to four pieces: sample it once
  const memo = new Map<string, Sample>();
  const S = (p: P2) => {
    const key = `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
    let v = memo.get(key);
    if (!v) memo.set(key, (v = sampleOf(h, p[0], p[1], zone)));
    return v;
  };
  const visit = (x0: number, x1: number, y0: number, y1: number, depth: number) => {
    const piece = clipPoly(rectPoly(x0, x1, y0, y1), poly);
    if (piece.length < 3) return;
    const ss = piece.map(S);
    const ok = ss.filter((s) => s.ok).length;
    if (ok === ss.length) out.push(ss);
    else if (ok > 0 && depth > 0) {
      const xm = (x0 + x1) / 2;
      const ym = (y0 + y1) / 2;
      visit(x0, xm, y0, ym, depth - 1);
      visit(xm, x1, y0, ym, depth - 1);
      visit(xm, x1, ym, y1, depth - 1);
      visit(x0, xm, ym, y1, depth - 1);
    }
  };
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) visit(b.x0 + ((b.x1 - b.x0) * i) / nx, b.x0 + ((b.x1 - b.x0) * (i + 1)) / nx, b.y0 + ((b.y1 - b.y0) * j) / ny, b.y0 + ((b.y1 - b.y0) * (j + 1)) / ny, 3);
  }
  return out;
}

/** The point of the lateral side at height z standing at Y (front +), on
    the screen, or null where it is not seen. */
export function lateralAt(h: Hull, Y: number, z: number): Flat | null {
  let lo = -Math.PI / 2;
  let hi = Math.PI / 2;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (hullPoint(h.side, m, z, h.shape)[1] < Y) lo = m;
    else hi = m;
  }
  const s = h.at(lo, z);
  return seen(h, s) ? s.xy : null;
}

/** Whether a whole (u, w) polygon is seen and inside its zone (a pad or a
    tile is a part: drawn whole or not at all). */
export function wholeOn(h: Hull, poly: Poly, zone: Zone): boolean {
  const c = poly.reduce<[number, number]>((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]);
  return [...poly, c].every((p) => sampleOf(h, p[0], p[1], zone).ok);
}

// ─── the ink ────────────────────────────────────────────────────────────────

/** Paths gathered by colour and width, emitted as one `<path>` each, in the
    order their keys were first used. */
export class Ink {
  private paths = new Map<string, string[]>();

  line(colour: string, width: number, pts: readonly Flat[]) {
    const d = lineD(pts);
    if (d) this.add(`s|${colour}|${width}`, d);
  }

  /** A fill, stroked a hair in its own colour so neighbours close. */
  fill(colour: string, pts: readonly Flat[]) {
    if (pts.length >= 3) this.add(`f|${colour}`, polyD(pts));
  }

  private add(key: string, d: string) {
    const list = this.paths.get(key);
    if (list) list.push(d);
    else this.paths.set(key, [d]);
  }

  svg(): string {
    let out = "";
    for (const [key, ds] of this.paths) {
      const [kind, colour, width] = key.split("|");
      out +=
        kind === "f"
          ? `<path fill="${colour}" stroke="${colour}" stroke-width="0.3" stroke-linejoin="round" d="${ds.join("")}"/>`
          : `<path fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="butt" stroke-linejoin="miter" d="${ds.join("")}"/>`;
    }
    return out;
  }
}

/** A piece painted in a ramp, cut along the light's band edges like the hull. */
export function paintPiece(ink: Ink, piece: Sample[], ramp: readonly string[], bands: readonly number[]) {
  const f = { v: piece.map((s) => ({ xy: s.xy, lit: s.lit })) } as unknown as Facet;
  for (const cut of facetBands(f, bands)) ink.fill(ramp[Math.min(ramp.length - 1, cut.band)], cut.pts);
}

// ─── the world floorplan: regions of the surface, painted facet by facet ───

/** A point of the hull in brain axes as a floorplan reads them: X across
    (lateral +, from the hemisphere's centre line), Y toward the front, Z up.
    The same numbers on both sides, so one plan serves both hemispheres. */
export type Pt3 = readonly [number, number, number];
export type Fn = (P: Pt3) => number;

interface RV {
  xy: Flat;
  P: Pt3;
  lit: number;
}

const lerpRV = (a: RV, b: RV, k: number): RV => ({
  xy: [a.xy[0] + (b.xy[0] - a.xy[0]) * k, a.xy[1] + (b.xy[1] - a.xy[1]) * k],
  P: [a.P[0] + (b.P[0] - a.P[0]) * k, a.P[1] + (b.P[1] - a.P[1]) * k, a.P[2] + (b.P[2] - a.P[2]) * k],
  lit: a.lit + (b.lit - a.lit) * k,
});

/** A piece of a facet: its corners and, per edge, the cut it lies on (-1 for
    the facet's own edges), so a block's edge along a lane can be drawn. */
interface Piece {
  v: RV[];
  tag: number[];
}

/** One side of a cut (Sutherland-Hodgman), keeping the edges' tags; the new
    edge along the cut takes the cut's. */
function sideOf(p: Piece, vals: number[], keep: (x: number) => boolean, tag: number): Piece {
  const out: Piece = { v: [], tag: [] };
  const n = p.v.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ia = keep(vals[i]);
    const ib = keep(vals[j]);
    if (ia) {
      out.v.push(p.v[i]);
      out.tag.push(p.tag[i]);
    }
    if (ia !== ib) {
      out.v.push(lerpRV(p.v[i], p.v[j], vals[i] / (vals[i] - vals[j])));
      out.tag.push(ia ? tag : p.tag[i]);
    }
  }
  return out;
}

/** A cut of the surface: where a linear function of the point crosses `th`. */
export interface Cut {
  f: Fn;
  th: number;
  /** Where the cut can matter (min and max corners); outside it a facet is
      left whole. */
  box?: readonly [Pt3, Pt3];
}

/** A texture: the iso-lines of `f` every `pitch`, inked over the region's
    ground at `ink`. `bank` breaks a lattice into banks (every `every`-th line
    left out, and the lines broken in the other family's gutters); `dash`
    keeps a line only where `g` modulo `pitch` is under `on` (tiles). */
export interface Texture {
  f: Fn;
  pitch: number;
  width: number;
  ink: number;
  bank?: { every: number; g: Fn; pitch: number };
  dash?: { g: Fn; pitch: number; on: number };
}

export interface Region {
  ramp: readonly string[];
  textures?: readonly Texture[];
  /** The region's edge along a lane, inked at this strength. */
  outline?: number;
  /** What the region's textures and outline are inked toward. */
  to?: string;
}

/** A stroke: the line where `f` is zero, between `from` and `to` of `along`,
    coloured by the band and fade under it. */
export interface Stroke {
  f: Fn;
  /** Linear limits the stroke stays between (its ends, its side). */
  limits: readonly { f: Fn; lo: number; hi: number }[];
  width: number;
  colour: (band: number, fade: number) => string;
}

export interface WorldPlan {
  cuts: readonly Cut[];
  classify: (P: Pt3) => string;
  regions: Record<string, Region>;
  strokes: readonly Stroke[];
}

const bandOfLit = (lit: number, bands: readonly number[]) => {
  let b = 0;
  while (b < bands.length && lit >= bands[b]) b++;
  return b;
};

/** The chord of a convex piece along the iso-line `f = c`: its two ends. */
function chord(v: readonly RV[], vals: readonly number[], c: number): [RV, RV] | null {
  const pts: RV[] = [];
  for (let i = 0; i < v.length && pts.length < 2; i++) {
    const j = (i + 1) % v.length;
    const a = vals[i] - c;
    const b = vals[j] - c;
    if ((a < 0 && b >= 0) || (a >= 0 && b < 0)) pts.push(lerpRV(v[i], v[j], a / (a - b)));
  }
  return pts.length === 2 ? [pts[0], pts[1]] : null;
}

/** The parts of a segment where `g`, taken modulo `pitch` from `off`, is
    under `on`: a line broken into banks or dashes. */
function spansOn(a: RV, b: RV, g: Fn, pitch: number, off: number, on: number): [RV, RV][] {
  const ga = g(a.P) - off;
  const gb = g(b.P) - off;
  const kept = (x: number) => ((x % pitch) + pitch) % pitch < on;
  const ks = [0, 1];
  if (Math.abs(gb - ga) > 1e-9) {
    const lo = Math.min(ga, gb);
    const hi = Math.max(ga, gb);
    for (let n = Math.floor(lo / pitch); n * pitch <= hi; n++) {
      for (const e of [n * pitch, n * pitch + on]) if (e > lo && e < hi) ks.push((e - ga) / (gb - ga));
    }
  }
  ks.sort((x, y) => x - y);
  const out: [RV, RV][] = [];
  for (let i = 0; i < ks.length - 1; i++) {
    if (ks[i + 1] - ks[i] < 1e-6) continue;
    if (kept(ga + (gb - ga) * ((ks[i] + ks[i + 1]) / 2))) out.push([lerpRV(a, b, ks[i]), lerpRV(a, b, ks[i + 1])]);
  }
  return out;
}

/**
 * The hull painted as a floorplan, back to front: each facet that faces the
 * viewer is cut by the plan's cuts, each piece takes the region its centre
 * lies in and is painted in that region's ramp (cut again along the light's
 * bands), then its textures, its edges along lanes, and the strokes over the
 * facet. Facets are gathered into thin depth slabs, fills before lines in
 * each, so a nearer fold covers what it hides.
 */
export function paintPlan(h: Hull, plan: WorldPlan, bands: readonly number[], slab = 6): string {
  const order = paintOrder(h);
  let out = "";
  let key = Number.NaN;
  let fills = new Ink();
  let lines = new Ink();
  const flush = () => {
    out += fills.svg() + lines.svg();
    fills = new Ink();
    lines = new Ink();
  };
  const side = h.side;
  const toP = (b: readonly number[]): Pt3 => [side * b[0] - LC, b[1], b[2]];
  for (const f of order) {
    const k = Math.floor(f.depth / slab);
    if (k !== key) {
      flush();
      key = k;
    }
    const fade = FADE_INK[fadeOf(dot3(f.n, h.toward))];
    const rv: RV[] = f.v.map((v) => ({ xy: v.xy, P: toP(v.b), lit: v.lit }));
    let pieces: Piece[] = [{ v: rv, tag: [-1, -1, -1, -1] }];
    const lo: Pt3 = [Math.min(...rv.map((v) => v.P[0])), Math.min(...rv.map((v) => v.P[1])), Math.min(...rv.map((v) => v.P[2]))];
    const hi: Pt3 = [Math.max(...rv.map((v) => v.P[0])), Math.max(...rv.map((v) => v.P[1])), Math.max(...rv.map((v) => v.P[2]))];
    plan.cuts.forEach((cut, ci) => {
      if (cut.box && (hi[0] < cut.box[0][0] || lo[0] > cut.box[1][0] || hi[1] < cut.box[0][1] || lo[1] > cut.box[1][1] || hi[2] < cut.box[0][2] || lo[2] > cut.box[1][2])) return;
      const fv = rv.map((v) => cut.f(v.P) - cut.th);
      if (fv.every((x) => x >= 0) || fv.every((x) => x < 0)) return;
      const next: Piece[] = [];
      for (const p of pieces) {
        const vals = p.v.map((v) => cut.f(v.P) - cut.th);
        if (vals.every((x) => x >= 0) || vals.every((x) => x < 0)) {
          next.push(p);
          continue;
        }
        for (const s of [sideOf(p, vals, (x) => x >= 0, ci), sideOf(p, vals, (x) => x < 0, ci)]) if (s.v.length >= 3) next.push(s);
      }
      pieces = next;
    });
    for (const p of pieces) {
      const n = p.v.length;
      const c: Pt3 = [p.v.reduce((s, v) => s + v.P[0], 0) / n, p.v.reduce((s, v) => s + v.P[1], 0) / n, p.v.reduce((s, v) => s + v.P[2], 0) / n];
      const cls = plan.classify(c);
      const reg = plan.regions[cls];
      if (!reg) continue;
      // the fill, cut along the light's bands as the hull's own tones are
      const asFacet = { v: p.v.map((v) => ({ xy: v.xy, lit: v.lit })) } as unknown as Facet;
      for (const cb of facetBands(asFacet, bands)) fills.fill(reg.ramp[Math.min(reg.ramp.length - 1, cb.band)], cb.pts);
      if (fade === 0) continue;
      const to = reg.to ?? "#ffffff";
      const inked = (lit: number, s: number) => mix(reg.ramp[Math.min(reg.ramp.length - 1, bandOfLit(lit, bands))], to, s * fade);
      for (const tex of reg.textures ?? []) {
        const vals = p.v.map((v) => tex.f(v.P));
        const lo = Math.min(...vals);
        const hi = Math.max(...vals);
        for (let q = Math.ceil(lo / tex.pitch); q * tex.pitch <= hi; q++) {
          if (tex.bank && ((q % tex.bank.every) + tex.bank.every) % tex.bank.every === 0) continue;
          const seg = chord(p.v, vals, q * tex.pitch);
          if (!seg) continue;
          let spans: [RV, RV][] = [seg];
          if (tex.bank) spans = spansOn(seg[0], seg[1], tex.bank.g, tex.bank.pitch * tex.bank.every, tex.bank.pitch * 0.5, tex.bank.pitch * (tex.bank.every - 1));
          else if (tex.dash) spans = spansOn(seg[0], seg[1], tex.dash.g, tex.dash.pitch, 0, tex.dash.on);
          for (const [a, b] of spans) lines.line(inked((a.lit + b.lit) / 2, tex.ink), tex.width, [a.xy, b.xy]);
        }
      }
      if (reg.outline) {
        for (let i = 0; i < n; i++) {
          if (p.tag[i] < 0) continue;
          const a = p.v[i];
          const b = p.v[(i + 1) % n];
          const m: Pt3 = [(a.P[0] + b.P[0]) / 2, (a.P[1] + b.P[1]) / 2, (a.P[2] + b.P[2]) / 2];
          const d = Math.hypot(m[0] - c[0], m[1] - c[1], m[2] - c[2]) || 1;
          const across: Pt3 = [m[0] + ((m[0] - c[0]) / d) * 0.5, m[1] + ((m[1] - c[1]) / d) * 0.5, m[2] + ((m[2] - c[2]) / d) * 0.5];
          if (plan.classify(across) !== cls) lines.line(inked((a.lit + b.lit) / 2, reg.outline), 0.3, [a.xy, b.xy]);
        }
      }
    }
    for (const st of plan.strokes) {
      const vals = rv.map((v) => st.f(v.P));
      if (vals.every((x) => x >= 0) || vals.every((x) => x < 0)) continue;
      const seg = chord(rv, vals, 0);
      if (!seg) continue;
      const [a, b] = seg;
      let k0 = 0;
      let k1 = 1;
      for (const lim of st.limits) {
        const ta = lim.f(a.P);
        const tb = lim.f(b.P);
        if (Math.abs(tb - ta) < 1e-9) {
          if (ta < lim.lo || ta > lim.hi) k1 = -1;
          continue;
        }
        const u0 = (lim.lo - ta) / (tb - ta);
        const u1 = (lim.hi - ta) / (tb - ta);
        k0 = Math.max(k0, Math.min(u0, u1));
        k1 = Math.min(k1, Math.max(u0, u1));
      }
      if (k1 - k0 < 1e-6) continue;
      const pa = lerpRV(a, b, k0);
      const pb = lerpRV(a, b, k1);
      lines.line(st.colour(bandOfLit((pa.lit + pb.lit) / 2, bands), fade), st.width, [pa.xy, pb.xy]);
    }
  }
  flush();
  return out;
}

/** A lane: a polyline in two of the three axes (the third runs through it),
    `half` either side, its bends mitred and its ends run on by `half` into
    the lanes they meet. Its cuts are the two offset lines of each segment. */
export function lane(axes: "YZ" | "XY", pts: readonly P2[], half: number): { cuts: Cut[]; holds: (P: Pt3) => boolean } {
  const pr = (P: Pt3): P2 => (axes === "YZ" ? [P[1], P[2]] : [P[0], P[1]]);
  const segs = pts.slice(0, -1).map((a, i) => {
    const b = pts[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { a, b, d: [(b[0] - a[0]) / len, (b[1] - a[1]) / len] as P2 };
  });
  const nrm = (d: P2): P2 => [-d[1], d[0]];
  const first = segs[0];
  const last = segs[segs.length - 1];
  const start: P2 = [first.a[0] - first.d[0] * half, first.a[1] - first.d[1] * half];
  const end: P2 = [last.b[0] + last.d[0] * half, last.b[1] + last.d[1] * half];
  // a mitre at each bend: the line through it along the sum of the normals
  const mitres = segs.map((s, i) => {
    if (i === 0) return { at: start, dir: nrm(s.d) };
    const n1 = nrm(segs[i - 1].d);
    const n2 = nrm(s.d);
    return { at: s.a, dir: [n1[0] + n2[0], n1[1] + n2[1]] as P2 };
  });
  mitres.push({ at: end, dir: nrm(last.d) });
  const sideOfLine = (m: { at: P2; dir: P2 }, p: P2) => m.dir[0] * (p[1] - m.at[1]) - m.dir[1] * (p[0] - m.at[0]);
  const dist = segs.map((s) => (P: Pt3) => {
    const p = pr(P);
    return s.d[0] * (p[1] - s.a[1]) - s.d[1] * (p[0] - s.a[0]);
  });
  const cuts: Cut[] = [];
  const big = 1e4;
  dist.forEach((f, i) => {
    // the segment's reach, run on and widened by its half and a mitre's
    const s = segs[i];
    const a = i === 0 ? start : s.a;
    const b = i === segs.length - 1 ? end : s.b;
    const m = half * 3;
    const u0 = Math.min(a[0], b[0]) - m;
    const u1 = Math.max(a[0], b[0]) + m;
    const v0 = Math.min(a[1], b[1]) - m;
    const v1 = Math.max(a[1], b[1]) + m;
    const box: [Pt3, Pt3] = axes === "YZ" ? [[-big, u0, v0], [big, u1, v1]] : [[u0, v0, -big], [u1, v1, big]];
    cuts.push({ f, th: half, box }, { f, th: -half, box });
  });
  const holds = (P: Pt3) => {
    const p = pr(P);
    return segs.some((s, i) => {
      const mid: P2 = [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2];
      const inA = sideOfLine(mitres[i], p) * sideOfLine(mitres[i], mid) >= 0;
      const inB = sideOfLine(mitres[i + 1], p) * sideOfLine(mitres[i + 1], mid) >= 0;
      return inA && inB && Math.abs(dist[i](P)) < half;
    });
  };
  return { cuts, holds };
}
