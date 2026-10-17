/**
 * E3 · Laminate (machine-mind round two, 2026-10-17; owner: "what's missing
 * is maybe that layered thing … it's missing the gold in the layers … make
 * sure it looks a bit more like a brain").
 *
 * The original brain's stacked contour plates brought back, thin and many,
 * like a multilayer board or a laser-cut layered brain model. Each plate is
 * the brain's true level section at its height (the anatomy's temporal drop
 * solved out, the sulci carved, so every plate's edge is notched where a
 * sulcus crosses it and the notches stack into the grooves). The plates are
 * spaced by the surface's slope, not by height, so the treads stay narrow
 * over the dome: no plateau. Risers and treads are each shaded from the
 * hull's own smooth normal, so the stack reads as one calm form first and
 * as layers second; a sulcus darkens the plates it notches, in a narrow
 * slot, so the grooves read across the stack. Every third plate carries a
 * thin copper foil at the top of its riser: the gold is in the layers.
 *
 * The core die sits on the left crown's cap (the highest plate its pad fits
 * on), its pins fanned out to vias, the one lit part. Two buses leave the
 * pad, one toward the front and one toward the lateral side, each straight
 * in plan, their traces stepping down the plates (a run across each tread,
 * a drop down each riser, a via at each turn) and ending on vias at three
 * different depths.
 *
 * Pure: strings and numbers, no randomness.
 */

import { LC, W, projOf, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, dotsSvg, extrude, iso, lineSvg, pathOf, solidSvg, towardViewer, type Flat, type Plane, type Projection } from "@/components/arcs/figures/foundation/isoKit";
import { dot3, hullNormal, hullPoint, inside, lightVector, mindSvg, polyD, rampOf, sidesFarFirst, sulcusAt, Z_CROWN, Z_FLOOR, type HullShape, type Side, type V3 } from "../hull";
import type { MindDirection, MindOptions } from "./types";

// ─── the shape ──────────────────────────────────────────────────────────────

/** The brain drawn (the round's baseline: anatomy, sulci carved) and the
    gentler shape its light is taken from. */
const SHAPE: HullShape = { brain: 1, sulci: 0.065 };
const LIGHT: HullShape = { brain: 1, fold: 0.25 };

/** Points round each plate's outline. */
const RING = 320;
/** Plates a hemisphere. */
const PLATES = 40;
/** The thinnest a plate gets (over the crown and under the belly). */
const MIN_T = 1.4;
/** Where the stack starts, in world height. */
const H_FLOOR = -55;

/** The world height the hull reaches at its crown. */
const H_CROWN = hullPoint(1, 0, Z_CROWN, SHAPE)[2];

/** The hull's point at contour angle `t` whose world height is `H`: the
    parameter solved so the temporal lobe's drop stays level. Returns the
    point and the parameter height. */
function atHeight(side: Side, t: number, H: number): { p: V3; z: number } {
  let z = H >= 0 ? H / 0.78 : H / 0.88;
  let p = hullPoint(side, t, z, SHAPE);
  for (let k = 0; k < 6; k++) {
    z = Math.max(Z_FLOOR, Math.min(Z_CROWN, z + (H - p[2]) / (z >= 0 ? 0.78 : 0.88)));
    p = hullPoint(side, t, z, SHAPE);
  }
  return { p, z };
}

/** The plates' heights, floor to crown: equal steps along the surface (the
    mean meridian over a dozen angles), never thinner than `MIN_T`. */
function levels(): number[] {
  const n = 400;
  const hs: number[] = [];
  const ds: number[] = [0];
  const angles = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  const radius = (H: number) =>
    angles.reduce((sum, t) => {
      const { p } = atHeight(1, t, H);
      return sum + Math.hypot(p[0] - LC, p[1]);
    }, 0) / angles.length;
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
  const total = ds[n];
  const out: number[] = [H_FLOOR];
  let j = 0;
  for (let k = 1; k < PLATES; k++) {
    const target = (total * k) / PLATES;
    while (ds[j + 1] < target) j++;
    const a = (target - ds[j]) / (ds[j + 1] - ds[j]);
    const H = hs[j] + (hs[j + 1] - hs[j]) * a;
    out.push(Math.max(H, out[out.length - 1] + MIN_T));
  }
  out.push(Math.max(H_CROWN, out[out.length - 1] + MIN_T));
  return out;
}

