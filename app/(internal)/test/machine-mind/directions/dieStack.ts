/**
 * F3 · Die Stack (machine-mind round three, 2026-10-17; owner: "more blocky
 * so it really feels like it's built out of a motherboard, machine circuits
 * … these elevations so they really look like wafers … really making it
 * visible that it looks like a brain … maybe there's also a port, like a
 * USB-B port").
 *
 * The brain as a 3D-IC memory stack. Each hemisphere is a dozen thinned
 * dies, each one the brain's level section routed as a board edge (long
 * runs, level, plumb or 45°, the sulci still notched into it), dark silicon
 * shaded face by face. Between two dies a thin bond gap: the underfill set
 * back under the die above, a row of gold micro-bumps along its edge. Gold
 * through-silicon vias run down the stack in two columns a side, a pair on
 * every die's edge and a landing on every tread. The treads carry a quiet
 * floorplan: a scribe grid on one die, a bank of cells inside a seal ring on
 * the next. The stack stands on a base logic die and a thin interposer. The
 * node sits on the left crown, the one lit part; one USB-B receptacle is
 * seated in the 45° edge a low die turns at the frontal corner, which faces
 * the isometric camera square and the face-on one at 45°, so it reads in
 * both.
 *
 * Pure: strings and numbers, no randomness.
 */

import { LC, W, projOf, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, dotsSvg, extrude, iso, lineSvg, pathOf, solidSvg, towardViewer, type Flat, type Plane, type Projection } from "@/components/arcs/figures/foundation/isoKit";
import { atHeight, heightRange, inside, lightVector, mindSvg, polyD, rampOf, routedOutline, sectionAt, sidesFarFirst, type HullShape, type MindTones, type Side, type V3 } from "../hull";
import type { MindDirection, MindOptions } from "./types";

// ─── the stack ──────────────────────────────────────────────────────────────

const SHAPE: HullShape = { brain: 1, sulci: 0.07 };
/** Dies a hemisphere, their routing tolerance, the bond gap under each, how
    far its underfill sets back, the thinnest a die gets. */
const DIES = 13;
const TOL = 2.5;
const GAP = 2.2;
const SETBACK = 1.3;
const MIN_T = 7;
/** Points sampled round each section before it is routed. */
const RING = 280;

const [H_FLOOR, H_CROWN] = heightRange(SHAPE);
/** The base logic die under the stack (the bottom die's outline grown) and
    the interposer under that, thinner and wider. */
const BASE = { grow: 4, h: 12 };
const INTERPOSER = { grow: 10, h: 3.2 };

/** The dies' bounds, floor to crown: equal steps along the surface (the mean
    meridian over a dozen angles), so the treads stay narrow over the dome,
    never thinner than `MIN_T`. */
function levels(): number[] {
  const n = 240;
  const angles = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  const radius = (H: number) => angles.reduce((s, t) => s + Math.hypot(atHeight(1, t, H, SHAPE).p[0] - LC, atHeight(1, t, H, SHAPE).p[1]), 0) / angles.length;
  const hs: number[] = [];
  const ds: number[] = [0];
  let r0 = radius(H_FLOOR);
  for (let i = 0; i <= n; i++) {
    const H = H_FLOOR + ((H_CROWN - H_FLOOR) * i) / n;
    hs.push(H);
    if (i) {
      const r = radius(H);
      ds.push(ds[i - 1] + Math.hypot(r - r0, (H_CROWN - H_FLOOR) / n));
      r0 = r;
    }
  }
  const out = [H_FLOOR];
  let j = 0;
  for (let k = 1; k < DIES; k++) {
    const target = (ds[n] * k) / DIES;
    while (ds[j + 1] < target) j++;
    const a = (target - ds[j]) / (ds[j + 1] - ds[j]);
    out.push(Math.max(hs[j] + (hs[j + 1] - hs[j]) * a, out[out.length - 1] + MIN_T));
  }
  out.push(Math.max(H_CROWN, out[out.length - 1] + MIN_T));
  return out;
}

