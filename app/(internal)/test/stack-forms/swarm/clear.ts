/* S4·E · SWARM, CLEAR, as a painter. No React.

   S4 by subtraction (owner, 2026-10-13: "i still like S4 Swarm … the best;
   can you make some iterations?"). The three plates are S4's own, built by
   S4's own arithmetic (`buildScene` in `dots.ts`), so at one size they are
   the same dots on the same pixels: the team's crowds, the layer's lattice
   and white-hot core, the agents' perfboard, chip, modules and runners.

   What is not painted: the bed of dots behind the stack, and the dotted runs
   out to its words. What is redrawn is what falls. S4 lets thirty streams a
   gap fall wherever they will, so some cross the layer's lit face as sparks
   and some lie scattered on the agents' board. Here a gap holds at most five
   a wing, and a drop is only ever seen against the open ground: it leaves
   the upper plate near a side corner, falls through the notch between the
   two plates and is gone where the lower plate's far edge begins. */

import { HEX, hash2, PLATES, poseAt } from "../model";

import {
  inside,
  kOf,
  type Lattice,
  offsets,
  type Pop,
  px,
  py,
  type Runner,
  type Scene,
  buildScene,
  STYLE,
} from "./dots";
import { COLOURS } from "./paint";
import type { SwarmPainter } from "./useSwarmCanvas";

type Ctx = CanvasRenderingContext2D;

/* -- what falls -------------------------------------------------------------- */

/** Streams a wing, at most; each of this many drops. */
const PER_WING = 5;
const DROPS = 2;
/** Nothing falls across a gap narrower than this, in units, so the closed
    stack is three plates and nothing else; past it, this many streams a wing
    for every unit the gap opens. */
const GAP_SHUT = 2.4;
const STREAMS_A_UNIT = 1.6;
/** A stream falls only where it has this many rows of open ground to cross. */
const MIN_ROWS = 7;

/** A drop and the dots it trails, each a row and a half behind the last and
    a size smaller: S4's own. */
const DROP = [
  [0, 3],
  [1.6, 2],
  [3.2, 1],
  [4.8, 0],
] as const;
const TRAIL = DROP[DROP.length - 1][0];

interface Falls {
  count: number;
  x: Int32Array;
  /** Where each stream comes out from under the upper plate, and where the
      lower plate's far edge takes it, both at lift 0, device px. */
  y0: Int32Array;
  y1: Int32Array;
  /** Device px a second. */
  speed: Float32Array;
  phase: Float32Array;
  /** Where each drop is on its way, 0..1: `phase` at rest, advanced by the
      painter while the drawing runs, so a change of pose never jumps it. */
  prog: Float32Array;
}

/** The streams of one gap, a wing each side, nearest the side corner first. */
function wingFalls(L: Lattice, seed: number, landing: (i: number, j: number) => number): Falls {
  const streams = PER_WING * 2;
  const n = streams * DROPS;
  const f: Falls = {
    count: n,
    x: new Int32Array(n),
    y0: new Int32Array(n),
    y1: new Int32Array(n),
    speed: new Float32Array(n),
    phase: new Float32Array(n),
    prog: new Float32Array(n),
  };
  const row = L.b * L.g;
  const unit = 2 * row * L.n;
  /* how far along the front edge from the side corner a wing reaches, and
     how far back from that edge a stream may leave */
  const span = Math.max(PER_WING, Math.round(L.m * 0.3));
  const depth = Math.max(1, Math.round(L.m * 0.08));
  for (let s = 0; s < streams; s++) {
    const rank = s >> 1;
    const along = 1 + Math.round(((rank + 0.75 * hash2(s, 1, seed)) * span) / PER_WING);
    const back = Math.floor(hash2(s, 2, seed) ** 2 * depth);
    const near = L.m - 1 - back;
    const [i, j] = s % 2 ? [near, along] : [along, near];
    const speed = unit * (0.8 + 0.45 * hash2(s, 4, seed));
    for (let d = 0; d < DROPS; d++) {
      const q = s * DROPS + d;
      f.x[q] = px(L, i, j);
      /* under the upper plate a drop is hidden until it clears the front
         edge, `back + 1` sites on; against the lower plate's face it would
         be seen for as many sites as it stands in from the far edge */
      f.y0[q] = py(L, i, j, 0) + (back + 1) * 2 * row;
      f.y1[q] = py(L, i, j, landing(i, j)) - Math.min(i, j) * 2 * row - row;
      f.speed[q] = speed;
      f.phase[q] = (hash2(s, 3, seed) + d / DROPS) % 1;
      f.prog[q] = f.phase[q];
    }
  }
  return f;
}

