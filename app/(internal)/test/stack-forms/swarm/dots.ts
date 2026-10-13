/* S4 · SWARM, as arithmetic. PURE: no React, no DOM.

   Everything on screen is a square dot on one lattice. The lattice is the
   isometric, rounded to whole device pixels: one step along a plate's x is
   (a, b) px and one along its y is (-a, b), with (a, b) one of 9:5, 7:4 or
   5:3 (29, 30, 31 degrees), so a site sampled at a fixed step in plate
   space always lands on a whole pixel and a row of dots is a row of the
   plate. A step of z is b px, half a site. The coarsest lattice that still
   gives a plate four sites a unit is the one used, so dots stay the size of
   the references' (4 to 5 px on a 10 px pitch) on a large screen and the
   form, not the dot, shrinks on a small one.

   The three plates are three KINDS of population, not three colours:
     team    a loose field, thickening into the four workstreams; it drifts
     layer   every site, in order; dot size swells to a white-hot core
     agents  a sparse board, dense chip and modules, dots strung on traces
   and dots fall from plate to plate across the gaps. */

import { bayer, type Box, hash2, PLATES, type Pose, poseAt, SIDE, type Tone } from "../model";

/* -- paint ----------------------------------------------------------------- */

export const STYLE = {
  bed: 0,
  lead: 1,
  teamDim: 2,
  team: 3,
  teamLit: 4,
  layerDim: 5,
  layer: 6,
  layerLit: 7,
  layerHot: 8,
  agentsDim: 9,
  agents: 10,
  agentsLit: 11,
  agentsHot: 12,
  fallGreen: 13,
  fallGold: 14,
  spark: 15,
} as const;

/** Each style as a brand tone at a share of itself over the ground. */
export const STYLE_PAINT: readonly (readonly [Tone, number])[] = [
  ["bone", 0.24],
  ["bone", 0.34],
  ["green", 0.5],
  ["green", 0.78],
  ["green", 1],
  ["gold", 0.44],
  ["gold", 0.8],
  ["gold", 1],
  ["bone", 1],
  ["bone", 0.26],
  ["bone", 0.52],
  ["bone", 0.82],
  ["bone", 1],
  ["green", 1],
  ["gold", 1],
  ["bone", 1],
];

/* -- the lattice ----------------------------------------------------------- */

export interface Lattice {
  /** One site step along a plate's x, in grains. */
  a: number;
  b: number;
  /** A grain, in device px: the device pixel ratio, rounded. */
  g: number;
  /** Sites a unit. */
  n: number;
  /** Sites a side. */
  m: number;
  /** The plates' back corner at the layer's floor, in device px. */
  ox: number;
  oy: number;
  w: number;
  h: number;
}

const LATTICES: readonly (readonly [number, number])[] = [
  [9, 5],
  [7, 4],
  [5, 3],
];

/** Half-site steps of z: one is `b` grains on screen. */
export const kOf = (L: Lattice, z: number) => Math.round(z * 2 * L.n);
export const px = (L: Lattice, i: number, j: number) => L.ox + (i - j) * L.a * L.g;
export const py = (L: Lattice, i: number, j: number, k: number) => L.oy + (i + j - k) * L.b * L.g;
/** A plate's lift as a screen offset, snapped to a row of the lattice. */
export const liftPx = (L: Lattice, lift: number) => -kOf(L, lift) * L.b * L.g;

/** Dot sizes, in device px: tiers 0..3 from a speck to one that touches the
    next row; 4 is the hot one, wide enough to merge with its neighbours. */
export function tierSizes(L: Lattice): number[] {
  const { a, b, g } = L;
  return [
    Math.max(1, b - 3) * g,
    Math.max(2, b - 2) * g,
    Math.max(2, b - 1) * g,
    b * g,
    (a - 2) * g,
  ];
}

const OPENED = poseAt(1);

export interface FitOptions {
  /** The lattices to try, coarsest first (default: all three). */
  lattices?: readonly (readonly [number, number])[];
  /** Clear height to keep above and below the stack, in units (default 0). */
  margin?: number;
  /** The canvas's own edge margin, as a share of its height (default 0.055). */
  pad?: number;
}

/** The lattice that seats the OPENED stack in a `w` by `h` canvas (device
    px), so opening the stack never rescales it. */