/** A die: its outline in the world plane (counter-clockwise), and its span. */
interface Die {
  ring: Plane[];
  z0: number;
  z1: number;
}

const ccw = (ring: Plane[]): Plane[] => {
  let a = 0;
  ring.forEach((p, i) => {
    const q = ring[(i + 1) % ring.length];
    a += p[0] * q[1] - q[0] * p[1];
  });
  return a > 0 ? ring : [...ring].reverse();
};

const memo = new Map<Side, Die[]>();

function diesOf(side: Side): Die[] {
  const known = memo.get(side);
  if (known) return known;
  const H = levels();
  const dies: Die[] = [];
  for (let k = 0; k < DIES; k++) {
    const z0 = H[k];
    const z1 = H[k + 1];
    const mid = (z0 + z1) / 2;
    const ring = ccw(routedOutline(sectionAt(side, mid, SHAPE, RING).ring, TOL).map(([l, f]) => [W(l, f, 0)[0], W(l, f, 0)[1]] as Plane));
    dies.push({ ring, z0: k ? z0 + GAP : z0, z1 });
  }
  memo.set(side, dies);
  return dies;
}

/** A ring moved in by `d` (mitred; counter-clockwise ring). */
function insetRing(ring: Plane[], d: number): Plane[] {
  const n = ring.length;
  const lines = ring.map((p, i) => {
    const q = ring[(i + 1) % n];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const nx = -(q[1] - p[1]) / len;
    const ny = (q[0] - p[0]) / len;
    return { p: [p[0] + nx * d, p[1] + ny * d] as Plane, v: [q[0] - p[0], q[1] - p[1]] as Plane };
  });
  return lines.map((l1, i) => {
    const l0 = lines[(i + n - 1) % n];
    const den = l0.v[0] * l1.v[1] - l0.v[1] * l1.v[0];
    if (Math.abs(den) < 1e-9) return l1.p;
    const k = ((l1.p[0] - l0.p[0]) * l1.v[1] - (l1.p[1] - l0.p[1]) * l1.v[0]) / den;
    return [l0.p[0] + l0.v[0] * k, l0.p[1] + l0.v[1] * k] as Plane;
  });
}

const areaOf = (ring: Plane[]) => ring.reduce((s, p, i) => s + p[0] * ring[(i + 1) % ring.length][1] - ring[(i + 1) % ring.length][0] * p[1], 0) / 2;

// ─── tones ──────────────────────────────────────────────────────────────────

interface Paint {
  side: string[];
  top: string;
  gap: string;
  bump: string;
  cell: string;
  edge: string;
  faint: string;
  gold: string;
  lit: string;
  ground: string;
  ink: string;
}

const SIDE_N = 9;

function paintOf(light: boolean, tones: MindTones): Paint {
  return light
    ? { side: rampOf("#9d968a", "#e6e0d4", SIDE_N), top: "#efeae0", gap: "#5f594f", bump: "#c9a552", cell: "#d9d3c6", edge: "#6e6658", faint: "#c4bdaf", gold: tones.gold, lit: tones.lit, ground: tones.ground, ink: tones.ink }
    : { side: rampOf("#0a0908", "#544d42", SIDE_N), top: "#3b362e", gap: "#040403", bump: tones.gold, cell: "#433e37", edge: "#857e72", faint: "#4d4840", gold: tones.gold, lit: tones.lit, ground: tones.ground, ink: tones.ink };
}

// ─── drawing a die ──────────────────────────────────────────────────────────

/** A ring's side faces that face the viewer, back to front, each with its
    outward normal and its ends. */