let levelMemo: number[] | null = null;
const LEVELS = () => (levelMemo ??= levels());

// ─── tones ──────────────────────────────────────────────────────────────────

interface Tones {
  body: string[];
  tread: string[];
  copper: string[];
}

const TONE_N = 18;
/** How many tones a sulcus darkens a riser by, and how much brighter a
    tread is than the riser under it. */
const GROOVE_DARK = 5;
/** The width of the darkening across a sulcus, on its field (the carve itself
    is 0.13 wide: a narrower shadow reads as a slot, not a smear). */
const GROOVE_W = 0.07;
const TREAD_LIFT = 0.08;
/** Every how many plates the copper foil comes round. */
const COPPER_EVERY = 3;

function tonesOf(light: boolean): Tones {
  return light
    ? { body: rampOf("#a9a194", "#ece7dc", TONE_N, 0.9), tread: rampOf("#bcb5a8", "#f7f3eb", TONE_N, 0.9), copper: rampOf("#6b521c", "#a8843a", TONE_N) }
    : { body: rampOf("#121110", "#57524a", TONE_N, 0.85), tread: rampOf("#1a1815", "#6a645a", TONE_N, 0.85), copper: rampOf("#4a3a19", "#d6ae58", TONE_N, 0.9) };
}

/** Light on a normal to a tone index. */
const toneAt = (lit: number) => Math.max(0, Math.min(TONE_N - 1, Math.round(((lit + 0.15) / 1.05) * (TONE_N - 1))));

// ─── one hemisphere ─────────────────────────────────────────────────────────

/** A plate's outline: world points, and the light at each from the hull's
    smooth normal. */
interface Ring {
  w: V3[];
  lit: number[];
  r: number[];
  /** How deep in a sulcus each point is, 0 … 1 (the carve's own bell). */
  groove: number[];
}

function ringAt(side: Side, H: number, L: V3): Ring {
  const w: V3[] = [];
  const lit: number[] = [];
  const r: number[] = [];
  const groove: number[] = [];
  for (let i = 0; i < RING; i++) {
    const t = (i / RING) * Math.PI * 2;
    const { p, z } = atHeight(side, t, H);
    w.push(W(p[0], p[1], H));
    lit.push(dot3(hullNormal(side, t, z, LIGHT), L));
    r.push(Math.hypot(p[0] - side * LC, p[1]));
    groove.push(Math.exp(-((sulcusAt(side, t, z) / GROOVE_W) ** 2)));
  }
  return { w, lit, r, groove };
}

/** A tone index from the light, darkened down a sulcus. */
const shade = (lit: number, groove: number, depth: number) => Math.max(0, toneAt(lit) - Math.round(depth * groove));

interface Run {
  tone: number;
  depth: number;
  pts: Flat[];
}

/** Consecutive pieces of one tone merged into one strip, each strip with
    its mean depth, so a stack of hundreds of quads stays a few paths. */
function strips(pieces: { i: number; tone: number; a: Flat; b: Flat; c: Flat; d: Flat; depth: number }[]): Run[] {
  const out: Run[] = [];
  let cur: typeof pieces = [];
  const flush = () => {
    if (!cur.length) return;
    const top = [cur[0].a, ...cur.map((q) => q.b)];
    const bottom = [cur[0].d, ...cur.map((q) => q.c)].reverse();
    out.push({ tone: cur[0].tone, depth: cur.reduce((s, q) => s + q.depth, 0) / cur.length, pts: [...top, ...bottom] });
    cur = [];
  };
  for (const q of pieces) {
    const last = cur[cur.length - 1];
    if (last && (q.tone !== last.tone || q.i !== last.i + 1)) flush();
    cur.push(q);
  }
  flush();
  return out;
}

// ─── the core on the crown ─────────────────────────────────────────────────

/** The core die's crown: the hemisphere that carries it, the copper pad it
    sits on (half-width, in brain units, squared to the brain's axes), the
    die, its pins and their fan-out to vias on the pad. */
