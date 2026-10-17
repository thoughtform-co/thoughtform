/**
 * G1 · Wafer Mind (machine-mind round four, 2026-10-17; the owner's pick of
 * F1, carried on, then his notes on the first G1: "remove the block patterns
 * on top because it makes it feel like Lego … the cables are too realistic
 * … like different types of cables. If the cables meet at the bottom, they
 * need to come from the bottom, as you have with part of the spine and the
 * brain … the front … needs to be more subtle").
 *
 * F1's sixteen routed silicon wafers a hemisphere (each the brain's own
 * level section, sulci notched into its edge; a fine bond line, a thin metal
 * band, a few traces on some treads, bare silicon on the rest, through-
 * silicon vias down the edges; no die grids, no rows of parts), and:
 *
 *   node     on the right crown, a stacked package (substrate with its pad
 *            row, moulded body, the lit heat spreader and a raised core):
 *            the tallest part on the crown and the one lit part; its traces
 *            leave all four sides in bundles, splay at 45° to a wider pitch
 *            and run out across the crown and down the top treads, stepping
 *            each riser, ending on vias
 *   cut      the right frontal lobe is cut away on a coronal plane; its face
 *            shows the wafers in section and the cortex as two quiet gold
 *            lines hugging the outline and diving square into each sulcus,
 *            round a calm interior with a few faint tracts and one small
 *            core; the node's front bundle runs over the edge into it
 *   stem     where a brain stem would be, between the hemispheres: a column
 *            rising into the fissure, a collar band just under the brain,
 *            rings down the neck like a spine's, and the connector block
 *            everything below leaves from
 *   cables   from the block's underside, each its own kind, all in the kit's
 *            flat tones (a body, one lit band, one shaded band, a hairline
 *            edge): a corrugated hose (ridges over a groove core), a
 *            segmented cable (vertebrae on a thin core), a plain cable with
 *            two machined collars hanging in a loop back into the block; and
 *            a USB-B plug seated in the block's front face, its cable
 *            falling to a USB-A plug; ends on connectors at three heights
 *
 * The picture's box is the brain's own, deepened only if a cable hangs past.
 *
 * Pure: strings and numbers, no randomness.
 */

import { brainIsoBox, LC, projOf, W, type BrainIsoBox, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, dotsSvg, extrude, iso, lineSvg, pathOf, solidSvg, towardViewer, type Flat, type Point3, type Projection } from "@/components/arcs/figures/foundation/isoKit";
import { heightRange, inside, mindSvg, routedOutline, sectionAt, sidesFarFirst, sulcusAt, type HullShape, type Side } from "../hull";
import {
  at3,
  bezier,
  cableItems,
  endItems,
  endOf,
  facePath,
  foldedRing,
  nodeSvg,
  onFace,
  paint,
  plugItems,
  portItems,
  slab,
  STEM,
  stemSvg,
  usbAItems,
  w3,
  WP,
  add3,
  sub3,
  type CableStyle,
  type Fold,
  type Item,
  type LF,
  type V3,
} from "./waferMind.parts";
import type { MindDirection, MindOptions } from "./types";

// ─── the stack ──────────────────────────────────────────────────────────────

const SHAPE: HullShape = { brain: 1, sulci: 0.085 };
/** Wafers a hemisphere, and how closely their edges are routed to the true
    section (2–3 keeps the sulcus notches; 5 is a plain octagon). */
const WAFERS = 16;
const TOL = 2;
/** The bond gap under each wafer, and the metal band round its top edge:
    finer than F1's, so the stack reads machined, not moulded. */
const GAP = 1;
const BAND = 0.7;
/** The thinnest a wafer gets. */
const MIN_T = 4.5;
/** How far below the hull's crown the stack stops. */
const CAP_DROP = 2.5;
/** How much of the spacing follows the slope (the rest is even height). */
const SLOPE = 0.72;

/** Where things are: the node and the cut on the right hemisphere, the
    plug and the hose on the left, the coil on the right flank. */
const NODE_SIDE: Side = 1;
const CUT_SIDE: Side = 1;
/** The stem under the brain, between the hemispheres, toward the back. */
const STEM_F = -22;
/** The coronal plane the right frontal lobe is cut on. */
const F_CUT = 60;

function levels(): number[] {
  const [floor, crown] = heightRange(SHAPE);
  const top = crown - CAP_DROP;
  const n = 160;
  const radius = (H: number) => {
    const { ring } = sectionAt(1, H, SHAPE, 24);
    return ring.reduce((s, [l, f]) => s + Math.hypot(l - LC, f), 0) / ring.length;
  };
  const hs: number[] = [];
  const ds: number[] = [0];
  let r0 = radius(floor + 0.5);
  for (let i = 0; i <= n; i++) {
    const H = floor + 0.5 + ((top - floor - 0.5) * i) / n;
    hs.push(H);
    if (i) {
      const r = radius(H);
      ds.push(ds[i - 1] + Math.hypot(r - r0, (top - floor) / n));
      r0 = r;
    }
  }
  const out: number[] = [hs[0]];
  let j = 0;
  for (let k = 1; k < WAFERS; k++) {
    const target = (ds[n] * k) / WAFERS;
    while (ds[j + 1] < target) j++;
    const a = (target - ds[j]) / (ds[j + 1] - ds[j]);
    const bySlope = hs[j] + (hs[j + 1] - hs[j]) * a;
    const byHeight = hs[0] + ((top - hs[0]) * k) / WAFERS;
    out.push(Math.max(SLOPE * bySlope + (1 - SLOPE) * byHeight, out[k - 1] + MIN_T));
  }
  out.push(top);
  return out;
}

let levelMemo: number[] | null = null;
const LEVELS = () => (levelMemo ??= levels());