export function fitLattice(w: number, h: number, dpr: number, o: FitOptions = {}): Lattice {
  const g = Math.max(1, Math.round(dpr));
  /* agents' floor to the team's top, in units, and the plate's own depth */
  const rise = 2 * OPENED.pitch + PLATES[0].top + 2 * (o.margin ?? 0);
  const padY = Math.max(36 * g, Math.round(h * (o.pad ?? 0.055)));
  let pick: [number, number, number] = [5, 3, 2];
  for (const [a, b] of o.lattices ?? LATTICES) {
    const tall = Math.floor((h - 2 * padY) / ((rise * 2 * b + 2 * SIDE * b) * g));
    const wide = Math.floor((w * 0.44) / (2 * SIDE * a * g));
    const n = Math.min(tall, wide);
    pick = [a, b, Math.max(2, n)];
    if (n >= 4) break;
  }
  const [a, b, n] = pick;
  const L: Lattice = { a, b, g, n, m: SIDE * n, ox: Math.round(w / 2), oy: 0, w, h };
  /* centre the opened stack's own height on the canvas */
  const top = liftPx(L, OPENED.lift[0]) - kOf(L, PLATES[0].top) * b * g;
  const bottom = 2 * L.m * b * g + liftPx(L, OPENED.lift[2]);
  L.oy = Math.round(h / 2 - (top + bottom) / 2);
  return L;
}

/* -- populations ----------------------------------------------------------- */

interface Raw {
  x: number;
  y: number;
  tier: number;
  style: number;
  /** Drift radius in device px along the plate (0 holds still). */
  amp: number;
  phase: number;
  /** Radians a second. */
  rate: number;
}

/** A population: dots packed by style, so a frame changes paint rarely. */
export interface Pop {
  count: number;
  x: Int32Array;
  y: Int32Array;
  tier: Uint8Array;
  amp: Float32Array;
  phase: Float32Array;
  rate: Float32Array;
  runs: { style: number; from: number; to: number }[];
}

function pack(raw: Raw[]): Pop {
  const sorted = raw
    .map((d, at) => ({ d, at }))
    .sort((p, q) => p.d.style - q.d.style || p.at - q.at)
    .map((p) => p.d);
  const n = sorted.length;
  const pop: Pop = {
    count: n,
    x: new Int32Array(n),
    y: new Int32Array(n),
    tier: new Uint8Array(n),
    amp: new Float32Array(n),
    phase: new Float32Array(n),
    rate: new Float32Array(n),
    runs: [],
  };
  sorted.forEach((d, i) => {
    pop.x[i] = d.x;
    pop.y[i] = d.y;
    pop.tier[i] = d.tier;
    pop.amp[i] = d.amp;
    pop.phase[i] = d.phase;
    pop.rate[i] = d.rate;
    const last = pop.runs[pop.runs.length - 1];
    if (last && last.style === d.style) last.to = i + 1;
    else pop.runs.push({ style: d.style, from: i, to: i + 1 });
  });
  return pop;
}

const still = (x: number, y: number, tier: number, style: number): Raw => ({
  x,
  y,
  tier,
  style,
  amp: 0,
  phase: 0,
  rate: 0,
});

/** A feature's footprint in sites. */
export interface Cells {
  i0: number;
  i1: number;
  j0: number;
  j1: number;
}
export const cellsOf = (L: Lattice, b: Box): Cells => ({
  i0: Math.round(b.x0 * L.n),
  i1: Math.round(b.x1 * L.n),
  j0: Math.round(b.y0 * L.n),
  j1: Math.round(b.y1 * L.n),
});
export const inside = (c: Cells, i: number, j: number) =>
  i >= c.i0 && i <= c.i1 && j >= c.j0 && j <= c.j1;
const onRim = (c: Cells, i: number, j: number) =>
  inside(c, i, j) && (i === c.i0 || i === c.i1 || j === c.j0 || j === c.j1);

/** The silhouette of a box of sites from row `k0` up to `k1`, as x, y pairs. */
export function outline(L: Lattice, c: Cells, k0: number, k1: number): Int32Array {
  /* a grain of slack all round, so a dot on the rim is covered whole */
  const e = L.b * L.g;
  const p = (i: number, j: number, k: number, dx: number, dy: number) => [
    px(L, i, j) + dx,
    py(L, i, j, k) + dy,
  ];
  return Int32Array.from(
    [
      p(c.i0, c.j0, k1, 0, -e),
      p(c.i1, c.j0, k1, e * 2, 0),
      p(c.i1, c.j0, k0, e * 2, 0),
      p(c.i1, c.j1, k0, 0, e),
      p(c.i0, c.j1, k0, -e * 2, 0),
      p(c.i0, c.j1, k1, -e * 2, 0),
    ].flat()
  );
}

