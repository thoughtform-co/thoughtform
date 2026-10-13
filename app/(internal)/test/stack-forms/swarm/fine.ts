/* S4·F · SWARM, FINE: S4 with one thing changed, how many dots it is made of
   (owner, 2026-10-13: "i still like S4 Swarm … the best; can you make some
   iterations?"; his note of 2026-10-01 on what he keeps pointing at: it
   "fills its frame … populated with dense luminous dots").

   The construction is S4's (`dots.ts`): three kinds of population on one
   lattice, the team a loose field that thickens into four workstreams and
   drifts, the layer every site in order with a white-hot core, the agents a
   board with a chip, four modules and dots strung on its traces, and dots
   falling from plate to plate. What changes is the lattice: always the
   finest that keeps the isometric on whole pixels (5 : 3, about 31 degrees),
   with as many sites a unit as the frame's height gives the opened stack.
   At 1920 x 1247 that is nine sites a unit where S4 has five on 9 : 5.

   What the extra dots are spent on:
     the layer   a falloff from the core to the corners, in dot size and in
                 tone, dithered where one step meets the next; its three
                 strata as three bands of rows down its walls
     the team    workstreams that are dense at the middle and thin out past
                 their own edge, on a floor that is faintly populated
     the agents  a board that is a surface, modules that are grids, traces
                 that are lines
   There is no field behind it: the stack is the frame.

   No React. The plates' standing dots are painted once a size, each plate to
   a sprite of its own with the ground's colour as its silhouette, so a frame
   is four images and only what moves: the drifting part of the team, the
   falling dots and the runners. Every dot is a whole number of device pixels
   on a lattice of whole device pixels. */

import { bayer, hash2, HEX, PLATES, poseAt, SIDE } from "../model";

import { type Cells, cellsOf, inside, kOf, type Lattice, offsets, outline, px, py } from "./dots";
import type { SwarmPainter } from "./useSwarmCanvas";

/* -- the lattice ----------------------------------------------------------- */

const OPENED = poseAt(1);
const LATTICES: readonly (readonly [number, number])[] = [
  [5, 3],
  [7, 4],
  [9, 5],
];
/** A site step along a plate's x, in CSS px, whatever the screen's ratio: on
    a screen of one device pixel a CSS pixel it is 5 : 3 itself. */
const STEP_CSS = 5;
/** The stack may take this share of the frame's width. */
const WIDE = 0.5;

/** The finest lattice and the most sites a unit that seat the OPENED stack
    in a `w` by `h` canvas (device px), so opening it never rescales it. */
export function fitFine(w: number, h: number, dpr: number): Lattice {
  let [a, b, g] = [5, 3, 1];
  let miss = Infinity;
  for (const [la, lb] of LATTICES)
    for (const lg of [1, 2]) {
      const off = Math.abs((la * lg) / dpr - STEP_CSS);
      if (off < miss - 1e-6) [miss, a, b, g] = [off, la, lb, lg];
    }
  const pad = Math.max(24 * dpr, h * 0.03);
  /* the team's top and the agents' foot, from the layer's floor, device px */
  const reach = (n: number) => {
    const lift = Math.round(OPENED.lift[0] * 2 * n) * b * g;
    return {
      up: lift + Math.round(PLATES[0].top * 2 * n) * b * g,
      down: 2 * SIDE * n * b * g + lift,
    };
  };
  let n = 3;
  for (let q = 14; q > 3; q--) {
    const r = reach(q);
    if (r.up + r.down <= h - 2 * pad && 2 * SIDE * q * a * g <= w * WIDE) {
      n = q;
      break;
    }
  }
  const r = reach(n);
  const oy = Math.round(h / 2 - (r.down - r.up) / 2);
  return { a, b, g, n, m: SIDE * n, ox: Math.round(w / 2), oy, w, h };
}

/** Dot sizes in device px: a speck, a dot, one that touches the next row,
    and the hot one, wide enough to all but close the lattice. */
const sizesOf = (L: Lattice) =>
  [Math.max(1, Math.floor(L.b / 2.5)), Math.round((L.b * 2) / 3), L.b, L.a - 1].map((s) => s * L.g);