// ─── outline geometry ───────────────────────────────────────────────────────

const areaOf = (ring: readonly LF[]) => ring.reduce((s, a, i) => s + a[0] * ring[(i + 1) % ring.length][1] - ring[(i + 1) % ring.length][0] * a[1], 0) / 2;

function offsetRing(ring: readonly LF[], d: number): LF[] {
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

function selfCrosses(ring: readonly LF[]): boolean {
  const n = ring.length;
  const cross = (a: LF, b: LF, c: LF) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const c = ring[j];
      const d = ring[(j + 1) % n];
      if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return true;
    }
  }
  return false;
}

const pointAt = (ring: readonly LF[], u: number): LF => {
  const n = ring.length;
  const i = ((Math.floor(u) % n) + n) % n;
  const k = u - Math.floor(u);
  const a = ring[i];
  const b = ring[(i + 1) % n];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
};

function along(ring: readonly LF[], u0: number, u1: number): LF[] {
  const pts: LF[] = [pointAt(ring, u0)];
  for (let v = Math.floor(u0) + 1; v < u1; v++) pts.push(pointAt(ring, v));
  pts.push(pointAt(ring, u1));
  return pts;
}

const edgeLen = (ring: readonly LF[], i: number) => {
  const a = ring[i % ring.length];
  const b = ring[(i + 1) % ring.length];
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
};

/** The part of a ring with f ≤ fc (Sutherland–Hodgman on one half-plane),
    the points on the cut set exactly on it. */
function cutRing(ring: readonly LF[], fc: number): LF[] {
  const out: LF[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const ia = a[1] <= fc;
    const ib = b[1] <= fc;
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = (fc - a[1]) / (b[1] - a[1]);
      out.push([a[0] + (b[0] - a[0]) * t, fc]);
    }
  }
  return out.filter((p, i) => Math.hypot(p[0] - out[(i + 1) % out.length][0], p[1] - out[(i + 1) % out.length][1]) > 0.05);
}

/** How far along (ux, uy) from (ox, oy) a ray leaves a ring: the nearest
    crossing out, or null. */
function exitAlong(ring: readonly LF[], ox: number, oy: number, ux: number, uy: number): number | null {
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
    if (s0 > 1e-6 && r >= -1e-9 && r <= 1 + 1e-9 && s0 < best) best = s0;
  }
  return Number.isFinite(best) ? best : null;
}

// ─── the wafers (the same for every camera) ─────────────────────────────────

interface Wafer {
  k: number;
  h0: number;
  h1: number;
  ring: LF[];
  /** The uncut section, its points' contour angles' parameter heights. */
  raw: LF[];
  zs: number[];
}

const waferMemo = new Map<Side, Wafer[]>();

function wafersOf(side: Side): Wafer[] {
  const known = waferMemo.get(side);
  if (known) return known;
  const L = LEVELS();
  const out: Wafer[] = [];
  for (let k = 0; k < WAFERS; k++) {
    const h0 = L[k];
    const h1 = L[k + 1];
    const { ring: raw, zs } = sectionAt(side, (h0 + h1) / 2, SHAPE, 200);
    let ring = routedOutline(raw, TOL);
    for (let tol = TOL + 0.25; selfCrosses(ring) && tol < TOL + 3; tol += 0.25) ring = routedOutline(raw, tol);
    ring = ring.filter((_, i) => edgeLen(ring, i) > 0.05 || i === 0);
    if (areaOf(ring) < 0) ring = ring.slice().reverse();
    if (side === CUT_SIDE && ring.some((p) => p[1] > F_CUT)) ring = cutRing(ring, F_CUT);
    out.push({ k, h0, h1, ring, raw, zs });
  }
  waferMemo.set(side, out);
  return out;
}

const onCut = (a: LF, b: LF) => Math.abs(a[1] - F_CUT) < 1e-6 && Math.abs(b[1] - F_CUT) < 1e-6;

// ─── tones ──────────────────────────────────────────────────────────────────

