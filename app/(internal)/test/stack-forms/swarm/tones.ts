/* S4·D · SWARM, BANDED, IN TONES: S4·B's order, with S4's colours and S4's
   motion (owner, 2026-10-13: "S4·B Swarm, banded but use the colors like S4
   Swarm … but with the animations").

   From S4·B, the order: every dot stands in a row of its plate, a plate's
   edge is whole, one axis runs down through the three with an arrowhead at
   each end and a second lies in the layer's own plane, and each plate's step
   stands in an outlined tag off its corner.

   From S4, the colours: the team green, the layer gold with a white-hot
   core, the agents bone. Each plate's marks take its own tone.

   From S4, the motion, made to belong to the rows:
     the team drifts   its rows sway along their own length, a slow wave
                       passing from row to row, and a dot walks each lane of
                       a workstream;
     dots fall         off the two front edges, at the wings, in a cascade
                       that runs along the edge; a file of them goes down the
                       axis;
     runners           step along the agents' traces, out of the chip.
   The layer does not move: it is what was written down.

   What is NOT here is what read as a Christmas decoration (coordinator's
   reading of the owner, 2026-10-13): nothing is scattered, nothing twinkles,
   and there is no field behind it. A dot is where its row puts it.

   No React; the canvas is handed in. Every dot is whole device pixels on
   S4's lattice, at 7 : 4 where there is room and 5 : 3 where there is not:
   a step coarser than S4·B's, so a row is beads and not a hairline. */

import { hash2, HEX, PLATES, poseAt, SIDE, type Tone } from "../model";

import {
  type Cells,
  cellsOf,
  fitLattice,
  inside,
  kOf,
  type Lattice,
  offsets,
  outline,
  px,
  py,
} from "./dots";
import type { SwarmPainter } from "./useSwarmCanvas";

const LATTICES = [
  [7, 4],
  [5, 3],
] as const;
/** The axis runs this far past the stack at each end, in units. */
const AXIS_OUT = 0.95;
const TAU = Math.PI * 2;

/** The team's sway: radians from one row to the next, and seconds a cycle. */
const SWAY = { step: 0.5, period: 9 };
/** What falls: streams an edge, drops a stream, and the stretch of a front
    edge they leave from, as shares of it from its outer corner. */
const FALL = { streams: 8, drops: 2, from: 0.06, to: 0.46 };
/** The order an edge's streams come in as a gap opens, so they stand evenly
    at two, at four and at eight. */
const ORDER = [0, 4, 2, 6, 1, 5, 3, 7];
/** The file down the axis: a dot every this many units. */
const FILE = 0.75;

/* -- paint ----------------------------------------------------------------- */

const ST = {
  teamDim: 0,
  team: 1,
  teamLit: 2,
  layerDim: 3,
  layer: 4,
  layerLit: 5,
  layerHot: 6,
  agentsDim: 7,
  agents: 8,
  agentsLit: 9,
  agentsHot: 10,
} as const;

/** Each style as a brand tone at a share of itself over the ground. */
const SHARE: readonly (readonly [Tone, number])[] = [
  ["green", 0.6],
  ["green", 0.8],
  ["green", 1],
  ["gold", 0.52],
  ["gold", 0.82],
  ["gold", 1],
  ["bone", 1],
  ["bone", 0.36],
  ["bone", 0.54],
  ["bone", 0.8],
  ["bone", 1],
];

const rgbOf = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
const GROUND = rgbOf(HEX.void);
const GOLD = rgbOf(HEX.gold).join(", ");

/** Every style as one opaque colour: its tone over the ground. */
const COLOURS: readonly string[] = SHARE.map(([tone, a]) => {
  const [r, g, b] = rgbOf(HEX[tone]).map((v, n) => Math.round(GROUND[n] + (v - GROUND[n]) * a));
  return `rgb(${r}, ${g}, ${b})`;
});

/** A plate's own tone, as a style and as an rgb triple for its marks. */
const TONE_OF = PLATES.map((p) => rgbOf(HEX[p.tone]).join(", "));