const DIE_SIDE: Side = -1;
/** The pad's half-extents across (l) and along (f) the crown's ridge. */
const PAD = { l: 7.5, f: 13 };
const DIE = { half: 4.6, h: 2.4, pins: 3, pitch: 2.2, fan: [7.2, 8.8] as [number, number] };
/** The buses that step down the layers from the pad, each straight in plan
    (toward the front and toward the lateral side: never 45° between, which
    points straight at the isometric camera and would fold its stairs into
    one plumb line) and a few traces wide, each trace stepping down its own
    number of plates and ending on a via. `dir` is [l, f] for the left
    hemisphere (lateral is −l). */
const BUSES: { dir: [number, number]; steps: number[] }[] = [
  { dir: [0, 1], steps: [9, 13, 16] },
  { dir: [-1, 0], steps: [10, 14, 7] },
];
const BUS_PITCH = 2.4;

const WP = (l: number, f: number): Plane => [f, -l];
const box = (l: number, f: number, hl: number, hf = hl): Plane[] => [WP(l - hl, f - hf), WP(l + hl, f - hf), WP(l + hl, f + hf), WP(l - hl, f + hf)];

/** The die, its pins fanned out to two staggered rows of vias, on a copper
    pad at height `z`, centred at brain-axis (cl, cf). */
function coreSvg(cl: number, cf: number, z: number, P: Projection): { pad: string; die: string } {
  const pad = solidSvg(extrude(box(cl, cf, PAD.l, PAD.f), z, 0.9, P, { bevel: 0.4 }), { tone: "mid", crease: "lo", className: "fa-gold" });
  const top = z + 0.9;
  const pins: string[] = [];
  const vias: Flat[] = [];
  const n = DIE.pins;
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * DIE.pitch;
      const reach = DIE.fan[i % 2];
      const splay = o * 1.45;
      // a pin out of the die's side, a 45° jog to its fanned row, a via
      const local: [number, number][] = [
        [DIE.half + 0.6, o],
        [DIE.half + 2.2, o],
        [DIE.half + 2.2 + Math.abs(splay - o), splay],
        [reach, splay],
      ];
      const rot = (x: number, y: number): [number, number] => (s === 0 ? [x, y] : s === 1 ? [-y, x] : s === 2 ? [-x, -y] : [y, -x]);
      const pts = local.map(([x, y]) => rot(x, y)).map(([x, y]) => {
        const [wx, wy] = WP(cl + x, cf + y);
        return iso([wx, wy, top], P);
      });
      pins.push(pathOf(pts));
      vias.push(pts[pts.length - 1]);
    }
  }
  const body = solidSvg(extrude(box(cl, cf, DIE.half), top, DIE.h, P, { bevel: 0.4 }), { tone: "hi", lit: true, className: "fa-gold fa-core" });
  return { pad, die: lineSvg(pins.join(""), { tone: "lo", className: "fa-gold-line" }) + `<g class="lm-via">${dotsSvg(vias, { size: 0.55, tone: "hi" })}</g>` + body };
}

/** How far along (ux, uy) from (ox, oy) a ray leaves a plate's outline:
    the first crossing out, or null if it starts outside. */
function exitAlong(ring: V3[], ox: number, oy: number, ux: number, uy: number): number | null {
  let best = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const den = ux * ey - uy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const s0 = ((a[0] - ox) * ey - (a[1] - oy) * ex) / den;
    const r = ((a[0] - ox) * uy - (a[1] - oy) * ux) / den;
    if (s0 > 1e-6 && r >= 0 && r <= 1 && s0 < best) best = s0;
  }
  return Number.isFinite(best) ? best : null;
}

