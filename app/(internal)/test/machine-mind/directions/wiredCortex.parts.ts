/**
 * H1 · Wired Cortex, its parts: plan geometry (signed distances, rings,
 * routed polylines), the wafer material in G1's tones, the wall painter
 * (a wafer's walls as bond, body and edge band, shaded by their facing),
 * the machined collar band round the base and the tendrils: bundles of fine
 * parallel lines that leave from under the band.
 *
 * Plan points are brain axes [l, f]; heights are world z. Pure: strings and
 * numbers, no randomness.
 */

import { W } from "@/components/arcs/figures/foundation/brainIso";
import { cameraOf, depthOf, iso, towardViewer, type Flat, type Point3, type Projection } from "@/components/arcs/figures/foundation/isoKit";
import { lineD, polyD, type MindTones } from "../hull";

export type P2 = [number, number];
export type V3 = [number, number, number];

export const at = (p: P2, z: number, P: Projection): Flat => iso(W(p[0], p[1], z), P);
export const depthAt = (p: P2, z: number, P: Projection) => depthOf(W(p[0], p[1], z), P);

// ─── plan geometry ──────────────────────────────────────────────────────────

export const areaOf = (ring: readonly P2[]) => ring.reduce((s, [x, y], i) => s + x * ring[(i + 1) % ring.length][1] - ring[(i + 1) % ring.length][0] * y, 0) / 2;

export function inside([x, y]: P2, poly: readonly P2[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export function segDist(p: P2, a: P2, b: P2): number {
  const ex = b[0] - a[0];
  const ey = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / (ex * ex + ey * ey || 1)));
  return Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ey * t);
}

export function nearestOn(p: P2, a: P2, b: P2): P2 {
  const ex = b[0] - a[0];
  const ey = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / (ex * ex + ey * ey || 1)));
  return [a[0] + ex * t, a[1] + ey * t];
}

/** Distance to an open polyline. */
export function polyDist(p: P2, pts: readonly P2[]): number {
  let d = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) d = Math.min(d, segDist(p, pts[i], pts[i + 1]));
  return d;
}

/** Signed distance to a closed ring: positive inside. */
export function sdRing(p: P2, ring: readonly P2[]): number {
  let d = Infinity;
  for (let i = 0; i < ring.length; i++) d = Math.min(d, segDist(p, ring[i], ring[(i + 1) % ring.length]));
  return inside(p, ring) ? d : -d;
}

/** The point of a ring nearest p, with its edge's outward normal (the ring
    keeps its solid on the left). */
export function nearestEdge(p: P2, ring: readonly P2[]): { q: P2; n: P2; d: number } {
  let best = { q: ring[0], n: [1, 0] as P2, d: Infinity };
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const q = nearestOn(p, a, b);
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < best.d) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      best = { q, n: [(b[1] - a[1]) / len, -(b[0] - a[0]) / len], d };
    }
  }
  return best;
}