/** Dot sizes in device px, tiers 0..4: a speck, a dim dot, a dot, a bright
    one, and the hot one, wide enough to all but meet the next along its row. */
const sizesOf = (L: Lattice) =>
  [Math.max(1, L.b - 2), L.b - 1, L.b, L.b + 1, L.b + 2].map((s) => s * L.g);

/* -- populations ----------------------------------------------------------- */

interface Bead {
  tier: number;
  style: number;
  /** How far it sways along its row, in sites (0 holds still). */
  sway?: number;
}

interface Dot extends Required<Bead> {
  x: number;
  y: number;
  row: number;
}

interface Pop {
  count: number;
  x: Int32Array;
  y: Int32Array;
  size: Uint8Array;
  sway: Float32Array;
  phase: Float32Array;
  runs: { style: number; from: number; to: number }[];
}

/** Packed by style, so a frame changes paint a handful of times. */
function pack(dots: Dot[], sizes: number[]): Pop {
  const sorted = dots
    .map((d, at) => ({ d, at }))
    .sort((p, q) => p.d.style - q.d.style || p.at - q.at)
    .map((p) => p.d);
  const n = sorted.length;
  const pop: Pop = {
    count: n,
    x: new Int32Array(n),
    y: new Int32Array(n),
    size: new Uint8Array(n),
    sway: new Float32Array(n),
    phase: new Float32Array(n),
    runs: [],
  };
  sorted.forEach((d, q) => {
    pop.x[q] = d.x;
    pop.y[q] = d.y;
    pop.size[q] = sizes[d.tier];
    pop.sway[q] = d.sway;
    pop.phase[q] = d.row * SWAY.step;
    const last = pop.runs[pop.runs.length - 1];
    if (last && last.style === d.style) last.to = q + 1;
    else pop.runs.push({ style: d.style, from: q, to: q + 1 });
  });
  return pop;
}

/** The rows of a wall: one a height, along the left wall and the right. */
function wallRows(
  L: Lattice,
  rows: readonly number[],
  tier: number,
  left: number,
  right: number,
  out: Dot[]
) {
  for (const k of rows) {
    for (let i = 0; i <= L.m; i++)
      out.push({ x: px(L, i, L.m), y: py(L, i, L.m, k), tier, style: left, sway: 0, row: 0 });
    for (let j = 0; j < L.m; j++)
      out.push({ x: px(L, L.m, j), y: py(L, L.m, j, k), tier, style: right, sway: 0, row: 0 });
  }
}

/** Every site of the top face through `each`, which says what stands there
    (or that nothing does). `onEdge` is true on the face's four edges. */