function facingSides(ring: Plane[], P: Projection) {
  const [vx, vy] = towardViewer(P);
  const out: { i: number; a: Plane; b: Plane; n: Plane; depth: number }[] = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const n: Plane = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
    if (n[0] * vx + n[1] * vy <= 1e-9) return;
    out.push({ i, a, b, n, depth: depthOf([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0], P) });
  });
  return out.sort((p, q) => p.depth - q.depth);
}

const at = (p: Plane, z: number, P: Projection): Flat => iso([p[0], p[1], z], P);

/** A prism of a ring between z0 and z1: its facing sides back to front, each
    in the tone its normal takes from the light, then its top. */
function prismSvg(ring: Plane[], z0: number, z1: number, P: Projection, L: V3, tone: (lit: number) => string, top: string | null, edge: string | null): string {
  let out = "";
  const sides = facingSides(ring, P);
  for (const s of sides) {
    const lit = s.n[0] * L[0] + s.n[1] * L[1];
    const c = tone(lit);
    out += `<path fill="${c}" stroke="${c}" stroke-width=".3" stroke-linejoin="round" d="${polyD([at(s.a, z1, P), at(s.b, z1, P), at(s.b, z0, P), at(s.a, z0, P)])}"/>`;
  }
  if (top) out += `<path fill="${top}" d="${polyD(ring.map((p) => at(p, z1, P)))}"/>`;
  if (edge) {
    // the top's edge whole, and each visible corner of the riser
    const corners: string[] = [];
    const seen = new Set(sides.map((s) => s.i));
    ring.forEach((p, i) => {
      if (seen.has(i) || seen.has((i - 1 + ring.length) % ring.length)) corners.push(pathOf([at(p, z1, P), at(p, z0, P)]));
    });
    out += `<path fill="none" stroke="${edge}" stroke-width=".4" stroke-linejoin="round" d="${polyD(ring.map((p) => at(p, z1, P)))}${corners.join("")}"/>`;
  }
  return out;
}

