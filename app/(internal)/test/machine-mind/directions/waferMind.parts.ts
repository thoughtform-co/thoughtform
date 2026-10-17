/**
 * G1 · Wafer Mind, its parts: the stem under the brain and the ports on its
 * block, the cables (corrugated, segmented, plain with collars) drawn in the
 * kit's flat tones, the connectors they end in, the USB-B receptacle and
 * plug, the tall node, and the cut face's folded-ribbon geometry.
 *
 * Everything is built in the kit's world (`W(l, f, z)` = [f, −l, z]) through
 * the vendored lathe and tube modules, so a collar is a turned part and a
 * cable a shaded round tube. Pure: strings and numbers.
 */

import { W } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, dotsSvg, extrude, iso, lineSvg, pathOf, ringSeam, solidSvg, type Flat, type Plane, type Point3, type Projection } from "@/components/arcs/figures/foundation/isoKit";
import * as G from "../kit/lathe.mjs";
import { tubePieces as kitTubePieces, tubeSvg as kitTubeSvg } from "../kit/tube.mjs";
import { polyD } from "../hull";

export type LF = [number, number];
export type V3 = [number, number, number];

/** Brain axes on the floor plane to the kit's world plane. */
export const WP = (l: number, f: number): Plane => [f, -l];
export const at3 = (l: number, f: number, z: number, P: Projection): Flat => iso([...WP(l, f), z], P);

export interface Item {
  depth: number;
  svg: string;
}

export const paint = (items: Item[]) =>
  items
    .sort((a, b) => a.depth - b.depth)
    .map((i) => i.svg)
    .join("");

// ─── vectors ────────────────────────────────────────────────────────────────

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** A brain-axis point to the world. */
export const w3 = (l: number, f: number, z: number): V3 => W(l, f, z) as V3;

/** A cubic Bézier through four world points, sampled. A cable's sag is a
    physical curve: cables may curve, connectors on a diagram may not. */
export function bezier(p0: V3, p1: V3, p2: V3, p3: V3, n = 40): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const d = t ** 3;
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1], a * p0[2] + b * p1[2] + c * p2[2] + d * p3[2]]);
  }
  return out;
}

/** The point and unit tangent at the end of a polyline. */
const endOf = (pts: V3[]): { p: V3; t: V3 } => ({ p: pts[pts.length - 1], t: unit(sub(pts[pts.length - 1], pts[pts.length - 2])) });

// ─── tubes ──────────────────────────────────────────────────────────────────

interface TubePiece {
  mid: number[];
}
const tubePieces = kitTubePieces as unknown as (points: V3[], radius: number, P: Projection, options?: Record<string, unknown>) => TubePiece[];
const tubeSvg = kitTubeSvg as unknown as (piece: TubePiece, options?: { tone?: string }) => string;

/** A route's length and the point and tangent at a length along it. */
export function walk(pts: V3[]) {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(...sub(pts[i], pts[i - 1])));
  const total = lens[lens.length - 1];
  const at = (s: number): { p: V3; t: V3 } => {
    const x = Math.max(0, Math.min(total, s));
    let i = 1;
    while (i < lens.length - 1 && lens[i] < x) i++;
    const k = (x - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
    return { p: add(pts[i - 1], mul(sub(pts[i], pts[i - 1]), k)), t: unit(sub(pts[i], pts[i - 1])) };
  };
  return { total, at };
}

/** A route resampled to points `step` apart (the kit walks a route from its
    start for every sample, so a cable is tubed from few points). */
function even(pts: V3[], step: number): V3[] {
  const { total, at } = walk(pts);
  const n = Math.max(2, Math.ceil(total / step));
  return Array.from({ length: n + 1 }, (_, i) => at((total * i) / n).p);
}

/** How a cable is drawn, all in the kit's flat tones (a body, one lit band,
    one shaded band, a hairline edge), never photoreal:
      plain       one run, machined collars at `collars` (lengths along it)
      corrugated  a hose of short rings in two alternating tones
      segmented   vertebrae: short segments on a thin core, gaps between */
export type CableStyle = "plain" | "corrugated" | "segmented";

