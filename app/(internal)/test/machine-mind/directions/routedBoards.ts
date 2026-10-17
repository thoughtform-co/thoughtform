import { atHeight, heightRange, hullNormal, lightVector, mindSvg, rampOf, routedOutline, sectionAt, sidesFarFirst, viewVector, type HullShape, type Side, type V3 } from "../hull";
import { LC, projOf } from "@/components/arcs/figures/foundation/brainIso";
import { at3, ccw, corners, depth3, distToPoly, edgeFaces, exitPoint, insetRing, insidePoly, padD, planLine, planPoly, prismSvg, sampleRing, squareOf, type P2, type Scene } from "./routedBoards.parts";
import { lineD, polyD } from "../hull";
import type { MindDirection, MindOptions } from "./types";

/**
 * F2 · Routed Boards (machine-mind round three, 2026-10-17; owner: "the
 * brain is too smooth. I want it to be more blocky so it really feels like
 * it's built out of a motherboard").
 *
 * The brain as a stack of fifteen routed circuit boards. Each board is the
 * brain's level section (the anatomy's temporal drop solved out, the sulci
 * carved deep) redrawn as a routed PCB edge: level, plumb and 45° runs, so
 * every sulcus is a notch cut into the board and the notches stack into
 * the grooves. A board is its FR4 body with a thin copper line round its
 * edge, standing on stand-offs over a dark gap. The boards are spaced along
 * the surface, not by height, so no tread opens into a plateau.
 *
 * Every exposed tread carries D1's circuitry: traces at one pitch running
 * round the tread parallel to its routed edge, ending on vias, more of them
 * where the light falls (density is the shading), and a few SMD parts. Gold
 * buses leave the crown and drop from board to board, a run across each
 * tread, a plated strip down each edge and a via where they land. The near
 * crown carries the core die in its copper ring (the one lit part), its
 * pins fanned out on all four sides; four of its lines run down the front
 * to ONE USB-B receptacle seated on a board's front edge, facing out the way
 * a motherboard's I/O does, so it reads face on and from the corner alike.
 * The far crown carries a smaller unlit package and a pin header.
 */

const SHAPE: HullShape = { brain: 1, sulci: 0.09 };
const LIGHT: HullShape = { brain: 1, fold: 0.25 };
/** How closely a board's routed edge follows the section (keeps the sulcus
    notches), how many boards, where the deck is, the gap between boards. */
const TOL = 2;
const N = 15;
const GAP = 3.2;
/** The thinnest a board and its gap get, over the crown. */
const MIN_STEP = 6.4;
const [FLOOR, CROWN] = heightRange(SHAPE);
/** Where the top board's deck sits: under the very crown, where the section
    still carries the die and its ring. */
const TOP = CROWN - 9;
const RING_STEPS = 240;

/** The boards' tops, floor to deck: equal steps along the surface (the mean
    meridian), so a tread never opens into a plateau over the dome, never a
    step thinner than `MIN_STEP`. */
const LEVELS = (() => {
  const angles = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  const radius = (H: number) => angles.reduce((sum, t) => {
    const p = atHeight(1, t, H, SHAPE).p;
    return sum + Math.hypot(p[0] - LC, p[1]);
  }, 0) / angles.length;
  const n = 300;
  const hs: number[] = [];
  const ds: number[] = [0];
  let r0 = radius(FLOOR);
  for (let i = 0; i <= n; i++) {
    const H = FLOOR + ((TOP - FLOOR) * i) / n;
    hs.push(H);
    if (i) {
      const r = radius(H);
      ds.push(ds[i - 1] + Math.hypot(r - r0, (TOP - FLOOR) / n));
      r0 = r;
    }
  }
  const out: number[] = [];
  let j = 0;
  for (let k = 1; k <= N; k++) {
    const target = (ds[n] * k) / N;
    while (j < n - 1 && ds[j + 1] < target) j++;
    const a = (target - ds[j]) / (ds[j + 1] - ds[j] || 1);
    out.push(hs[j] + (hs[j + 1] - hs[j]) * Math.min(1, a));
  }
  // never thinner than MIN_STEP: push the steps apart from the top down
  out[N - 1] = TOP;
  for (let k = N - 2; k >= 0; k--) out[k] = Math.min(out[k], out[k + 1] - MIN_STEP);
  return out;
})();