/** Plan lines cut to the inside of a ring (even-odd), for the treads. */
function clipToRing(a: Plane, b: Plane, ring: Plane[]): [Plane, Plane][] {
  const ks = [0, 1];
  ring.forEach((p, i) => {
    const q = ring[(i + 1) % ring.length];
    const den = (b[0] - a[0]) * (q[1] - p[1]) - (b[1] - a[1]) * (q[0] - p[0]);
    if (Math.abs(den) < 1e-12) return;
    const s = ((p[0] - a[0]) * (q[1] - p[1]) - (p[1] - a[1]) * (q[0] - p[0])) / den;
    const r = ((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / den;
    if (s > 0 && s < 1 && r >= 0 && r <= 1) ks.push(s);
  });
  ks.sort((x, y) => x - y);
  const out: [Plane, Plane][] = [];
  for (let i = 0; i < ks.length - 1; i++) {
    const m = (ks[i] + ks[i + 1]) / 2;
    const mid: Flat = [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
    if (ks[i + 1] - ks[i] > 1e-6 && inside(mid, ring)) out.push([[a[0] + (b[0] - a[0]) * ks[i], a[1] + (b[1] - a[1]) * ks[i]], [a[0] + (b[0] - a[0]) * ks[i + 1], a[1] + (b[1] - a[1]) * ks[i + 1]]]);
  }
  return out;
}

/** Where a ray from (ox, oy) along (ux, uy) leaves a ring: the first crossing
    out, or null. */
function exitAlong(ring: Plane[], ox: number, oy: number, ux: number, uy: number): { s: number; i: number } | null {
  let best: { s: number; i: number } | null = null;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const den = ux * ey - uy * ex;
    if (Math.abs(den) < 1e-9) return;
    const s = ((a[0] - ox) * ey - (a[1] - oy) * ex) / den;
    const r = ((a[0] - ox) * uy - (a[1] - oy) * ux) / den;
    if (s > 1e-6 && r >= 0 && r <= 1 && (!best || s < best.s)) best = { s, i };
  });
  return best;
}

// ─── the node, the port ─────────────────────────────────────────────────────

const box = (cx: number, cy: number, hx: number, hy = hx): Plane[] => [
  [cx - hx, cy - hy],
  [cx + hx, cy - hy],
  [cx + hx, cy + hy],
  [cx - hx, cy + hy],
];
const NODE = { pad: 9, die: 5, h: 2.6, pins: 3, pitch: 2.4 };

/** The node: a gold pad on the crown, the die on it (the one lit part), its
    pins fanned out to a ring of vias on the pad. */
function nodeSvg(cx: number, cy: number, z: number, P: Projection): string {
  const pad = solidSvg(extrude(box(cx, cy, NODE.pad), z, 0.9, P, { bevel: 0.4 }), { tone: "mid", crease: "lo", className: "fa-gold" });
  const top = z + 0.9;
  const pins: string[] = [];
  const vias: Flat[] = [];
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < NODE.pins; i++) {
      const o = (i - (NODE.pins - 1) / 2) * NODE.pitch;
      const splay = o * 1.5;
      const reach = NODE.pad - 1.4;
      const local: [number, number][] = [
        [NODE.die + 0.4, o],
        [NODE.die + 1.8, o],
        [NODE.die + 1.8 + Math.abs(splay - o), splay],
        [reach, splay],
      ];
      const rot = (x: number, y: number): [number, number] => (s === 0 ? [x, y] : s === 1 ? [-y, x] : s === 2 ? [-x, -y] : [y, -x]);
      const pts = local.map(([x, y]) => rot(x, y)).map(([x, y]) => iso([cx + x, cy + y, top], P));
      pins.push(pathOf(pts));
      vias.push(pts[pts.length - 1]);
    }
  }
  const die = solidSvg(extrude(box(cx, cy, NODE.die), top, NODE.h, P, { bevel: 0.4 }), { tone: "hi", lit: true, className: "fa-gold fa-core" });
  return pad + lineSvg(pins.join(""), { tone: "lo", className: "fa-gold-line" }) + `<g class="ds-via">${dotsSvg(vias, { size: 0.55, tone: "hi" })}</g>` + die;
}

/** A USB-B receptacle seated in a die's edge: the tin shell standing a
    little proud of the face, its plug face square with its two top corners
    cut, the dark opening, the tongue inside with its four gold contacts. */