/** A polyline resampled every `step`, its corners kept. */
export function resample(pts: readonly P2[], step: number): P2[] {
  const out: P2[] = [pts[0]];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

/** A polyline offset sideways by d (left positive), corners mitred. */
export function offsetLine(pts: readonly P2[], d: number): P2[] {
  const n = pts.length;
  const dirs = pts.slice(0, -1).map((a, i) => {
    const b = pts[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / len, (b[1] - a[1]) / len] as P2;
  });
  return pts.map((p, i) => {
    const a = dirs[Math.max(0, i - 1)];
    const b = dirs[Math.min(n - 2, i)];
    let mx = -a[1] - b[1];
    let my = a[0] + b[0];
    const ml = Math.hypot(mx, my) || 1;
    mx /= ml;
    my /= ml;
    const k = d / Math.max(0.3, mx * -b[1] + my * b[0]);
    return [p[0] + mx * k, p[1] + my * k];
  });
}

/** Screen points with the collinear ones dropped. */
export function lean(pts: Flat[]): Flat[] {
  if (pts.length < 3) return pts;
  const out: Flat[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(cross) > 0.02 * Math.hypot(c[0] - a[0], c[1] - a[1])) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// ─── the material ───────────────────────────────────────────────────────────

/** G1's wafer tones (`waferMind.ts` `sheetOf`): the silicon body in four
    shades by facing, its top, the thin metal edge band, the bond line, the
    hairline edge; the band's gunmetal; the tendrils' ink. */
export interface Palette {
  body: string[];
  /** A groove's walls, darker: the sulci read as the brain's own lines. */
  sulcus: string[];
  top: string;
  band: string[];
  bond: string;
  edge: string;
  metal: string[];
  metalTop: string;
  metalEdge: string;
  seam: string;
  glass: string;
  ink: string;
  gold: string;
  lit: string;
  ground: string;
}

export function paletteOf(light: boolean, tones: MindTones): Palette {
  return light
    ? {
        body: ["#aea79a", "#bdb6a9", "#cbc5b9", "#d8d3c8"],
        sulcus: ["#8a8478", "#958f83", "#a09a8e", "#aba59a"],
        top: "#e9e5dc",
        band: ["#8d877b", "#9b9588", "#aaa497", "#b8b2a6"],
        bond: "#6d675c",
        edge: "#8f897d",
        metal: ["#66625b", "#736f67", "#817d75", "#8f8b82"],
        metalTop: "#a39f96",
        metalEdge: "#4a4742",
        seam: "#2f2d2a",
        glass: "#23211e",
        ink: "#6e6658",
        gold: tones.gold,
        lit: tones.lit,
        ground: tones.ground,
      }
    : {
        body: ["#0e0e0d", "#161615", "#1f1e1c", "#292826"],
        sulcus: ["#070707", "#0a0a0a", "#0e0e0d", "#121211"],
        top: "#33312d",
        band: ["#4f4b45", "#5e5a53", "#6e6a62", "#7e7a71"],
        bond: "#050505",
        edge: "#4b4842",
        metal: ["#242321", "#2d2b28", "#373531", "#423f3a"],
        metalTop: "#4a4741",
        metalEdge: "#66625a",
        seam: "#0b0b0a",
        glass: "#070707",
        ink: "#8a8274",
        gold: tones.gold,
        lit: tones.lit,
        ground: tones.ground,
      };
}

/** The node's classes (G1's `nodeSvg`) in G1's tones. */
export function nodeCss(light: boolean, gold: string, lit: string, ground: string): string {
  const part = light ? ["#5d574d", "#6b655a", "#79736a", "#878178"] : ["#141312", "#1b1a18", "#22211f", "#2a2826"];
  const partTop = light ? "#4a463f" : "#47443e";
  const shades = (s: string[], top: string) => `--anatomy-shade-0:${s[0]};--anatomy-shade-1:${s[1]};--anatomy-shade-2:${s[2]};--anatomy-shade-3:${s[3]};--anatomy-top:${top};--anatomy-paper:${s[1]}`;
  return [
    `.wf-part,.wf-mold{${shades(part, partTop)};--anatomy-lo:${part[3]};--anatomy-mid:${part[3]}}`,
    `.wf-via .iso-dots circle{fill:${gold};stroke:${ground};stroke-width:.3;opacity:1}`,
    `.wf-core .iso-top{fill:${light ? "#d9b65c" : "#c9a04a"}}`,
    `.wf-core .iso-edge{stroke:${lit}}`,
  ].join("");
}

// ─── walls ──────────────────────────────────────────────────────────────────

export interface Wall {
  depth: number;
  a: P2;
  b: P2;
  /** Outward normal in plan. */
  n: P2;
  svg: string;
  /** What is drawn on the wall, painted right after it. */
  deco: string[];
}

/** The light a wall takes (the kit's: from the upper left of the screen),
    as one of four shades. */
export function shadeOf(n: P2, P: Projection): number {
  const { sinA, cosA } = cameraOf(P);
  // plan normal (l, f) to the world plane (f, −l)
  const lit = (n[1] * -sinA + -n[0] * cosA + 1) / 2;
  return Math.min(3, Math.max(0, Math.floor(lit * 4)));
}

export function facing(n: P2, P: Projection): number {
  const [vx, vy] = towardViewer(P);
  return n[1] * vx + -n[0] * vy;
}

/** The walls of one ring that face the viewer, each a bond line, a body and
    a thin metal band at its top, shaded by its facing; a hairline where the
    wall turns away. The ring keeps its solid on its left. */
export function wallsOf(ring: readonly P2[], h0: number, h1: number, P: Projection, pal: Palette, { gap = 1, band = 0.7, gild }: { gap?: number; band?: number; gild?: (a: P2, b: P2, n: P2) => 0 | 1 | 2 } = {}): Wall[] {
  const n = ring.length;
  const normals: P2[] = ring.map((a, i) => {
    const b = ring[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
  });
  const faces = normals.map((m) => facing(m, P) > 1e-6);
  const out: Wall[] = [];
  for (let i = 0; i < n; i++) {
    if (!faces[i]) continue;
    const a = ring[i];
    const b = ring[(i + 1) % n];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-3) continue;
    const s = shadeOf(normals[i], P);
    const quad = (z0: number, z1: number) => polyD([at(a, z1, P), at(b, z1, P), at(b, z0, P), at(a, z0, P)]);
    const g = gild?.(a, b, normals[i]) ?? 0;
    const edge = g === 2 ? pal.gold : pal.band[s];
    let svg = `<path fill="${pal.bond}" d="${quad(h0, h0 + gap)}"/><path fill="${g ? pal.sulcus[s] : pal.body[s]}" d="${quad(h0 + gap, h1 - band)}"/><path fill="${edge}" d="${quad(h1 - band, h1)}"/>`;
    const lines: string[] = [];
    if (!faces[(i - 1 + n) % n]) lines.push(lineD([at(a, h1, P), at(a, h0 + gap, P)]));
    if (!faces[(i + 1) % n]) lines.push(lineD([at(b, h1, P), at(b, h0 + gap, P)]));
    if (lines.length) svg += `<path fill="none" stroke="${pal.edge}" stroke-width=".5" d="${lines.join("")}"/>`;
    out.push({ depth: depthAt([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], (h0 + h1) / 2, P), a, b, n: normals[i], svg, deco: [] });
  }
  return out;
}

// ─── the band ───────────────────────────────────────────────────────────────

export interface BandSpec {
  /** One hemisphere's collar in plan (solid on its left). */
  ring: P2[];
  z0: number;
  z1: number;
  /** The chamfer at its top edge. */
  chamfer: number;
  /** Ring vertices the segments part at. */
  seams: number[];
}

/** One hemisphere's collar band: a faceted wall in gunmetal, a chamfer at
    its top edge, seams between its segments with a screw either side, and
    its top a quiet ledge the brain stands in. */
export function bandSvg(spec: BandSpec, P: Projection, pal: Palette, extra: (wall: { a: P2; b: P2; n: P2 }) => string = () => ""): string {
  const { z0, z1, chamfer, ring } = spec;
  const n = ring.length;
  const normals: P2[] = ring.map((a, i) => {
    const b = ring[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
  });
  // the inset ring the chamfer rises to
  const inner = ring.map((p, i) => {
    const m0 = normals[(i - 1 + n) % n];
    const m1 = normals[i];
    let mx = m0[0] + m1[0];
    let my = m0[1] + m1[1];
    const ml = Math.hypot(mx, my) || 1;
    mx /= ml;
    my /= ml;
    const k = chamfer / Math.max(0.4, mx * m1[0] + my * m1[1]);
    return [p[0] - mx * k, p[1] - my * k] as P2;
  });
  const items: { depth: number; svg: string }[] = [];
  for (let i = 0; i < n; i++) {
    const m = normals[i];
    if (facing(m, P) <= 1e-6) continue;
    const a = ring[i];
    const b = ring[(i + 1) % n];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-3) continue;
    const s = shadeOf(m, P);
    const wall = polyD([at(a, z1 - chamfer, P), at(b, z1 - chamfer, P), at(b, z0, P), at(a, z0, P)]);
    const cham = polyD([at(inner[i], z1, P), at(inner[(i + 1) % n], z1, P), at(b, z1 - chamfer, P), at(a, z1 - chamfer, P)]);
    let svg = `<path fill="${pal.metal[s]}" stroke="${pal.metal[s]}" stroke-width=".3" d="${wall}"/><path fill="${pal.metal[Math.min(3, s + 1)]}" stroke="${pal.metal[Math.min(3, s + 1)]}" stroke-width=".3" d="${cham}"/>`;
    svg += `<path fill="none" stroke="${pal.metalEdge}" stroke-width=".5" d="${lineD([at(a, z1 - chamfer, P), at(b, z1 - chamfer, P)])}${lineD([at(a, z0, P), at(b, z0, P)])}"/>`;
    // a machined recess round the band, a third of the way up
    const zr = z0 + (z1 - z0) * 0.34;
    svg += `<path fill="none" stroke="${pal.seam}" stroke-width=".9" d="${lineD([at(a, zr, P), at(b, zr, P)])}"/><path fill="none" stroke="${pal.metalEdge}" stroke-width=".4" d="${lineD([at(a, zr - 0.8, P), at(b, zr - 0.8, P)])}"/>`;
    svg += extra({ a, b, n: m });
    items.push({ depth: depthAt([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], (z0 + z1) / 2, P), svg });
  }
  items.sort((p, q) => p.depth - q.depth);
  // seams, a screw either side of each
  const marks: string[] = [];
  const screws: Flat[] = [];
  for (const k of spec.seams) {
    const p = ring[k];
    const a = ring[(k - 1 + n) % n];
    const b = ring[(k + 1) % n];
    const ta = unit([p[0] - a[0], p[1] - a[1]]);
    const tb = unit([b[0] - p[0], b[1] - p[1]]);
    const na: P2 = [ta[1], -ta[0]];
    const nb: P2 = [tb[1], -tb[0]];
    if (facing(na, P) <= 0.05 && facing(nb, P) <= 0.05) continue;
    marks.push(lineD([at(p, z1 - chamfer, P), at(p, z0, P)]));
    const zs = [z1 - chamfer - 3, z0 + 3];
    for (const [t, m] of [[ta, na], [tb, nb]] as [P2, P2][]) {
      if (facing(m, P) <= 0.05) continue;
      const sgn = t === ta ? -1 : 1;
      for (const z of zs) screws.push(at([p[0] + t[0] * 3.2 * sgn + m[0] * 0.05, p[1] + t[1] * 3.2 * sgn + m[1] * 0.05], z, P));
    }
  }
  // the top: the ledge round the brain's foot
  const top = `<path fill="${pal.metalTop}" stroke="${pal.metalEdge}" stroke-width=".5" d="${polyD(inner.map((p) => at(p, z1, P)))}"/>`;
  const seamSvg = marks.length ? `<path fill="none" stroke="${pal.seam}" stroke-width="1.1" d="${marks.join("")}"/>` : "";
  const screwSvg = screws.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r=".75" fill="${pal.seam}" stroke="${pal.metalEdge}" stroke-width=".35"/>`).join("");
  return `<g class="wc-band">${top}${items.map((i) => i.svg).join("")}${seamSvg}${screwSvg}</g>`;
}

const unit = (v: P2): P2 => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};

/** A small lens port flush in the band's wall: a chamfered bezel, a dark
    glass, one lit glint. `c` is its centre on the wall, `t` the wall's
    direction, `m` its outward normal, `z` its height. */
export function lensSvg(c: P2, t: P2, m: P2, z: number, r: number, P: Projection, pal: Palette): string {
  const on = (u: number, v: number, out = 0.1): Flat => at([c[0] + t[0] * u + m[0] * out, c[1] + t[1] * u + m[1] * out], z + v, P);
  const oct = (h: number, cut: number, out: number) =>
    polyD(
      [
        [-h + cut, -h],
        [h - cut, -h],
        [h, -h + cut],
        [h, h - cut],
        [h - cut, h],
        [-h + cut, h],
        [-h, h - cut],
        [-h, -h + cut],
      ].map(([u, v]) => on(u, v, out))
    );
  const circle = (rr: number, out: number) => polyD(Array.from({ length: 20 }, (_, i) => on(rr * Math.cos((i / 20) * Math.PI * 2), rr * Math.sin((i / 20) * Math.PI * 2), out)));
  const [gx, gy] = on(-r * 0.3, r * 0.3, 0.3);
  return (
    `<path fill="${pal.metal[3]}" stroke="${pal.metalEdge}" stroke-width=".5" d="${oct(r + 2.4, 1.4, 0.2)}"/>` +
    `<path fill="${pal.metal[0]}" stroke="${pal.metalEdge}" stroke-width=".4" d="${circle(r + 0.9, 0.25)}"/>` +
    `<path fill="${pal.glass}" stroke="${pal.seam}" stroke-width=".4" d="${circle(r, 0.3)}"/>` +
    `<path fill="none" stroke="${pal.gold}" stroke-width=".5" opacity=".8" d="${circle(r * 0.45, 0.35)}"/>` +
    `<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r=".55" fill="${pal.lit}"/>`
  );
}

// ─── the tendrils ───────────────────────────────────────────────────────────

export interface Tendril {
  /** The route's centre line, world points (sampled). */
  route: V3[];
  /** Lines in the bundle and their pitch, screen units. */
  lines: number;
  pitch: number;
  /** Which line (0 …) is gold, if one is. */
  gold?: number;
  /** How it ends: a small chamfered terminal, or fading out. */
  end: "terminal" | "fade" | "none";
}

export function bezier3(p0: V3, p1: V3, p2: V3, p3: V3, n = 60): V3[] {
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

/** Screen points evenly spaced along a polyline. */
function evenFlat(pts: Flat[], step: number): Flat[] {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1];
  const n = Math.max(2, Math.ceil(total / step));
  const out: Flat[] = [];
  let j = 1;
  for (let k = 0; k <= n; k++) {
    const s = (total * k) / n;
    while (j < pts.length - 1 && lens[j] < s) j++;
    const t = (s - lens[j - 1]) / (lens[j] - lens[j - 1] || 1);
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t]);
  }
  return out;
}

/** One bundle: its lines offset at a constant pitch from the route's
    projection (so the bundle reads as a flat ribbon of traces, never a hose),
    a knock-out under it in the ground so a bundle that crosses another reads
    over it, and its end. */
export function tendrilSvg(td: Tendril, P: Projection, pal: Palette, id: string): string {
  const centre = evenFlat(td.route.map((p) => iso(p as Point3, P)), 1.2);
  const m = centre.length;
  // smoothed normals
  const tan = centre.map((_, i) => {
    const a = centre[Math.max(0, i - 2)];
    const b = centre[Math.min(m - 1, i + 2)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l] as Flat;
  });
  const half = ((td.lines - 1) * td.pitch) / 2;
  const lines: Flat[][] = Array.from({ length: td.lines }, (_, k) => centre.map((c, i) => [c[0] - tan[i][1] * (k * td.pitch - half), c[1] + tan[i][0] * (k * td.pitch - half)] as Flat));
  const out: string[] = [];
  // the knock-out: the ground under the bundle (not over its first stretch,
  // which leaves from under the band)
  out.push(`<path fill="none" stroke="${pal.ground}" stroke-width="${(half * 2 + 2.2).toFixed(1)}" stroke-linecap="butt" stroke-linejoin="round" d="${lineD(lean(centre.slice(Math.min(m - 2, 10))))}"/>`);
  const fadeFrom = td.end === "fade" ? Math.floor(m * 0.62) : m;
  const [fx, fy] = centre[Math.min(m - 1, fadeFrom)];
  const [ex, ey] = centre[m - 1];
  if (td.end === "fade") {
    const stops = (c: string) => `<stop offset="0" stop-color="${c}" stop-opacity="1"/><stop offset="1" stop-color="${c}" stop-opacity="0"/>`;
    out.push(`<defs><linearGradient id="${id}-i" gradientUnits="userSpaceOnUse" x1="${fx.toFixed(1)}" y1="${fy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}">${stops(pal.ink)}</linearGradient><linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="${fx.toFixed(1)}" y1="${fy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}">${stops(pal.gold)}</linearGradient></defs>`);
  }
  const inkD: string[] = [];
  const inkTail: string[] = [];
  const goldD: string[] = [];
  const goldTail: string[] = [];
  lines.forEach((ln, k) => {
    const head = lean(ln.slice(0, fadeFrom + 1));
    const tail = fadeFrom < m ? lean(ln.slice(fadeFrom)) : [];
    if (k === td.gold) {
      goldD.push(lineD(head));
      if (tail.length > 1) goldTail.push(lineD(tail));
    } else {
      inkD.push(lineD(head));
      if (tail.length > 1) inkTail.push(lineD(tail));
    }
  });
  const stroke = (c: string, w: number, d: string[]) => (d.length ? `<path fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="butt" stroke-linejoin="round" d="${d.join("")}"/>` : "");
  out.push(stroke(pal.ink, 0.65, inkD), stroke(`url(#${id}-i)`, 0.65, inkTail), stroke(pal.gold, 0.85, goldD), stroke(`url(#${id}-g)`, 0.85, goldTail));
  if (td.end === "terminal") {
    // a small chamfered terminal across the bundle's end
    const t = tan[m - 1];
    const nrm: Flat = [-t[1], t[0]];
    const w = half + 1.4;
    const L = 5;
    const c = 0.9;
    const pt = (u: number, v: number): Flat => [ex + nrm[0] * u + t[0] * v, ey + nrm[1] * u + t[1] * v];
    const body = [pt(-w + c, -0.6), pt(w - c, -0.6), pt(w, -0.6 + c), pt(w, L - c), pt(w - c, L), pt(-w + c, L), pt(-w, L - c), pt(-w, -0.6 + c)];
    out.push(`<path fill="${pal.metal[2]}" stroke="${pal.metalEdge}" stroke-width=".45" d="${polyD(body)}"/>`);
    out.push(`<path fill="none" stroke="${pal.metalEdge}" stroke-width=".4" d="${lineD([pt(-w, 1.6), pt(w, 1.6)])}"/>`);
  }
  return `<g class="wc-tendril">${out.join("")}</g>`;
}