interface Board {
  i: number;
  z0: number;
  z1: number;
  /** The routed edge, counter-clockwise, brain axes [l, f]. */
  ring: P2[];
  /** The raw section and the light at each of its points. */
  section: P2[];
  lit: number[];
}

/** The sections and their smooth normals, per hemisphere (the light changes
    with the view, the shape never does). */
const sectionMemo = new Map<Side, { ring: P2[]; section: P2[]; normals: V3[] }[]>();
function sectionsOf(side: Side) {
  const known = sectionMemo.get(side);
  if (known) return known;
  const out = Array.from({ length: N }, (_, i) => {
    const z1 = LEVELS[i];
    const { ring, zs } = sectionAt(side, z1 - 0.3, SHAPE, RING_STEPS);
    const normals = zs.map((z, j) => hullNormal(side, (j / RING_STEPS) * Math.PI * 2, z, LIGHT));
    return { ring: ccw(routedOutline(ring, TOL)), section: ring, normals };
  });
  sectionMemo.set(side, out);
  return out;
}

function boardsOf(side: Side, L: V3): Board[] {
  return sectionsOf(side).map((s, i) => ({
    i,
    z0: i ? LEVELS[i - 1] + GAP : FLOOR,
    z1: LEVELS[i],
    ring: s.ring,
    section: s.section,
    lit: s.normals.map((n) => n[0] * L[0] + n[1] * L[1] + n[2] * L[2]),
  }));
}

/** The light at a plan point of a board: its nearest section point's. */
function litAt(b: Board, p: P2): number {
  let best = Infinity;
  let at = 0;
  for (let j = 0; j < b.section.length; j += 2) {
    const d = (b.section[j][0] - p[0]) ** 2 + (b.section[j][1] - p[1]) ** 2;
    if (d < best) {
      best = d;
      at = j;
    }
  }
  return b.lit[at];
}

// ─── the paint ──────────────────────────────────────────────────────────────

interface Body {
  top: string;
  walls: [string, string];
  edge: string;
}

interface Paint {
  riser: string[];
  top: string;
  edge: string;
  copper: string;
  gap: string;
  post: string[];
  postTop: string;
  trace: string[];
  via: string;
  drill: string;
  pour: string;
  die: Body;
  chip: Body;
  tin: string[];
  tinTop: string;
  mouth: string;
  tongue: string;
  gold: string;
  capRamp: string[];
  smd: string[];
  smdTop: string;
}

function paintOf(light: boolean, tones: MindOptions["tones"]): Paint {
  return light
    ? { riser: rampOf("#958e80", "#dcd6ca", 6), top: "#f1ede5", edge: "#8f887a", copper: "#a88a45", gap: "#6a645a", post: rampOf("#9a9488", "#d5d0c6", 6), postTop: "#c9c4ba", trace: ["#b39c66", "#a08442", tones.gold], via: tones.gold, drill: "#f1ede5", pour: "#dcc690", die: { top: "#d9b65c", walls: ["#b8963e", "#9a7a2c"], edge: tones.lit }, chip: { top: "#e3d8bf", walls: ["#d2c5a7", "#c2b494"], edge: tones.gold }, tin: rampOf("#a7a299", "#e2ded6", 6), tinTop: "#d6d2c9", mouth: "#2a2620", tongue: "#5e5a52", gold: tones.gold, capRamp: rampOf("#7a5f22", "#c9a556", 6), smd: rampOf("#24221e", "#4a463f", 6), smdTop: "#3a3732" }
    : { riser: rampOf("#0f0e0d", "#55514a", 6), top: "#35322c", edge: "#5c574d", copper: "#7a6330", gap: "#070706", post: rampOf("#2c2a26", "#6b665c", 6), postTop: "#5a564e", trace: ["#5e4d27", "#9a7e3e", tones.gold], via: tones.gold, drill: "#35322c", pour: "#5a4823", die: { top: "#c9a04a", walls: ["#6a5424", "#4a3c1c"], edge: tones.lit }, chip: { top: "#1c1a17", walls: ["#15130f", "#0f0e0b"], edge: tones.gold }, tin: rampOf("#4d4a45", "#a29d93", 6), tinTop: "#8f8a80", mouth: "#0b0a09", tongue: "#2a2824", gold: tones.gold, capRamp: rampOf("#5a4519", "#b8933f", 6), smd: rampOf("#0c0b0a", "#2a2824", 6), smdTop: "#1e1c19" };
}