/** The two walls a viewer sees, as rows of dots at the given heights. */
function walls(
  L: Lattice,
  c: Cells,
  rows: readonly number[],
  left: readonly [number, number],
  right: readonly [number, number],
  out: Raw[]
) {
  for (const k of rows) {
    for (let i = c.i0; i <= c.i1; i++)
      out.push(still(px(L, i, c.j1), py(L, i, c.j1, k), left[0], left[1]));
    for (let j = c.j0; j < c.j1; j++)
      out.push(still(px(L, c.i1, j), py(L, c.i1, j, k), right[0], right[1]));
  }
}

const TAU = Math.PI * 2;
const WHOLE: Cells = { i0: 0, i1: 0, j0: 0, j1: 0 };

/* the team: a loose field that thickens into four workstreams, and drifts */
function teamPop(L: Lattice): Pop {
  const plate = PLATES[0];
  const all: Cells = { ...WHOLE, i1: L.m, j1: L.m };
  const kt = kOf(L, plate.top);
  const tiles = plate.features.filter((f) => f.kind === "tile").map((f) => cellsOf(L, f.box));
  const rail = cellsOf(L, plate.features.find((f) => f.kind === "rail")!.box);
  const out: Raw[] = [];
  const rows: number[] = [];
  for (let k = 0; k < kt; k += 2) rows.push(k);
  walls(L, all, rows, [1, STYLE.team], [1, STYLE.teamDim], out);

  const reach = L.a * L.g;
  for (let i = 0; i <= L.m; i++)
    for (let j = 0; j <= L.m; j++) {
      const x = px(L, i, j);
      const y = py(L, i, j, kt);
      const h = hash2(i, j, 11);
      const h2 = hash2(i, j, 29);
      const tile = tiles.find((c) => inside(c, i, j));
      if (onRim(all, i, j)) out.push(still(x, y, 1, STYLE.team));
      else if (tile) {
        /* a workstream: a crowd, packed at its middle and thinning to its
           edge, every one of them breathing a little */
        const d = Math.max(
          Math.abs(i - (tile.i0 + tile.i1) / 2) / ((tile.i1 - tile.i0) / 2),
          Math.abs(j - (tile.j0 + tile.j1) / 2) / ((tile.j1 - tile.j0) / 2)
        );
        if (h < 0.98 - 0.56 * d) {
          const big = d < 0.45 || h2 < 0.22;
          out.push({
            x,
            y,
            tier: big ? 3 : 2,
            style: d < 0.62 ? STYLE.teamLit : STYLE.team,
            amp: (0.12 + 0.3 * h2) * reach * (0.5 + d),
            phase: h * 97 * TAU,
            rate: TAU / (7 + 7 * h2),
          });
        }
      } else if (inside(rail, i, j)) {
        /* the tools they have: a rule of ticks along one edge */
        if ((j - rail.j0) % 3 === 0) out.push(still(x, y, 1, STYLE.team));
      } else if (h < 0.15) {
        /* the open floor: a few, wandering further */
        out.push({
          x,
          y,
          tier: h2 < 0.5 ? 1 : 0,
          style: STYLE.teamDim,
          amp: (0.5 + 0.7 * h2) * reach,
          phase: h * 131 * TAU,
          rate: TAU / (10 + 9 * h2),
        });
      }
    }
  return pack(out);
}

