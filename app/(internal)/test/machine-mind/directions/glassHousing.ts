/**
 * D3 · Glass Housing (machine-mind lab, 2026-10-17; reference 1: the glass
 * brain with machinery inside).
 *
 * The hull is clear glass and the machine stands inside it. Per hemisphere,
 * back to front:
 *
 *   far wall    the hull's back faces: a faint tint (it veils whatever lies
 *               behind this hemisphere, so the far stack reads behind more
 *               glass) and the rim bands
 *   machine     a base plate seated in the glass's mouth, a stack of four
 *               thin machined boards on stand-offs (straight edges, 45° cut
 *               corners, inscribed in the hemisphere's section well inside
 *               the shell), chip packages along their straight edges with
 *               short gold bundles running in from the sides, the core die
 *               on the top board under its heatsink (the one lit part; gold
 *               packages only round it), and two buses from the top board's
 *               medial edge down the inside of the glass to the base plate
 *   near wall   the front faces nearly clear, denser toward the rim (glass
 *               thickens where it is seen edge on), one hairline glint where
 *               the light catches the dome, the rim line and the mouth
 *
 * Between the hemispheres a corrugated conduit runs down the fissure front
 * to back, an arch that turns down round the frontal and occipital poles,
 * follows the fissure in under them and stands into a collar at its foot,
 * front and back, on a bridge plate tying the two base plates together
 * flush under the floor: nothing hangs below the brain, where the act draws
 * its own tendrils (both halves drawn; a parted half has neither).
 *
 * Pure: strings and numbers. No randomness: every part is placed by rule,
 * so stills repeat.
 */

import { BRAIN_VIEW_ISO, HEMI, LC, W, projOf, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { cylinder, depthOf, dotsSvg, extrude, iso, lineSvg, pathOf, solidSvg, type Flat, type Plane, type Projection } from "@/components/arcs/figures/foundation/isoKit";
import { fillet } from "../kit/lathe.mjs";
import { tubePieces as kitTubePieces, tubeSvg as kitTubeSvg } from "../kit/tube.mjs";
import { dot3, hullNormal, hullPoint, inside, lineD, makeHull, mindSvg, polyD, scaleAt, sidesFarFirst, silhouetteD, viewVector, Z_FLOOR, type Hull, type Side, type V3, type Vertex } from "../hull";
import type { MindDirection, MindOptions } from "./types";

// ─── tones ──────────────────────────────────────────────────────────────────

interface Glass {
  /** The glass's own tone, laid at low alpha. */
  tint: string;
  /** A wall's base alpha, then the alpha each rim band adds: far, near. */
  back: [number, number];
  front: [number, number];
  rim: string;
  rimWidth: number;
  glint: string;
  glintAlpha: number;
}

const GLASS: Record<"dark" | "light", Glass> = {
  dark: { tint: "#e6dfd1", back: [0.07, 0.016], front: [0.024, 0.03], rim: "#d8d0c2", rimWidth: 0.85, glint: "#fbf6ea", glintAlpha: 0.85 },
  light: { tint: "#4a4335", back: [0.06, 0.014], front: [0.02, 0.026], rim: "#2a2214", rimWidth: 0.85, glint: "#ffffff", glintAlpha: 0.95 },
};

/** The rim bands: thresholds on 1 − |n · v| (0 facing the viewer, 1 edge on). */
const RIM_BANDS = [0.5, 0.72, 0.86, 0.95];

/** The glass is drawn on a grid a little coarser than the lab's (the rim
    still reads round at the owner's size, the file stays light). */
const GLASS_GRID = { cols: 132, lower: 8, upper: 30 };

// ─── small helpers ──────────────────────────────────────────────────────────

/** The vendored kit's pipes, typed loosely (its options default to null, so
    their types are inferred too narrowly). */
interface TubePiece {
  mid: number[];
}
const tubePieces = kitTubePieces as unknown as (points: number[][], radius: number, P: Projection, options?: Record<string, unknown>) => TubePiece[];
const tubeSvg = kitTubeSvg as unknown as (piece: TubePiece, options?: { tone?: string }) => string;

/** Brain axes on the floor plane to the kit's world plane. */
const WP = (l: number, f: number): Plane => [f, -l];

type LF = [number, number];

interface Cut {
  x: number;
  y: number;
  s: number[];
}

/** The part of a polygon whose scalar `k` is ≥ 0 (Sutherland–Hodgman), every
    scalar carried through the cut. */
function keep(poly: Cut[], k: number): Cut[] {
  const out: Cut[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ia = a.s[k] >= 0;
    const ib = b.s[k] >= 0;
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = a.s[k] / (a.s[k] - b.s[k]);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s: a.s.map((v, j) => v + (b.s[j] - v) * t) });
    }
  }
  return out;
}

/**
 * A region of the hull's faces (front or back) where every scalar is ≥ 0, as
 * ONE path: runs of whole facets merge into strips, cut facets follow. One
 * path is filled once, so a low alpha never doubles at a seam.
 */