const toneOf = (ramp: string[]) => (lit: number) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(((lit + 0.75) / 1.5) * (ramp.length - 1))))];

// ─── one hemisphere ─────────────────────────────────────────────────────────

/** Traces along a tread: rings inset from the board's edge at one pitch, kept
    where the tread is clear of the board above and lit enough for the ring's
    rank, each run ending on vias. */
const EDGE = 2.4;
const PITCH = 2.6;
const NEED = [-0.3, 0.25, 0.5];
const CLEAR = 2.2;

function treadTraces(b: Board, above: Board, keep: (p: P2) => boolean): { runs: P2[][]; lit: number[][] } {
  const runs: P2[][] = [];
  const lits: number[][] = [];
  NEED.forEach((need, k) => {
    const d = EDGE + k * PITCH;
    const ring = insetRing(b.ring, d);
    const pts = sampleRing(ring, 1.2);
    let run: P2[] = [];
    let lit: number[] = [];
    const flush = () => {
      if (run.length > 10) {
        runs.push(run);
        lits.push(lit);
      }
      run = [];
      lit = [];
    };
    // start where the ring is broken, so no run is split at the seam
    let start = 0;
    const ok = (p: P2) => {
      if (!insidePoly(p, b.ring) || distToPoly(p, b.ring) < d - 0.4) return -2;
      if (insidePoly(p, above.ring) || distToPoly(p, above.ring) < CLEAR) return -2;
      if (!keep(p)) return -2;
      const l = litAt(b, p);
      return l >= need ? l : -2;
    };
    const flags = pts.map(ok);
    const firstBad = flags.findIndex((f) => f === -2);
    if (firstBad < 0) start = 0;
    else start = firstBad;
    for (let n = 0; n <= pts.length; n++) {
      const j = (start + n) % pts.length;
      if (flags[j] !== -2 && n < pts.length) {
        run.push(pts[j]);
        lit.push(flags[j]);
      } else flush();
    }
    flush();
  });
  return { runs, lit: lits };
}

// ─── the parts ──────────────────────────────────────────────────────────────

/** A package on a board's top, in plan: centre, half-width, pins per side at
    a pitch, splayed to `spread` and fanned out to vias at two depths. */
interface Package {
  c: P2;
  half: number;
  pins: number;
  pitch: number;
  spread: number;
  fan: [number, number];
  h: number;
}

/** A package: its fan-out on the board (each pin's trace splays and ends on
    a via, the vias in two staggered rows), then the body on gull-wing pins,
    the house's one notch cut from its top's far corner. */