function topRows(
  L: Lattice,
  k: number,
  each: (i: number, j: number, onEdge: boolean) => Bead | null,
  out: Dot[]
) {
  for (let j = 0; j <= L.m; j++)
    for (let i = 0; i <= L.m; i++) {
      const d = each(i, j, i === 0 || i === L.m || j === 0 || j === L.m);
      if (d) out.push({ x: px(L, i, j), y: py(L, i, j, k), sway: 0, ...d, row: j });
    }
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

/** A dot stepping site to site along a run, with a tail. */
interface Runner {
  /** Screen points of the run, at lift 0, in the order it is walked. */
  x: Int32Array;
  y: Int32Array;
  /** Where it starts, as a share of the run. */
  phase: number;
  /** Sites a second. */
  rate: number;
  /** Its row's sway, as a dot of that row has it. */
  sway: number;
  swayPhase: number;
}

/** Head first: how many sites back, the dot's tier, its style. */
type Tail = readonly (readonly [number, number, number])[];

interface Falls {
  count: number;
  x: Int32Array;
  /** Where each leaves the upper plate and lands on the lower, at lift 0. */
  y0: Int32Array;
  y1: Int32Array;
  /** Where each is on its way, 0..1: its rest phase, advanced by the painter
      while the drawing runs, so a change of pose never jumps it. */
  prog: Float32Array;
  /** Its stream's turn to come in as the gap opens. */
  rank: Uint8Array;
}

/** What falls across one gap: streams off the upper plate's two front edges,
    at the wings, where a drop is seen against the ground for most of its way.
    The two edges are one another's mirror, and a stream's phase is its place
    along its edge: the drops come down as two slanted files a wing, in step
    on both sides. Nothing about it is drawn by lot. */
function fallsOf(L: Lattice, landing: number): Falls {
  const n = 2 * FALL.streams * FALL.drops;
  const f: Falls = {
    count: n,
    x: new Int32Array(n),
    y0: new Int32Array(n),
    y1: new Int32Array(n),
    prog: new Float32Array(n),
    rank: new Uint8Array(n),
  };
  /* the streams stand a whole number of sites apart, so the file is even */
  const first = Math.round(FALL.from * L.m);
  const step = Math.max(1, Math.round(((FALL.to - FALL.from) * L.m) / (FALL.streams - 1)));
  let q = 0;
  for (let edge = 0; edge < 2; edge++)
    for (let c = 0; c < FALL.streams; c++) {
      const site = first + c * step;
      /* the right-hand front edge, then the left */
      const [i, j] = edge ? [site, L.m] : [L.m, site];
      for (let d = 0; d < FALL.drops; d++, q++) {
        f.x[q] = px(L, i, j);
        f.y0[q] = py(L, i, j, 0);
        f.y1[q] = py(L, i, j, landing);
        f.prog[q] = (c / FALL.streams + d) / FALL.drops;
        f.rank[q] = ORDER.indexOf(c);
      }
    }
  return f;
}

/** How many of an edge's streams are falling: two, four or all eight as the
    gap widens, and none while the plates are all but touching. `gap` is in
    units. */
const falling = (gap: number) => (gap < 0.7 ? 0 : gap < 2.4 ? 2 : gap < 4.4 ? 4 : FALL.streams);

export interface TonePlate {
  pop: Pop;
  mask: Int32Array;
  runners: Runner[];
  /** Screen y of the top face's middle and of the floor's middle, at lift 0. */
  topY: number;
  floorY: number;
  /** The right-hand corner, mid-wall: where its name meets it. */
  corner: { x: number; y: number };
}

export interface ToneScene {
  L: Lattice;
  sizes: number[];
  plates: [TonePlate, TonePlate, TonePlate];
  /** Team to layer, layer to agents. */
  falls: [Falls, Falls];
  /** The plates' own dots, all told: what stands, without what travels. */
  dots: number;
  /** Where the names stand, device px from the left. */
  tagX: number;
  /** The last frame's time, so what falls is advanced by the step between. */
  clock: number;
}

export function buildTones(w: number, h: number, dpr: number): ToneScene {
  const L = fitLattice(w, h, dpr, { lattices: LATTICES, margin: AXIS_OUT, pad: 0.03 });
  const { n, m } = L;
  const sizes = sizesOf(L);
  const all: Cells = { i0: 0, i1: m, j0: 0, j1: m };
  const tops = PLATES.map((p) => kOf(L, p.body[p.body.length - 1].z1));

  const plate = (i: 0 | 1 | 2, dots: Dot[], runners: Runner[]): TonePlate => ({
    pop: pack(dots, sizes),
    mask: outline(L, all, 0, tops[i]),
    runners,
    topY: py(L, m / 2, m / 2, tops[i]),
    floorY: py(L, m / 2, m / 2, 0),
    corner: { x: px(L, m, 0), y: py(L, m, 0, Math.round(tops[i] / 2)) },
  });

  /* -- the team: few rows, wide apart; a workstream is where they close up -- */
  const team: Dot[] = [];
  const walkers: Runner[] = [];
  const teamTop = kOf(L, PLATES[0].top);
  const tiles = PLATES[0].features.filter((f) => f.kind === "tile").map((f) => cellsOf(L, f.box));
  const wide = Math.max(4, Math.round(0.75 * n));
  wallRows(L, [0], 1, ST.team, ST.teamDim, team);
  topRows(
    L,
    teamTop,
    (i, j, onEdge) => {
      if (onEdge) return { tier: 1, style: ST.team };
      const tile = tiles.find((c) => inside(c, i, j));
      if (tile) {
        if (j % 2) return null;
        /* a crowd: the dots swell toward the workstream's middle */
        const d = Math.max(
          Math.abs(i - (tile.i0 + tile.i1) / 2) / ((tile.i1 - tile.i0) / 2),
          Math.abs(j - (tile.j0 + tile.j1) / 2) / ((tile.j1 - tile.j0) / 2)
        );
        return { tier: d < 0.55 ? 3 : 2, style: ST.teamLit, sway: 0.9 };
      }
      if (j % wide) return null;
      /* a row runs the plate's full width; where two slow waves say it is
         airy it thins to every other dot, and never stops */
      const airy = Math.sin(i * 0.19 + j * 1.3) + Math.sin(i * 0.071 + j * 0.7 + 1.1) < -0.5;
      return airy && (i & 1) === 1 ? null : { tier: 1, style: ST.teamDim, sway: 0.45 };
    },
    team
  );
  /* a dot walks every lane of a workstream toward the front edge, and the
     lanes of one workstream are in step: a file crossing it, not a scatter */
  tiles.forEach((c, t) => {
    const run = Array.from({ length: c.i1 - c.i0 + 1 }, (_, q) => c.i0 + q);
    for (let j = c.j0 + (c.j0 % 2); j <= c.j1; j += 2)
      walkers.push({
        x: Int32Array.from(run.map((i) => px(L, i, j))),
        y: Int32Array.from(run.map((i) => py(L, i, j, teamTop))),
        phase: hash2(t, 3, 41),
        rate: 0.4 * n,
        sway: 0.9,
        swayPhase: j * SWAY.step,
      });
  });

  /* -- the layer: every other row, unbroken, swelling to a white-hot core -- */
  const layer: Dot[] = [];
  const strata = PLATES[1].body.map((box) => kOf(L, box.z0));
  wallRows(L, [...new Set(strata)], 2, ST.layerLit, ST.layer, layer);
  const c = SIDE / 2;
  topRows(
    L,
    tops[1],
    (i, j, onEdge) => {
      if (j % 2 && j !== m) return null;
      if (onEdge) return { tier: 2, style: ST.layerLit };
      const r = Math.hypot(i / n - c, j / n - c);
      if (r < 1) return { tier: 4, style: ST.layerHot };
      if (r < 1.9) return { tier: 3, style: ST.layerLit };
      if (r < 3.1) return { tier: 2, style: ST.layerLit };
      return { tier: r < 4.2 ? 2 : 1, style: ST.layer };
    },
    layer
  );

  /* -- the agents: a quiet board; the chip and the modules are knots -- */
  const agents: Dot[] = [];
  const runners: Runner[] = [];
  const board = kOf(L, PLATES[2].body[0].z1);
  const solids = PLATES[2].features.map((f) => ({
    chip: f.kind === "chip",
    cells: cellsOf(L, f.box),
  }));
  const mid = Math.max(3, Math.round(0.5 * n));
  wallRows(L, [0], 1, ST.agents, ST.agentsDim, agents);
  topRows(
    L,
    board,
    (i, j, onEdge) => {
      if (onEdge) return { tier: 1, style: ST.agents };
      const on = solids.find((s) => inside(s.cells, i, j));
      if (on) {
        if (j % 2) return null;
        return on.chip ? { tier: 3, style: ST.agentsHot } : { tier: 2, style: ST.agentsLit };
      }
      return j % mid ? null : { tier: 1, style: ST.agentsDim };
    },
    agents
  );
  PLATES[2].traces.forEach((t, q) => {
    const sites = traceSites(L, t.pts);
    for (const [i, j] of sites)
      if (!solids.some((s) => inside(s.cells, i, j)))
        agents.push({
          x: px(L, i, j),
          y: py(L, i, j, board),
          tier: 1,
          style: ST.agentsLit,
          sway: 0,
          row: j,
        });
    for (const lead of [0, 0.5])
      runners.push({
        x: Int32Array.from(sites.map(([i, j]) => px(L, i, j))),
        y: Int32Array.from(sites.map(([i, j]) => py(L, i, j, board))),
        phase: hash2(q, 7, 3) + lead,
        rate: 1.1 * n,
        sway: 0,
        swayPhase: 0,
      });
  });

  const plates: ToneScene["plates"] = [
    plate(0, team, walkers),
    plate(1, layer, []),
    plate(2, agents, runners),
  ];
  return {
    L,
    sizes,
    plates,
    falls: [fallsOf(L, tops[1]), fallsOf(L, board)],
    dots: plates.reduce((sum, p) => sum + p.pop.count, 0),
    tagX: px(L, m, 0) + Math.round(3.1 * 2 * L.b * L.g * n),
    clock: 0,
  };
}

/* -- paint ----------------------------------------------------------------- */

type Ctx = CanvasRenderingContext2D;

/** A dot's shift along its row, in whole device px. */
function swayOf(L: Lattice, sway: number, phase: number, t: number): [number, number] {
  const d = sway * Math.sin(phase - (t * TAU) / SWAY.period);
  return [Math.round(L.a * L.g * d), Math.round(L.b * L.g * d)];
}

function drawPop(ctx: Ctx, L: Lattice, pop: Pop, dy: number, t: number) {
  for (const run of pop.runs) {
    ctx.fillStyle = COLOURS[run.style];
    for (let q = run.from; q < run.to; q++) {
      const size = pop.size[q];
      let x = pop.x[q];
      let y = pop.y[q] + dy;
      if (pop.sway[q] > 0) {
        const [sx, sy] = swayOf(L, pop.sway[q], pop.phase[q], t);
        x += sx;
        y += sy;
      }
      ctx.fillRect(x - (size >> 1), y - (size >> 1), size, size);
    }
  }
}

function drawRunners(ctx: Ctx, S: ToneScene, runners: Runner[], dy: number, t: number, tail: Tail) {
  for (const [back, tier, style] of tail) {
    ctx.fillStyle = COLOURS[style];
    const size = S.sizes[tier];
    for (const r of runners) {
      const n = r.x.length;
      if (n < 4) continue;
      const at = Math.floor(((r.phase * n + r.rate * t) % n) - back);
      if (at < 0) continue;
      const [sx, sy] = r.sway > 0 ? swayOf(S.L, r.sway, r.swayPhase, t) : [0, 0];
      ctx.fillRect(r.x[at] + sx - (size >> 1), r.y[at] + dy + sy - (size >> 1), size, size);
    }
  }
}

/** A drop and the dots it trails, each a row and a half behind the last and
    a size smaller: size, not paint, is what fades. */
const DROP = [
  [0, 3],
  [1.6, 2],
  [3.2, 1],
  [4.8, 0],
] as const;

/** Dots falling from the plate at `dyTop` to the one at `dyBottom`, in the
    tone of the plate they left. Each is advanced by `dt` seconds here (0
    holds it at its rest phase). */
function drawFall(
  ctx: Ctx,
  S: ToneScene,
  f: Falls,
  dyTop: number,
  dyBottom: number,
  style: number,
  dt: number
) {
  const { L } = S;
  const row = L.b * L.g;
  /* a unit a second, whatever the gap */
  const speed = 2 * row * L.n;
  ctx.fillStyle = COLOURS[style];
  for (let q = 0; q < f.count; q++) {
    const from = f.y0[q] + dyTop;
    const gap = f.y1[q] + dyBottom - from;
    if (f.rank[q] >= falling(gap / speed)) continue;
    if (dt > 0) f.prog[q] = (f.prog[q] + (dt * speed) / gap) % 1;
    const y = Math.round(from + f.prog[q] * gap);
    for (const [back, tier] of DROP) {
      const yy = y - Math.round(back * row);
      if (yy < from) continue;
      const size = S.sizes[tier];
      ctx.fillRect(f.x[q] - (size >> 1), yy - (size >> 1), size, size);
    }
  }
}

function mask(ctx: Ctx, poly: Int32Array, dy: number) {
  ctx.fillStyle = HEX.void;
  ctx.beginPath();
  ctx.moveTo(poly[0], poly[1] + dy);
  for (let q = 2; q < poly.length; q += 2) ctx.lineTo(poly[q], poly[q + 1] + dy);
  ctx.closePath();
  ctx.fill();
}

/** A hairline of an axis, a grain wide. */
function line(ctx: Ctx, L: Lattice, x0: number, y0: number, x1: number, y1: number) {
  ctx.fillStyle = `rgba(${GOLD}, 0.78)`;
  const [w, half] = [L.g, L.g >> 1];
  if (x0 === x1) ctx.fillRect(x0 - half, Math.min(y0, y1), w, Math.abs(y1 - y0));
  else ctx.fillRect(Math.min(x0, x1), y0 - half, Math.abs(x1 - x0), w);
}

/** The file of dots going down the axis, between two heights of it. They
    stand a fixed step apart on the screen, so the file is one file from the
    top arrowhead to the bottom one, whatever hides the middle of it. */
function file(ctx: Ctx, S: ToneScene, x: number, y0: number, y1: number, t: number) {
  const { L } = S;
  const unit = 2 * L.b * L.g * L.n;
  const step = Math.max(8 * L.g, Math.round(FILE * unit));
  const shift = Math.round(t * unit) % step;
  const size = S.sizes[1];
  ctx.fillStyle = COLOURS[ST.layerLit];
  for (let y = Math.ceil((y0 - shift) / step) * step + shift; y < y1; y += step)
    ctx.fillRect(x - (size >> 1), y - (size >> 1), size, size);
}

/** A small solid arrowhead, its tip at (x, y), pointing along (dx, dy). */
function arrow(ctx: Ctx, L: Lattice, x: number, y: number, dx: number, dy: number) {
  const [len, half] = [9 * L.g, 4 * L.g];
  ctx.fillStyle = HEX.gold;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * len - dy * half, y - dy * len - dx * half);
  ctx.lineTo(x - dx * len + dy * half, y - dy * len + dx * half);
  ctx.closePath();
  ctx.fill();
}

