/* S4 · SWARM: one frame, painted. No React; the canvas is handed in.

   Occlusion is painter's order with the ground as a mask: the agents, what
   falls onto them, then the layer's silhouette in the ground's own colour
   and the layer, and so on up. A dot that leaves the underside of a plate
   is therefore hidden until it has fallen clear of the plate's front edge,
   which is what a real one would be. */

import { HEX, type Pose } from "../model";

import {
  DROPS,
  falling,
  type Fallers,
  offsets,
  type Pop,
  px,
  type Runner,
  type Scene,
  STYLE,
  STYLE_PAINT,
} from "./dots";

const rgbOf = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
const GROUND = rgbOf(HEX.void);

/** Every style as one opaque colour: its tone over the ground. */
export const COLOURS: readonly string[] = STYLE_PAINT.map(([tone, a]) => {
  const c = rgbOf(HEX[tone]);
  const [r, g, b] = c.map((v, n) => Math.round(GROUND[n] + (v - GROUND[n]) * a));
  return `rgb(${r}, ${g}, ${b})`;
});

type Ctx = CanvasRenderingContext2D;

function drawPop(ctx: Ctx, S: Scene, pop: Pop, dy: number, t: number): number {
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
  return pop.count;
}

function mask(ctx: Ctx, poly: Int32Array, dy: number) {
  ctx.fillStyle = HEX.void;
  ctx.beginPath();
  ctx.moveTo(poly[0], poly[1] + dy);
  for (let q = 2; q < poly.length; q += 2) ctx.lineTo(poly[q], poly[q + 1] + dy);
  ctx.closePath();
  ctx.fill();
}

/** A drop and the dots it trails, each a row and a half behind the last and
    a size smaller: size, not paint, is what fades. */
const DROP = [
  [0, 3],
  [1.6, 2],
  [3.2, 1],
  [4.8, 0],
] as const;

/** Dots falling from the plate at `dyTop` to the one at `dyBottom`. Against
    the ground a drop is the tone of the plate it left; with `spark`, once it
    is seen against the plate below it is a spark of that plate's light. Each
    drop is advanced by `dt` seconds here (0 holds it at its rest phase). */
function drawFall(
  ctx: Ctx,
  S: Scene,
  f: Fallers,
  dyTop: number,
  dyBottom: number,
  style: number,
  spark: number | null,
  dt: number
): number {
  const row = S.L.b * S.L.g;
  let drawn = 0;
  for (let q = 0; q < f.count; q++) {
    const gap = f.y1[q] + dyBottom - (f.y0[q] + dyTop);
    if (q < falling(S.L, gap) * DROPS && dt > 0)
      f.prog[q] = (f.prog[q] + (dt * f.speed[q]) / gap) % 1;
  }
  for (const pass of spark === null ? [style] : [style, spark]) {
    ctx.fillStyle = COLOURS[pass];
    for (let q = 0; q < f.count; q++) {
      const from = f.y0[q] + dyTop;
      const land = f.y1[q] + dyBottom;
      const gap = land - from;
      if (q >= falling(S.L, gap) * DROPS) continue;
      const y = Math.round(from + f.prog[q] * gap);
      for (const [back, tier] of DROP) {
        const yy = y - Math.round(back * row);
        if (yy < from) continue;
        const lit = spark !== null && land - yy <= f.over[q];
        if (lit !== (pass === spark)) continue;
        /* a spark is a size smaller: it is light, not a body */
        const size = S.sizes[lit ? Math.max(0, tier - 1) : tier];
        ctx.fillRect(f.x[q] - (size >> 1), yy - (size >> 1), size, size);
        drawn++;
      }
    }
  }
  return drawn;
}

/** The runners on the agents' traces: a bright dot stepping site to site out
    of the chip, two dimmer ones behind it. */
function drawRunners(ctx: Ctx, S: Scene, runners: Runner[], dy: number, t: number): number {
  let drawn = 0;
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
      drawn++;
    }
  }
  return drawn;
}

/** The layer's halo: gold light on its top face, densest at the core. It
    is light, not a mark: the dots stay the only things drawn. */
function halo(ctx: Ctx, S: Scene, dy: number) {
  const { L } = S;
  const mid = L.m / 2;
  const cx = px(L, mid, mid);
  /* the face's middle is a plate's side further down the screen than its back corner */
  const cy = S.plates[1].topY + L.m * L.b * L.g + dy;
  const reach = L.m * L.a * L.g * 0.62;
  const [r, g, b] = rgbOf(HEX.gold);
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

export interface Painted {
  /** Every dot on the canvas this frame. */
  dots: number;
  /** Each plate's screen offset, device px. */
  off: [number, number, number];
}

/** Paint the scene in a pose at time `t`, `dt` after the last frame (both
    seconds; 0 and 0 is the rest frame). */
export function paintScene(ctx: Ctx, S: Scene, pose: Pose, t: number, dt: number): Painted {
  const off = offsets(S.L, pose);
  const [team, layer, agents] = S.plates;
  ctx.clearRect(0, 0, S.L.w, S.L.h);
  let dots = drawPop(ctx, S, S.bed, S.bedY, 0);
  S.plates.forEach((p, i) => {
    dots += drawPop(ctx, S, p.leads, off[i], 0);
  });

  /* the agents, and what stands on their board */
  mask(ctx, agents.mask, off[2]);
  dots += drawPop(ctx, S, agents.base, off[2], 0);
  dots += drawRunners(ctx, S, agents.runners, off[2], t);
  for (const b of agents.blocks) {
    mask(ctx, b.mask, off[2]);
    dots += drawPop(ctx, S, b.pop, off[2], 0);
  }
  dots += drawFall(ctx, S, S.falls[1], off[1], off[2], STYLE.fallGold, null, dt);

  /* the layer, the one lit thing: a warm halo under its core, then it */
  mask(ctx, layer.mask, off[1]);
  halo(ctx, S, off[1]);
  dots += drawPop(ctx, S, layer.base, off[1], 0);
  dots += drawFall(ctx, S, S.falls[0], off[0], off[1], STYLE.fallGreen, STYLE.spark, dt);

  /* the team, drifting */
  mask(ctx, team.mask, off[0]);
  dots += drawPop(ctx, S, team.base, off[0], t);
  return { dots, off };
}