function regionD(h: Hull, front: boolean, scalars: ((v: Vertex) => number)[]): string {
  const C = h.cols;
  const R = h.zs.length - 1;
  let d = "";
  for (let r = 0; r < R; r++) {
    let run: typeof h.facets = [];
    const flush = () => {
      if (!run.length) return;
      const last = run[run.length - 1];
      const bottom: Flat[] = [...run.map((f) => f.v[0].xy), last.v[1].xy];
      const top: Flat[] = [...run.map((f) => f.v[3].xy), last.v[2].xy].reverse();
      d += polyD([...bottom, ...top]);
      run = [];
    };
    for (let c = 0; c < C; c++) {
      const f = h.facets[r * C + c];
      if (f.facing !== front) {
        flush();
        continue;
      }
      const vals = f.v.map((v) => scalars.map((s) => s(v)));
      if (vals.every((vs) => vs.every((x) => x >= 0))) {
        run.push(f);
        continue;
      }
      flush();
      let poly: Cut[] = f.v.map((v, i) => ({ x: v.xy[0], y: v.xy[1], s: vals[i] }));
      for (let k = 0; k < scalars.length && poly.length >= 3; k++) poly = keep(poly, k);
      if (poly.length >= 3) d += polyD(poly.map((p) => [p.x, p.y]));
    }
    flush();
  }
  return d;
}

// ─── the glass ──────────────────────────────────────────────────────────────

/** One wall of the glass: a base tint, then the rim bands nested inside it,
    each a little denser (glass seen edge on is thicker). */
function wallSvg(h: Hull, front: boolean, g: Glass, twin: Twin): string {
  const V = viewVector(h.view);
  // half the gyri's own normal, half the smooth field's: the bands still
  // meet the rim, but the folds no longer mottle them (found once a vertex)
  const edge = new Map<Vertex, number>();
  for (const row of h.vertices) {
    for (const v of row) {
      const n = twin(v).n;
      const m = [v.n[0] + n[0], v.n[1] + n[1], v.n[2] + n[2]] as V3;
      edge.set(v, 1 - Math.abs(dot3(m, V)) / Math.hypot(m[0], m[1], m[2]));
    }
  }
  const e = (v: Vertex) => edge.get(v) ?? 0;
  const [base, step] = front ? g.front : g.back;
  const out: string[] = [];
  if (base > 0) {
    const all = regionD(h, front, []);
    if (all) out.push(`<path fill="${g.tint}" fill-opacity="${base}" d="${all}"/>`);
  }
  for (const th of RIM_BANDS) {
    const d = regionD(h, front, [(v) => e(v) - th]);
    if (d) out.push(`<path fill="${g.tint}" fill-opacity="${step}" d="${d}"/>`);
  }
  return out.join("");
}

/** The smooth field under a vertex: the hull's normal there with the gyri
    smoothed out, and the light on it. */
type Twin = (v: Vertex) => { n: V3; lit: number };

/** The same hull with the gyri smoothed out, vertex for vertex: the glint is
    shaped by its smooth field, so the light catches the dome in one clean
    crescent and not in a scatter of lobes. */
function smoothTwin(h: Hull): Twin {
  const map = new Map<Vertex, { n: V3; lit: number }>();
  for (const row of h.vertices) {
    for (const v of row) {
      const n = hullNormal(h.side, v.t, v.z, { fold: 0 });
      map.set(v, { n, lit: dot3(n, h.light) });
    }
  }
  return (v) => map.get(v) ?? { n: v.n, lit: v.lit };
}

/** The glint: one hairline crescent where the light catches the dome, a band
    of the near wall a little inside the rim on the lit side, tapering to
    nothing at both ends. */
function glintSvg(h: Hull, g: Glass, twin: Twin): string {
  const V = viewVector(h.view);
  const e = (v: Vertex) => 1 - Math.abs(dot3(twin(v).n, V));
  const lit = (v: Vertex) => twin(v).lit;
  const at = 0.46;
  const width = 0.022;
  const from = 0.7;
  const ramp = (x: number) => Math.max(0, Math.min(1, (x - from) / (1 - from))) ** 1.2;
  const d = regionD(h, true, [(v) => e(v) - at, (v) => at + width * ramp(lit(v)) - e(v), (v) => lit(v) - from, (v) => v.z - 20]);
  return d ? `<path fill="${g.glint}" fill-opacity="${g.glintAlpha}" d="${d}"/>` : "";
}

/** The glass's mouth: the open ring it ends in at the floor, which is no
    silhouette but is the glass's bottom edge. The near half in the rim's
    tone, the far half faint behind the glass. */