/* -- paint ----------------------------------------------------------------- */

const rgbOf = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
const GROUND = rgbOf(HEX.void);
const mix = (from: number[], to: number[], t: number) =>
  `rgb(${from.map((v, n) => Math.round(v + (to[n] - v) * t)).join(", ")})`;

/* each plate's tone at rising shares of itself over the ground; the layer's
   goes on past gold toward bone, which is its heat */
const GREEN = [0.3, 0.48, 0.66, 0.84, 1];
const GOLD = [0.34, 0.48, 0.62, 0.76, 0.88, 1];
const HEAT = [0.4, 0.72, 1];
const BONE = [0.18, 0.28, 0.42, 0.6, 0.8, 1];

const COLOURS: readonly string[] = [
  ...GREEN.map((s) => mix(GROUND, rgbOf(HEX.green), s)),
  ...GOLD.map((s) => mix(GROUND, rgbOf(HEX.gold), s)),
  ...HEAT.map((s) => mix(rgbOf(HEX.gold), rgbOf(HEX.bone), s)),
  ...BONE.map((s) => mix(GROUND, rgbOf(HEX.bone), s)),
];
const gr = (n: number) => n;
const au = (n: number) => GREEN.length + n;
const ht = (n: number) => GREEN.length + GOLD.length + n;
const bn = (n: number) => GREEN.length + GOLD.length + HEAT.length + n;

/* -- populations ----------------------------------------------------------- */

interface Raw {
  x: number;
  y: number;
  /** Its side, device px. */
  s: number;
  /** Its colour, an index into COLOURS. */
  c: number;
  /** Drift radius in device px along the plate (0 holds still). */
  amp: number;
  phase: number;
  /** Radians a second. */
  rate: number;
}

/** A population: dots packed by colour, so a frame changes paint rarely. */
interface Pop {
  count: number;
  x: Int32Array;
  y: Int32Array;
  s: Uint8Array;
  amp: Float32Array;
  phase: Float32Array;
  rate: Float32Array;
  runs: { c: number; from: number; to: number }[];
}

function pack(raw: Raw[]): Pop {
  const sorted = raw
    .map((d, at) => ({ d, at }))
    .sort((p, q) => p.d.c - q.d.c || p.at - q.at)
    .map((p) => p.d);
  const n = sorted.length;
  const pop: Pop = {
    count: n,
    x: new Int32Array(n),
    y: new Int32Array(n),
    s: new Uint8Array(n),
    amp: new Float32Array(n),
    phase: new Float32Array(n),
    rate: new Float32Array(n),
    runs: [],
  };
  sorted.forEach((d, i) => {
    pop.x[i] = d.x;
    pop.y[i] = d.y;
    pop.s[i] = d.s;
    pop.amp[i] = d.amp;
    pop.phase[i] = d.phase;
    pop.rate[i] = d.rate;
    const last = pop.runs[pop.runs.length - 1];
    if (last && last.c === d.c) last.to = i + 1;
    else pop.runs.push({ c: d.c, from: i, to: i + 1 });
  });
  return pop;
}

const dot = (x: number, y: number, s: number, c: number): Raw => ({
  x,
  y,
  s,
  c,
  amp: 0,
  phase: 0,
  rate: 0,
});

const TAU = Math.PI * 2;
const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};
const wholeOf = (L: Lattice): Cells => ({ i0: 0, i1: L.m, j0: 0, j1: L.m });
const onRim = (c: Cells, i: number, j: number) =>
  i === c.i0 || i === c.i1 || j === c.j0 || j === c.j1;

/** One row of the two walls a viewer sees, at height `k`. */
function wallRow(
  L: Lattice,
  c: Cells,
  k: number,
  left: readonly [number, number],
  right: readonly [number, number],
  out: Raw[]
) {
  for (let i = c.i0; i <= c.i1; i++)
    out.push(dot(px(L, i, c.j1), py(L, i, c.j1, k), left[0], left[1]));
  for (let j = c.j0; j < c.j1; j++)
    out.push(dot(px(L, c.i1, j), py(L, c.i1, j, k), right[0], right[1]));
}