export function cableItems(route: V3[], radius: number, P: Projection, { style = "plain", collars = [], pitch = 2.6 }: { style?: CableStyle; collars?: number[]; pitch?: number } = {}): Item[] {
  const pts = even(route, 2.4);
  const { total, at } = walk(pts);
  const out: Item[] = [];
  const piece = (p: TubePiece, cls = "") => {
    const svg = tubeSvg(p, { tone: "mid" });
    out.push({ depth: depthOf(p.mid as Point3, P), svg: cls ? `<g class="${cls}">${svg}</g>` : svg });
  };
  if (style === "corrugated") {
    // ridges of the full radius over a groove core: the hose's outline steps
    // in and out, each ridge a short flat-toned band
    const gaps: [number, number][] = [];
    for (let s = pitch * 0.62; s < total - 1; s += pitch) gaps.push([s, s + pitch * 0.38]);
    tubePieces(pts, radius * 0.8, P, { maxLength: 8, spacing: 1 }).forEach((p) => piece(p, "gm-alt"));
    tubePieces(pts, radius, P, { maxLength: pitch, spacing: 0.6, gaps, caps: false }).forEach((p) => piece(p));
    return out;
  }
  if (style === "segmented") {
    const seg = pitch;
    const gaps: [number, number][] = [];
    for (let s = seg; s < total - 2; s += seg + 1.4) gaps.push([s, s + 1.4]);
    tubePieces(pts, radius * 0.5, P, { maxLength: 8, spacing: 1 }).forEach((p) => piece(p, "gm-alt"));
    tubePieces(pts, radius, P, { maxLength: seg + 0.5, spacing: 0.8, gaps }).forEach((p) => piece(p));
    return out;
  }
  const gaps: [number, number][] = collars.map((c) => [c - 2.2, c + 2.2]);
  tubePieces(pts, radius, P, { maxLength: 7, spacing: 1, gaps }).forEach((p) => piece(p));
  for (const c of collars) {
    const { p, t } = at(c);
    const F = frameAlong(p, t);
    const R = radius + 1.1;
    const band: Meridian = [
      [-2.6, 0],
      [-2.6, radius + 0.4],
      [-1.8, R],
      [1.8, R],
      [2.6, radius + 0.4],
      [2.6, 0],
    ];
    out.push({ depth: depthOf(p as Point3, P) + 0.5, svg: solidSvg(latheOf(band, F, P), { tone: "mid", crease: "lo", className: "gm-metal" }) });
  }
  return out;
}

/** A port on the stem's underside a cable leaves by: a turned boss, a nut
    and a ferrule along `n` (straight down). Returns where the cable starts. */
export function portItems(o: V3, n: V3, r: number, P: Projection): { items: Item[]; exit: V3 } {
  const F = frameAlong(o, n);
  const R = r + 1.8;
  const boss: Meridian = [
    [0, 0],
    [0, R + 0.6],
    [1.6, R + 0.6],
    [1.6, R],
    [3.4, R],
    [3.4, R - 0.5],
    [4, R - 0.5],
    [4, R + 0.2],
    [5.6, R + 0.2],
    [6.8, r + 0.5],
    [6.8, 0],
  ];
  return { items: [{ depth: depthOf(add(o, mul(n, 3)) as Point3, P), svg: solidSvg(latheOf(boss, F, P), { tone: "mid", crease: "lo", className: "gm-metal" }) }], exit: add(o, mul(n, 6.6)) };
}

// ─── turned and prismatic parts ─────────────────────────────────────────────

type Meridian = (number[] | [number, number] | [number, number, number])[];
const latheOf = (meridian: Meridian, F: unknown, P: Projection) => (G.lathe as unknown as (m: Meridian, F: unknown, P: Projection, o?: Record<string, unknown>) => never)(meridian, F, P, {});
const prismOf = (F: unknown, poly: LF[], s0: number, s1: number, P: Projection) => (G.prismOf as unknown as (F: unknown, p: LF[], a: number, b: number, P: Projection) => never)(F, poly, s0, s1, P);
const frameAlong = (o: V3, a: V3) => (G.frameAlong as unknown as (o: V3, a: V3) => { o: V3; a: V3; u: V3; v: V3 })(o, a);

/** A chamfered rectangle in a frame's (u, v): half-sizes, the chamfer, and an
    optional larger cut on the two +v corners (the USB-B's cut corners). */
function chamferRect(hu: number, hv: number, c: number, top = c): LF[] {
  return [
    [-hu + c, -hv],
    [hu - c, -hv],
    [hu, -hv + c],
    [hu, hv - top],
    [hu - top, hv],
    [-hu + top, hv],
    [-hu, hv - top],
    [-hu, -hv + c],
  ];
}

/** A connector a hanging cable ends in: a ferrule, a collared body, a knurl
    band and a metal tip with a gold contact pin. `p` is the cable's end, `t`
    its direction. */