function mouthSvg(h: Hull, g: Glass): string {
  const C = h.cols;
  const near: string[] = [];
  const far: string[] = [];
  for (let c = 0; c < C; c++) {
    const f = h.facets[c];
    (f.facing ? near : far).push(lineD([f.v[0].xy, f.v[1].xy]));
  }
  return `<path fill="none" stroke="${g.rim}" stroke-opacity=".35" stroke-width="${g.rimWidth * 0.8}" stroke-linecap="round" d="${far.join("")}"/><path fill="none" stroke="${g.rim}" stroke-width="${g.rimWidth}" stroke-linecap="round" d="${near.join("")}"/>`;
}

// ─── the machine ────────────────────────────────────────────────────────────

/** Where the boards sit: their underside heights, floor to crown. */
const BOARDS = [-24, 12, 48, 84];
const BOARD_T = 2.2;
/** How far inside the shell the boards are cut, as a share of its section. */
const INSET = 0.78;
/** The tallest part a board carries, for its fit under the dome. */
const HEADROOM = 16;
/** The base plate the glass stands in. */
const BASE = { z: Z_FLOOR, h: 3 } as const;

/** A section's outline in brain axes [l, f]: `share` of the hull's own
    section at height `z` (which already carries the dome's scale there),
    the gyri all but smoothed out. The base plate is cut to it (it fills the
    glass's round mouth). */
function sectionLF(side: Side, z: number, share: number, n = 120): LF[] {
  const out: LF[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const [l, f] = hullPoint(side, t, z, { fold: 0.3 });
    out.push([side * LC + (l - side * LC) * share, f * share]);
  }
  return out;
}

/** A board's plan in the hemisphere's own frame: x lateral (+) to medial
    (−) from its centre, y the front. */
interface Plan {
  /** Lateral and medial edges, front/back edges' half length. */
  xl: number;
  xm: number;
  yf: number;
  /** The 45° cuts at the lateral and the medial corners. */
  cl: number;
  cm: number;
}

const planMemo = new Map<number, Plan>();

/** A machined board: a rectangle squared to the brain's axes with its four
    corners cut at 45°, inscribed in the shell's section at absolute scale
    `S` (the cut is the smallest that keeps both its ends inside). Straight
    edges and cut corners read as a routed board; a contour reads as a
    terrace. */
function planOf(S: number): Plan {
  const key = Math.round(S * 1e4);
  const known = planMemo.get(key);
  if (known) return known;
  const n = 120;
  const poly: LF[] = [];
  for (let i = 0; i < n; i++) {
    const [l, f] = hullPoint(1, (i / n) * Math.PI * 2, 0, { fold: 0 });
    poly.push([(l - LC) * S * 0.99, f * S * 0.99]);
  }
  const xl = 0.92 * HEMI.a * S;
  const xm = 0.84 * HEMI.a * HEMI.medial * S;
  const yf = 0.84 * HEMI.b * S;
  const cut = (X: number, sx: number) => {
    let worst = 0;
    for (const sy of [-1, 1]) {
      const Y = sy * yf;
      let lo = 0;
      let hi = Math.min(Math.abs(X) + xl, 2 * yf);
      for (let k = 0; k < 30; k++) {
        const c = (lo + hi) / 2;
        const ok = inside([X, Y - sy * c], poly) && inside([X - sx * c, Y], poly);
        if (ok) hi = c;
        else lo = c;
      }
      worst = Math.max(worst, hi);
    }
    return worst;
  };
  const plan = { xl, xm, yf, cl: cut(xl, 1), cm: cut(-xm, -1) };
  planMemo.set(key, plan);
  return plan;
}

/** A plan's outline as brain-axis points, and its named points. */
function planRing(side: Side, p: Plan): LF[] {
  const c = side * LC;
  const local: LF[] = [
    [p.xl, -p.yf + p.cl],
    [p.xl, p.yf - p.cl],
    [p.xl - p.cl, p.yf],
    [-p.xm + p.cm, p.yf],
    [-p.xm, p.yf - p.cm],
    [-p.xm, -p.yf + p.cm],
    [-p.xm + p.cm, -p.yf],
    [p.xl - p.cl, -p.yf],
  ];
  return local.map(([x, y]) => [c + side * x, y]);
}

/** The height whose section bounds a board at `z`: the narrowest the shell
    gets over the board and what stands on it. */
function boardRef(z: number): number {
  let zRef = z;
  for (let k = 0; k <= 8; k++) {
    const zz = z + ((BOARD_T + HEADROOM) * k) / 8;
    if (scaleAt(zz) < scaleAt(zRef)) zRef = zz;
  }
  return zRef;
}

interface Item {
  depth: number;
  svg: string;
}

interface Chip {
  l: number;
  f: number;
  w: number;
  d: number;
  h: number;
  quad?: boolean;
  gold?: boolean;
}

/** A box aligned to the brain axes, as a world-plane ring. */
const boxRing = (l: number, f: number, wl: number, df: number): Plane[] => [WP(l - wl / 2, f - df / 2), WP(l + wl / 2, f - df / 2), WP(l + wl / 2, f + df / 2), WP(l - wl / 2, f + df / 2)];

/** A package's pins: short legs from its sides down onto the board, on its
    two long sides, or on all four for a quad. */
