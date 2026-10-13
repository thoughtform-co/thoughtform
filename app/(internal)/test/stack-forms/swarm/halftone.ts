/* S4·G · SWARM, HALFTONE (owner, 2026-10-13: "i still like S4 Swarm … No
   lines at all: density and dot size carry the three plates. … can you make
   some iterations?").

   S4 with one thing changed, and it is his own phrase taken at its word:
   DOT SIZE carries the three plates, and nothing else does. One lattice,
   S4's own. Every site of every plate holds a dot, always: none is
   scattered, none is left out, none ever leaves its place. A dot is only
   ever larger or smaller, from a pinpoint of one grain to one that all but
   touches the next, and its tone goes with its size. The stack is a lit
   object in halftone.

   The layer is the light: its core is the largest, whitest dots and it
   tapers to pinpoints at its corners. The team's four workstreams are four
   swells on one relief: their skirts meet, so the plate is a surface and
   not four things on a floor. On the agents the chip and the four modules
   are the large dots, and they stop short of white: the layer's core is the
   one white thing. The traces are a middle size, the board pinpoints that
   grow a little where the layer's light falls. An edge is a row of one size
   and a wall is rows of another, so each plate keeps its silhouette and its
   thickness.

   What moves is size. The workstreams breathe, one after the other; a ring
   of size goes out from the layer's core; a pulse of size runs each trace
   from the chip, and the module swells as it arrives.

   No React; the canvas is handed in. */

import { HEX, PLATES, poseAt, SIDE, type Tone } from "../model";

import { type Cells, fitLattice, kOf, type Lattice, offsets, outline, px, py } from "./dots";
import type { SwarmPainter } from "./useSwarmCanvas";

const TAU = Math.PI * 2;

/* -- the form: how large a dot is, 0 (a pinpoint) to 1 (it all but touches) -- */

const FORM = {
  /** A plate's edge, and its two walls (the nearer to the light first). */
  rim: 0.3,
  wall: [0.3, 0.16],
  team: {
    /** A workstream at its middle. */
    peak: 0.92,
    /** How far its swell runs, in half-tiles: past 1 its skirt meets the next
        one's, so the four stand on one relief and not on a bare floor. */
    reach: 1.5,
    /** The rule of the tools they have, at its middle. */
    rail: 0.3,
  },
  layer: {
    /** The light reaches this far from the core, in units; and its falloff. */
    reach: 6.2,
    curve: 1.15,
    rim: 0.43,
    wall: [0.43, 0.29],
  },
  agents: {
    chip: 0.9,
    module: 0.7,
    trace: 0.43,
    /** The layer's light on the board under it, at its middle. */
    light: 0.24,
    reach: 4.2,
  },
} as const;

/* -- the motion: all of it is size ------------------------------------------ */

const MOVE = {
  /** A workstream swells and shrinks by this share of its reach. */
  breath: 0.16,
  breathEvery: 9,
  /** A ring of size goes out from the layer's core. */
  ring: 0.15,
  ringEvery: 8,
  ringWidth: 0.7,
  ringFar: 6.2,
  /** A pulse of size on a trace: sites a second, sites wide, sites of rest. */
  pulse: 0.36,
  pulseRate: 5,
  pulseWidth: 1.3,
  pulseRest: 12,
  /** The module it reaches swells by this much. */
  arrive: 0.18,
} as const;

/** How square a workstream's swell is: it keeps to its tile's own outline. */
const TILE_ROUND = 5;

const STILL = 0;
const SWELL = 1;
const RING = 2;
const TRACE = 3;
const MODULE = 4;

/* -- populations ------------------------------------------------------------ */

interface Raw {
  x: number;
  y: number;
  /** Its size at rest, 0..1. */
  v: number;
  kind: number;
  /** What its mover reads: see the painter. */
  p: number;
  q: number;
  /** The least it may be, whatever moves it. */
  f: number;
}

export interface HalfPop {
  count: number;
  x: Int32Array;
  y: Int32Array;
  v: Float32Array;
  kind: Uint8Array;
  p: Float32Array;
  q: Float32Array;
  f: Float32Array;
  /** Each dot's size this frame, as a level. Scratch: refilled every paint. */
  lv: Uint8Array;
}