/* the layer: every site, in order; size swells to a white-hot core */
function layerPop(L: Lattice): Pop {
  const plate = PLATES[1];
  const all: Cells = { ...WHOLE, i1: L.m, j1: L.m };
  const kt = kOf(L, plate.top);
  const out: Raw[] = [];
  /* three strata on the walls: a band of rows each, dark between them */
  const rows: number[] = [];
  for (const b of plate.body) {
    const mid = Math.min(kt - 1, kOf(L, (b.z0 + b.z1) / 2));
    rows.push(mid);
    if (L.n >= 4 && mid + 1 < kt) rows.push(mid + 1);
  }
  walls(L, all, [...new Set(rows)], [2, STYLE.layerLit], [1, STYLE.layer], out);

  const c = SIDE / 2;
  for (let i = 0; i <= L.m; i++)
    for (let j = 0; j <= L.m; j++) {
      const x = px(L, i, j);
      const y = py(L, i, j, kt);
      const r = Math.hypot(i / L.n - c, j / L.n - c);
      if (onRim(all, i, j)) out.push(still(x, y, 2, STYLE.layerLit));
      else if (r < 0.85 || (r < 1.55 && bayer(i, j) < (1.55 - r) / 0.7))
        out.push(still(x, y, 4, STYLE.layerHot));
      else if (r < 2.05) out.push(still(x, y, 3, STYLE.layerLit));
      else if (r >= 2.6 && r < 2.95) out.push(still(x, y, 3, STYLE.layerLit));
      else if (r < 3.5) out.push(still(x, y, 2, STYLE.layer));
      else out.push(still(x, y, 1, STYLE.layer));
    }
  return pack(out);
}

/** Lattice sites along a trace, vertex to vertex. */
function traceSites(L: Lattice, pts: readonly (readonly [number, number])[]): [number, number][] {
  const snap = (v: number) => Math.round(v * L.n);
  const out: [number, number][] = [];
  for (let s = 1; s < pts.length; s++) {
    const [i0, j0] = [snap(pts[s - 1][0]), snap(pts[s - 1][1])];
    const [i1, j1] = [snap(pts[s][0]), snap(pts[s][1])];
    const steps = Math.max(Math.abs(i1 - i0), Math.abs(j1 - j0));
    for (let q = s === 1 ? 0 : 1; q <= steps; q++)
      out.push([
        Math.round(i0 + ((i1 - i0) * q) / Math.max(1, steps)),
        Math.round(j0 + ((j1 - j0) * q) / Math.max(1, steps)),
      ]);
  }
  return out;
}

export interface Block {
  cells: Cells;
  /** The row its top sits on. */
  k: number;
  mask: Int32Array;
  pop: Pop;
}

export interface Runner {
  /** Screen points of the trace, chip end first. */
  x: Int32Array;
  y: Int32Array;
  phase: number;
  /** Sites a second. */
  rate: number;
}

/* the agents: a sparse board, a dense chip and four modules, dots on traces */
function agentsPop(L: Lattice): { base: Pop; blocks: Block[]; runners: Runner[]; kb: number } {
  const plate = PLATES[2];
  const all: Cells = { ...WHOLE, i1: L.m, j1: L.m };
  const kb = kOf(L, plate.body[0].z1);
  const out: Raw[] = [];
  const rows: number[] = [];
  for (let k = 0; k < kb; k += 2) rows.push(k);
  walls(L, all, rows, [1, STYLE.agents], [0, STYLE.agents], out);

  const solids = plate.features.map((f) => ({ f, cells: cellsOf(L, f.box) }));
  for (let i = 0; i <= L.m; i++)
    for (let j = 0; j <= L.m; j++) {
      if (solids.some((s) => inside(s.cells, i, j))) continue;
      if (onRim(all, i, j)) out.push(still(px(L, i, j), py(L, i, j, kb), 1, STYLE.agents));
      else if (i % 2 === 0 && j % 2 === 0)
        /* the bare board: every other site, a perfboard */
        out.push(still(px(L, i, j), py(L, i, j, kb), 0, STYLE.agentsDim));
    }

  const runners: Runner[] = [];
  plate.traces.forEach((t, n) => {
    const sites = traceSites(L, t.pts);
    for (const [i, j] of sites) out.push(still(px(L, i, j), py(L, i, j, kb), 1, STYLE.agentsLit));
    for (const lead of [0, 0.5])
      runners.push({
        x: Int32Array.from(sites.map(([i, j]) => px(L, i, j))),
        y: Int32Array.from(sites.map(([i, j]) => py(L, i, j, kb))),
        phase: hash2(n, 7, 3) + lead,
        rate: 5.5,
      });
  });

  /* the solids, back first: each hides the board behind it */
  const blocks: Block[] = solids
    .sort((p, q) => p.cells.i0 + p.cells.j0 - (q.cells.i0 + q.cells.j0))
    .map(({ f, cells }) => {
      const k = Math.max(kb + 1, kOf(L, f.box.z1));
      const raw: Raw[] = [];
      const side: number[] = [];
      for (let r = kb + 1; r < k; r++) side.push(r);
      walls(L, cells, side, [1, STYLE.agents], [0, STYLE.agents], raw);
      const chip = f.kind === "chip";
      for (let i = cells.i0; i <= cells.i1; i++)
        for (let j = cells.j0; j <= cells.j1; j++) {
          const rim = onRim(cells, i, j);
          /* the chip's core is the brightest thing on the board */
          const core =
            chip && i > cells.i0 + 1 && i < cells.i1 - 1 && j > cells.j0 + 1 && j < cells.j1 - 1;
          /* the chip is the board's bright thing; a module is a quieter
             block with a lit rim, so the layer stays the one lit plate */
          const style = chip
            ? rim || core
              ? STYLE.agentsHot
              : STYLE.agentsLit
            : rim
              ? STYLE.agentsLit
              : STYLE.agents;
          raw.push(still(px(L, i, j), py(L, i, j, k), core ? 3 : 2, style));
        }
      return { cells, k, mask: outline(L, cells, kb, k), pop: pack(raw) };
    });
  return { base: pack(out), blocks, runners, kb };
}