/** A diamond node, `r` grains from middle to point. */
function diamond(ctx: Ctx, L: Lattice, x: number, y: number, r: number, fill: string) {
  const d = r * L.g;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y - d);
  ctx.lineTo(x + d, y);
  ctx.lineTo(x, y + d);
  ctx.lineTo(x - d, y);
  ctx.closePath();
  ctx.fill();
}

/** The layer's halo: gold light on its top face, densest at the core. It is
    light, not a mark: the dots stay the only things that stand there. */
function halo(ctx: Ctx, L: Lattice, cx: number, cy: number) {
  const reach = L.m * L.a * L.g * 0.6;
  ctx.save();
  ctx.translate(cx, cy);
  /* a circle on the plate is an ellipse on screen */
  ctx.scale(1, L.b / L.a);
  const light = ctx.createRadialGradient(0, 0, 0, 0, 0, reach);
  light.addColorStop(0, `rgba(${GOLD}, 0.3)`);
  light.addColorStop(0.35, `rgba(${GOLD}, 0.12)`);
  light.addColorStop(1, `rgba(${GOLD}, 0)`);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(0, 0, reach, 0, TAU);
  ctx.fill();
  ctx.restore();
}

const TEAM_TAIL: Tail = [
  [0, 4, ST.teamLit],
  [1, 3, ST.teamLit],
];
const AGENTS_TAIL: Tail = [
  [0, 3, ST.agentsHot],
  [1, 2, ST.agentsLit],
  [2, 1, ST.agentsLit],
];