function sheetOf(light: boolean, gold: string, lit: string, ground: string): string {
  const t = light
    ? {
        body: ["#aea79a", "#bdb6a9", "#cbc5b9", "#d8d3c8"],
        top: "#e9e5dc",
        band: ["#8d877b", "#9b9588", "#aaa497", "#b8b2a6"],
        bond: "#6d675c",
        die: "#d3cdc1",
        part: ["#5d574d", "#6b655a", "#79736a", "#878178"],
        partTop: "#4a463f",
        edge: "#8f897d",
        metal: ["#4f4c47", "#5e5a54", "#6f6b64", "#827d75"],
        metalTop: "#99948b",
        tin: ["#a7a398", "#b6b2a7", "#c5c1b6", "#d4d0c5"],
        rubber: ["#4a4640", "#57534c", "#6a665e", "#7d7870"],
        cable: { body: "#bdb6a9", shine: "#d8d3c8", edge: "#8f897d", band: ["#aea79a", "#bdb6a9", "#cbc5b9", "#d8d3c8"] },
        white: "#c9c2b5",
        tract: "#a7a093",
      }
    : {
        body: ["#0e0e0d", "#161615", "#1f1e1c", "#292826"],
        top: "#33312d",
        band: ["#4f4b45", "#5e5a53", "#6e6a62", "#7e7a71"],
        bond: "#050505",
        die: "#4c4943",
        part: ["#141312", "#1b1a18", "#22211f", "#2a2826"],
        partTop: "#47443e",
        edge: "#4b4842",
        metal: ["#2b2a28", "#383633", "#47443f", "#58554e"],
        metalTop: "#5f5b54",
        tin: ["#5f5c56", "#716d66", "#827e76", "#948f87"],
        rubber: ["#121110", "#1a1917", "#24221f", "#33302c"],
        cable: { body: "#1f1e1c", shine: "#3a3833", edge: "#4b4842", band: ["#1f1e1c", "#292826", "#33312d", "#3e3b36"] },
        white: "#131211",
        tract: "#34312c",
      };
  const shades = (s: string[], top: string) => `--anatomy-shade-0:${s[0]};--anatomy-shade-1:${s[1]};--anatomy-shade-2:${s[2]};--anatomy-shade-3:${s[3]};--anatomy-top:${top};--anatomy-paper:${s[1]}`;
  return [
    `.wf-body{${shades(t.body, t.top)};--anatomy-lo:${t.edge};--anatomy-faint:${t.edge}}`,
    `.wf-band{${shades(t.band, t.top)};--anatomy-lo:${t.band[2]};--anatomy-faint:${t.band[2]}}`,
    `.wf-bond{${shades([t.bond, t.bond, t.bond, t.bond], t.bond)};--anatomy-lo:${t.bond}}`,
    `.wf-part,.wf-mold{${shades(t.part, t.partTop)};--anatomy-lo:${t.part[3]};--anatomy-mid:${t.part[3]}}`,
    `.gm-metal,.gm-nut{${shades(t.metal, t.metalTop)};--anatomy-lo:${t.metal[3]};--anatomy-mid:${t.metal[3]}}`,
    `.gm-nut{--anatomy-top:${t.metal[3]}}`,
    `.gm-tin{${shades(t.tin, t.tin[3])};--anatomy-lo:${t.tin[1]};--anatomy-mid:${t.tin[1]}}`,
    `.gm-plastic{${shades(t.rubber, t.rubber[3])};--anatomy-lo:${t.rubber[3]};--anatomy-mid:${t.rubber[3]}}`,
    `.gm-cable{--anatomy-shade-2:${t.cable.body};--anatomy-top:${t.cable.shine};--anatomy-lo:${t.cable.edge};--anatomy-mid:${t.cable.edge}}`,
    `.gm-cable .tb-shade{display:none}`,
    `.gm-band{${shades(t.cable.band, t.cable.band[3])};--anatomy-lo:${t.cable.edge};--anatomy-mid:${t.cable.edge}}`,
    `.gm-seam{stroke:${t.metal[0]}!important}`,
    `.gm-screw .iso-dots circle{fill:${t.metal[0]};opacity:1}`,
    `.gm-pin{stroke:${gold}!important;stroke-width:1.2px}`,
    `.gm-white{fill:${t.white}}`,
    `.gm-cortex{fill:none;stroke:${gold};stroke-width:.55;stroke-linejoin:miter;opacity:.9}`,
    `.gm-sulcus{fill:none;stroke:${light ? "#8f897d" : "#000"};stroke-width:.8}`,
    `.gm-tract{fill:none;stroke:${t.tract};stroke-width:.55}`,
    `.gm-core{fill:${light ? "#b8b1a4" : "#0c0c0b"};stroke:${t.tract};stroke-width:.5}`,
    `.gm-tract-via circle{fill:${t.tract}}`,
    `.wf-die{fill:${t.die}}`,
    `.wf-via .iso-dots circle{fill:${gold};stroke:${ground};stroke-width:.3;opacity:1}`,
    `.wf-trace{stroke:${gold}!important;opacity:1}`,
    `.wf-tsv{stroke:${gold}!important;stroke-width:1px;opacity:1}`,
    `.wf-core .iso-top{fill:${light ? "#d9b65c" : "#c9a04a"}}`,
    `.wf-core .iso-edge{stroke:${lit}}`,
    `.gm-section path{vector-effect:none}`,
  ].join("");
}

// ─── the treads' circuits (F1's) ────────────────────────────────────────────

/** What a tread stretch carries: a few traces, or bare silicon. No die grid
    and no rows of parts (owner, 2026-10-17: the block patterns read as
    Lego). */
type Pattern = "traces" | "none";
const PATTERNS: Pattern[] = ["traces", "none", "none", "traces", "none", "none", "none"];

function treadSvg(side: Side, w: Wafer, next: Wafer, P: Projection): string {
  const { ring, h1, k } = w;
  const z = h1;
  const n = ring.length;
  const keepOut = offsetRing(next.ring, -1.6);
  const lens = Array.from({ length: n }, (_, i) => edgeLen(ring, i));
  const total = lens.reduce((s, v) => s + v, 0);
  const stretches = Math.max(3, Math.round(total / 55));
  const uAt = (s: number) => {
    let x = ((s % total) + total) % total;
    for (let i = 0; i < n; i++) {
      if (x <= lens[i]) return i + x / (lens[i] || 1);
      x -= lens[i];
    }
    return n - 1e-6;
  };
  const traceRuns: string[] = [];
  const vias: Flat[] = [];
  const phase = (k * 23 + (side > 0 ? 11 : 0)) % total;
  for (let sIdx = 0; sIdx < stretches; sIdx++) {
    const pattern = PATTERNS[(sIdx * 3 + k * 5 + (side > 0 ? 2 : 0)) % PATTERNS.length];
    if (pattern === "none") continue;
    const s0 = phase + (total * sIdx) / stretches;
    const s1 = phase + (total * (sIdx + 1)) / stretches;
    let offs: number[] = [];
    let best: [number, number] | null = null;
    const steps = 40;
    for (const set of [[1.8, 3.4, 5], [1.8, 3.4], [2]]) {
      const inner = offsetRing(ring, set[set.length - 1] + 1);
      let found: [number, number] | null = null;
      let run: number | null = null;
      for (let i = 0; i <= steps; i++) {
        const u = uAt(s0 + ((s1 - s0) * i) / steps);
        const ok = !inside(pointAt(inner, u), keepOut) && inside(pointAt(inner, u), ring);
        if (ok && run === null) run = i;
        if ((!ok || i === steps) && run !== null) {
          const end = ok ? i : i - 1;
          if (!found || end - run > found[1] - found[0]) found = [run, end];
          run = null;
        }
      }
      if (found && found[1] - found[0] >= 14) {
        offs = set;
        best = found;
        break;
      }
    }
    if (!best) continue;
    const sa = s0 + ((s1 - s0) * best[0]) / steps;
    const sb = s0 + ((s1 - s0) * best[1]) / steps;
    offs.forEach((d, j) => {
      const r = offsetRing(ring, d);
      const ua = uAt(sa + j * 3);
      let ub = uAt(sb - j * 3);
      if (ub <= ua) ub += n;
      const pts = along(r, ua, ub);
      traceRuns.push(pathOf(pts.map(([a, b]) => at3(a, b, z, P))));
      vias.push(at3(pts[0][0], pts[0][1], z, P), at3(pts[pts.length - 1][0], pts[pts.length - 1][1], z, P));
    });
  }
  const out: string[] = [];
  if (traceRuns.length) out.push(lineSvg(traceRuns.join(""), { tone: "lo", className: "wf-trace" }));
  if (vias.length) out.push(`<g class="wf-via">${dotsSvg(vias, { size: 0.5, tone: "hi" })}</g>`);
  return out.join("");
}