/* -- what falls between plates --------------------------------------------- */

export interface Fallers {
  count: number;
  x: Int32Array;
  /** Where each leaves the upper plate and lands on the lower, at lift 0. */
  y0: Int32Array;
  y1: Int32Array;
  phase: Float32Array;
  /** Device px a second. */
  speed: Float32Array;
  /** How far above its landing a drop is first seen against the lower plate
      rather than against the ground, device px. */
  over: Int32Array;
  /** Where each drop is on its way, 0..1: `phase` at rest, advanced by the
      painter while the drawing runs, so a change of pose never jumps it. */
  prog: Float32Array;
}

/** A gap holds up to this many streams, each of this many drops. */
const MAX_STREAMS = 30;
export const DROPS = 3;

function fallers(
  L: Lattice,
  seed: number,
  landing: (i: number, j: number) => number,
  /** Sites nothing may land on. */
  keepOff: (i: number, j: number) => boolean = () => false
): Fallers {
  const n = MAX_STREAMS * DROPS;
  const f: Fallers = {
    count: n,
    x: new Int32Array(n),
    y0: new Int32Array(n),
    y1: new Int32Array(n),
    phase: new Float32Array(n),
    speed: new Float32Array(n),
    over: new Int32Array(n),
    prog: new Float32Array(n),
  };
  const unit = 2 * L.b * L.g * L.n;
  for (let s = 0; s < MAX_STREAMS; s++) {
    /* a dot under a plate is hidden until it clears the plate's front edge,
       so most streams leave from near the two front edges, where they show */
    let [i, j] = [1, 1];
    for (let tries = 0; tries < 8; tries++) {
      const near = L.m - 1 - Math.floor(hash2(s, 1 + tries * 7, seed) ** 2 * L.m * 0.6);
      const along = 1 + Math.floor(hash2(s, 2 + tries * 7, seed) * (L.m - 1));
      [i, j] = s % 2 ? [near, along] : [along, near];
      if (!keepOff(i, j)) break;
    }
    const speed = unit * (0.8 + 0.45 * hash2(s, 4, seed));
    for (let d = 0; d < DROPS; d++) {
      const q = s * DROPS + d;
      f.x[q] = px(L, i, j);
      f.y0[q] = py(L, i, j, 0);
      f.y1[q] = py(L, i, j, landing(i, j));
      f.phase[q] = (hash2(s, 3, seed) + d / DROPS) % 1;
      f.prog[q] = f.phase[q];
      f.speed[q] = speed;
      /* a site's height above the plate reads, on screen, as that many
         sites back along the diagonal: past the back edge it is in the air */
      f.over[q] = Math.min(i, j) * 2 * L.b * L.g;
    }
  }
  return f;
}

/* -- the scene ------------------------------------------------------------- */

export interface Label {
  /** Device px, at lift 0: where the plate's side corner is, mid-wall. */
  x: number;
  y: number;
}

export interface PlateScene {
  base: Pop;
  mask: Int32Array;
  blocks: Block[];
  runners: Runner[];
  /** A row of dots out to its words, either side. */
  leads: Pop;
  right: Label;
  left: Label;
  /** Dots that are the plate's own, without what moves across it. */
  dots: number;
  /** The screen y of its top face at the back corner, at lift 0. */
  topY: number;
}