function pack(raw: Raw[]): HalfPop {
  const n = raw.length;
  const pop: HalfPop = {
    count: n,
    x: new Int32Array(n),
    y: new Int32Array(n),
    v: new Float32Array(n),
    kind: new Uint8Array(n),
    p: new Float32Array(n),
    q: new Float32Array(n),
    f: new Float32Array(n),
    lv: new Uint8Array(n),
  };
  raw.forEach((d, i) => {
    pop.x[i] = d.x;
    pop.y[i] = d.y;
    pop.v[i] = d.v;
    pop.kind[i] = d.kind;
    pop.p[i] = d.p;
    pop.q[i] = d.q;
    pop.f[i] = d.f;
  });
  return pop;
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
/** A swell's profile: whole near its middle, tapering to nothing at 1. */
const swell = (d: number, taper: number) => smooth((1 - d) / taper);
/** A workstream's: one slope from its middle out to its reach. */
const teamSwell = (d: number) => FORM.team.peak * smooth(1 - d / FORM.team.reach);

interface Spot {
  cx: number;
  cy: number;
  half: number;
}
const spotOf = (b: { x0: number; x1: number; y0: number; y1: number }): Spot => ({
  cx: (b.x0 + b.x1) / 2,
  cy: (b.y0 + b.y1) / 2,
  half: (b.x1 - b.x0) / 2,
});
/** How far out of a spot a point is, 1 at its edge: `round` 2 is a circle,
    more is squarer. */
const out = (s: Spot, u: number, w: number, round: number) =>
  (Math.abs((u - s.cx) / s.half) ** round + Math.abs((w - s.cy) / s.half) ** round) ** (1 / round);

const still = (x: number, y: number, v: number): Raw => ({
  x,
  y,
  v,
  kind: STILL,
  p: 0,
  q: 0,
  f: 0,
});

/** The two walls a viewer sees, as rows of one size each. */
function walls(L: Lattice, rows: readonly number[], size: readonly [number, number], to: Raw[]) {
  for (const k of rows) {
    for (let i = 0; i <= L.m; i++) to.push(still(px(L, i, L.m), py(L, i, L.m, k), size[0]));
    for (let j = 0; j < L.m; j++) to.push(still(px(L, L.m, j), py(L, L.m, j, k), size[1]));
  }
}

const onRim = (L: Lattice, i: number, j: number) => i === 0 || j === 0 || i === L.m || j === L.m;

/* the team: four workstreams, four swells of size */
function teamDots(L: Lattice): Raw[] {
  const plate = PLATES[0];
  const kt = kOf(L, plate.top);
  const tiles = plate.features.filter((f) => f.kind === "tile").map((f) => spotOf(f.box));
  const rail = plate.features.find((f) => f.kind === "rail")!.box;
  const railMid = (rail.x0 + rail.x1) / 2;
  const to: Raw[] = [];
  const rows: number[] = [];
  for (let k = 0; k < kt; k += 2) rows.push(k);
  walls(L, rows, FORM.wall, to);

  for (let i = 0; i <= L.m; i++)
    for (let j = 0; j <= L.m; j++) {
      const x = px(L, i, j);
      const y = py(L, i, j, kt);
      const u = i / L.n;
      const w = j / L.n;
      if (onRim(L, i, j)) {
        to.push(still(x, y, FORM.rim));
        continue;
      }
      let near = 0;
      let d = Infinity;
      tiles.forEach((s, n) => {
        const dn = out(s, u, w, TILE_ROUND);
        if (dn < d) [d, near] = [dn, n];
      });
      /* the tools they have: one rule along an edge, a size up from the floor */
      const tools =
        w >= rail.y0 && w <= rail.y1
          ? FORM.team.rail * smooth(1 - Math.abs(u - railMid) / (rail.x1 - railMid))
          : 0;
      if (d < FORM.team.reach * (1 + MOVE.breath))
        to.push({ x, y, v: Math.max(tools, teamSwell(d)), kind: SWELL, p: near, q: d, f: tools });
      else to.push(still(x, y, tools));
    }
  return to;
}

/* the layer: the light. Its core the largest dots, pinpoints at its corners */
function layerDots(L: Lattice): Raw[] {
  const plate = PLATES[1];
  const kt = kOf(L, plate.top);
  const to: Raw[] = [];
  /* three strata on the walls: a band of rows each, dark between them */
  const rows: number[] = [];
  for (const b of plate.body) {
    const mid = Math.min(kt - 1, kOf(L, (b.z0 + b.z1) / 2));
    rows.push(mid);
    if (L.n >= 4 && mid + 1 < kt) rows.push(mid + 1);
  }
  walls(L, [...new Set(rows)], FORM.layer.wall, to);

  const c = SIDE / 2;
  for (let i = 0; i <= L.m; i++)
    for (let j = 0; j <= L.m; j++) {
      const r = Math.hypot(i / L.n - c, j / L.n - c);
      const v = Math.max(0, 1 - r / FORM.layer.reach) ** FORM.layer.curve;
      const x = px(L, i, j);
      const y = py(L, i, j, kt);
      if (onRim(L, i, j)) to.push(still(x, y, Math.max(v, FORM.layer.rim)));
      else to.push({ x, y, v, kind: RING, p: r, q: 0, f: 0 });
    }
  return to;
}

/** Lattice sites along a trace, vertex to vertex. */
function traceSites(L: Lattice, pts: readonly (readonly [number, number])[]): [number, number][] {
  const snap = (v: number) => Math.round(v * L.n);
  const sites: [number, number][] = [];
  for (let s = 1; s < pts.length; s++) {
    const [i0, j0] = [snap(pts[s - 1][0]), snap(pts[s - 1][1])];
    const [i1, j1] = [snap(pts[s][0]), snap(pts[s][1])];
    const steps = Math.max(Math.abs(i1 - i0), Math.abs(j1 - j0));
    for (let q = s === 1 ? 0 : 1; q <= steps; q++)
      sites.push([
        Math.round(i0 + ((i1 - i0) * q) / Math.max(1, steps)),
        Math.round(j0 + ((j1 - j0) * q) / Math.max(1, steps)),
      ]);
  }
  return sites;
}

export interface Wire {
  /** Sites from the chip to its module. */
  len: number;
  /** Where its pulse stands at rest, 0..1 of its round. */
  phase: number;
}

/* the agents: the chip and four modules the large dots, the traces a middle
   size, the board pinpoints, a little larger where the layer's light falls */
function agentsDots(L: Lattice): { dots: Raw[]; wires: Wire[]; top: number } {
  const plate = PLATES[2];
  const kb = kOf(L, plate.body[0].z1);
  const chip = spotOf(plate.features.find((f) => f.kind === "chip")!.box);
  const modules = plate.features.filter((f) => f.kind === "module").map((f) => spotOf(f.box));
  const to: Raw[] = [];
  const rows: number[] = [];
  for (let k = 0; k < kb; k += 2) rows.push(k);
  walls(L, rows, FORM.wall, to);

  /* each trace's sites, and the module it ends at */
  const onTrace = new Map<number, [number, number]>();
  const ends: number[] = [];
  const wires: Wire[] = plate.traces.map((t, n) => {
    const sites = traceSites(L, t.pts);
    sites.forEach(([i, j], at) => {
      const key = i * 4096 + j;
      if (!onTrace.has(key)) onTrace.set(key, [n, at]);
    });
    const [ei, ej] = sites[sites.length - 1];
    let end = 0;
    modules.forEach((m, k) => {
      if (out(m, ei / L.n, ej / L.n, 2) < out(modules[end], ei / L.n, ej / L.n, 2)) end = k;
    });
    ends[end] = n;
    return { len: sites.length, phase: (0.21 + n * 0.37) % 1 };
  });

  const c = SIDE / 2;
  for (let i = 0; i <= L.m; i++)
    for (let j = 0; j <= L.m; j++) {
      const x = px(L, i, j);
      const y = py(L, i, j, kb);
      const u = i / L.n;
      const w = j / L.n;
      if (onRim(L, i, j)) {
        to.push(still(x, y, FORM.rim));
        continue;
      }
      const floor =
        FORM.agents.light * Math.max(0, 1 - Math.hypot(u - c, w - c) / FORM.agents.reach) ** 1.5;
      const core = swell(out(chip, u, w, 6), 0.4);
      const k = modules.findIndex((m) => out(m, u, w, 5) < 1);
      const run = onTrace.get(i * 4096 + j);
      if (core > 0) to.push(still(x, y, floor + (FORM.agents.chip - floor) * core));
      else if (k >= 0) {
        const body = swell(out(modules[k], u, w, 5), 0.5);
        to.push({
          x,
          y,
          v: floor + (FORM.agents.module - floor) * body,
          kind: MODULE,
          p: body,
          q: ends[k] ?? 0,
          f: 0,
        });
      } else if (run)
        to.push({ x, y, v: FORM.agents.trace, kind: TRACE, p: run[1], q: run[0], f: 0 });
      else to.push(still(x, y, floor));
    }
  return { dots: to, wires, top: kb };
}

/* -- the scene --------------------------------------------------------------- */

export interface HalfPlate {
  pop: HalfPop;
  mask: Int32Array;
  /** A colour a size, the smallest first. */
  paint: string[];
  /** Where its words stand: level with its side corner, at lift 0. */
  corner: { x: number; y: number };
}

export interface HalfScene {
  L: Lattice;
  /** A dot's sizes, device px, the pinpoint first. */
  sizes: number[];
  plates: [HalfPlate, HalfPlate, HalfPlate];
  wires: Wire[];
  /** Each workstream's place in the round of breathing, radians. */
  turn: number[];
  /** The plates' dots, all told: it never changes, no dot comes or goes. */
  dots: number;
  /** The smallest and the largest dot at rest, device px. */
  span: [number, number];
  lead: string;
  labelX: number;
  /** What the words were last seated to. */
  seated: string;
}

const rgbOf = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
const GROUND = rgbOf(HEX.void);
const mix = (a: number[], b: number[], t: number) => a.map((v, n) => v + (b[n] - v) * clamp01(t));
const css = (c: number[]) => `rgb(${c.map((v) => Math.round(v)).join(", ")})`;

/** A plate's tone, a colour a size: from `low` of it for a pinpoint to
    `high` for the large. The layer's largest go on to white: its core is
    hot, and it is the one white thing in the stack. */
function ramp(tone: Tone, levels: number, [low, high]: readonly number[], hot: boolean): string[] {
  return Array.from({ length: levels }, (_, s) => {
    const t = levels > 1 ? s / (levels - 1) : 1;
    let c = mix(GROUND, rgbOf(HEX[tone]), low + (high - low) * Math.min(1, t / 0.6));
    if (hot && t > 0.6) c = mix(c, rgbOf(HEX.bone), (t - 0.6) / 0.4);
    return css(c);
  });
}

const levelOf = (v: number, levels: number) =>
  Math.min(levels - 1, Math.max(0, Math.round(v * (levels - 1))));

export function buildHalftone(w: number, h: number, dpr: number): HalfScene {
  const L = fitLattice(w, h, dpr);
  /* the largest dot leaves one grain between it and the next along a row */
  const levels = L.a - 1;
  const sizes = Array.from({ length: levels }, (_, s) => (s + 1) * L.g);
  const all: Cells = { i0: 0, i1: L.m, j0: 0, j1: L.m };
  const agents = agentsDots(L);
  const tops = [kOf(L, PLATES[0].top), kOf(L, PLATES[1].top), agents.top];
  const raws = [teamDots(L), layerDots(L), agents.dots];
  /* the agents stop short of white: the layer is the light */
  const tones = [
    [0.78, 1],
    [0.8, 1],
    [0.5, 0.84],
  ];

  const plates = PLATES.map(
    (plate, i): HalfPlate => ({
      pop: pack(raws[i]),
      mask: outline(L, all, 0, tops[i]),
      paint: ramp(plate.tone, levels, tones[i], plate.lit),
      corner: { x: px(L, L.m, 0), y: py(L, L.m, 0, Math.round(tops[i] / 2)) },
    })
  ) as HalfScene["plates"];

  let [small, large] = [levels - 1, 0];
  for (const raw of raws)
    for (const d of raw) {
      const lv = levelOf(d.v, levels);
      small = Math.min(small, lv);
      large = Math.max(large, lv);
    }

  return {
    L,
    sizes,
    plates,
    wires: agents.wires,
    /* back to front: the breath crosses the team, it does not beat */
    turn: PLATES[0].features
      .filter((f) => f.kind === "tile")
      .map((f) => -(f.box.x0 + f.box.y0) * 0.5),
    dots: plates.reduce((sum, p) => sum + p.pop.count, 0),
    span: [sizes[small], sizes[large]],
    lead: css(mix(GROUND, rgbOf(HEX.bone), 0.3)),
    labelX: px(L, L.m, 0) + 13 * L.a * L.g,
    seated: "",
  };
}

/* -- one frame --------------------------------------------------------------- */

const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");
const px1 = (n: number) => String(Math.round(n * 10) / 10);

export function paintHalftone(
  ctx: CanvasRenderingContext2D,
  S: HalfScene,
  open: number,
  t: number,
  el: HTMLElement,
  dpr: number
) {
  const { L, sizes } = S;
  const levels = sizes.length;
  const off = offsets(L, poseAt(open));
  ctx.clearRect(0, 0, L.w, L.h);

  /* what moves, worked out once a frame. All of it is nothing at t = 0 but
     the pulses, which rest part of the way along their traces. */
  const reach = S.turn.map(
    (at) => 1 + MOVE.breath * (Math.sin((TAU * t) / MOVE.breathEvery + at) - Math.sin(at)) * 0.5
  );
  const round = (t / MOVE.ringEvery) % 1;
  const ringAt = round * MOVE.ringFar;
  const ring = MOVE.ring * Math.sin(Math.PI * round) ** 0.7;
  const pulseAt = S.wires.map((wire) => {
    const whole = wire.len + MOVE.pulseRest;
    return ((wire.phase + (t * MOVE.pulseRate) / whole) % 1) * whole;
  });
  const bell = (d: number, width: number) => Math.exp(-(d * d) / (2 * width * width));

  for (const i of [2, 1, 0] as const) {
    const plate = S.plates[i];
    const { pop } = plate;
    const dy = off[i];

    /* its name: a run of pinpoints out to it, level with its corner */
    ctx.fillStyle = S.lead;
    for (let n = 2; n < 12; n++)
      ctx.fillRect(plate.corner.x + n * L.a * L.g, plate.corner.y + dy, L.g, L.g);

    /* painter's order, the ground as the mask */
    ctx.fillStyle = HEX.void;
    ctx.beginPath();
    ctx.moveTo(plate.mask[0], plate.mask[1] + dy);
    for (let q = 2; q < plate.mask.length; q += 2)
      ctx.lineTo(plate.mask[q], plate.mask[q + 1] + dy);
    ctx.closePath();
    ctx.fill();

    /* every dot's size this frame */
    for (let q = 0; q < pop.count; q++) {
      let v = pop.v[q];
      switch (pop.kind[q]) {
        case SWELL:
          v = Math.max(pop.f[q], teamSwell(pop.q[q] / reach[pop.p[q]]));
          break;
        case RING:
          v += ring * bell(pop.p[q] - ringAt, MOVE.ringWidth);
          break;
        case TRACE:
          v += MOVE.pulse * bell(pop.p[q] - pulseAt[pop.q[q]], MOVE.pulseWidth);
          break;
        case MODULE: {
          const wire = S.wires[pop.q[q]];
          v += MOVE.arrive * pop.p[q] * bell(pulseAt[pop.q[q]] - wire.len, 2.2);
          break;
        }
      }
      pop.lv[q] = levelOf(v, levels);
    }
    /* painted a size at a time: one colour a size */
    for (let s = 0; s < levels; s++) {
      const size = sizes[s];
      const half = size >> 1;
      ctx.fillStyle = plate.paint[s];
      for (let q = 0; q < pop.count; q++)
        if (pop.lv[q] === s) ctx.fillRect(pop.x[q] - half, pop.y[q] + dy - half, size, size);
    }
  }

  /* the words keep level with their plate; they only move when it does */
  const key = off.join(",");
  if (key !== S.seated) {
    S.seated = key;
    el.querySelectorAll<HTMLElement>("[data-sfsh-label]").forEach((label, i) => {
      label.style.left = `${S.labelX / dpr}px`;
      label.style.top = `${(S.plates[i].corner.y + off[i]) / dpr}px`;
    });
    const dots = el.querySelector<HTMLElement>("[data-sfsh-fact='dots']");
    const span = el.querySelector<HTMLElement>("[data-sfsh-fact='span']");
    if (dots) dots.textContent = fmt(S.dots);
    if (span) span.textContent = `${px1(S.span[0] / dpr)} to ${px1(S.span[1] / dpr)} px`;
  }
}

export const HALFTONE: SwarmPainter<HalfScene> = { build: buildHalftone, paint: paintHalftone };