function pinsSvg(c: Chip, top: number, P: Projection): string {
  const pins: string[] = [];
  const legs = (along: "f" | "l") => {
    const span = along === "f" ? c.d : c.w;
    const count = Math.max(3, Math.round((span - 2) / 3.4));
    for (let i = 0; i < count; i++) {
      const at = -(span - 2) / 2 + ((i + 0.5) * (span - 2)) / count;
      for (const sgn of [-1, 1]) {
        if (along === "f") {
          const l0 = c.l + (sgn * c.w) / 2;
          pins.push(pathOf([iso(W(l0, c.f + at, top + 0.9), P), iso(W(l0 + sgn * 2.2, c.f + at, top), P)]));
        } else {
          const f0 = c.f + (sgn * c.d) / 2;
          pins.push(pathOf([iso(W(c.l + at, f0, top + 0.9), P), iso(W(c.l + at, f0 + sgn * 2.2, top), P)]));
        }
      }
    }
  };
  if (c.quad || c.w <= c.d) legs("f");
  if (c.quad || c.w > c.d) legs("l");
  return lineSvg(pins.join(""), { tone: "lo", className: "fa-gold-line" });
}

/** A chip package with its pins on the board's top. */
function chipSvg(c: Chip, top: number, P: Projection): string {
  const body = solidSvg(extrude(boxRing(c.l, c.f, c.w, c.d), top, c.h, P, { bevel: 0.5 }), { tone: "mid", crease: "lo", className: c.gold ? "fa-gold" : undefined });
  return pinsSvg(c, top, P) + body;
}

/** The core die on the top board: the one lit part, its heatsink's fins
    standing across it. */
function coreSvg(l: number, f: number, top: number, P: Projection): string {
  const c: Chip = { l, f, w: 28, d: 34, h: 4.5, quad: true };
  let svg = pinsSvg(c, top, P);
  svg += solidSvg(extrude(boxRing(l, f, c.w, c.d), top, c.h, P, { bevel: 0.5 }), { tone: "hi", lit: true, className: "fa-gold fa-core" });
  const fins = 7;
  for (let i = 0; i < fins; i++) {
    const ff = f - c.d / 2 + 4 + ((c.d - 8) * i) / (fins - 1);
    svg += solidSvg(extrude(boxRing(l, ff, c.w - 6, 1.5), top + c.h, 9, P), { tone: "hi", crease: "lo" });
  }
  return svg;
}

/** The packages along a board's four straight edges (none on the cut
    corners), at an even pitch, each squared to its edge (long side with it),
    and a short gold bundle running in from the lateral and the medial ones.
    None runs in from the front or the back edge: seen face on, a run
    straight back stands up off its package like a stray mark. The pattern of
    sizes turns with the board, so no two boards repeat. */
function rimOf(side: Side, p: Plan, index: number): { chips: Chip[]; bundles: { from: LF; dir: LF; n: number }[] } {
  const c0 = side * LC;
  const sizes: { w: number; d: number; quad?: boolean }[] = [
    { w: 12, d: 8 },
    { w: 10, d: 7 },
    { w: 15, d: 15, quad: true },
    { w: 12, d: 8 },
    { w: 14, d: 9 },
  ];
  const chips: Chip[] = [];
  const bundles: { from: LF; dir: LF; n: number }[] = [];
  const pitch = 34;
  let k = index;
  // an edge from a to b (local), inward unit `inn`, along l or along f
  const edge = (a: LF, b: LF, inn: LF, alongL: boolean, bundled: boolean) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const count = Math.floor(len / pitch);
    for (let i = 0; i < count; i++) {
      const u = (i + 0.5) / count;
      const sz = sizes[k++ % sizes.length];
      const w0 = Math.max(sz.w, sz.d);
      const d0 = Math.min(sz.w, sz.d);
      const depth = d0;
      const inset = depth / 2 + 6;
      const x = a[0] + (b[0] - a[0]) * u + inn[0] * inset;
      const y = a[1] + (b[1] - a[1]) * u + inn[1] * inset;
      const l = c0 + side * x;
      const w = alongL ? w0 : d0;
      const d = alongL ? d0 : w0;
      const chip: Chip = { l, f: y, w, d, h: sz.quad ? 2.8 : 2, quad: sz.quad };
      chips.push(chip);
      if (bundled && (sz.quad || i % 2 === 0)) {
        const dirL: LF = [side * inn[0], inn[1]];
        bundles.push({ from: [l + dirL[0] * (w / 2 + 2.6), y], dir: dirL, n: sz.quad ? 4 : 3 });
      }
    }
  };
  edge([p.xl, -p.yf + p.cl], [p.xl, p.yf - p.cl], [-1, 0], false, true);
  edge([-p.xm, -p.yf + p.cm], [-p.xm, p.yf - p.cm], [1, 0], false, true);
  edge([-p.xm + p.cm, p.yf], [p.xl - p.cl, p.yf], [0, -1], true, false);
  edge([-p.xm + p.cm, -p.yf], [p.xl - p.cl, -p.yf], [0, 1], true, false);
  return { chips, bundles };
}