/** How many of a wing's streams fall: more, the wider the gap. */
const perWing = (L: Lattice, gapPx: number) => {
  const gap = gapPx / (2 * L.b * L.g * L.n);
  return Math.max(0, Math.min(PER_WING, Math.round((gap - GAP_SHUT) * STREAMS_A_UNIT)));
};

/** Paint a gap's drops, each advanced by `dt` seconds (0 holds it at rest).
    `gapPx` is the clear height between the two plates at their side corner. */
function drawFalls(
  ctx: Ctx,
  S: Scene,
  f: Falls,
  dyTop: number,
  dyBottom: number,
  gapPx: number,
  style: number,
  dt: number
): number {
  const row = S.L.b * S.L.g;
  const live = perWing(S.L, gapPx) * 2 * DROPS;
  const tail = Math.round(TRAIL * row);
  let drawn = 0;
  ctx.fillStyle = COLOURS[style];
  for (let q = 0; q < Math.min(live, f.count); q++) {
    const from = f.y0[q] + dyTop;
    const to = f.y1[q] + dyBottom;
    if (to - from < MIN_ROWS * row) continue;
    /* the head runs on past the far edge until its trail has gone too */
    const run = to - from + tail;
    if (dt > 0) f.prog[q] = (f.prog[q] + (dt * f.speed[q]) / run) % 1;
    const y = Math.round(from + f.prog[q] * run);
    for (const [back, tier] of DROP) {
      const yy = y - Math.round(back * row);
      if (yy < from || yy > to) continue;
      const size = S.sizes[tier];
      ctx.fillRect(f.x[q] - (size >> 1), yy - (size >> 1), size, size);
      drawn++;
    }
  }
  return drawn;
}

/* -- S4's own marks, restated (`paint.ts` keeps them to itself) -------------- */