function packageSvg(S: Scene, p: Package, z: number, body: Body, paint: Paint, lit: boolean): string {
  const { c, half: D, pins: N, pitch, spread, fan, h } = p;
  const dirs: P2[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const local = (d: P2, out: number, along: number): P2 => [c[0] + d[0] * out - d[1] * along, c[1] + d[1] * out + d[0] * along];
  const traces: string[] = [];
  const pads: string[] = [];
  const drills: string[] = [];
  for (const d of dirs) {
    for (let i = 0; i < N; i++) {
      const p0 = (i - (N - 1) / 2) * pitch;
      const p1 = (i - (N - 1) / 2) * spread;
      const bend = D + 3.6;
      const end = D + fan[i % 2];
      traces.push(planLine(S, [local(d, D + 2.6, p0), local(d, bend, p0), local(d, bend + Math.abs(p1 - p0), p1), local(d, end, p1)], z));
      const v = local(d, end + 1, p1);
      pads.push(padD(S, v, z, 1.05));
      drills.push(padD(S, v, z, 0.4, 8));
    }
  }
  const out: string[] = [`<path class="f2-trace" stroke="${paint.trace[2]}" d="${traces.join("")}"/>`, `<path fill="${paint.via}" d="${pads.join("")}"/><path fill="${paint.drill}" d="${drills.join("")}"/>`];
  const top = z + h;
  const legsFar: string[] = [];
  const legsNear: string[] = [];
  for (const d of dirs) {
    const facing = d[1] * S.toward[0] - d[0] * S.toward[1] > 0;
    const legs: string[] = [];
    for (let i = 0; i < N; i++) {
      const along = (i - (N - 1) / 2) * pitch;
      const [a0, a1, a2, a3] = [local(d, D, along), local(d, D + 1, along), local(d, D + 1.8, along), local(d, D + 2.6, along)];
      legs.push(lineD([at3(S, a0[0], a0[1], top - 1.2), at3(S, a1[0], a1[1], top - 1.2), at3(S, a2[0], a2[1], z + 0.2), at3(S, a3[0], a3[1], z + 0.1)]));
    }
    (facing ? legsNear : legsFar).push(legs.join(""));
  }
  const notch = Math.max(2, D * 0.35);
  const ring: P2[] = [
    [c[0] - D, c[1] - D],
    [c[0] + D, c[1] - D],
    [c[0] + D, c[1] + D - notch],
    [c[0] + D - notch, c[1] + D],
    [c[0] - D, c[1] + D],
  ];
  const leg = `fill="none" stroke="${paint.gold}" stroke-width=".55" stroke-linecap="butt"`;
  out.push(`<path ${leg} d="${legsFar.join("")}"/>`);
  out.push(prismSvg(S, ring, z, top, { riser: (l) => body.walls[l > 0 ? 0 : 1], top: body.top, edge: body.edge, edgeWidth: lit ? 0.6 : 0.45 }));
  const lid = ring.map(([l, f]): P2 => [c[0] + (l - c[0]) * 0.7, c[1] + (f - c[1]) * 0.7]);
  out.push(`<path fill="none" stroke="${body.edge}" stroke-width=".3" stroke-opacity=".55" d="${planPoly(S, lid, top)}"/>`);
  out.push(`<path ${leg} d="${legsNear.join("")}"/>`);
  return out.join("");
}

/** The USB-B receptacle: a tin shell seated on a board's front edge, its plug
    face square with the two top corners cut, the plastic tongue inside it
    with four gold contacts under it. Plan: centre l, the face's f; z the
    board's top. */
const PORT = { w: 12, h: 10.5, d: 13, wall: 1.3, cut: 2.6, over: 1.5 };
function usbBSvg(S: Scene, l: number, fFace: number, z: number, paint: Paint): string {
  const { w, h, d, wall, cut } = PORT;
  const ring: P2[] = [
    [l - w / 2, fFace - d],
    [l + w / 2, fFace - d],
    [l + w / 2, fFace],
    [l - w / 2, fFace],
  ];
  const out: string[] = [prismSvg(S, ring, z, z + h, { riser: toneOf(paint.tin), top: paint.tinTop, edge: paint.edge, edgeWidth: 0.35 })];
  // the face, a hair proud of the shell: (x along l, y up)
  const F = (x: number, y: number) => at3(S, l + x, fFace + 0.05, z + y);
  const x0 = -w / 2 + wall;
  const x1 = w / 2 - wall;
  const y0 = wall;
  const y1 = h - wall;
  out.push(`<path fill="${paint.mouth}" d="${polyD([F(x0, y0), F(x1, y0), F(x1, y1 - cut), F(x1 - cut, y1), F(x0 + cut, y1), F(x0, y1 - cut)])}"/>`);
  const tx = w * 0.27;
  const ty0 = h * 0.47;
  const ty1 = y1 - 1.1;
  out.push(`<path fill="${paint.tongue}" d="${polyD([F(-tx, ty0), F(tx, ty0), F(tx, ty1), F(-tx, ty1)])}"/>`);
  const contacts: string[] = [];
  for (let k = 0; k < 4; k++) {
    const cx = -tx + ((k + 0.5) * 2 * tx) / 4;
    contacts.push(polyD([F(cx - 0.55, ty0 - 0.9), F(cx + 0.55, ty0 - 0.9), F(cx + 0.55, ty0), F(cx - 0.55, ty0)]));
  }
  out.push(`<path fill="${paint.gold}" d="${contacts.join("")}"/>`);
  return out.join("");
}

/** A bus: `n` traces at one pitch leaving `from` along `dir`, crossing each
    board's tread to its edge, down the edge (a plated strip on the riser)
    and onto the board below, from the board at `top` down to `to`, where
    it ends on vias (or at `stop`, an along-distance, under a part). */
interface Bus {
  from: P2;
  dir: P2;
  n: number;
  pitch: number;
  top: number;
  to: number;
  /** Starts in copper (no via there). */
  copperStart?: boolean;
  stop?: number;
}

interface BusDraw {
  runs: Map<number, P2[][]>;
  vias: Map<number, P2[]>;
  strips: Map<number, P2[]>;
}

function busDraw(boards: Board[], buses: Bus[]): BusDraw {
  const runs = new Map<number, P2[][]>();
  const vias = new Map<number, P2[]>();
  const strips = new Map<number, P2[]>();
  const push = <T,>(m: Map<number, T[]>, k: number, v: T) => {
    const list = m.get(k);
    if (list) list.push(v);
    else m.set(k, [v]);
  };
  for (const bus of buses) {
    const perp: P2 = [-bus.dir[1], bus.dir[0]];
    for (let t = 0; t < bus.n; t++) {
      const o = (t - (bus.n - 1) / 2) * bus.pitch;
      const origin: P2 = [bus.from[0] + perp[0] * o, bus.from[1] + perp[1] * o];
      const along = (p: P2) => (p[0] - origin[0]) * bus.dir[0] + (p[1] - origin[1]) * bus.dir[1];
      const atS = (s: number): P2 => [origin[0] + bus.dir[0] * s, origin[1] + bus.dir[1] * s];
      if (!bus.copperStart) push(vias, bus.top, origin);
      for (let i = bus.top; i >= bus.to; i--) {
        const b = boards[i];
        const start = i === bus.top ? origin : exitPoint(boards[i + 1].ring, origin, bus.dir);
        const edge = exitPoint(b.ring, origin, bus.dir);
        if (!start || !edge) break;
        const last = i === bus.to;
        const s0 = along(start);
        const s1 = last ? (bus.stop ?? along(edge) - 2.4) : along(edge);
        if (s1 > s0 + 0.5) push(runs, i, [atS(s0), atS(s1)]);
        // where the bus lands on a lower board it drops through a plated via
        if (i !== bus.top && s1 > s0 + 2.5) push(vias, i, atS(s0 + 1.4));
        if (last) {
          if (bus.stop === undefined) push(vias, i, atS(s1));
        } else push(strips, i, edge);
      }
    }
  }
  return { runs, vias, strips };
}

/** Whether a plan point lies in a bus's corridor (the tread traces break
    round it). */
const inCorridor = (bus: Bus, p: P2) => {
  const v: P2 = [p[0] - bus.from[0], p[1] - bus.from[1]];
  const along = v[0] * bus.dir[0] + v[1] * bus.dir[1];
  const across = Math.abs(v[0] * -bus.dir[1] + v[1] * bus.dir[0]);
  return along > -3 && across < ((bus.n - 1) / 2) * bus.pitch + 2.2;
};

/** A small SMD part (a resistor, a capacitor): a body with gold end caps,
    long along `dir` in plan. */
function smdSvg(S: Scene, c: P2, dir: P2, z: number, paint: Paint): string {
  const [len, wid, h, cap] = [3.4, 1.7, 1.1, 0.7];
  const n: P2 = [-dir[1], dir[0]];
  const box = (s0: number, s1: number): P2[] => [
    [c[0] + dir[0] * s0 - n[0] * wid / 2, c[1] + dir[1] * s0 - n[1] * wid / 2],
    [c[0] + dir[0] * s1 - n[0] * wid / 2, c[1] + dir[1] * s1 - n[1] * wid / 2],
    [c[0] + dir[0] * s1 + n[0] * wid / 2, c[1] + dir[1] * s1 + n[1] * wid / 2],
    [c[0] + dir[0] * s0 + n[0] * wid / 2, c[1] + dir[1] * s0 + n[1] * wid / 2],
  ];
  const gold = { riser: toneOf(paint.capRamp), top: paint.gold };
  // the caps far and near in depth order round the body
  const a = box(-len / 2, -len / 2 + cap);
  const b = box(len / 2 - cap, len / 2);
  const da = depth3(S, a[0][0], a[0][1], z);
  const db = depth3(S, b[0][0], b[0][1], z);
  const [far, near] = da < db ? [a, b] : [b, a];
  return prismSvg(S, far, z, z + h, gold) + prismSvg(S, box(-len / 2 + cap, len / 2 - cap), z, z + h * 0.92, { riser: toneOf(paint.smd), top: paint.smdTop }) + prismSvg(S, near, z, z + h, gold);
}

/** A pin header: a black block, `cols` × 2 gold pins standing out of it,
    long along f. */
function headerSvg(S: Scene, c: P2, cols: number, z: number, paint: Paint): string {
  const pitch = 2.1;
  const halfL = (cols * pitch) / 2;
  const block: P2[] = [
    [c[0] - pitch, c[1] - halfL],
    [c[0] + pitch, c[1] - halfL],
    [c[0] + pitch, c[1] + halfL],
    [c[0] - pitch, c[1] + halfL],
  ];
  const h = 2.4;
  const out: string[] = [prismSvg(S, block, z, z + h, { riser: toneOf(paint.smd), top: paint.smdTop, edge: paint.edge, edgeWidth: 0.3 })];
  const pins: { d: number; svg: string }[] = [];
  for (let i = 0; i < cols; i++) {
    for (const side of [-0.5, 0.5]) {
      const pl = c[0] + side * pitch;
      const pf = c[1] - halfL + (i + 0.5) * pitch;
      const sq: P2[] = [
        [pl - 0.35, pf - 0.35],
        [pl + 0.35, pf - 0.35],
        [pl + 0.35, pf + 0.35],
        [pl - 0.35, pf + 0.35],
      ];
      pins.push({ d: depth3(S, pl, pf, z + h), svg: prismSvg(S, sq, z + h, z + h + 2.6, { riser: toneOf(paint.capRamp), top: paint.gold }) });
    }
  }
  pins.sort((p, q) => p.d - q.d);
  return out.join("") + pins.map((p) => p.svg).join("");
}

const DIE_SIDE: Side = -1;
const DIE_A = 12.5;
const DIE_F = 4;
const RING = { half: 19, cut: 5, window: 14 };
const DIE: Omit<Package, "c"> = { half: 4.6, pins: 4, pitch: 2, spread: 2.8, fan: [5, 7.5], h: 3 };
const CHIP: Omit<Package, "c"> = { half: 6, pins: 4, pitch: 2.2, spread: 3, fan: [6, 8.5], h: 2.6 };
const CHIP_A = 10;
const CHIP_F = 8;
/** The pin header on the far crown, behind its package. */
const HEADER_A = 10;
const HEADER_F = -36;

function hemisphereSvg(side: Side, o: MindOptions, paint: Paint): string {
  const P = projOf(o.view);
  const L = lightVector(o.view);
  const S: Scene = { P, toward: viewVector(o.view), light: L };
  const boards = boardsOf(side, L);
  const topB = boards[N - 1];
  const riser = toneOf(paint.riser);
  const post = toneOf(paint.post);
  const die = side === DIE_SIDE;
  const lOf = (a: number) => side * (LC + a);
  const centre: P2 = die ? [lOf(DIE_A), DIE_F] : [lOf(CHIP_A), CHIP_F];
  // the buses: on the core's crown out of its ring on the lit side and the
  // back, and the port's four lines to the front; on the far crown out of
  // the package's landing to the front and the back
  const buses: Bus[] = [];
  let port: { l: number; f: number; board: number } | null = null;
  if (die) {
    const reach = RING.half - 2;
    buses.push({ from: [centre[0] + side * reach, centre[1]], dir: [side, 0], n: 3, pitch: PITCH, top: N - 1, to: 8, copperStart: true });
    const k = Math.SQRT1_2;
    buses.push({ from: [centre[0] + side * reach * k, centre[1] - reach * k], dir: [side * k, -k], n: 3, pitch: PITCH, top: N - 1, to: 9, copperStart: true });
    // the port: on the highest board whose front tread is deep enough for it
    for (let i = N - 3; i >= 6 && !port; i--) {
      const e = exitPoint(boards[i].ring, centre, [0, 1]);
      const e2 = exitPoint(boards[i + 1].ring, centre, [0, 1]);
      if (e && e2 && e[1] - e2[1] >= PORT.d + 1) port = { l: centre[0], f: e[1] + PORT.over, board: i };
    }
    if (port) buses.push({ from: [centre[0], centre[1] + reach], dir: [0, 1], n: 4, pitch: 2, top: N - 1, to: port.board, copperStart: true, stop: port.f - PORT.d + 2 - (centre[1] + reach) });
  } else {
    const reach = CHIP.half + CHIP.fan[1] + 5;
    buses.push({ from: [centre[0], centre[1] + reach], dir: [0, 1], n: 3, pitch: PITCH, top: N - 1, to: 9 });
    buses.push({ from: [centre[0], centre[1] - reach], dir: [0, -1], n: 3, pitch: PITCH, top: N - 1, to: 10 });
  }
  const bd = busDraw(boards, buses);
  const out: string[] = [];
  for (const b of boards) {
    const below = boards[b.i - 1];
    if (below) {
      // the gap: a shadow under the board, and its stand-offs
      out.push(prismSvg(S, insetRing(b.ring, 1.6), below.z1, b.z0, { riser: () => paint.gap, top: paint.gap }));
      for (const p of sampleRing(insetRing(b.ring, 4), 34)) {
        const oct: P2[] = Array.from({ length: 8 }, (_, k) => [p[0] + 1.1 * Math.cos((k / 8) * Math.PI * 2), p[1] + 1.1 * Math.sin((k / 8) * Math.PI * 2)]);
        out.push(prismSvg(S, oct, below.z1, b.z0, { riser: post, top: paint.postTop }));
      }
    }
    out.push(prismSvg(S, b.ring, b.z0, b.z1, { riser, top: paint.top, edge: paint.edge, edgeWidth: 0.35, band: { z: b.z1 - 0.8, stroke: paint.copper, width: 0.5 } }));
    // the strips down this board's edge and across the gap under it
    const sd: string[] = [];
    for (const e of bd.strips.get(b.i) ?? []) {
      if (!edgeFaces(S, b.ring, e)) continue;
      sd.push(lineD([at3(S, e[0], e[1], b.z1), at3(S, e[0], e[1], below ? below.z1 : b.z0)]));
    }
    const tiers: string[][] = paint.trace.map(() => []);
    const pads: P2[] = [];
    const above = boards[b.i + 1];
    if (above) {
      const clear = (p: P2) => !buses.some((bus) => b.i >= bus.to && b.i <= bus.top && inCorridor(bus, p)) && !(port && b.i === port.board && Math.abs(p[0] - port.l) < PORT.w / 2 + 2 && p[1] > port.f - PORT.d - 2);
      const { runs, lit } = treadTraces(b, above, clear);
      runs.forEach((run, r) => {
        const mean = lit[r].reduce((s2, v) => s2 + v, 0) / lit[r].length;
        tiers[mean < 0.15 ? 0 : mean < 0.45 ? 1 : 2].push(planLine(S, corners(run), b.z1));
        pads.push(run[0], run[run.length - 1]);
      });
    }
    for (const run of bd.runs.get(b.i) ?? []) tiers[2].push(planLine(S, run, b.z1));
    pads.push(...(bd.vias.get(b.i) ?? []));
    tiers.forEach((d, k) => out.push(`<path class="f2-trace" stroke="${paint.trace[k]}" d="${d.join("")}"/>`));
    if (sd.length) out.push(`<path class="f2-trace" stroke="${paint.trace[2]}" d="${sd.join("")}"/>`);
    out.push(`<path fill="${paint.via}" d="${pads.map((p) => padD(S, p, b.z1, 1.05)).join("")}"/><path fill="${paint.drill}" d="${pads.map((p) => padD(S, p, b.z1, 0.4, 8)).join("")}"/>`);
    // a few SMD parts just inside the bundles, where the tread is wide and lit
    if (above && b.i >= 5) {
      const lane = insetRing(b.ring, EDGE + NEED.length * PITCH + 1.4);
      const parts: { d: number; svg: string }[] = [];
      let since = 0;
      const pts = sampleRing(lane, 1.5);
      for (let j = 0; j < pts.length && parts.length < 3; j++) {
        since += 1.5;
        const p = pts[j];
        const q = pts[(j + 1) % pts.length];
        if (since < 26) continue;
        if (!insidePoly(p, b.ring) || distToPoly(p, b.ring) < EDGE + NEED.length * PITCH + 1) continue;
        if (insidePoly(p, above.ring) || distToPoly(p, above.ring) < CLEAR + 3) continue;
        if (buses.some((bus) => b.i >= bus.to && inCorridor(bus, p)) || litAt(b, p) < 0.35) continue;
        const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        parts.push({ d: depth3(S, p[0], p[1], b.z1), svg: smdSvg(S, p, [(q[0] - p[0]) / len, (q[1] - p[1]) / len], b.z1, paint) });
        since = 0;
      }
      parts.sort((x, y) => x.d - y.d);
      out.push(...parts.map((x) => x.svg));
    }
  }
  // the crown: the core die in its copper ring, or the far package
  if (die) {
    const outer = squareOf(centre, RING.half, RING.cut);
    const inner = squareOf(centre, RING.window, 0).reverse();
    out.push(`<path fill="${paint.pour}" fill-rule="evenodd" d="${planPoly(S, outer, topB.z1)}${planPoly(S, inner, topB.z1)}"/>`);
    const fence: P2[] = [];
    const r = (RING.half + RING.window) / 2;
    for (let s2 = -r + 4; s2 <= r - 4; s2 += 4.5) fence.push([centre[0] + s2, centre[1] - r], [centre[0] + s2, centre[1] + r], [centre[0] - r, centre[1] + s2], [centre[0] + r, centre[1] + s2]);
    const keep = fence.filter((p) => !buses.some((bus) => inCorridor(bus, p)));
    out.push(`<path fill="${paint.via}" d="${keep.map((p) => padD(S, p, topB.z1, 0.85)).join("")}"/><path fill="${paint.drill}" d="${keep.map((p) => padD(S, p, topB.z1, 0.32, 8)).join("")}"/>`);
    out.push(packageSvg(S, { c: centre, ...DIE }, topB.z1, paint.die, paint, true));
    if (port) out.push(usbBSvg(S, port.l, port.f, boards[port.board].z1, paint));
  } else {
    out.push(packageSvg(S, { c: centre, ...CHIP }, topB.z1, paint.chip, paint, false));
    out.push(headerSvg(S, [lOf(HEADER_A), HEADER_F], 6, topB.z1, paint));
  }
  return `<g class="f2">${out.join("")}</g>`;
}

function svg(o: MindOptions): string {
  const paint = paintOf(o.light, o.tones);
  const sides = o.only ? [o.only] : sidesFarFirst(o.view);
  const body = sides.map((s) => hemisphereSvg(s, o, paint)).join("");
  const css = `.f2 path{vector-effect:none}.f2-trace{fill:none;stroke-width:.8;stroke-linecap:butt;stroke-linejoin:miter}`;
  return mindSvg({ view: o.view, light: o.light, tones: o.tones, body, css });
}


export const routedBoards: MindDirection = {
  id: "f2",
  round: 3,
  name: "Routed Boards",
  line: "The brain as a stack of routed circuit boards on stand-offs, each tread populated with traces and parts, the core die on the crown and one USB-B port at the front.",
  svg,
};