/** The buses: a pair of cables a hemisphere, from the top board's rim out
    and down the inside of the glass on its lateral meridian (a little inside
    it, so they follow its curve where the stack's own edge turns away, in
    both cameras) to the base plate. At these contour angles. */
const BUSES = [Math.PI - 0.32, Math.PI + 0.32];
const BUS_R = 1.45;
/** How far out the buses run, as a share of the shell's section. */
const BUS_AT = 0.88;

/** A bus's route in brain axes, from its edge connector on the top board's
    medial edge (level with the board, straight out of it) to its shell on
    the base plate. */
function busRoute(side: Side, t: number, boardZ: number, edgeL: number, baseTop: number): V3[] {
  const cl = side * LC;
  const [l0, f0] = hullPoint(side, t, 0, { fold: 0 });
  const at = (rho: number, z: number): V3 => [cl + (l0 - cl) * rho, f0 * rho, z];
  const zMid = boardZ + BOARD_T / 2;
  const first = at(BUS_AT * scaleAt(zMid), zMid);
  const pts: V3[] = [[edgeL, first[1], zMid]];
  const zEnd = baseTop + 7;
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const z = zMid - ((zMid - zEnd) * i) / n;
    pts.push(at(BUS_AT * scaleAt(z), z));
  }
  const rhoEnd = Math.min(BUS_AT * scaleAt(zEnd), (scaleAt(Z_FLOOR) - 0.012) * 0.86);
  pts.push(at(rhoEnd, zEnd - 2), at(rhoEnd, baseTop + 2.4));
  return fillet(pts, 3.2, 7) as V3[];
}

/** A connector shell a bus ends in: standing on the base plate, or clamped
    over the top board's edge (`z0` under the board, `h` over its thickness). */
function shellSvg(p: V3, z0: number, h: number, P: Projection): string {
  return solidSvg(extrude(boxRing(p[0], p[1], 6, 4.4), z0, h, P, { bevel: 0.4 }), { tone: "mid", crease: "lo" });
}

interface Hemisphere {
  back: string;
  machine: string;
  front: string;
}