/** How thick the crowd is at a site: 1 inside a workstream's middle, thinning
    over its edge and a little past it, 0 on the open floor. The workstream is
    a rounded square, not a disc: it is a tile of the model. */
const CROWD = { full: 0.52, gone: 1.12 };
function crowdAt(tiles: readonly Cells[], i: number, j: number): number {
  let best = 0;
  for (const t of tiles) {
    const u = Math.abs(i - (t.i0 + t.i1) / 2) / ((t.i1 - t.i0) / 2);
    const v = Math.abs(j - (t.j0 + t.j1) / 2) / ((t.j1 - t.j0) / 2);
    const d = (u ** 3 + v ** 3) ** (1 / 3);
    best = Math.max(best, 1 - smooth((d - CROWD.full) / (CROWD.gone - CROWD.full)));
  }
  return best;
}

/* the team: a loose field that thickens into four workstreams, and drifts */
function teamDots(L: Lattice, sz: number[]): { still: Raw[]; moving: Raw[] } {
  const plate = PLATES[0];
  const all = wholeOf(L);
  const kt = kOf(L, plate.top);
  const tiles = plate.features.filter((f) => f.kind === "tile").map((f) => cellsOf(L, f.box));
  const railBox = plate.features.find((f) => f.kind === "rail")?.box;
  const rail = railBox ? cellsOf(L, railBox) : null;
  const still: Raw[] = [];
  const moving: Raw[] = [];
  /* the board's edge: a lit rule under the rim, the rest of the wall dim */
  for (let k = 0; k < kt; k++) {
    const lip = k === kt - 1;
    wallRow(L, all, k, [sz[1], gr(lip ? 3 : 2)], [sz[lip ? 1 : 0], gr(lip ? 2 : 1)], still);
  }

  const reach = L.a * L.g;
  for (let i = 0; i <= L.m; i++)
    for (let j = 0; j <= L.m; j++) {
      const x = px(L, i, j);
      const y = py(L, i, j, kt);
      const h = hash2(i, j, 11);
      const h2 = hash2(i, j, 29);
      const h3 = hash2(i, j, 53);
      if (onRim(all, i, j)) {
        still.push(dot(x, y, sz[1], gr(3)));
        continue;
      }
      const crowd = crowdAt(tiles, i, j);
      if (crowd > 0.02) {
        /* a workstream: packed at its middle, thinning to its edge */
        if (h >= 0.08 + 0.86 * crowd) continue;
        const s = crowd > 0.7 && h2 < 0.5 ? sz[2] : crowd > 0.22 || h2 < 0.5 ? sz[1] : sz[0];
        const c = gr(crowd > 0.55 ? 4 : crowd > 0.25 ? 3 : 2);
        /* most of them stand; the rest breathe, further out the looser it is */
        if (h3 < 0.42)
          moving.push({
            x,
            y,
            s,
            c,
            amp: (0.3 + 0.5 * h2) * reach * (1.5 - crowd),
            phase: h * 97 * TAU,
            rate: TAU / (8 + 8 * h2),
          });
        else still.push(dot(x, y, s, c));
      } else if (rail && inside(rail, i, j)) {
        /* the tools they have: a rule of ticks along one edge */
        if ((j - rail.j0) % 4 === 0) still.push(dot(x, y, sz[1], gr(i % 2 ? 2 : 3)));
      } else if (h < 0.16) {
        /* the open floor: a few, wandering further */
        const d: Raw = {
          x,
          y,
          s: sz[h2 < 0.45 ? 1 : 0],
          c: gr(2),
          amp: (0.6 + 0.9 * h2) * reach,
          phase: h * 131 * TAU,
          rate: TAU / (11 + 9 * h2),
        };
        if (h3 < 0.6) moving.push(d);
        else still.push({ ...d, amp: 0 });
      }
    }
  return { still, moving };
}

/** The layer's light at `r` units from its middle: 1 at the core, falling
    without a step to the corners. */
const lightAt = (r: number) => 1 / (1 + (r / 2.3) ** 2.3);
/** The one ring S4 draws round the core, in units. */
const RING = { from: 2.62, to: 2.94 };