export function endItems(p: V3, t: V3, r: number, P: Projection): Item[] {
  const F = frameAlong(p, t);
  const R = r + 1.9;
  const body: Meridian = [
    [-0.6, 0],
    [-0.6, r + 0.5],
    [1.4, R - 0.3],
    [1.4, R],
    [6.5, R],
    [6.5, R - 0.5],
    [7.2, R - 0.5],
    [7.2, R + 0.35],
    [9.4, R + 0.35],
    [9.4, R - 0.8],
    [11.4, R - 1.1],
    [11.4, 0],
  ];
  const items: Item[] = [{ depth: depthOf(add(p, mul(t, 5)) as Point3, P), svg: solidSvg(latheOf(body, F, P), { tone: "mid", crease: "lo", className: "gm-metal" }) }];
  const tip = add(p, mul(t, 11.4));
  const pin = add(p, mul(t, 13.6));
  items.push({ depth: depthOf(pin as Point3, P), svg: lineSvg(pathOf([iso(tip as Point3, P), iso(pin as Point3, P)]), { tone: "lo", className: "gm-pin" }) });
  return items;
}

// ─── the USB-B receptacle and its plug ──────────────────────────────────────

export const USB = { w: 10.4, h: 9.6, cut: 2.4 } as const;

/**
 * The USB-B receptacle set flush into a wafer's front edge, and the plug
 * seated in it. The receptacle shows only as its tin lip just proud of the
 * edge; the plug's moulded housing leaves it, a step for the grip, a ribbed
 * strain relief, then the cable. `c` is the centre of the opening on the
 * edge (world) and `n` the edge's outward normal. Returns its items and
 * where the cable starts.
 */
export function plugItems(c: V3, n: V3, P: Projection): { items: Item[]; exit: V3 } {
  const F = frameAlong(c, n);
  // the frame's u lies level, v up (n is level): keep v pointing up
  const up = F.v[2] < 0;
  const flip = (poly: LF[]): LF[] => (up ? poly.map(([u, v]) => [u, -v] as LF) : poly);
  const items: Item[] = [];
  const lip = solidSvg(prismOf(F, flip(chamferRect(USB.w / 2 + 1.1, USB.h / 2 + 1.1, 0.5, USB.cut + 0.6)), -0.3, 0.45, P), { tone: "mid", crease: "lo", className: "gm-tin" });
  items.push({ depth: depthOf(c as Point3, P) - 1, svg: lip });
  const housing = solidSvg(prismOf(F, flip(chamferRect(USB.w / 2, USB.h / 2, 0.7, USB.cut)), 0.45, 11, P), { tone: "mid", crease: "lo", className: "gm-plastic" });
  const grip = solidSvg(prismOf(F, flip(chamferRect(USB.w / 2 - 0.6, USB.h / 2 - 0.6, 1, USB.cut - 0.3)), 11, 13, P), { tone: "mid", crease: "lo", className: "gm-plastic" });
  items.push({ depth: depthOf(add(c, mul(n, 6)) as Point3, P), svg: housing });
  items.push({ depth: depthOf(add(c, mul(n, 12)) as Point3, P), svg: grip });
  const relief: Meridian = [
    [13, 0],
    [13, 3.4],
    [14.4, 3.4],
    [14.4, 3],
    [15.2, 3],
    [15.2, 3.2],
    [16.2, 3.1],
    [16.2, 2.7],
    [17, 2.7],
    [17, 2.85],
    [18, 2.75],
    [20.5, 2],
    [20.5, 0],
  ];
  items.push({ depth: depthOf(add(c, mul(n, 17)) as Point3, P), svg: solidSvg(latheOf(relief, F, P), { tone: "mid", crease: "lo", className: "gm-plastic" }) });
  return { items, exit: add(c, mul(n, 20)) };
}

/** The far end of the USB cable: a USB-A plug hanging from it, its moulded
    body, the tin shell and the shell's two windows. */
export function usbAItems(p: V3, t: V3, P: Projection): Item[] {
  const F = frameAlong(p, t);
  const relief: Meridian = [
    [-0.4, 0],
    [-0.4, 2],
    [2.5, 2.8],
    [3.4, 2.8],
    [3.4, 0],
  ];
  const items: Item[] = [{ depth: depthOf(add(p, mul(t, 1.5)) as Point3, P), svg: solidSvg(latheOf(relief, F, P), { tone: "mid", crease: "lo", className: "gm-plastic" }) }];
  items.push({ depth: depthOf(add(p, mul(t, 7)) as Point3, P), svg: solidSvg(prismOf(F, chamferRect(4.6, 2.8, 0.6), 3.4, 11.5, P), { tone: "mid", crease: "lo", className: "gm-plastic" }) });
  items.push({ depth: depthOf(add(p, mul(t, 14)) as Point3, P), svg: solidSvg(prismOf(F, chamferRect(3.8, 1.5, 0.15), 11.5, 17.5, P), { tone: "mid", crease: "lo", className: "gm-tin" }) });
  return items;
}