function hemisphere(side: Side, view: BrainView, T: Tones): string {
  const P = projOf(view);
  const L = lightVector(view);
  const [vx, vy] = towardViewer(P);
  const H = LEVELS();
  let rings: Ring[] = [];
  for (let k = 0; k < H.length - 1; k++) rings.push(ringAt(side, (H[k] + H[k + 1]) / 2, L));
  // the die's crown: the highest plate the pad fits on, centred on the
  // plate's own middle, is the cap (the one or two slivers above it go)
  const die = side === DIE_SIDE;
  let cl = side * LC;
  let cf = 0;
  if (die) {
    let deck = 0;
    rings.forEach((r, k) => {
      const ls = r.w.map((p) => -p[1]);
      const fs = r.w.map((p) => p[0]);
      const ml = (Math.min(...ls) + Math.max(...ls)) / 2;
      const mf = (Math.min(...fs) + Math.max(...fs)) / 2;
      const poly = r.w.map((p): Flat => [p[0], p[1]]);
      if (box(ml, mf, PAD.l + 1.5, PAD.f + 1.5).every((c) => inside(c, poly))) {
        deck = k;
        cl = ml;
        cf = mf;
      }
    });
    rings = rings.slice(0, deck + 1);
  }
  // the traces stepping down from the pad, by plate: a drop down its riser
  // and a run across its top, and a via at every edge they turn over
  const top = rings.length - 1;
  const runs = new Map<number, { drop: string[]; run: string[]; vias: Flat[] }>();
  const at3 = (p: V3, z: number) => iso([p[0], p[1], z], P);
  const slotOf = (k: number) => {
    const known = runs.get(k);
    if (known) return known;
    const made = { drop: [] as string[], run: [] as string[], vias: [] as Flat[] };
    runs.set(k, made);
    return made;
  };
  if (die) {
    for (const bus of BUSES) {
      // in the world plane: l → −y, f → x; mirrored for the right side
      const [dl, df] = [bus.dir[0] * -side, bus.dir[1]];
      const ux = df;
      const uy = -dl;
      const nx = -uy;
      const ny = ux;
      bus.steps.forEach((steps, j) => {
        const o = (j - (bus.steps.length - 1) / 2) * BUS_PITCH;
        const c = W(cl, cf, 0);
        const ox = c[0] + nx * o;
        const oy = c[1] + ny * o;
        // leave the pad through its edge
        const reach = Math.min(PAD.f / Math.max(1e-6, Math.abs(ux)), PAD.l / Math.max(1e-6, Math.abs(uy)));
        let prev: V3 = [ox + ux * reach, oy + uy * reach, 0];
        const last = Math.max(0, top - steps);
        for (let k = top; k > last; k--) {
          const s0 = exitAlong(rings[k].w, ox, oy, ux, uy);
          if (s0 === null) break;
          const e: V3 = [ox + ux * s0, oy + uy * s0, 0];
          const slot = slotOf(k);
          slot.run.push(pathOf([at3(prev, H[k + 1]), at3(e, H[k + 1])]));
          slot.drop.push(pathOf([at3(e, H[k + 1]), at3(e, H[k])]));
          slot.vias.push(at3(e, H[k + 1]));
          prev = e;
          if (k === last + 1) slotOf(last).vias.push(at3(e, H[k]));
        }
      });
    }
  }
  // the outline's winding, for each edge's outward normal
  const area = rings[Math.floor(rings.length / 2)].w.reduce((s, a, i, ws) => {
    const b = ws[(i + 1) % ws.length];
    return s + a[0] * b[1] - b[0] * a[1];
  }, 0);
  const ccw = area > 0;
  const out: string[] = [];
  const emit = (runs: Run[], ramp: string[]) => {
    runs.sort((a, b) => a.depth - b.depth);
    let tone = -1;
    let d = "";
    const flush = () => {
      if (d) out.push(`<path fill="${ramp[tone]}" stroke="${ramp[tone]}" stroke-width=".35" stroke-linejoin="round" d="${d}"/>`);
      d = "";
    };
    for (const r of runs) {
      if (r.tone !== tone) {
        flush();
        tone = r.tone;
      }
      d += polyD(r.pts);
    }
    flush();
  };
  for (let k = 0; k < rings.length; k++) {
    const ring = rings[k];
    const z0 = H[k];
    const z1 = H[k + 1];
    const copper = k % COPPER_EVERY === COPPER_EVERY - 1 && k < rings.length - 1;
    const foil = copper ? Math.min(0.9, (z1 - z0) * 0.3) : 0;
    const body: Parameters<typeof strips>[0] = [];
    const cu: Parameters<typeof strips>[0] = [];
    for (let i = 0; i < RING; i++) {
      const j = (i + 1) % RING;
      const a = ring.w[i];
      const b = ring.w[j];
      let nx = b[1] - a[1];
      let ny = -(b[0] - a[0]);
      if (!ccw) [nx, ny] = [-nx, -ny];
      if (nx * vx + ny * vy <= 0) continue;
      const tone = shade((ring.lit[i] + ring.lit[j]) / 2, Math.max(ring.groove[i], ring.groove[j]), GROOVE_DARK);
      const depth = depthOf([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z0], P);
      const at = (p: V3, z: number) => iso([p[0], p[1], z], P);
      const zf = z1 - foil;
      body.push({ i, tone, a: at(a, zf), b: at(b, zf), c: at(b, z0), d: at(a, z0), depth });
      if (foil > 0) cu.push({ i, tone, a: at(a, z1), b: at(b, z1), c: at(b, zf), d: at(a, zf), depth });
    }
    emit(strips(body), T.body);
    if (cu.length) emit(strips(cu), T.copper);
    const slot = runs.get(k);
    if (slot) out.push(lineSvg(slot.drop.join(""), { tone: "lo", className: "fa-gold-line" }));
    // the tread: the strip of this plate's top the next plate leaves bare
    const next = rings[k + 1];
    if (next) {
      const tread: Parameters<typeof strips>[0] = [];
      // where the next plate overhangs this one the tread closes to nothing
      const inner = (i: number) => (next.r[i] < ring.r[i] ? next.w[i] : ring.w[i]);
      for (let i = 0; i < RING; i++) {
        const j = (i + 1) % RING;
        if (next.r[i] >= ring.r[i] && next.r[j] >= ring.r[j]) continue;
        const lit = (ring.lit[i] + ring.lit[j] + next.lit[i] + next.lit[j]) / 4;
        const g = Math.max(ring.groove[i], ring.groove[j], next.groove[i], next.groove[j]);
        const at = (p: V3) => iso([p[0], p[1], z1], P);
        tread.push({ i, tone: shade(lit + TREAD_LIFT, g, GROOVE_DARK - 2), a: at(ring.w[i]), b: at(ring.w[j]), c: at(inner(j)), d: at(inner(i)), depth: depthOf([ring.w[i][0], ring.w[i][1], z1], P) });
      }
      emit(strips(tread), T.tread);
    } else {
      // the crown (or the die's deck): the last plate's whole top
      const face = ring.w.map((p) => iso([p[0], p[1], z1], P));
      const lit = ring.lit.reduce((s, v) => s + v, 0) / RING;
      out.push(`<path fill="${T.tread[toneAt(lit + TREAD_LIFT)]}" d="${polyD(face)}"/>`);
    }
    if (die && k === top) out.push(coreSvg(cl, cf, z1, P).pad);
    if (slot) out.push(lineSvg(slot.run.join(""), { tone: "lo", className: "fa-gold-line" }) + `<g class="lm-via">${dotsSvg(slot.vias, { size: 0.55, tone: "hi" })}</g>`);
    if (die && k === top) out.push(coreSvg(cl, cf, z1, P).die);
  }
  return `<g class="lm-hemi">${out.join("")}</g>`;
}

// ─── the picture ────────────────────────────────────────────────────────────

const cssOf = (gold: string, ground: string) => `.lm-hemi>path{vector-effect:none}.lm-via .iso-dots circle{fill:${gold};stroke:${ground};stroke-width:.25;opacity:1}`;

function laminateSvg({ view, only, light, tones }: MindOptions): string {
  const T = tonesOf(light);
  const sides = only ? [only] : sidesFarFirst(view);
  const body = sides.map((side) => hemisphere(side, view, T)).join("");
  return mindSvg({ view, light, tones, body, css: cssOf(tones.gold, tones.ground) });
}

export const laminate: MindDirection = {
  id: "e3",
  round: 2,
  name: "Laminate",
  line: "The original plates made thin and many, each the brain's section with its sulci notched in, a gold copper layer every third plate, the core's traces stepping down the layers.",
  svg: (o) => laminateSvg(o),
};