export function paintTones(
  ctx: Ctx,
  S: ToneScene,
  open: number,
  t: number,
  el: HTMLElement,
  dpr: number
) {
  const { L } = S;
  const off = offsets(L, poseAt(open));
  const [team, layer, agents] = S.plates;
  /* a tab left in the background comes back a long frame later: what falls
     takes one ordinary step, not the whole absence */
  const dt = Math.min(0.1, Math.max(0, t - S.clock));
  S.clock = t;
  const unit = 2 * L.b * L.g * L.n;
  const out = Math.round(AXIS_OUT * unit);
  const cx = L.ox;
  const head = 12 * L.g;
  /* a plate's back corner stands half its diagonal above its middle on
     screen, its front corner as far below: the axis has to clear both */
  const reach = L.m * L.b * L.g;
  const tipTop = team.topY + off[0] - reach - out;
  const tipBottom = agents.floorY + off[2] + reach + out;
  ctx.clearRect(0, 0, L.w, L.h);

  /* painter's order, the ground as the mask: what is under a plate is hidden
     until it clears the plate's front corner, the axis and its file included */
  line(ctx, L, cx, agents.topY + off[2], cx, tipBottom);
  file(ctx, S, cx, agents.topY + off[2], tipBottom - head, t);
  arrow(ctx, L, cx, tipBottom, 0, 1);

  mask(ctx, agents.mask, off[2]);
  drawPop(ctx, L, agents.pop, off[2], t);
  drawRunners(ctx, S, agents.runners, off[2], t, AGENTS_TAIL);
  drawFall(ctx, S, S.falls[1], off[1], off[2], ST.layerLit, dt);
  line(ctx, L, cx, layer.floorY + off[1], cx, agents.topY + off[2]);
  file(ctx, S, cx, layer.floorY + off[1], agents.topY + off[2] - 5 * L.g, t);
  diamond(ctx, L, cx, agents.topY + off[2], 3, COLOURS[ST.agentsHot]);

  /* the layer, the one lit thing: a warm halo under its core, then it */
  const ly = layer.topY + off[1];
  mask(ctx, layer.mask, off[1]);
  halo(ctx, L, cx, ly);
  drawPop(ctx, L, layer.pop, off[1], t);
  /* the second axis lies in the layer's own plane, corner to corner */
  const across = L.m * L.a * L.g + out;
  line(ctx, L, cx - across, ly, cx - L.m * L.a * L.g, ly);
  line(ctx, L, cx + L.m * L.a * L.g, ly, cx + across, ly);
  arrow(ctx, L, cx - across, ly, -1, 0);
  arrow(ctx, L, cx + across, ly, 1, 0);
  drawFall(ctx, S, S.falls[0], off[0], off[1], ST.teamLit, dt);
  line(ctx, L, cx, team.floorY + off[0], cx, ly);
  file(ctx, S, cx, team.floorY + off[0], ly - 5 * L.g, t);

  mask(ctx, team.mask, off[0]);
  drawPop(ctx, L, team.pop, off[0], t);
  drawRunners(ctx, S, team.runners, off[0], t, TEAM_TAIL);
  line(ctx, L, cx, tipTop, cx, team.topY + off[0]);
  file(ctx, S, cx, tipTop + head, team.topY + off[0] - 5 * L.g, t);
  arrow(ctx, L, cx, tipTop, 0, -1);
  diamond(ctx, L, cx, team.topY + off[0], 3, COLOURS[ST.teamLit]);

  /* each plate's name: a diamond where it meets the plate, a dotted run out,
     both in the plate's own tone */
  const tags = el.querySelectorAll<HTMLElement>("[data-sfst-tag]");
  S.plates.forEach((p, i) => {
    const y = i === 1 ? ly : p.corner.y + off[i];
    /* the layer's name hangs off its own axis, a node past the arrowhead */
    const from = i === 1 ? cx + across + 9 * L.g : p.corner.x;
    diamond(ctx, L, from, y, 3, `rgb(${TONE_OF[i]})`);
    ctx.fillStyle = `rgba(${TONE_OF[i]}, 0.5)`;
    for (let x = from + 12 * L.g; x < S.tagX - 6 * L.g; x += 6 * L.g)
      ctx.fillRect(x, y - (L.g >> 1), L.g, L.g);
    const tag = tags[i];
    if (tag) {
      tag.style.left = `${S.tagX / dpr}px`;
      tag.style.top = `${y / dpr}px`;
    }
  });

  const total = el.querySelector<HTMLElement>("[data-sfst-fact='dots']");
  const text = S.dots.toLocaleString("en-US").replace(/,/g, " ");
  if (total && total.textContent !== text) total.textContent = text;
}

export const TONES: SwarmPainter<ToneScene> = { build: buildTones, paint: paintTones };