// ─── the stem ───────────────────────────────────────────────────────────────

/** The stem under the brain, where a brain stem would be, between the
    hemispheres toward the back: a column rising into the fissure, a collar
    band just under the brain and, right under it, the connector block the
    cables leave from. Brain axes: centred on (0, `f`); heights below. */
export const STEM = { colTop: -36, colL: 8, colF: 10, band: [-60, -53] as [number, number], bandL: 13, bandF: 15, block: [-79, -60] as [number, number], blockL: 22, blockF: 16 } as const;

/** An octagon (a chamfered rectangle) round (0, f) in the world plane. */
const octagon = (f: number, hl: number, hf: number, c: number): Plane[] => chamferRect(hl, hf, c).map(([l, ff]) => WP(l, f + ff));

/** The stem's column, band and block, with screws and a seam: the kit's
    solids in gunmetal. */
export function stemSvg(f: number, P: Projection): string {
  const S = STEM;
  let svg = solidSvg(extrude(octagon(f, S.colL, S.colF, 3), S.block[1], S.colTop - S.block[1], P, { bevel: 0.5 }), { tone: "mid", crease: "lo", className: "gm-metal" });
  svg += solidSvg(extrude(octagon(f, S.bandL, S.bandF, 4), S.band[0], S.band[1] - S.band[0], P, { bevel: 0.6 }), { tone: "mid", crease: "lo", className: "gm-nut" });
  const bandScrews: Flat[] = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [0.7, 0.7],
    [-0.7, 0.7],
    [0.7, -0.7],
    [-0.7, -0.7],
  ].map(([a, b]) => at3(a * (S.bandL - 1.6), f + b * (S.bandF - 1.6), S.band[1], P));
  svg += `<g class="gm-screw">${dotsSvg(bandScrews, { size: 0.5, tone: "hi" })}</g>`;
  const block = octagon(f, S.blockL, S.blockF, 4.5);
  svg += solidSvg(extrude(block, S.block[0], S.block[1] - S.block[0], P, { bevel: 0.8 }), { tone: "mid", crease: "lo", className: "gm-metal" });
  svg += lineSvg(ringSeam(block, (S.block[0] + S.block[1]) / 2 - 2.5, P), { tone: "lo", className: "gm-seam" });
  const blockScrews: Flat[] = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ].map(([a, b]) => at3(a * (S.blockL - 3), f + b * (S.blockF - 3), S.block[1], P));
  svg += `<g class="gm-screw">${dotsSvg(blockScrews, { size: 0.55, tone: "hi" })}</g>`;
  return svg;
}

// ─── the node ───────────────────────────────────────────────────────────────

/**
 * The node: a stacked package standing on the crown, the tallest part there
 * and the one lit part. A substrate, the moulded package body, the heat
 * spreader (lit gold) and, set on it, a short stack of fins in gunmetal that
 * leaves the spreader's rim showing. `half` is the substrate's half-width.
 */
export function nodeSvg(cl: number, cf: number, z: number, half: number, P: Projection): string {
  const box = (h: number): Plane[] => [WP(cl - h, cf - h), WP(cl + h, cf - h), WP(cl + h, cf + h), WP(cl - h, cf + h)];
  const sub0 = z;
  const sub1 = sub0 + 1.6;
  const body1 = sub1 + 4.6;
  const ihs1 = body1 + 2;
  let svg = solidSvg(extrude(box(half), sub0, sub1 - sub0, P, { bevel: 0.4 }), { tone: "lo", crease: "lo", className: "wf-part" });
  // the substrate's ball row, a line of pads round the package body
  const pads: Flat[] = [];
  const pb = half - 1.2;
  for (let i = 0; i < 9; i++) {
    const o = -pb + ((2 * pb) / 8) * i;
    pads.push(at3(cl + o, cf - pb, sub1, P), at3(cl + o, cf + pb, sub1, P), at3(cl - pb, cf + o, sub1, P), at3(cl + pb, cf + o, sub1, P));
  }
  svg += `<g class="wf-via">${dotsSvg(pads, { size: 0.42, tone: "hi" })}</g>`;
  svg += solidSvg(extrude(box(half * 0.76), sub1, body1 - sub1, P, { bevel: 0.6 }), { tone: "mid", crease: "lo", className: "wf-mold" });
  svg += solidSvg(extrude(box(half * 0.66), body1, ihs1 - body1, P, { bevel: 0.6 }), { tone: "hi", lit: true, className: "fa-gold fa-core wf-core" });
  // the raised core: the die standing proud of the spreader
  svg += solidSvg(extrude(box(half * 0.34), ihs1, 2.6, P, { bevel: 0.5 }), { tone: "hi", lit: true, className: "fa-gold fa-core wf-core" });
  return svg;
}