// ─── the node's fan-out ─────────────────────────────────────────────────────

/** The bundles leaving the node: a direction in (l, f) (for the right
    hemisphere; mirrored for the left), how many traces and how many wafers
    each trace steps down. */
const BUNDLES: { dir: LF; steps: number[] }[] = [
  { dir: [0, 1], steps: [9, 9, 9, 9, 9] },
  { dir: [0, -1], steps: [2, 4, 5, 3, 2] },
  { dir: [1, 0], steps: [2, 3, 4, 3] },
  { dir: [-1, 0], steps: [3, 4, 5, 4] },
];
/** The wafers below the crown the fan-out covers (their treads carry no
    other circuits). */
const FAN_WAFERS = 5;

interface Fan {
  runs: Map<number, string[]>;
  drops: Map<number, string[]>;
  vias: Map<number, Flat[]>;
  /** Drops down the cut face, drawn after the section. */
  face: string[];
  faceVias: Flat[];
}

function fanOut(side: Side, wafers: Wafer[], cl: number, cf: number, half: number, P: Projection): Fan {
  const [vx, vy] = towardViewer(P);
  const top = wafers.length - 1;
  const fan: Fan = { runs: new Map(), drops: new Map(), vias: new Map(), face: [], faceVias: [] };
  const push = <T>(m: Map<number, T[]>, k: number, v: T) => {
    const list = m.get(k);
    if (list) list.push(v);
    else m.set(k, [v]);
  };
  for (const { dir, steps } of BUNDLES) {
    const d: LF = [dir[0] * side, dir[1]];
    const p: LF = [-d[1], d[0]];
    const n = steps.length;
    steps.forEach((count, j) => {
      const o = (j - (n - 1) / 2) * 1.25;
      const O = (j - (n - 1) / 2) * 3.2;
      const at = (s: number, off: number): LF => [cl + d[0] * s + p[0] * off, cf + d[1] * s + p[1] * off];
      const s0 = half + 0.2;
      const s1 = s0 + 1.6;
      const s2 = s1 + Math.abs(O - o);
      // on the crown: out of the substrate, a 45° jog to the wide pitch
      const lead: LF[] = [at(s0, o), at(s1, o), at(s2, O)];
      const ox = lead[2][0];
      const oy = lead[2][1];
      const capExit = exitAlong(wafers[top].ring, ox, oy, d[0], d[1]);
      if (capExit === null) return;
      let prev: LF = [ox + d[0] * capExit, oy + d[1] * capExit];
      push(fan.runs, top, pathOf([...lead, prev].map(([l, f]) => at3(l, f, wafers[top].h1, P))));
      let last = top;
      for (let k = top - 1; k >= Math.max(0, top - count); k--) {
        const upper = wafers[k + 1];
        const w = wafers[k];
        // the drop down the upper wafer's riser at prev, where it faces us
        const edge = nearestEdge(upper.ring, prev);
        if (edge && edge.facing(vx, vy)) push(fan.drops, k + 1, pathOf([at3(prev[0], prev[1], upper.h1, P), at3(prev[0], prev[1], upper.h0, P)]));
        if (edge && onCut(edge.a, edge.b)) {
          // over the cut's edge: down the face into the cortex
          fan.face.push(pathOf([at3(prev[0], prev[1] + 0.06, upper.h1, P), at3(prev[0], prev[1] + 0.06, upper.h1 - 8 - (j % 2) * 3, P)]));
          fan.faceVias.push(at3(prev[0], prev[1] + 0.06, upper.h1 - 8 - (j % 2) * 3, P));
          last = -1;
          break;
        }
        const s = exitAlong(w.ring, prev[0] + d[0] * 0.05, prev[1] + d[1] * 0.05, d[0], d[1]);
        if (s === null) break;
        const next: LF = [prev[0] + d[0] * (s + 0.05), prev[1] + d[1] * (s + 0.05)];
        push(fan.runs, k, pathOf([at3(prev[0], prev[1], w.h1, P), at3(next[0], next[1], w.h1, P)]));
        prev = next;
        last = k;
      }
      if (last >= 0) {
        // end a little short of the last wafer's edge, on a via
        const back: LF = [prev[0] - d[0] * 1.6, prev[1] - d[1] * 1.6];
        push(fan.vias, last, at3(back[0], back[1], wafers[last].h1, P));
      }
    });
  }
  return fan;
}