function portSvg(a: Plane, b: Plane, n: Plane, z0: number, z1: number, P: Projection, T: Paint, light: boolean): string {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const u: Plane = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const c: Plane = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const zc = (z0 + z1) / 2;
  const W2 = 6.6;
  const H2 = Math.min(5.6, (z1 - z0) / 2 - 1.2);
  const cut = 1.6;
  const proud = 1.6;
  const pt = (x: number, y: number, d: number): Flat => iso([c[0] + u[0] * x + n[0] * d, c[1] + u[1] * x + n[1] * d, zc + y], P);
  const face = (inset: number, d: number): Flat[] => [
    pt(-W2 + inset, -H2 + inset, d),
    pt(W2 - inset, -H2 + inset, d),
    pt(W2 - inset, H2 - cut - inset * 0.4, d),
    pt(W2 - cut - inset * 0.4, H2 - inset, d),
    pt(-W2 + cut + inset * 0.4, H2 - inset, d),
    pt(-W2 + inset, H2 - cut - inset * 0.4, d),
  ];
  const tin = light ? { face: "#d7d3cb", side: "#b9b4aa", top: "#e4e0d8", line: "#6e6658" } : { face: "#77736b", side: "#55524c", top: "#8a867d", line: "#2a2722" };
  const shellFront = face(0, proud);
  const shellBack = face(0, 0);
  // the shell's top and the side that faces the viewer, then its face
  const [vx, vy] = towardViewer(P);
  const sideX = u[0] * vx + u[1] * vy > 0 ? 1 : -1;
  const parts: string[] = [];
  const topQuad = [shellBack[4], shellBack[3], shellFront[3], shellFront[4]];
  parts.push(`<path fill="${tin.top}" d="${polyD(topQuad)}"/>`);
  const cutQuad = sideX > 0 ? [shellBack[3], shellBack[2], shellFront[2], shellFront[3]] : [shellBack[5], shellBack[4], shellFront[4], shellFront[5]];
  parts.push(`<path fill="${tin.top}" d="${polyD(cutQuad)}"/>`);
  const sideQuad = sideX > 0 ? [shellBack[2], shellBack[1], shellFront[1], shellFront[2]] : [shellBack[0], shellBack[5], shellFront[5], shellFront[0]];
  parts.push(`<path fill="${tin.side}" d="${polyD(sideQuad)}"/>`);
  parts.push(`<path fill="${tin.face}" stroke="${tin.line}" stroke-width=".35" stroke-linejoin="round" d="${polyD(shellFront)}"/>`);
  parts.push(`<path fill="${light ? "#2a2214" : "#050504"}" d="${polyD(face(0.9, proud))}"/>`);
  // the tongue: a block in the opening, four contacts on it
  const tongue = [pt(-2.6, -1.5, proud - 0.2), pt(2.6, -1.5, proud - 0.2), pt(2.6, 1.3, proud - 0.2), pt(-2.6, 1.3, proud - 0.2)];
  parts.push(`<path fill="${light ? "#cfc8b8" : "#3b3832"}" d="${polyD(tongue)}"/>`);
  const contacts: string[] = [];
  for (const x of [-1.5, 1.5]) {
    for (const y of [-1.1, 0.9]) contacts.push(pathOf([pt(x - 0.7, y, proud - 0.1), pt(x + 0.7, y, proud - 0.1)]));
  }
  parts.push(`<path fill="none" stroke="${T.gold}" stroke-width=".55" d="${contacts.join("")}"/>`);
  return parts.join("");
}

// ─── one hemisphere ─────────────────────────────────────────────────────────

/** The two columns of through-silicon vias a side: directions in the plan,
    measured from lateral (0) toward the front (90°), so the same anatomy on
    both sides. */
const TSV_AT = [52, 104];
/** The hemisphere that carries the node (on its crown) and the one that
    carries the port (in its base die). */
const NODE_SIDE: Side = -1;
const PORT_SIDE: Side = -1;
/** The dies the port may sit in (low, below the widest). */
const PORT_DIES = [3, 4, 5];