function drawPop(ctx: Ctx, S: Scene, pop: Pop, dy: number, t: number) {
  const squash = S.L.b / S.L.a;
  for (const run of pop.runs) {
    ctx.fillStyle = COLOURS[run.style];
    for (let q = run.from; q < run.to; q++) {
      const size = S.sizes[pop.tier[q]];
      let x = pop.x[q];
      let y = pop.y[q] + dy;
      const amp = pop.amp[q];
      if (amp > 0) {
        /* a circle in the plate's own plane: an ellipse on screen */
        const at = pop.phase[q] + pop.rate[q] * t;
        x += Math.round(amp * Math.cos(at));
        y += Math.round(amp * squash * Math.sin(at));
      }
      ctx.fillRect(x - (size >> 1), y - (size >> 1), size, size);
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

/** The runners on the agents' traces: a bright dot stepping site to site out
    of the chip, two dimmer ones behind it. */
function drawRunners(ctx: Ctx, S: Scene, runners: Runner[], dy: number, t: number) {
  const tail = [
    [0, 3, STYLE.agentsHot],
    [1, 2, STYLE.agentsLit],
    [2, 1, STYLE.agentsLit],
  ] as const;
  for (const [back, tier, style] of tail) {
    ctx.fillStyle = COLOURS[style];
    const size = S.sizes[tier];
    for (const r of runners) {
      const n = r.x.length;
      if (n < 4) continue;
      const at = Math.floor(((r.phase * n + r.rate * t) % n) - back);
      if (at < 0) continue;
      ctx.fillRect(r.x[at] - (size >> 1), r.y[at] + dy - (size >> 1), size, size);
    }
  }
}

const GOLD = [1, 3, 5].map((at) => parseInt(HEX.gold.slice(at, at + 2), 16));

/** The layer's halo: gold light on its top face, densest at the core. */
function halo(ctx: Ctx, S: Scene, dy: number) {
  const { L } = S;
  const mid = L.m / 2;
  const cx = px(L, mid, mid);
  const cy = S.plates[1].topY + L.m * L.b * L.g + dy;
  const reach = L.m * L.a * L.g * 0.62;
  const [r, g, b] = GOLD;
  ctx.save();
  ctx.translate(cx, cy);
  /* a circle on the plate is an ellipse on screen */
  ctx.scale(1, L.b / L.a);
  const light = ctx.createRadialGradient(0, 0, 0, 0, 0, reach);
  light.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.34)`);
  light.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.14)`);
  light.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(0, 0, reach, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* -- the scene --------------------------------------------------------------- */

export interface ClearScene {
  /** S4's scene; only its lattice and its three plates are used. */
  S: Scene;
  /** What falls onto the layer, and onto the agents. */
  falls: [Falls, Falls];
  /** The three plates' thickness in rows, top face to floor. */
  thick: [number, number, number];
  /** The dots the three plates are made of, without what moves across them. */
  dots: number;
  /** The last frame's time, seconds. */
  tLast: number;
}

function buildClear(w: number, h: number, dpr: number): ClearScene {
  const S = buildScene(w, h, dpr);
  const { L } = S;
  const tops = PLATES.map((p) => kOf(L, p.body[p.body.length - 1].z1)) as [number, number, number];
  const board = kOf(L, PLATES[2].body[0].z1);
  const blocks = S.plates[2].blocks;
  /* a dot that falls onto the agents lands on whatever stands there */
  const onAgents = (i: number, j: number) => blocks.find((b) => inside(b.cells, i, j))?.k ?? board;
  return {
    S,
    falls: [wingFalls(L, 101, () => tops[1]), wingFalls(L, 211, onAgents)],
    thick: tops,
    dots: S.plates.reduce((sum, p) => sum + p.dots, 0),
    tLast: 0,
  };
}

/** How far a plate's name stands off its side corner, CSS px. */
const NAME_OFF = 30;

function paintClear(
  ctx: Ctx,
  C: ClearScene,
  open: number,
  t: number,
  el: HTMLElement,
  dpr: number
) {
  const { S } = C;
  const { L } = S;
  /* a tab left in the background comes back a long frame later: the falling
     dots take one ordinary step, not the whole absence */
  const dt = Math.min(0.1, Math.max(0, t - C.tLast));
  C.tLast = t;
  const off = offsets(L, poseAt(open));
  const [team, layer, agents] = S.plates;
  const row = L.b * L.g;
  ctx.clearRect(0, 0, L.w, L.h);

  /* the agents, and what stands on their board */
  drawPop(ctx, S, agents.base, off[2], 0);
  drawRunners(ctx, S, agents.runners, off[2], t);
  for (const b of agents.blocks) {
    mask(ctx, b.mask, off[2]);
    drawPop(ctx, S, b.pop, off[2], 0);
  }
  drawFalls(
    ctx,
    S,
    C.falls[1],
    off[1],
    off[2],
    off[2] - off[1] - C.thick[2] * row,
    STYLE.fallGold,
    dt
  );

  /* the layer, the one lit thing: a warm halo under its core, then it */
  mask(ctx, layer.mask, off[1]);
  halo(ctx, S, off[1]);
  drawPop(ctx, S, layer.base, off[1], 0);
  drawFalls(
    ctx,
    S,
    C.falls[0],
    off[0],
    off[1],
    off[1] - off[0] - C.thick[1] * row,
    STYLE.fallGreen,
    dt
  );

  /* the team, drifting */
  mask(ctx, team.mask, off[0]);
  drawPop(ctx, S, team.base, off[0], t);

  /* a plate's name, level with its side corner */
  const names = el.querySelectorAll<HTMLElement>("[data-sfse-name]");
  S.plates.forEach((p, i) => {
    const name = names[i];
    if (!name) return;
    name.style.left = `${p.right.x / dpr + NAME_OFF}px`;
    name.style.top = `${(p.right.y + off[i]) / dpr}px`;
  });
  const total = el.querySelector<HTMLElement>("[data-sfse-fact='dots']");
  const text = C.dots.toLocaleString("en-US").replace(/,/g, " ");
  if (total && total.textContent !== text) total.textContent = text;
}

export const CLEAR: SwarmPainter<ClearScene> = { build: buildClear, paint: paintClear };