/** The node's height above the crown. */
export const NODE_H = 1.6 + 4.6 + 2 + 2.6;

// ─── the coronal section ────────────────────────────────────────────────────

const areaOf = (ring: readonly LF[]) => ring.reduce((s, a, i) => s + a[0] * ring[(i + 1) % ring.length][1] - ring[(i + 1) % ring.length][0] * a[1], 0) / 2;

/** A ring offset inward by `d`, every edge along its normal, neighbours
    re-joined at their lines' crossing. */
export function offsetRing(ring: readonly LF[], d: number): LF[] {
  const n = ring.length;
  const s = areaOf(ring) > 0 ? 1 : -1;
  const lines = ring.map((a, i) => {
    const b = ring[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const dx = (b[0] - a[0]) / len;
    const dy = (b[1] - a[1]) / len;
    return { p: [a[0] - dy * s * d, a[1] + dx * s * d] as LF, d: [dx, dy] as LF };
  });
  return lines.map((l, i) => {
    const m = lines[(i - 1 + n) % n];
    const den = m.d[0] * l.d[1] - m.d[1] * l.d[0];
    if (Math.abs(den) < 1e-9) return l.p;
    const t = ((l.p[0] - m.p[0]) * l.d[1] - (l.p[1] - m.p[1]) * l.d[0]) / den;
    return [m.p[0] + m.d[0] * t, m.p[1] + m.d[1] * t] as LF;
  });
}

/** A fold of the cortex: on edge `e` of the section's outline, at length `s`
    along it, a sulcus `depth` deep. */
export interface Fold {
  e: number;
  s: number;
  depth: number;
}

/** The outline offset inward by `d`, every fold spliced in as a U round its
    sulcus: a curve `d` inside the surface runs down one bank `d` from it,
    round the floor and up the other, so the nested curves wrap the slit. */
export function foldedRing(outline: readonly LF[], d: number, folds: readonly Fold[], gap: number): LF[] {
  const base = offsetRing(outline, d);
  const n = outline.length;
  const s = areaOf(outline) > 0 ? 1 : -1;
  const out: LF[] = [];
  for (let i = 0; i < n; i++) {
    out.push(base[i]);
    const a = outline[i];
    const b = outline[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const tx = (b[0] - a[0]) / len;
    const ty = (b[1] - a[1]) / len;
    const nx = -ty * s;
    const ny = tx * s;
    const here = folds.filter((f) => f.e === i).sort((p, q) => p.s - q.s);
    for (const f of here) {
      const cx = a[0] + tx * f.s + nx * d;
      const cy = a[1] + ty * f.s + ny * d;
      const hw = gap / 2 + d;
      out.push([cx - tx * hw, cy - ty * hw], [cx - tx * hw + nx * f.depth, cy - ty * hw + ny * f.depth], [cx + tx * hw + nx * f.depth, cy + ty * hw + ny * f.depth], [cx + tx * hw, cy + ty * hw]);
    }
  }
  return out;
}

/** A ring cut to the horizontal slab z0 ≤ z ≤ z1 (the section's points are
    (l, z)): the part of it inside one wafer's face. */
export function slab(ring: readonly LF[], z0: number, z1: number): LF[] {
  const clip = (poly: LF[], keep: (p: LF) => number): LF[] => {
    const out: LF[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const ka = keep(a);
      const kb = keep(b);
      if (ka >= 0) out.push(a);
      if (ka >= 0 !== kb >= 0) {
        const t = ka / (ka - kb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  };
  return clip(clip(ring.slice(), (p) => p[1] - z0), (p) => z1 - p[1]);
}

/** A section point (l, z) on the cut plane at `f`, a hair in front of it. */
export const onFace = (f: number, P: Projection) => ([l, z]: LF): Flat => at3(l, f + 0.06, z, P);

export const facePath = (pts: readonly LF[], f: number, P: Projection, closed = true) => (closed ? polyD(pts.map(onFace(f, P))) : pathOf(pts.map(onFace(f, P))));

export { add as add3, mul as mul3, sub as sub3, unit as unit3, endOf };