/** One hemisphere: its far wall, its machine, its near wall and rim. */
function hemisphere(side: Side, view: BrainView, light: boolean): Hemisphere {
  const P = projOf(view);
  const g = GLASS[light ? "light" : "dark"];
  const h = makeHull(side, { view, grid: GLASS_GRID });
  const twin = smoothTwin(h);
  const back = `<g class="mm-hull">${wallSvg(h, false, g, twin)}</g>`;
  const mouthLine = mouthSvg(h, g);
  const front = `<g class="mm-hull">${wallSvg(h, true, g, twin)}${glintSvg(h, g, twin)}<path fill="none" stroke="${g.rim}" stroke-width="${g.rimWidth}" stroke-linecap="round" stroke-linejoin="round" d="${silhouetteD(h)}"/>${mouthLine}</g>`;
  const cl = side * LC;

  const out: string[] = [];
  // the base plate, in the glass's mouth
  const mouthFit = scaleAt(Z_FLOOR) - 0.012;
  const mouth = sectionLF(side, Z_FLOOR, mouthFit / scaleAt(Z_FLOOR));
  out.push(solidSvg(extrude(mouth.map(([l, f]) => WP(l, f)), BASE.z, BASE.h, P, { convex: false, bevel: 0.8 }), { tone: "mid", crease: "lo" }));

  const boards = BOARDS.map((z, i) => {
    const fit = INSET * scaleAt(boardRef(z));
    const plan = planOf(fit);
    return { z, i, fit, plan, ring: planRing(side, plan) };
  });
  const top = boards.length - 1;
  let below: { top: number; ring: LF[]; fit: number } = { top: BASE.z + BASE.h, ring: mouth, fit: mouthFit };
  for (const b of boards) {
    const items: Item[] = [];
    // stand-offs from the board below up to this one: under the smaller
    // board's cut corners and the middles of its lateral and medial edges
    const z0 = below.top;
    const sp = planOf(Math.min(b.fit, below.fit));
    const local: LF[] = [
      [sp.xl - sp.cl / 2, sp.yf - sp.cl / 2],
      [sp.xl - sp.cl / 2, -sp.yf + sp.cl / 2],
      [-sp.xm + sp.cm / 2, sp.yf - sp.cm / 2],
      [-sp.xm + sp.cm / 2, -sp.yf + sp.cm / 2],
      [sp.xl, 0],
      [-sp.xm, 0],
    ];
    for (const [lx, ly] of local) {
      const [x, y] = WP(cl + side * lx * 0.8, ly * 0.8);
      items.push({ depth: depthOf([x, y, z0], P), svg: solidSvg(cylinder(x, y, 1.3, z0, b.z - z0, P, 12), { tone: "mid", crease: "faint" }) });
    }
    // what stands on the board below, where this board does not cover it
    if (b.i > 0) {
      const prev = boards[b.i - 1];
      const topZ = prev.z + BOARD_T;
      const cover = b.ring.map(([l, f]) => iso(W(l, f, b.z), P));
      const hidden = (pts: LF[], z: number) => pts.every(([l, f]) => inside(iso(W(l, f, z), P), cover));
      const { chips, bundles } = rimOf(side, prev.plan, prev.i);
      const runs: string[] = [];
      const vias: Flat[] = [];
      for (const bd of bundles) {
        const len = 16;
        const pitch = 1.7;
        const ortho: LF = [-bd.dir[1], bd.dir[0]];
        for (let j = 0; j < bd.n; j++) {
          const o = (j - (bd.n - 1) / 2) * pitch;
          const a: LF = [bd.from[0] + ortho[0] * o, bd.from[1] + ortho[1] * o];
          const e: LF = [a[0] + bd.dir[0] * (len + (j % 2) * 4), a[1] + bd.dir[1] * (len + (j % 2) * 4)];
          if (hidden([a, e], topZ)) continue;
          runs.push(pathOf([iso(W(a[0], a[1], topZ), P), iso(W(e[0], e[1], topZ), P)]));
          vias.push(iso(W(e[0], e[1], topZ), P));
        }
      }
      items.push({ depth: -1e6, svg: lineSvg(runs.join(""), { tone: "lo", className: "fa-gold-line" }) + `<g class="gh-via">${dotsSvg(vias, { size: 0.5, tone: "mid" })}</g>` });
      for (const c of chips) {
        const corners: LF[] = [
          [c.l - c.w / 2 - 2, c.f - c.d / 2 - 2],
          [c.l + c.w / 2 + 2, c.f - c.d / 2 - 2],
          [c.l + c.w / 2 + 2, c.f + c.d / 2 + 2],
          [c.l - c.w / 2 - 2, c.f + c.d / 2 + 2],
        ];
        if (hidden(corners, topZ + c.h)) continue;
        const [x, y] = WP(c.l, c.f);
        items.push({ depth: depthOf([x, y, topZ], P), svg: chipSvg(c, topZ, P) });
      }
    }
    out.push(...items.sort((p, q) => p.depth - q.depth).map((i) => i.svg));
    // the board itself
    out.push(solidSvg(extrude(b.ring.map(([l, f]) => WP(l, f)), b.z, BOARD_T, P, { bevel: 0.6 }), { tone: "mid", crease: "lo" }));
    below = { top: b.z + BOARD_T, ring: b.ring, fit: b.fit };
  }
  // the top board's machine: packages round the core, traces into it
  const tb = boards[top];
  const topZ = tb.z + BOARD_T;
  const s = tb.fit;
  const core: LF = [side * (LC + HEMI.a * s * 0.18), 0];
  const items: Item[] = [];
  const round: Chip[] = [
    { l: side * (LC + HEMI.a * s * 0.66), f: -HEMI.b * s * 0.32, w: 16, d: 18, h: 2.8, quad: true, gold: true },
    { l: side * (LC + HEMI.a * s * 0.68), f: HEMI.b * s * 0.3, w: 14, d: 14, h: 2.6, quad: true, gold: true },
    { l: side * (LC + HEMI.a * s * 0.16), f: HEMI.b * s * 0.6, w: 16, d: 10, h: 2 },
    { l: side * (LC + HEMI.a * s * 0.16), f: -HEMI.b * s * 0.6, w: 16, d: 10, h: 2 },
  ];
  const traces: string[] = [];
  for (const c of round) {
    // along f, a 45° jog, then along l into the core's side
    const sgnF = Math.sign(c.f);
    const lateral = Math.abs(c.l - cl) > Math.abs(core[0] - cl) + 10;
    for (const off of [-2.4, 0, 2.4]) {
      if (lateral) {
        // level along l, then 45° onto the core's lateral pins
        const a: LF = [c.l - side * (c.w / 2 + 2.2), c.f + off];
        const fEnd = core[1] + sgnF * 8 + off;
        const edge = core[0] + side * 16.5;
        const lm = edge + side * Math.abs(a[1] - fEnd);
        const pts: LF[] = side * (a[0] - lm) > 0 ? [a, [lm, a[1]], [edge, fEnd]] : [a, [edge, fEnd]];
        traces.push(pathOf(pts.map(([l, f]) => iso(W(l, f, topZ), P))));
      } else {
        const a: LF = [c.l + off, c.f - sgnF * (c.d / 2 + 2.2)];
        const e: LF = [c.l + off, core[1] + sgnF * 19.5];
        traces.push(pathOf([a, e].map(([l, f]) => iso(W(l, f, topZ), P))));
      }
    }
  }
  items.push({ depth: -1e6, svg: lineSvg(traces.join(""), { tone: "lo", className: "fa-gold-line" }) });
  for (const c of round) {
    const [x, y] = WP(c.l, c.f);
    items.push({ depth: depthOf([x, y, topZ], P), svg: chipSvg(c, topZ, P) });
  }
  {
    const [x, y] = WP(core[0], core[1]);
    items.push({ depth: depthOf([x, y, topZ], P), svg: coreSvg(core[0], core[1], topZ, P) });
  }
  // a screw in each cut corner
  const tp = tb.plan;
  const screws: Flat[] = [
    [tp.xl - tp.cl / 2, tp.yf - tp.cl / 2],
    [tp.xl - tp.cl / 2, -tp.yf + tp.cl / 2],
    [-tp.xm + tp.cm / 2, tp.yf - tp.cm / 2],
    [-tp.xm + tp.cm / 2, -tp.yf + tp.cm / 2],
  ].map(([x, y]) => iso(W(cl + side * x * 0.86, y * 0.86, topZ), P));
  items.push({ depth: 1e6, svg: dotsSvg(screws, { size: 0.55, tone: "mid" }) });
  out.push(...items.sort((p, q) => p.depth - q.depth).map((i) => i.svg));

  // the buses: one that runs down a stretch of the stack's outline facing
  // the viewer is painted over the stack, one on the far side under it; the
  // shell and the rise on the top board are always over it
  const V = viewVector(view);
  const behind: Item[] = [];
  const over: Item[] = [];
  const baseTop = BASE.z + BASE.h;
  for (const t of BUSES) {
    const edgeL = cl - side * tp.xm;
    const route = busRoute(side, t, tb.z, edgeL, baseTop);
    const world = route.map(([l, f, z]) => W(l, f, z));
    const a0 = hullPoint(side, t - 0.01, 0, { fold: 0 });
    const a1 = hullPoint(side, t + 0.01, 0, { fold: 0 });
    // the outline's outward normal at t, in the world plane
    const tan = W(a1[0] - a0[0], a1[1] - a0[1], 0);
    const mid = hullPoint(side, t, 0, { fold: 0 });
    const out0 = W(mid[0] - cl, mid[1], 0);
    let nx = tan[1];
    let ny = -tan[0];
    if (nx * out0[0] + ny * out0[1] < 0) [nx, ny] = [-nx, -ny];
    const facing = nx * V[0] + ny * V[1] > 0;
    const pieces = tubePieces(world, BUS_R, P, { maxLength: 24, spacing: 2 });
    for (const p of pieces) {
      const [x, y, z] = p.mid as [number, number, number];
      (facing || z > topZ ? over : behind).push({ depth: depthOf([x, y, z], P), svg: tubeSvg(p, { tone: "mid" }) });
    }
    const b = route[route.length - 1];
    const clamp: V3 = [edgeL + side * 1.5, route[0][1], 0];
    over.push({ depth: depthOf(W(clamp[0], clamp[1], topZ), P) + 50, svg: shellSvg(clamp, tb.z - 1, BOARD_T + 2, P) });
    behind.push({ depth: depthOf(W(b[0], b[1], baseTop), P) - 50, svg: shellSvg(b, baseTop, 2.6, P) });
  }
  const paint = (list: Item[]) => list.sort((p, q) => p.depth - q.depth).map((i) => i.svg).join("");
  return { back, machine: `<g class="gh-machine">${paint(behind)}${out.join("")}${paint(over)}</g>`, front };
}