function hemisphere(side: Side, view: BrainView, T: Paint, light: boolean): string {
  const P = projOf(view);
  const L = lightVector(view);
  const [vx, vy] = towardViewer(P);
  const dies = diesOf(side);
  const tone = (lit: number) => T.side[Math.max(0, Math.min(SIDE_N - 1, Math.round(((lit + 0.85) / 1.7) * (SIDE_N - 1))))];
  // the hemisphere's centre in the world plane, and a plan direction
  const centre = W(side * LC, 0, 0);
  const dirOf = (deg: number): Plane => {
    const lat = Math.cos((deg * Math.PI) / 180);
    const front = Math.sin((deg * Math.PI) / 180);
    const w = W(side * lat, front, 0);
    return [w[0], w[1]];
  };
  // the base die and the interposer under the stack
  const zBase1 = dies[0].z0 - GAP;
  const zBase0 = zBase1 - BASE.h;
  const base = insetRing(dies[0].ring, -BASE.grow);
  const inter = insetRing(dies[0].ring, -INTERPOSER.grow);
  // the port: in the longest 45° run a low die turns to the frontal corner
  // (it faces the isometric camera square and the face-on one at 45°)
  let port: { k: number; a: Plane; b: Plane; n: Plane } | null = null;
  if (side === PORT_SIDE) {
    const want = dirOf(45);
    let best = 0;
    for (const k of PORT_DIES) {
      const ring = dies[k].ring;
      ring.forEach((a, i) => {
        const b = ring[(i + 1) % ring.length];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n: Plane = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
        if (n[0] * want[0] + n[1] * want[1] > 0.97 && len > best) {
          best = len;
          port = { k, a, b, n };
        }
      });
    }
  }
  /** The bond gap between two dies: the underfill set back under the
      smaller, a row of micro-bumps along its seen edges. */
  const bondGap = (lower: Plane[], upper: Plane[], z0: number, z1: number) => {
    const under = insetRing(areaOf(lower) < areaOf(upper) ? lower : upper, SETBACK);
    out.push(prismSvg(under, z0, z1, P, L, () => T.gap, null, null));
    const bumps: Flat[] = [];
    const zb = (z0 + z1) / 2;
    under.forEach((a, i) => {
      const b = under[(i + 1) % under.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n: Plane = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
      if (n[0] * vx + n[1] * vy <= 0.05) return;
      const count = Math.floor(len / 3.2);
      for (let j = 0; j < count; j++) {
        const s = (j + 0.5) / count;
        bumps.push(at([a[0] + (b[0] - a[0]) * s + n[0] * 0.55, a[1] + (b[1] - a[1]) * s + n[1] * 0.55], zb, P));
      }
    });
    out.push(`<g class="ds-bump">${dotsSvg(bumps, { size: 0.42, tone: "hi" })}</g>`);
  };
  const out: string[] = [];
  out.push(prismSvg(inter, zBase0 - INTERPOSER.h, zBase0, P, L, (lit) => tone(lit - 0.3), T.top, T.edge));
  out.push(prismSvg(base, zBase0, zBase1, P, L, (lit) => tone(lit + 0.15), T.top, T.edge));
  bondGap(base, dies[0].ring, zBase1, dies[0].z0);
  dies.forEach((die, k) => {
    const prev = dies[k - 1];
    if (prev) bondGap(prev.ring, die.ring, prev.z1, die.z0);
    // the die
    out.push(prismSvg(die.ring, die.z0, die.z1, P, L, tone, T.top, T.edge));
    const pp = port as { k: number; a: Plane; b: Plane; n: Plane } | null;
    if (pp && pp.k === k) out.push(portSvg(pp.a, pp.b, pp.n, die.z0, die.z1, P, T, light));
    // the tread's floorplan: a scribe grid on one die, a seal ring on the next
    const next = dies[k + 1];
    if (next) {
      if (k % 2 === 0) {
        const xs = die.ring.map((p) => p[0]);
        const ys = die.ring.map((p) => p[1]);
        const lines: string[] = [];
        const pitch = 9;
        for (let x = Math.ceil(Math.min(...xs) / pitch) * pitch; x < Math.max(...xs); x += pitch) {
          for (const [a, b] of clipToRing([x, Math.min(...ys) - 1], [x, Math.max(...ys) + 1], die.ring)) lines.push(pathOf([at(a, die.z1, P), at(b, die.z1, P)]));
        }
        for (let y = Math.ceil(Math.min(...ys) / pitch) * pitch; y < Math.max(...ys); y += pitch) {
          for (const [a, b] of clipToRing([Math.min(...xs) - 1, y], [Math.max(...xs) + 1, y], die.ring)) lines.push(pathOf([at(a, die.z1, P), at(b, die.z1, P)]));
        }
        out.push(`<path fill="none" stroke="${T.faint}" stroke-width=".3" d="${lines.join("")}"/>`);
      } else {
        // a bank of cells inside a seal ring: a fine lattice
        const seal = insetRing(die.ring, 1.4);
        const xs = seal.map((p) => p[0]);
        const ys = seal.map((p) => p[1]);
        const lines: string[] = [];
        const pitch = 2.4;
        for (let x = Math.ceil(Math.min(...xs) / pitch) * pitch; x < Math.max(...xs); x += pitch) {
          for (const [a, b] of clipToRing([x, Math.min(...ys) - 1], [x, Math.max(...ys) + 1], seal)) lines.push(pathOf([at(a, die.z1, P), at(b, die.z1, P)]));
        }
        for (let y = Math.ceil(Math.min(...ys) / pitch) * pitch; y < Math.max(...ys); y += pitch) {
          for (const [a, b] of clipToRing([Math.min(...xs) - 1, y], [Math.max(...xs) + 1, y], seal)) lines.push(pathOf([at(a, die.z1, P), at(b, die.z1, P)]));
        }
        out.push(`<path fill="none" stroke="${T.cell}" stroke-width=".22" d="${lines.join("")}"/><path fill="none" stroke="${T.faint}" stroke-width=".35" d="${polyD(seal.map((p) => at(p, die.z1, P)))}"/>`);
      }
    }
    // the through-silicon vias: a pair on this die's edge where the column
    // leaves it, a landing on its tread
    for (const deg of TSV_AT) {
      const [ux, uy] = dirOf(deg);
      const hit = exitAlong(die.ring, centre[0], centre[1], ux, uy);
      if (!hit) continue;
      const e: Plane = [centre[0] + ux * hit.s, centre[1] + uy * hit.s];
      const a = die.ring[hit.i];
      const b = die.ring[(hit.i + 1) % die.ring.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const t: Plane = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
      const n: Plane = [t[1], -t[0]];
      if (n[0] * vx + n[1] * vy > 0.05) {
        const pair: string[] = [];
        for (const o of [-0.7, 0.7]) {
          const p: Plane = [e[0] + t[0] * o + n[0] * 0.05, e[1] + t[1] * o + n[1] * 0.05];
          pair.push(pathOf([at(p, die.z1 - 0.6, P), at(p, die.z0 + 0.6, P)]));
        }
        out.push(`<path fill="none" stroke="${T.gold}" stroke-width=".45" d="${pair.join("")}"/>`);
      }
      if (next) {
        const hn = exitAlong(next.ring, centre[0], centre[1], ux, uy);
        if (hn && hit.s - hn.s > 2.2) {
          const s = (hit.s + hn.s) / 2;
          out.push(`<g class="ds-via">${dotsSvg([at([centre[0] + ux * s, centre[1] + uy * s], die.z1, P)], { size: 0.62, tone: "hi" })}</g>`);
        }
      }
    }
  });
  // the node on the left crown: centred on the top die's own middle
  if (side === NODE_SIDE) {
    const top = dies[dies.length - 1];
    const xs = top.ring.map((p) => p[0]);
    const ys = top.ring.map((p) => p[1]);
    out.push(nodeSvg((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, top.z1, P));
  }
  return `<g class="ds-hemi">${out.join("")}</g>`;
}

// ─── the picture ────────────────────────────────────────────────────────────

const cssOf = (T: Paint) => `.ds-hemi path{vector-effect:none}.ds-via .iso-dots circle{fill:${T.gold};stroke:${T.ground};stroke-width:.2;opacity:1}.ds-bump .iso-dots circle{fill:${T.bump};opacity:1}`;

export function dieStackSvg({ view, only, light, tones }: MindOptions): string {
  const T = paintOf(light, tones);
  const sides = only ? [only] : sidesFarFirst(view);
  const body = sides.map((side) => hemisphere(side, view, T, light)).join("");
  return mindSvg({ view, light, tones, body, css: cssOf(T) });
}

/** Die Stack (machine-mind round three, 2026-10-17). */
export const dieStack: MindDirection = {
  id: "f3",
  round: 3,
  name: "Die Stack",
  line: "The brain as a memory stack: thirteen dies cut to its sections on a base die, gold micro-bumps in every bond gap, through-silicon vias down the edges, the node on the crown and a USB-B port at the frontal corner.",
  svg: (o) => dieStackSvg(o),
};