/** The ring edge nearest a point, with whether it faces the viewer. */
function nearestEdge(ring: readonly LF[], q: LF) {
  let best = Infinity;
  let at = -1;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((q[0] - a[0]) * ex + (q[1] - a[1]) * ey) / (ex * ex + ey * ey || 1)));
    const d = Math.hypot(q[0] - a[0] - ex * t, q[1] - a[1] - ey * t);
    if (d < best) {
      best = d;
      at = i;
    }
  }
  if (at < 0) return null;
  const a = ring[at];
  const b = ring[(at + 1) % ring.length];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (b[1] - a[1]) / len;
  const ny = -(b[0] - a[0]) / len;
  return { a, b, facing: (vx: number, vy: number) => ny * vx + -nx * vy > 0.1 };
}

// ─── the cut face ───────────────────────────────────────────────────────────

/** The right frontal lobe's coronal section, drawn on the cut face: the
    stacked wafers' faces, the cortex as a folded ribbon of gold traces, the
    white matter darker, carried by level tracts into a core. */
function sectionSvg(side: Side, wafers: Wafer[], P: Projection): string {
  // each cut wafer's face: the span of its edge on the cut
  const faces: { k: number; l0: number; l1: number; z0: number; z1: number }[] = [];
  for (const w of wafers) {
    const ls: number[] = [];
    for (let i = 0; i < w.ring.length; i++) if (onCut(w.ring[i], w.ring[(i + 1) % w.ring.length])) ls.push(w.ring[i][0], w.ring[(i + 1) % w.ring.length][0]);
    if (ls.length) faces.push({ k: w.k, l0: Math.min(...ls), l1: Math.max(...ls), z0: w.h0 + GAP, z1: w.h1 });
  }
  if (faces.length < 3) return "";
  // the section's outline in (l, z): up the lateral side, across, down the medial
  const lat = side > 0 ? "l1" : "l0";
  const med = side > 0 ? "l0" : "l1";
  const raw: LF[] = [];
  for (const f of faces) raw.push([f[lat], f.z0], [f[lat], f.z1]);
  for (const f of faces.slice().reverse()) raw.push([f[med], f.z1], [f[med], f.z0]);
  // eroded so the ribbon stays on the faces across the steps, then routed
  // in long runs (level, plumb, 45°) so it reads as one calm outline
  const eroded = faces.map((f, i) => {
    const near = faces.slice(Math.max(0, i - 1), i + 2);
    return { ...f, l0: Math.max(...near.map((q) => q.l0)), l1: Math.min(...near.map((q) => q.l1)) };
  });
  const raw2: LF[] = [];
  for (const f of eroded) raw2.push([f[lat], f.z0], [f[lat], f.z1]);
  for (const f of eroded.slice().reverse()) raw2.push([f[med], f.z1], [f[med], f.z0]);
  let outline = routedOutline(raw2, 5);
  if (areaOf(outline) < 0) outline = outline.reverse();
  outline = offsetRing(outline, 1.5);
  void raw;
  // the hull's sulcus field where the cut crosses each wafer's edge, on both
  // sides: a point of the section's outline takes the nearest one's value
  const marks: { l: number; z: number; v: number }[] = [];
  for (const fc of faces) {
    const w = wafers[fc.k];
    const n = w.raw.length;
    for (let i = 0; i < n; i++) {
      const a = w.raw[i];
      const b = w.raw[(i + 1) % n];
      if ((a[1] - F_CUT) * (b[1] - F_CUT) > 0 || a[1] === b[1]) continue;
      const t = (F_CUT - a[1]) / (b[1] - a[1]);
      const z = w.zs[i] + (w.zs[(i + 1) % n] - w.zs[i]) * t;
      marks.push({ l: a[0] + (b[0] - a[0]) * t, z: (fc.z0 + fc.z1) / 2, v: sulcusAt(side, ((i + t) / n) * Math.PI * 2, z) });
    }
  }
  const fieldAt = (l: number, z: number) => marks.reduce((best, m) => (Math.hypot(m.l - l, m.z - z) < Math.hypot(best.l - l, best.z - z) ? m : best), marks[0]).v;
  // the folds: along the outline, a sulcus wherever the field changes sign,
  // never closer than a fold's own width, and a few more where the outline
  // runs long and bare, so the ribbon folds the way a cortex does
  const folds: Fold[] = [];
  const GAP_S = 1;
  const DMAX = 3.8;
  const HALF = GAP_S / 2 + DMAX;
  const n = outline.length;
  const lens = Array.from({ length: n }, (_, i) => edgeLen(outline, i));
  const per = lens.reduce((sum, v) => sum + v, 0);
  const placed: number[] = [];
  const pointOn = (sAll: number): { e: number; s: number } => {
    let x = sAll;
    for (let i = 0; i < n; i++) {
      if (x <= lens[i]) return { e: i, s: x };
      x -= lens[i];
    }
    return { e: n - 1, s: lens[n - 1] };
  };
  const free = (sAll: number) => placed.every((q) => Math.min(Math.abs(q - sAll), per - Math.abs(q - sAll)) > 2 * HALF + 7);
  const fits = ({ e, s }: { e: number; s: number }) => s > HALF + 1.5 && s < lens[e] - HALF - 1.5;
  const depthAt = (k: number) => 12 + ((k * 7) % 5);
  // a sulcus dives square into the section: only from a level or plumb run
  const square = (e: number) => {
    const a = outline[e];
    const b = outline[(e + 1) % n];
    return Math.abs(a[0] - b[0]) < 0.01 || Math.abs(a[1] - b[1]) < 0.01;
  };
  let prev: number | null = null;
  for (let sAll = 0; sAll < per; sAll += 1) {
    const { e, s } = pointOn(sAll);
    const a = outline[e];
    const b = outline[(e + 1) % n];
    const t = s / (lens[e] || 1);
    const v = fieldAt(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
    if (prev !== null && v * prev < 0 && square(e) && fits({ e, s }) && free(sAll) && folds.length < 5) {
      folds.push({ e, s, depth: depthAt(folds.length) });
      placed.push(sAll);
    }
    prev = v;
  }
  for (let e = 0; e < n && folds.length < 5; e++) {
    if (lens[e] < 2 * HALF + 14 || !square(e)) continue;
    let start = 0;
    for (let i = 0; i < e; i++) start += lens[i];
    const at = lens[e] * (0.38 + 0.24 * ((e * 7) % 3) / 2);
    if (free(start + at) && fits({ e, s: at })) {
      folds.push({ e, s: at, depth: depthAt(folds.length + 1) });
      placed.push(start + at);
    }
  }
  const out: string[] = [];
  // the white matter, per wafer face, so the bond lines stay in section
  const whiteRing = foldedRing(outline, 5, folds, GAP_S);
  const white: string[] = [];
  for (const f of faces) {
    const piece = slab(whiteRing, f.z0, f.z1);
    if (piece.length >= 3) white.push(facePath(piece, F_CUT, P));
  }
  out.push(`<path class="gm-white" d="${white.join("")}"/>`);
  // the tracts: one level run a wafer through the white matter, ending on
  // vias at its edge; the core interrupts the ones it meets
  const wl = whiteRing.map((p) => p[0]);
  const wz = whiteRing.map((p) => p[1]);
  const wl0 = Math.min(...wl);
  const wl1 = Math.max(...wl);
  const wz0 = Math.min(...wz);
  const wz1 = Math.max(...wz);
  const coreL = side > 0 ? wl0 + (wl1 - wl0) * 0.3 : wl1 - (wl1 - wl0) * 0.3;
  const coreZ = wz0 + (wz1 - wz0) * 0.38;
  const core = { l0: coreL - 5, l1: coreL + 5, z0: coreZ - 6, z1: coreZ + 6 };
  const tracts: string[] = [];
  const tvias: Flat[] = [];
  for (const f of faces.filter((_, i) => i % 3 === 1)) {
    const z = (f.z0 + f.z1) / 2;
    const xs: number[] = [];
    for (let i = 0; i < whiteRing.length; i++) {
      const a = whiteRing[i];
      const b = whiteRing[(i + 1) % whiteRing.length];
      if ((a[1] - z) * (b[1] - z) > 0 || a[1] === b[1]) continue;
      xs.push(a[0] + ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const a = xs[i] + 4;
      const b = xs[i + 1] - 4;
      if (b - a < 6) continue;
      const spans: [number, number][] = z > core.z0 && z < core.z1 ? [[a, core.l0], [core.l1, b]] : [[a, b]];
      for (const [x0, x1] of spans) {
        if (x1 - x0 < 4) continue;
        tracts.push(facePath([[x0, z], [x1, z]], F_CUT, P, false));
        tvias.push(onFace(F_CUT, P)([x0, z]), onFace(F_CUT, P)([x1, z]));
      }
    }
  }
  out.push(`<path class="gm-tract" d="${tracts.join("")}"/>`);
  out.push(`<path class="gm-core" d="${facePath([[core.l0, core.z0], [core.l1, core.z0], [core.l1, core.z1], [core.l0, core.z1]], F_CUT, P)}"/>`);
  out.push(`<g class="gm-tract-via">${dotsSvg(tvias, { size: 0.42, tone: "hi" })}</g>`);
  // the cortex: two quiet gold lines hugging the outline, wrapping every
  // sulcus
  const cortex = [1.8, 3.4].map((d) => facePath(foldedRing(outline, d, folds, GAP_S), F_CUT, P));
  out.push(`<path class="gm-cortex" d="${cortex.join("")}"/>`);
  // the sulci themselves: slits from the surface into the fold
  const slits: string[] = [];
  for (const f of folds) {
    const a = outline[f.e];
    const b = outline[(f.e + 1) % outline.length];
    const len = edgeLen(outline, f.e);
    const tx = (b[0] - a[0]) / len;
    const ty = (b[1] - a[1]) / len;
    const s = areaOf(outline) > 0 ? 1 : -1;
    const nx = -ty * s;
    const ny = tx * s;
    const p: LF = [a[0] + tx * f.s, a[1] + ty * f.s];
    slits.push(facePath([[p[0] - nx * 0.9, p[1] - ny * 0.9], [p[0] + nx * f.depth, p[1] + ny * f.depth]], F_CUT, P, false));
  }
  out.push(`<path class="gm-sulcus" d="${slits.join("")}"/>`);
  return `<g class="gm-section">${out.join("")}</g>`;
}

// ─── the stem and its cables ────────────────────────────────────────────────

/** Everything that hangs under the brain starts there: the stem's block and
    its ports, the cables (each its own kind, in the kit's flat tones) and
    the USB-B plug seated in the block's front face. Brain axes, then the
    world. */
interface StemGroup {
  svg: string;
  /** The cables out of each hemisphere's underside, painted before that
      hemisphere (it stands over them, and in front of their ports). */
  under: Map<Side, string>;
  pts: V3[];
}

function stemGroup(P: Projection): StemGroup {
  const F = STEM_F;
  const zb = STEM.block[0];
  const items: Item[] = [];
  const pts: V3[] = [];
  const down = [0, 0, -1] as V3;
  const hang = (l: number, f: number, r: number, to: (x: V3) => V3[], style: CableStyle, end: "plug" | "none", collars: number[] = []) => {
    const { items: port, exit } = portItems(w3(l, f, zb), down, r, P);
    items.push(...port);
    const route = to(exit);
    items.push(...cableItems(route, r, P, { style, collars }));
    pts.push(...route);
    if (end === "plug") {
      const e = endOf(route);
      items.push(...endItems(e.p, e.t, r, P));
      pts.push([e.p[0], e.p[1], e.p[2] - 12]);
    }
  };
  /** A cable that leaves one port and hangs in a loop back into another. */
  const loop = (a0: LF, b0: LF, r: number, depth: number, sway: V3, style: CableStyle, collars: number[] = []) => {
    const a = portItems(w3(a0[0], a0[1], zb), down, r, P);
    const b = portItems(w3(b0[0], b0[1], zb), down, r, P);
    items.push(...a.items, ...b.items);
    const route = bezier(a.exit, [a.exit[0] + sway[0], a.exit[1] + sway[1], depth], [b.exit[0] + sway[0] * 0.6, b.exit[1] - sway[1], depth + sway[2]], b.exit, 50);
    items.push(...cableItems(route, r, P, { style, collars }));
    pts.push(...route);
  };
  /** A hanging route: straight down out of the port, then swinging by
      (dl, df) in brain axes to end at height `z`. */
  const fall = (dl: number, df: number, z: number, swing = 0.5) => (x: V3): V3[] => {
    const end = add3(x, sub3(w3(dl, df, 0), w3(0, 0, 0)));
    return bezier(x, [x[0], x[1], x[2] - 26], [x[0] + (end[0] - x[0]) * swing, x[1] + (end[1] - x[1]) * swing, z + 34], [end[0], end[1], z], 40);
  };
  // the thick corrugated hose, the longest
  hang(-13, F - 8, 3.8, fall(-14, -10, -222), "corrugated", "plug");
  // a lighter corrugated hose, hanging in a loop
  loop([-2, F - 10], [8, F - 10], 2.4, -158, [-4, -12, 6] as V3, "corrugated");
  // a thick plain cable with one collar, forward and out
  hang(13, F + 4, 3.2, fall(22, 14, -186, 0.7), "plain", "plug", [44]);
  // a thin plain cable, swinging back, the second longest
  hang(15, F - 8, 1.6, fall(10, -16, -206, 0.4), "plain", "plug");
  // a plain cable with one collar, hanging in a deep loop
  loop([-6, F + 8], [4, F + 9], 1.7, -200, [6, 10, 4] as V3, "plain", [60]);
  // one leaves the left hemisphere's underside near the stem
  const under = new Map<Side, string>();
  for (const [side, l, f, r, style, dl, df, z] of [[-1, -36, F - 14, 2.2, "plain", -12, -6, -170]] as [Side, number, number, number, CableStyle, number, number, number][]) {
    const zs = undersideZ(side, l, f);
    if (zs === null) continue;
    const { items: port, exit } = portItems(w3(l, f, zs), down, r, P);
    const route = fall(dl, df, z)(exit);
    const e = endOf(route);
    under.set(side, `<g class="gm-cable">${paint([...port, ...cableItems(route, r, P, { style }), ...endItems(e.p, e.t, r, P)])}</g>`);
    pts.push(...route, [e.p[0], e.p[1], e.p[2] - 12]);
  }
  const behind = paint(items);
  // the stem itself, over the tops of the cables it holds
  const stem = stemSvg(F, P);
  // the USB-B plug in the block's front face, its cable falling to a USB-A
  const front: Item[] = [];
  const n = [1, 0, 0] as V3;
  const { items: plug, exit } = plugItems(w3(-1, F + STEM.blockF, (STEM.block[0] + STEM.block[1]) / 2), n, P);
  front.push(...plug);
  const route = bezier(exit, [exit[0] + 10, exit[1], exit[2] - 2], [exit[0] + 18, exit[1] - 2, -168], [exit[0] + 16, exit[1] - 4, -190], 40);
  front.push(...cableItems(route, 1.4, P, { style: "plain", collars: [] }));
  const e = endOf(route);
  front.push(...usbAItems(e.p, e.t, P));
  pts.push(...route, [e.p[0], e.p[1], e.p[2] - 18]);
  return { svg: `<g class="gm-cable">${behind}</g>${stem}<g class="gm-cable">${paint(front)}</g>`, under, pts };
}

/** The height of a hemisphere's underside at (l, f): the bottom of the
    lowest wafer over that point. */
function undersideZ(side: Side, l: number, f: number): number | null {
  for (const w of wafersOf(side)) if (inside([l, f], w.ring)) return w.h0 + (w.k ? GAP : 0);
  return null;
}

const stemMemo = new Map<string, StemGroup>();
const stemOf = (P: Projection) => {
  const key = `${P.azimuth}/${P.elevation}`;
  const known = stemMemo.get(key);
  if (known) return known;
  const made = stemGroup(P);
  stemMemo.set(key, made);
  return made;
};

// ─── one hemisphere ─────────────────────────────────────────────────────────

function hemisphere(side: Side, view: BrainView): string {
  const P = projOf(view);
  const [vx, vy] = towardViewer(P);
  const wafers = wafersOf(side);
  const top = wafers.length - 1;
  const out: string[] = [];
  const plane = (ring: readonly LF[]) => ring.map(([l, f]) => WP(l, f));
  // the node and its fan-out
  let node: { cl: number; cf: number; half: number } | null = null;
  let fan: Fan | null = null;
  if (side === NODE_SIDE) {
    const ring = wafers[top].ring;
    const ls = ring.map((p) => p[0]);
    const fs = ring.map((p) => p[1]);
    const cl = (Math.min(...ls) + Math.max(...ls)) / 2;
    const cf = (Math.min(...fs) + Math.max(...fs)) / 2;
    let half = 11;
    const fits = (h: number) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(([a, b]) => inside([cl + a * (h + 3), cf + b * (h + 3)], ring));
    while (half > 6 && !fits(half)) half -= 0.5;
    node = { cl, cf, half };
    fan = fanOut(side, wafers, cl, cf, half, P);
  }
  for (const w of wafers) {
    const { k, h0, h1, ring } = w;
    const next = wafers[k + 1];
    const below = wafers[k - 1];
    if (k > 0) out.push(solidSvg(extrude(plane(offsetRing(ring, 1.8)), h0, GAP, P, { convex: false }), { tone: "lo", crease: "none", className: "wf-bond" }));
    out.push(solidSvg(extrude(plane(ring), h0 + GAP, h1 - BAND - h0 - GAP, P, { convex: false, bevel: 0.5 }), { tone: "lo", crease: "faint", className: "wf-body" }));
    out.push(solidSvg(extrude(plane(ring), h1 - BAND, BAND, P, { convex: false }), { tone: "lo", crease: "none", className: "wf-band" }));
    // through-silicon vias down this wafer's edge (not on the port's wafer
    // or the cut face)
    if (below) {
      const tsv: string[] = [];
      const feet: Flat[] = [];
      const n = ring.length;
      const shelf = offsetRing(below.ring, 1.2);
      for (let i = 0; i < n; i++) {
        if ((i + k * 3) % 9 !== 0) continue;
        const a = ring[i];
        const b = ring[(i + 1) % n];
        const len = edgeLen(ring, i);
        if (len < 12 || onCut(a, b)) continue;
        const nx = (b[1] - a[1]) / len;
        const ny = -(b[0] - a[0]) / len;
        if (ny * vx + -nx * vy <= 0.3) continue;
        for (const u of [0.42, 0.58]) {
          const q: LF = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
          const foot: LF = [q[0] + nx * 1.8, q[1] + ny * 1.8];
          if (!inside(foot, shelf)) continue;
          if (next && inside([q[0] + nx * 0.5, q[1] + ny * 0.5], next.ring)) continue;
          const p: LF = [q[0] + nx * 0.05, q[1] + ny * 0.05];
          tsv.push(pathOf([at3(p[0], p[1], h1 - BAND, P), at3(p[0], p[1], h0 + GAP, P), at3(foot[0], foot[1], below.h1, P)]));
          feet.push(at3(foot[0], foot[1], below.h1, P));
        }
      }
      if (tsv.length) out.push(lineSvg(tsv.join(""), { tone: "lo", className: "wf-tsv" }) + `<g class="wf-via">${dotsSvg(feet, { size: 0.55, tone: "hi" })}</g>`);
    }
    // the fan-out's drops down this wafer's riser
    const drops = fan?.drops.get(k);
    if (drops) out.push(lineSvg(drops.join(""), { tone: "lo", className: "wf-trace" }));
    // the circuits on the tread
    const fanZone = fan && k >= top - FAN_WAFERS;
    if (next && !fanZone) out.push(treadSvg(side, w, next, P));
    const runs = fan?.runs.get(k);
    if (runs) out.push(lineSvg(runs.join(""), { tone: "lo", className: "wf-trace" }));
    const vias = fan?.vias.get(k);
    if (vias) out.push(`<g class="wf-via">${dotsSvg(vias, { size: 0.55, tone: "hi" })}</g>`);
    if (!next && node) out.push(nodeSvg(node.cl, node.cf, h1, node.half, P));
  }
  if (side === CUT_SIDE) out.push(sectionSvg(side, wafers, P));
  if (fan?.face.length) out.push(lineSvg(fan.face.join(""), { tone: "lo", className: "wf-trace" }) + `<g class="wf-via">${dotsSvg(fan.faceVias, { size: 0.55, tone: "hi" })}</g>`);
  return `<g class="wf-hemi">${out.join("")}</g>`;
}

// ─── the picture ────────────────────────────────────────────────────────────

/** The stem and its cables stand between the hemispheres: seen corner on,
    after the far one and before the near; face on, after both. */
function waferSvg({ view, only, light, tones }: MindOptions): string {
  const P = projOf(view);
  const sides = only ? [only] : sidesFarFirst(view);
  const group = only ? null : stemOf(P);
  const stem = group?.svg ?? "";
  const [a, b] = sides.map((side) => (group?.under.get(side) ?? "") + hemisphere(side, view));
  const apart = Math.abs(depthOf(W(LC, 0, 0), P) - depthOf(W(-LC, 0, 0), P)) > 1;
  const body = only ? a : apart ? a + stem + b : a + b + stem;
  return mindSvg({ view, light, tones, body, css: sheetOf(light, tones.gold, tones.lit, tones.ground), box: boxOf(view) });
}

/** The brain's own box, deepened if a cable hangs past it. */
function boxOf(view: BrainView): BrainIsoBox {
  const P = projOf(view);
  const B = brainIsoBox(view);
  let { x0, x1, y0, y1 } = B;
  for (const p of stemOf(P).pts) {
    const [x, y] = iso(p as Point3, P);
    x0 = Math.min(x0, x - 16);
    x1 = Math.max(x1, x + 16);
    y0 = Math.min(y0, y - 16);
    y1 = Math.max(y1, y + 16);
  }
  return { x0, x1, y0, y1 };
}

export const waferMind: MindDirection = {
  id: "g1",
  round: 4,
  name: "Wafer Mind",
  line: "F1 carried on: a taller node feeding the crown, the right frontal lobe cut open to its cortex, cables hanging from a stem underneath.",
  svg: (o) => waferSvg(o),
  box: (o) => boxOf(o.view),
};