// ─── the conduit ────────────────────────────────────────────────────────────

const CONDUIT_R = 5.5;
/** Where the conduit lands at each end: a fitting on a bridge plate in the
    fissure's foot, front and back, that ties the two base plates together
    flush under the floor (clear of the roots the act hangs its tendrils
    from, which sit further out at f ±69). */
const FOOT_F = 46;
const BRIDGE = { half: 33, depth: 14, h: 3, z: Z_FLOOR - 3 } as const;
const COLLAR = 6;

/** How far the right hemisphere's medial wall stands from the fissure's
    middle at (f, z); infinite where the hemisphere does not reach f. */
function halfGap(f: number, z: number): number {
  if (z <= Z_FLOOR || z >= HEMI.up) return Infinity;
  let a = Math.PI / 2;
  let b = (Math.PI * 3) / 2;
  const fa = hullPoint(1, a, z)[1];
  const fb = hullPoint(1, b, z)[1];
  if (f > fa || f < fb) return Infinity;
  for (let k = 0; k < 24; k++) {
    const m = (a + b) / 2;
    if (hullPoint(1, m, z)[1] > f) a = m;
    else b = m;
  }
  return hullPoint(1, (a + b) / 2, z)[0];
}

let routeMemo: V3[] | null = null;

/** The conduit's route in brain axes: along the fissure as low as it clears
    both medial walls, then down the fissure's own front and back into its
    foot at both ends. The same for every camera and theme, so found once. */
function conduitRoute(): V3[] {
  if (!routeMemo) routeMemo = findRoute();
  return routeMemo;
}