/* the layer: every site, in order; size and tone fall away from a hot core */
function layerDots(L: Lattice, sz: number[]): Raw[] {
  const plate = PLATES[1];
  const all = wholeOf(L);
  const kt = kOf(L, plate.top);
  const out: Raw[] = [];
  /* three strata down the walls: a band of rows each, its top row the
     brightest, and dark between one and the next */
  plate.body.forEach((band, n) => {
    const k0 = kOf(L, band.z0);
    const k1 = n === plate.body.length - 1 ? kt : kOf(L, band.z1);
    for (let k = k0; k < k1; k++) {
      const lip = k === k1 - 1;
      wallRow(L, all, k, [sz[1], au(lip ? 5 : 3)], [sz[1], au(lip ? 4 : 2)], out);
    }
  });

  const c = SIDE / 2;
  for (let i = 0; i <= L.m; i++)
    for (let j = 0; j <= L.m; j++) {
      const x = px(L, i, j);
      const y = py(L, i, j, kt);
      if (onRim(all, i, j)) {
        out.push(dot(x, y, sz[1], au(5)));
        continue;
      }
      const r = Math.hypot(i / L.n - c, j / L.n - c);
      /* one step is dithered into the next over a few sites, so the falloff
         has no edge in it */
      const v = lightAt(r) + (bayer(i, j) - 0.5) * 0.07;
      if (r >= RING.from && r < RING.to) out.push(dot(x, y, sz[2], au(5)));
      else if (v > 0.9) out.push(dot(x, y, sz[3], ht(2)));
      else if (v > 0.76) out.push(dot(x, y, sz[2], ht(2)));
      else if (v > 0.62) out.push(dot(x, y, sz[2], ht(1)));
      else if (v > 0.5) out.push(dot(x, y, sz[2], ht(0)));
      else if (v > 0.4) out.push(dot(x, y, sz[1], au(5)));
      else if (v > 0.31) out.push(dot(x, y, sz[1], au(4)));
      else if (v > 0.24) out.push(dot(x, y, sz[1], au(3)));
      else if (v > 0.17) out.push(dot(x, y, sz[1], au(2)));
      else if (v > 0.125) out.push(dot(x, y, sz[1], au(1)));
      else out.push(dot(x, y, sz[0], au(3)));
    }
  return out;
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

interface Block {
  cells: Cells;
  /** The row its top sits on. */
  k: number;
  mask: Int32Array;
  dots: Raw[];
}

interface Runner {
  /** Screen points of the trace, chip end first. */
  x: Int32Array;
  y: Int32Array;
  phase: number;
  /** Sites a second. */
  rate: number;
}

/** The board's perforations: one brighter site in this many, each way. */
const PERF = 3;

/* the agents: a board, a dense chip and four modules, dots on the traces */
function agentsDots(
  L: Lattice,
  sz: number[]
): { board: Raw[]; blocks: Block[]; runners: Runner[]; kb: number } {
  const plate = PLATES[2];
  const all = wholeOf(L);
  const kb = kOf(L, plate.body[0].z1);
  const board: Raw[] = [];
  for (let k = 0; k < kb; k++) {
    const lip = k === kb - 1;
    wallRow(L, all, k, [sz[1], bn(lip ? 4 : 2)], [sz[lip ? 1 : 0], bn(lip ? 3 : 1)], board);
  }

  const solids = plate.features.map((f) => ({ f, cells: cellsOf(L, f.box) }));
  for (let i = 0; i <= L.m; i++)
    for (let j = 0; j <= L.m; j++) {
      if (solids.some((s) => inside(s.cells, i, j))) continue;
      const x = px(L, i, j);
      const y = py(L, i, j, kb);
      /* the bare board: every site a speck, every third a hole */
      const hole = i % PERF === 0 && j % PERF === 0;
      if (onRim(all, i, j)) board.push(dot(x, y, sz[1], bn(3)));
      else board.push(dot(x, y, sz[hole ? 1 : 0], bn(2)));
    }

  const runners: Runner[] = [];
  plate.traces.forEach((t, n) => {
    const sites = traceSites(L, t.pts);
    for (const [i, j] of sites) board.push(dot(px(L, i, j), py(L, i, j, kb), sz[1], bn(5)));
    for (const lead of [0, 0.5])
      runners.push({
        x: Int32Array.from(sites.map(([i, j]) => px(L, i, j))),
        y: Int32Array.from(sites.map(([i, j]) => py(L, i, j, kb))),
        phase: hash2(n, 7, 3) + lead,
        /* S4's pace in units, whatever the lattice */
        rate: 1.1 * L.n,
      });
  });

  /* the solids, back first: each hides the board behind it */
  const blocks: Block[] = solids
    .sort((p, q) => p.cells.i0 + p.cells.j0 - (q.cells.i0 + q.cells.j0))
    .map(({ f, cells }) => {
      const k = Math.max(kb + 1, kOf(L, f.box.z1));
      const dots: Raw[] = [];
      const chip = f.kind === "chip";
      for (let r = kb + 1; r < k; r++) {
        const lip = r === k - 1;
        wallRow(
          L,
          cells,
          r,
          [sz[1], bn(lip ? (chip ? 5 : 4) : 3)],
          [sz[lip ? 1 : 0], bn(lip ? 3 : 2)],
          dots
        );
      }
      const inset = Math.max(2, Math.round(L.n * 0.45));
      for (let i = cells.i0; i <= cells.i1; i++)
        for (let j = cells.j0; j <= cells.j1; j++) {
          const rim = onRim(cells, i, j);
          /* the chip's core is the brightest thing on the board */
          const core =
            chip &&
            i >= cells.i0 + inset &&
            i <= cells.i1 - inset &&
            j >= cells.j0 + inset &&
            j <= cells.j1 - inset;
          /* a module is a quieter grid with a lit rim, so the layer stays
             the one lit plate */
          const c = chip ? bn(rim || core ? 5 : 4) : bn(rim ? 5 : 3);
          dots.push(dot(px(L, i, j), py(L, i, j, k), core ? sz[2] : sz[1], c));
        }
      return { cells, k, mask: outline(L, cells, kb, k), dots };
    });
  return { board, blocks, runners, kb };
}

/* -- what falls between plates --------------------------------------------- */

interface Fallers {
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

/** A gap holds up to this many streams, each of this many drops: S4's own
    count, not more for the finer lattice, so the air stays as calm as the
    plates are dense. */
const FALL = { streams: 30, drops: 3, perUnit: 5.2 };
/** A drop and the dots it trails: each this share of a unit behind the last,
    and a size smaller; size, not paint, is what fades. Where the stack is
    small (fewer than `full` sites a unit) a drop is lighter and shorter, so
    the air does not outweigh the plates. */
const TRAIL = { gap: 0.09, full: 7, sizes: [2, 1, 1, 1, 0, 0], small: [1, 1, 0, 0] } as const;

function fallers(
  L: Lattice,
  seed: number,
  landing: (i: number, j: number) => number,
  /** Sites nothing may land on. */
  keepOff: (i: number, j: number) => boolean = () => false
): Fallers {
  const n = FALL.streams * FALL.drops;
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
  for (let s = 0; s < FALL.streams; s++) {
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
    for (let d = 0; d < FALL.drops; d++) {
      const q = s * FALL.drops + d;
      f.x[q] = px(L, i, j);
      f.y0[q] = py(L, i, j, 0);
      f.y1[q] = py(L, i, j, landing(i, j));
      f.phase[q] = (hash2(s, 3, seed) + d / FALL.drops) % 1;
      f.prog[q] = f.phase[q];
      f.speed[q] = speed;
      /* a site's height above the plate reads, on screen, as that many
         sites back along the diagonal: past the back edge it is in the air */
      f.over[q] = Math.min(i, j) * 2 * L.b * L.g;
    }
  }
  return f;
}

/** How many of a gap's streams are falling: more, the wider the gap. */
const falling = (L: Lattice, gapPx: number) => {
  const units = gapPx / (2 * L.b * L.g * L.n);
  return units < 0.4 ? 0 : Math.min(FALL.streams, Math.round(units * FALL.perUnit));
};

/* -- the scene ------------------------------------------------------------- */

/** A plate's standing dots, painted once: where its sprite sits at lift 0. */
interface Sprite {
  cv: HTMLCanvasElement;
  x: number;
  y: number;
}

interface Words {
  names: HTMLElement[];
  total: HTMLElement | null;
  grid: HTMLElement | null;
}

export interface FineScene {
  L: Lattice;
  sizes: number[];
  board: Sprite;
  blocks: Sprite;
  layer: Sprite;
  team: Sprite;
  /** The part of the team that drifts. */
  crowd: Pop;
  /** A row of dots out to each plate's name. */
  leads: Pop;
  runners: Runner[];
  falls: [Fallers, Fallers];
  /** Where each plate's name stands, device px at lift 0. */
  names: { x: number; y: number }[];
  /** The dots the three plates are made of, without what crosses the gaps. */
  standing: number;
  tLast: number;
  words: Words | null;
  seated: string;
}

type Ctx = CanvasRenderingContext2D;

function drawRaw(ctx: Ctx, raw: Raw[]) {
  const pop = pack(raw);
  for (const run of pop.runs) {
    ctx.fillStyle = COLOURS[run.c];
    for (let q = run.from; q < run.to; q++) {
      const s = pop.s[q];
      ctx.fillRect(pop.x[q] - (s >> 1), pop.y[q] - (s >> 1), s, s);
    }
  }
}

function mask(ctx: Ctx, poly: Int32Array) {
  ctx.fillStyle = HEX.void;
  ctx.beginPath();
  ctx.moveTo(poly[0], poly[1]);
  for (let q = 2; q < poly.length; q += 2) ctx.lineTo(poly[q], poly[q + 1]);
  ctx.closePath();
  ctx.fill();
}

/** The layer's halo: gold light on its top face, densest at the core. It is
    light, not a mark: the dots stay the only things drawn. */
function halo(ctx: Ctx, L: Lattice, topY: number) {
  const mid = L.m / 2;
  const reach = L.m * L.a * L.g * 0.68;
  const [r, g, b] = rgbOf(HEX.gold);
  ctx.save();
  /* the face's middle is a plate's side further down than its back corner */
  ctx.translate(px(L, mid, mid), topY + L.m * L.b * L.g);
  /* a circle on the plate is an ellipse on screen */
  ctx.scale(1, L.b / L.a);
  const light = ctx.createRadialGradient(0, 0, 0, 0, 0, reach);
  light.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
  light.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.17)`);
  light.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, 0.05)`);
  light.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(0, 0, reach, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** A plate's box on the canvas at lift 0, from its floor to `kTop`. */
function sprite(L: Lattice, kTop: number, paint: (ctx: Ctx) => void): Sprite {
  const slack = 6 * L.g + L.a * L.g;
  const x = px(L, 0, L.m) - slack;
  const y = py(L, 0, 0, kTop) - slack;
  const cv = document.createElement("canvas");
  cv.width = px(L, L.m, 0) + slack - x;
  cv.height = py(L, L.m, L.m, 0) + slack - y;
  const ctx = cv.getContext("2d");
  if (ctx) {
    ctx.translate(-x, -y);
    paint(ctx);
  }
  return { cv, x, y };
}

/** How far a plate's name stands off its corner, in dots of its lead. */
const LEAD = 8;

export function buildFine(w: number, h: number, dpr: number): FineScene {
  const L = fitFine(w, h, dpr);
  const sizes = sizesOf(L);
  const all = wholeOf(L);
  const tops = PLATES.map((p) => kOf(L, p.body[p.body.length - 1].z1));
  const team = teamDots(L, sizes);
  const layer = layerDots(L, sizes);
  const agents = agentsDots(L, sizes);
  const kHigh = agents.blocks.reduce((k, b) => Math.max(k, b.k), agents.kb);

  const names = PLATES.map((_, i) => ({
    x: px(L, L.m, 0),
    y: py(L, L.m, 0, Math.round(tops[i] / 2)),
  }));
  const leads: Raw[] = [];
  const step = 2 * L.a * L.g;
  names.forEach((p, i) => {
    for (let q = 2; q < LEAD; q++)
      leads.push({ ...dot(p.x + q * step, p.y, sizes[0], bn(2)), phase: i });
  });

  /* a dot that falls onto the agents lands on whatever stands there */
  const onAgents = (i: number, j: number) =>
    agents.blocks.find((b) => inside(b.cells, i, j))?.k ?? agents.kb;

  return {
    L,
    sizes,
    board: sprite(L, kHigh, (ctx) => {
      mask(ctx, outline(L, all, 0, agents.kb));
      drawRaw(ctx, agents.board);
    }),
    blocks: sprite(L, kHigh, (ctx) => {
      for (const b of agents.blocks) {
        mask(ctx, b.mask);
        drawRaw(ctx, b.dots);
      }
    }),
    layer: sprite(L, tops[1], (ctx) => {
      mask(ctx, outline(L, all, 0, tops[1]));
      halo(ctx, L, py(L, 0, 0, tops[1]));
      drawRaw(ctx, layer);
    }),
    team: sprite(L, tops[0], (ctx) => {
      mask(ctx, outline(L, all, 0, tops[0]));
      drawRaw(ctx, team.still);
    }),
    crowd: pack(team.moving),
    leads: pack(leads),
    runners: agents.runners,
    falls: [
      /* nothing falls onto the layer's core or across it: that light is its
         own, and a drop keeps to one column of the screen all the way */
      fallers(
        L,
        101,
        () => tops[1],
        (i, j) => Math.abs(i - j) < 2.7 * L.n
      ),
      fallers(L, 211, onAgents),
    ],
    names,
    standing:
      team.still.length +
      team.moving.length +
      layer.length +
      agents.board.length +
      agents.blocks.reduce((s, b) => s + b.dots.length, 0),
    tLast: 0,
    words: null,
    seated: "",
  };
}

/* -- one frame ------------------------------------------------------------- */

function drawCrowd(ctx: Ctx, S: FineScene, dy: number, t: number) {
  const pop = S.crowd;
  const squash = S.L.b / S.L.a;
  for (const run of pop.runs) {
    ctx.fillStyle = COLOURS[run.c];
    for (let q = run.from; q < run.to; q++) {
      const s = pop.s[q];
      /* a circle in the plate's own plane: an ellipse on screen */
      const at = pop.phase[q] + pop.rate[q] * t;
      const x = pop.x[q] + Math.round(pop.amp[q] * Math.cos(at));
      const y = pop.y[q] + dy + Math.round(pop.amp[q] * squash * Math.sin(at));
      ctx.fillRect(x - (s >> 1), y - (s >> 1), s, s);
    }
  }
}

/** Dots falling from the plate at `dyTop` to the one at `dyBottom`. Against
    the ground a drop is the tone of the plate it left; with `spark`, once it
    is seen against the plate below it is a spark of that plate's light. Each
    drop is advanced by `dt` seconds here (0 holds it at its rest phase). */
function drawFall(
  ctx: Ctx,
  S: FineScene,
  f: Fallers,
  dyTop: number,
  dyBottom: number,
  colour: number,
  spark: number | null,
  dt: number
) {
  const { L, sizes } = S;
  const back = Math.max(2 * L.g, Math.round(2 * L.b * L.g * L.n * TRAIL.gap));
  const trail = L.n >= TRAIL.full ? TRAIL.sizes : TRAIL.small;
  for (let q = 0; q < f.count; q++) {
    const gap = f.y1[q] + dyBottom - (f.y0[q] + dyTop);
    if (q < falling(L, gap) * FALL.drops && dt > 0)
      f.prog[q] = (f.prog[q] + (dt * f.speed[q]) / gap) % 1;
  }
  for (const pass of spark === null ? [colour] : [colour, spark]) {
    ctx.fillStyle = COLOURS[pass];
    for (let q = 0; q < f.count; q++) {
      const from = f.y0[q] + dyTop;
      const land = f.y1[q] + dyBottom;
      const gap = land - from;
      if (q >= falling(L, gap) * FALL.drops) continue;
      const y = Math.round(from + f.prog[q] * gap);
      for (let d = 0; d < trail.length; d++) {
        const yy = y - d * back;
        if (yy < from) break;
        const lit = spark !== null && land - yy <= f.over[q];
        if (lit !== (pass === spark)) continue;
        const s = sizes[trail[d]];
        ctx.fillRect(f.x[q] - (s >> 1), yy - (s >> 1), s, s);
      }
    }
  }
}

/** The runners on the agents' traces: a bright dot stepping site to site out
    of the chip, dimmer ones behind it. */
const TAIL = [
  [0, 2, 5],
  [1, 1, 5],
  [2, 1, 4],
  [3, 1, 4],
  [4, 0, 4],
] as const;

function drawRunners(ctx: Ctx, S: FineScene, dy: number, t: number) {
  for (const [back, size, shade] of TAIL) {
    ctx.fillStyle = COLOURS[bn(shade)];
    const s = S.sizes[size];
    for (const r of S.runners) {
      const n = r.x.length;
      if (n < 4) continue;
      const at = Math.floor(((r.phase * n + r.rate * t) % n) - back);
      if (at < 0) continue;
      ctx.fillRect(r.x[at] - (s >> 1), r.y[at] + dy - (s >> 1), s, s);
    }
  }
}

const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");
/** How far a name stands past the end of its lead, CSS px. */
const NAME_OFF = 14;

function seat(S: FineScene, el: HTMLElement, off: readonly number[], dpr: number) {
  const key = off.join(",");
  if (key === S.seated) return;
  S.seated = key;
  S.words ??= {
    names: [...el.querySelectorAll<HTMLElement>("[data-sfsf-name]")],
    total: el.querySelector<HTMLElement>("[data-sfsf-fact='dots']"),
    grid: el.querySelector<HTMLElement>("[data-sfsf-fact='grid']"),
  };
  const { L } = S;
  const reach = (LEAD * 2 * L.a * L.g) / dpr + NAME_OFF;
  S.words.names.forEach((name, i) => {
    name.style.left = `${S.names[i].x / dpr + reach}px`;
    name.style.top = `${(S.names[i].y + off[i]) / dpr}px`;
  });
  if (S.words.total) S.words.total.textContent = fmt(S.standing);
  if (S.words.grid) S.words.grid.textContent = `${L.a * L.g} × ${L.b * L.g} px`;
}

function paintFine(ctx: Ctx, S: FineScene, open: number, t: number, el: HTMLElement, dpr: number) {
  const { L } = S;
  /* a tab left in the background comes back a long frame later: the falling
     dots take one ordinary step, not the whole absence */
  const dt = Math.min(0.1, Math.max(0, t - S.tLast));
  S.tLast = t;
  const off = offsets(L, poseAt(open));
  ctx.clearRect(0, 0, L.w, L.h);
  ctx.imageSmoothingEnabled = false;

  for (const run of S.leads.runs) {
    ctx.fillStyle = COLOURS[run.c];
    for (let q = run.from; q < run.to; q++) {
      const s = S.leads.s[q];
      /* a lead's `phase` is the plate it belongs to */
      const dy = off[S.leads.phase[q]];
      ctx.fillRect(S.leads.x[q] - (s >> 1), S.leads.y[q] + dy - (s >> 1), s, s);
    }
  }

  /* the agents, what runs on their board, and what stands on it */
  ctx.drawImage(S.board.cv, S.board.x, S.board.y + off[2]);
  drawRunners(ctx, S, off[2], t);
  ctx.drawImage(S.blocks.cv, S.blocks.x, S.blocks.y + off[2]);
  drawFall(ctx, S, S.falls[1], off[1], off[2], au(5), null, dt);

  /* the layer, the one lit thing */
  ctx.drawImage(S.layer.cv, S.layer.x, S.layer.y + off[1]);
  drawFall(ctx, S, S.falls[0], off[0], off[1], gr(4), bn(5), dt);

  /* the team, and the part of it that drifts */
  ctx.drawImage(S.team.cv, S.team.x, S.team.y + off[0]);
  drawCrowd(ctx, S, off[0], t);

  seat(S, el, off, dpr);
}

export const FINE: SwarmPainter<FineScene> = { build: buildFine, paint: paintFine };