export interface Scene {
  L: Lattice;
  sizes: number[];
  bed: Pop;
  /** The bed's own lift: the opened stack's floor. */
  bedY: number;
  plates: [PlateScene, PlateScene, PlateScene];
  falls: [Fallers, Fallers];
}

/** How far the words stand off a plate's corner, in site steps. */
export const LEAD_STEPS = 13;

function leads(L: Lattice, right: Label, left: Label): Pop {
  const out: Raw[] = [];
  const step = L.a * L.g;
  for (let q = 2; q < LEAD_STEPS; q++) {
    out.push(still(right.x + q * step, right.y, 0, STYLE.lead));
    out.push(still(left.x - q * step, left.y, 0, STYLE.lead));
  }
  return pack(out);
}

/** The bed: the floor the opened stack stands on, two dots a unit near it
    and thinning with distance, so it is a ground and never a fourth plate. */
function bedPop(L: Lattice): Pop {
  const out: Raw[] = [];
  const far = 17;
  const half = Math.max(1, Math.round(L.n / 2));
  for (let I = -far * 2; I <= (SIDE + far) * 2; I++)
    for (let J = -far * 2; J <= (SIDE + far) * 2; J++) {
      const d = Math.hypot(I / 2 - SIDE / 2, J / 2 - SIDE / 2);
      const whole = I % 2 === 0 && J % 2 === 0;
      /* the half-unit dots stay close in; the whole ones run out to the edge */
      if (!whole && d > 8.5) continue;
      const keep = d < 10 ? 1 : 1 - (d - 10) / (far - 10);
      if (bayer((I >> 1) + 64, (J >> 1) + 64) >= keep) continue;
      out.push(
        still(px(L, I * half, J * half), py(L, I * half, J * half, 0), whole ? 1 : 0, STYLE.bed)
      );
    }
  return pack(out);
}

export function buildScene(w: number, h: number, dpr: number): Scene {
  const L = fitLattice(w, h, dpr);
  const all: Cells = { ...WHOLE, i1: L.m, j1: L.m };
  const agents = agentsPop(L);
  const tops = PLATES.map((p) => kOf(L, p.body[p.body.length - 1].z1));

  const plate = (i: 0 | 1 | 2, base: Pop, blocks: Block[], runners: Runner[]): PlateScene => {
    const k = Math.round(tops[i] / 2);
    const right = { x: px(L, L.m, 0), y: py(L, L.m, 0, k) };
    const left = { x: px(L, 0, L.m), y: py(L, 0, L.m, k) };
    return {
      base,
      mask: outline(L, all, 0, tops[i]),
      blocks,
      runners,
      leads: leads(L, right, left),
      right,
      left,
      dots: base.count + blocks.reduce((s, b) => s + b.pop.count, 0),
      topY: py(L, 0, 0, tops[i]),
    };
  };

  /* a dot that falls onto the agents lands on whatever stands there */
  const onAgents = (i: number, j: number) =>
    agents.blocks.find((b) => inside(b.cells, i, j))?.k ?? agents.kb;

  return {
    L,
    sizes: tierSizes(L),
    bed: bedPop(L),
    bedY: liftPx(L, OPENED.lift[2]),
    plates: [
      plate(0, teamPop(L), [], []),
      plate(1, layerPop(L), [], []),
      plate(2, agents.base, agents.blocks, agents.runners),
    ],
    falls: [
      /* nothing falls onto the layer's core or across it: that light is
         its own, and a drop keeps to one column of the screen all the way */
      fallers(
        L,
        101,
        () => tops[1],
        (i, j) => Math.abs(i - j) < 2.7 * L.n
      ),
      fallers(L, 211, onAgents),
    ],
  };
}

/** The three plates' screen offsets in a pose, device px. */
export const offsets = (L: Lattice, pose: Pose): [number, number, number] => [
  liftPx(L, pose.lift[0]),
  liftPx(L, pose.lift[1]),
  liftPx(L, pose.lift[2]),
];

/** How many of a gap's streams are falling: more, the wider the gap. */
export const falling = (L: Lattice, gapPx: number) =>
  gapPx <= 4 * L.b * L.g ? 0 : Math.min(MAX_STREAMS, Math.round((gapPx / (L.b * L.g)) * 0.52));