function findRoute(): V3[] {
  const r = CONDUIT_R + 1.4;
  const reach = HEMI.b * 0.86;
  const n = 40;
  const zs: number[] = [];
  const fs: number[] = [];
  for (let i = 0; i <= n; i++) {
    const f = reach - (2 * reach * i) / n;
    let z = r;
    for (; z < HEMI.up; z += 1) {
      let clear = true;
      for (let k = -4; k <= 4 && clear; k++) {
        const dz = (r * k) / 4;
        if (halfGap(f, z + dz) < Math.sqrt(Math.max(0, r * r - dz * dz)) + 0.6) clear = false;
      }
      if (clear) break;
    }
    fs.push(f);
    zs.push(z);
  }
  // smooth the arch so it reads as one sweep, never below what clears
  const sm = zs.map((_, i) => {
    let sum = 0;
    for (let k = -3; k <= 3; k++) sum += zs[Math.max(0, Math.min(n, i + k))];
    return Math.max(zs[i], sum / 7);
  });
  // each end turns down round the pole, follows the fissure's front (or
  // back) in under the hemispheres and stands into its collar
  const top = Z_FLOOR + COLLAR;
  const end = (sgn: number, fA: number, zA: number): V3[] => [
    [0, sgn * FOOT_F, top],
    [0, sgn * FOOT_F, top + 6],
    [0, sgn * (FOOT_F + 18), top + 16],
    [0, sgn * (fA - 8), zA - 22],
  ];
  const pts: V3[] = [...end(1, fs[0], sm[0])];
  for (let i = 0; i <= n; i++) pts.push([0, fs[i], sm[i]]);
  pts.push(...end(-1, -fs[n], sm[n]).reverse());
  return fillet(pts, 9, 9) as V3[];
}

/** The collar the conduit stands into, on its bridge. */
function collarSvg(f: number, P: Projection): string {
  const [x, y] = WP(0, f);
  return solidSvg(cylinder(x, y, CONDUIT_R + 1.5, Z_FLOOR, COLLAR, P, 28, 0.6), { tone: "mid", crease: "lo" });
}

/** The two bridge plates under the fissure's foot, each running under both
    base plates' medial edges. The lowest parts of the picture, so painted
    first. */
function bridgesSvg(view: BrainView): string {
  const P = projOf(view);
  return [-1, 1]
    .map((sgn) => ({ sgn, depth: depthOf(W(0, sgn * FOOT_F, BRIDGE.z), P) }))
    .sort((a, b) => a.depth - b.depth)
    .map(({ sgn }) => solidSvg(extrude(boxRing(0, sgn * FOOT_F, BRIDGE.half * 2, BRIDGE.depth), BRIDGE.z, BRIDGE.h, P, { bevel: 0.6 }), { tone: "mid", crease: "lo" }))
    .join("");
}

function conduitSvg(view: BrainView): string {
  const P = projOf(view);
  const route = conduitRoute().map(([l, f, z]) => W(l, f, z));
  const items: Item[] = tubePieces(route, CONDUIT_R, P, { maxLength: 30, spacing: 3, rings: { pitch: 2.8, tone: "lo", fade: [0.08, 0.5], steps: 8 } }).map((p) => ({
    depth: depthOf(p.mid as [number, number, number], P),
    svg: tubeSvg(p, { tone: "mid" }),
  }));
  for (const sgn of [-1, 1]) items.push({ depth: depthOf(W(0, sgn * FOOT_F, Z_FLOOR), P) - CONDUIT_R, svg: collarSvg(sgn * FOOT_F, P) });
  return `<g class="gh-conduit">${items
    .sort((a, b) => a.depth - b.depth)
    .map((i) => i.svg)
    .join("")}</g>`;
}

// ─── the picture ────────────────────────────────────────────────────────────

const cssOf = (gold: string) => `.gh-conduit .tb-ring{stroke-width:.5}.gh-via .iso-dots circle{fill:${gold};opacity:.8}`;

/** One hemisphere alone (the halves parted) draws no conduit and no
    bridges: they lie in the fissure between the two, and a parted half's
    medial wall is where the act plugs its own tendrils in (ADR-159 U7), so
    it stays clear. */
function glassSvg({ view = BRAIN_VIEW_ISO, only, light, tones }: MindOptions): string {
  const draw = (side: Side) => {
    const hs = hemisphere(side, view, light);
    return hs.back + hs.machine + hs.front;
  };
  const [far, near] = sidesFarFirst(view);
  const parts = only ? [draw(only)] : [bridgesSvg(view), draw(far), conduitSvg(view), draw(near)];
  return mindSvg({ view, light, tones, body: parts.join(""), css: cssOf(tones.gold) });
}

export const glassHousing: MindDirection = {
  id: "d3",
  name: "Glass Housing",
  line: "A clear glass shell in the brain's shape, a stack of machined boards standing inside it, a corrugated conduit down the fissure into its foot.",
  svg: (o) => glassSvg(o),
};
