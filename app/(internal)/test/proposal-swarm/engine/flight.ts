/* Where every dot is, at any point of the scroll. PURE.

   The act is five states and the two hops between them, all read off the
   clocks (`clocks.ts`), so it plays both ways and a frame is repeatable:

     the opening   the stack closed in its seat (A)
     HOP 1         it leaves, plate by plate, and prints itself opened in the
                   steps' seat (B)
     the steps     the stack on the section's own clock: it travels, closes
     HOP 2         the closed stack turns to face the reader as one object
                   and its plates settle into three level bars (`turn.ts`)
     the network   the bars shrink to Marketing's node as the view draws
                   back, then dots leave along each team's lane

   The first hop is never one move of the whole, and how it goes is the
   page's one switch. The second is the turn, whichever way the first went
   (owner, 2026-10-14: "I don't think we need that particle transition
   because we get a frontal view"):

     fall    each plate falls whole, mostly downward, the bottom plate first,
             what stands on the agents' board ahead of it, a few dots
             straggling with trails behind them
     scan    as a terminal prints: the plate is sent a row at a time, each
             row a rigid line of dots stepping on the lattice, the rows
             one after another at an even pitch, plumb to the line they
             land on, then level into place; the bottom plate first
             (owner, 2026-10-14, on march's clouds: "I don't really like
             the pancake shape … Isn't there something closer to our
             aesthetic of terminal interfaces?")
     march   a level run, a 45-degree cut, a plumb run: files of dots on
             lanes, a row landing as a row
     drift   a loose cloud: each dot starts when its own number says, and
             goes by a waypoint of its own on two straight legs
     rigid   every dot together on one straight line: the travel as it was,
             kept as the control */

import { type Clocks, arriveLight, hop2T, networkAt, TURN_LEN, turnOf } from "./clocks";
import { along, type Org, SHOW, type Targets } from "./formations";
import { type Pool, rowAt } from "./pool";
import { hullOf, lensAt, project, topPlane, type Turn } from "./turn";
import { STYLE } from "../../stack-forms/swarm/dots";

const STYLE_LIT = { team: STYLE.teamLit, layer: STYLE.layerLit, agents: STYLE.agentsLit } as const;

export type Fly = "fall" | "march" | "drift" | "rigid" | "scan";
export const FLIES: readonly Fly[] = ["fall", "march", "drift", "rigid", "scan"];

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** A dot on its way: off at once, settling as it lands. Eased in, a dot
    covers a hundredth of its way in the first sixth of its time, and with
    every dot doing so a hop began with a stretch of scroll in which nothing
    was seen to leave (owner, 2026-10-14: "a weird dead space where the
    three stacks move … rigidly instead of through the elegant particle
    flow"). */
const flow = (t: number) => 1 - (1 - t) * (1 - t);

/** A seat of the stack: its lattice's origin on the canvas and each plate's
    lift, device px. */
export interface Seat {
  ox: number;
  oy: number;
  lift: readonly [number, number, number];
}

/** A hop's timing, on its own 0..1 clock. */
export interface HopSpec {
  /** When each plate's first dot leaves, team first. */
  lead: readonly [number, number, number];
  /** How long a plate takes to send its last dot after its first. */
  spread: number;
  /** A dot's own lateness, at most. */
  jitter: number;
  /** How long one dot is on the way. */
  dur: number;
  /** Which leg a march takes first: the level run, or the plumb one. */
  first: "h" | "v";
}

/* it ends at 1 exactly: the last dot of the last plate lands as the hop does */
/* the first hop builds the stack from the ground up: the agents leave first
   and land first, then the layer, and the team last (owner, 2026-10-14:
   "it should be bottom, middle and THEN the first layer"). The first
   plate's first row is off the moment the hop begins. */
/* The first hop marches plumb first: a dot drops out of the stack, as
   S4·E's own drops do, and then files level along its row into its seat.
   Level first, it would cross the tool cards, which stand beside the
   stack at its own height. */
export const HOP1: HopSpec = {
  lead: [0.16, 0.08, 0],
  spread: 0.26,
  jitter: 0.03,
  dur: 0.55,
  first: "v",
};
const DRIFT_DUR = 0.55;

/* -- the fall --------------------------------------------------------------------

   The owner, 2026-10-14, after the scan: "I don't like how our artifacts are
   being flattened. What I liked in one of the previous versions is that the
   nodes on the gray panel just dropped down and then the rest followed. It
   should be more of a vertical motion. I don't want it to look flat and 2D
   or to rotate, morph, or warp too much."

   So a plate falls WHOLE: every dot of it on the same way at nearly the same
   moment, so it keeps its depth and its shape all the way down. What stands
   on the agents' board (the chip and the modules) drops first and the board
   follows; the front of a plate leaves a hair before its back; and a few of
   its dots straggle, each one trailing two smaller dots behind it as S4·E's
   own drops do. The way is mostly down: down on a sine, and across in the
   middle of the fall, so it leaves straight down and settles straight down. */

export const FALL = {
  /** When each plate starts, team first: the bottom plate first. */
  lead1: [0.34, 0.17, 0] as const,
  /** What stands on the agents' board (the nodes) drops first, one after
      another over this much; the board itself follows by `board`. */
  nodes: 0.03,
  board: 0.04,
  /** The share of a plate's dots that fall as its body, together, so the
      body stays the exact lattice it is at rest; the rest straggle, at
      most `straggle` after it, and trail. */
  keep: 0.85,
  straggle: 0.12,
  dur: 0.48,
  /** How far behind on its way a straggler's two trailing dots are. */
  trail: [0.05, 0.1] as const,
} as const;

const smooth = (t: number) => t * t * (3 - 2 * t);
const sine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

/** A fall from a to b, `e` of it, into `out`: down on a sine, across in the
    middle of it. */
export function fallTo(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  e: number,
  out: number[]
): void {
  const ex = smooth(seg(e, 0.18, 0.82));
  const ey = sine(clamp01(e));
  out[0] = ax + (bx - ax) * ex;
  out[1] = ay + (by - ay) * ey;
}

/** When a dot starts to fall, on its hop's clock. */
export function fallStart(P: Pool, d: number, lead: readonly number[]): number {
  const h = P.h[d];
  /* a node drops whole (its dots share one number), the nodes one after
     another, all of them before the board */
  if (P.solid[d]) return lead[P.plate[d]] + FALL.nodes * h;
  const late = h > FALL.keep ? FALL.straggle * ((h - FALL.keep) / (1 - FALL.keep)) ** 1.5 : 0;
  return lead[P.plate[d]] + FALL.board + late;
}

/** A straggler, or a node: the dots that trail as they fall. */
const trails = (P: Pool, d: number) => P.solid[d] === 1 || P.h[d] > FALL.keep;

/** When a plate's body starts to fall. */
const bodyStart = (lead: readonly number[], p: number) => lead[p] + FALL.board;

/* -- the scan ------------------------------------------------------------------ */

/** A scan's timing: how long one row is on its way, and how early the last
    row lands, so a hop's end is its rest to the pixel. */
export const SCAN = { dur: 0.3, slack: 0.03 } as const;

/** The order a scan sends its rows in. */
export interface Scan {
  /** Each dot's start on its hop's clock: its row's. */
  start: Float32Array;
  /** When each plate's first row leaves and its last, team first. */
  plates: [number, number][];
  dur: number;
}

/**
 * The rows of a hop in order: `key` gives a dot's row, smaller first, and
 * every dot of a row starts together. Rows leave at an even pitch over the
 * hop, so the rows on their way stand an even pitch apart.
 */
export function scanOf(pool: Pool, key: (d: number) => number, dur: number = SCAN.dur): Scan {
  const keys = new Float64Array(pool.count);
  const ds: number[] = [];
  for (let d = 0; d < pool.own; d++) {
    keys[d] = Math.round(key(d));
    ds.push(d);
  }
  ds.sort((p, q) => keys[p] - keys[q] || p - q);
  const rowOf = new Int32Array(pool.count);
  let rows = 0;
  ds.forEach((d, i) => {
    if (i > 0 && keys[d] !== keys[ds[i - 1]]) rows++;
    rowOf[d] = rows;
  });
  const span = 1 - dur - SCAN.slack;
  /* a rider never leaves a seat on a hop: it is not seen until the teams' */
  const start = new Float32Array(pool.count).fill(2);
  const plates: [number, number][] = [
    [1, 0],
    [1, 0],
    [1, 0],
  ];
  for (const d of ds) {
    const s = rows > 0 ? (rowOf[d] / rows) * span : 0;
    start[d] = s;
    const window = plates[pool.plate[d]];
    window[0] = Math.min(window[0], s);
    window[1] = Math.max(window[1], s);
  }
  return { start, plates, dur };
}

/**
 * A scan's way from a to b, `e` of it, into `out`: plumb to the line it
 * lands on, then level into its place, in whole steps of the lattice
 * counted back from where it lands, so a row on its way is still a row of
 * the grid, and it lands to the pixel.
 */
export function scanTo(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  e: number,
  stepX: number,
  stepY: number,
  out: number[]
): void {
  if (e <= 0) {
    out[0] = ax;
    out[1] = ay;
    return;
  }
  if (e >= 1) {
    out[0] = bx;
    out[1] = by;
    return;
  }
  const dx = bx - ax;
  const dy = by - ay;
  const left = (1 - e) * (Math.abs(dx) + Math.abs(dy));
  if (left > Math.abs(dx)) {
    out[0] = ax;
    out[1] = by - Math.sign(dy) * Math.round((left - Math.abs(dx)) / stepY) * stepY;
  } else {
    out[0] = bx - Math.sign(dx) * Math.round(left / stepX) * stepX;
    out[1] = by;
  }
}

/** That way's corners, for the guard: plumb, then level. */
export const scanRoute = (ax: number, ay: number, bx: number, by: number): [number, number][] => [
  [ax, ay],
  [ax, by],
  [bx, by],
];

/** A row on its way is lit, as a line being written is. */
const WRITING = [STYLE_LIT.team, STYLE_LIT.layer, STYLE_LIT.agents] as const;

/** How far one dot is through a hop whose clock reads `T`, eased. */
export function dotT(
  T: number,
  plate: number,
  rank: number,
  h: number,
  fly: Fly,
  spec: HopSpec
): number {
  if (fly === "rigid") return ease(clamp01(T));
  if (fly === "drift") return flow(seg(T, h * (1 - DRIFT_DUR), h * (1 - DRIFT_DUR) + DRIFT_DUR));
  const start = spec.lead[plate] + rank * spec.spread + h * spec.jitter;
  return flow(seg(T, start, start + spec.dur));
}

/** When a plate's first dot has left and its last has landed. */
export function plateWindow(plate: number, fly: Fly, spec: HopSpec): [number, number] {
  if (fly !== "march") return [0, 1];
  return [spec.lead[plate], spec.lead[plate] + spec.spread + spec.jitter + spec.dur];
}

/**
 * A point `e` of the way from a to b, into `out`. March: level, a cut, then
 * plumb. Drift: by a waypoint off to one side. Rigid: the straight line.
 */
export function moveTo(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  e: number,
  fly: Fly,
  h: number,
  cut: number,
  out: number[],
  first: "h" | "v" = "h"
): void {
  if (e <= 0) {
    out[0] = ax;
    out[1] = ay;
    return;
  }
  if (e >= 1) {
    out[0] = bx;
    out[1] = by;
    return;
  }
  const dx = bx - ax;
  const dy = by - ay;
  if (fly === "rigid") {
    out[0] = ax + dx * e;
    out[1] = ay + dy * e;
    return;
  }
  if (fly === "drift") {
    const side = (h - 0.5) * 0.36;
    const mx = ax + dx * 0.5 - dy * side;
    const my = ay + dy * 0.5 + dx * side;
    if (e < 0.5) {
      out[0] = ax + (mx - ax) * e * 2;
      out[1] = ay + (my - ay) * e * 2;
    } else {
      out[0] = mx + (bx - mx) * (e * 2 - 1);
      out[1] = my + (by - my) * (e * 2 - 1);
    }
    return;
  }
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const c = Math.min(cut, adx, ady);
  const level = adx - c;
  const diagonal = c * Math.SQRT2;
  const plumb = ady - c;
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  let s = e * (level + diagonal + plumb);
  if (first === "v") {
    if (s <= plumb) {
      out[0] = ax;
      out[1] = ay + sy * s;
      return;
    }
    s -= plumb;
    if (s <= diagonal) {
      const d = s / Math.SQRT2;
      out[0] = ax + sx * d;
      out[1] = ay + sy * (plumb + d);
      return;
    }
    out[0] = ax + sx * (c + s - diagonal);
    out[1] = by;
    return;
  }
  if (s <= level) {
    out[0] = ax + sx * s;
    out[1] = ay;
    return;
  }
  s -= level;
  if (s <= diagonal) {
    const d = s / Math.SQRT2;
    out[0] = ax + sx * (level + d);
    out[1] = ay + sy * d;
    return;
  }
  out[0] = bx;
  out[1] = ay + sy * (c + s - diagonal);
}

/** The corners of that march, for the guard: level, cut, plumb. */
export function marchRoute(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cut: number,
  first: "h" | "v" = "h"
): [number, number][] {
  const dx = bx - ax;
  const dy = by - ay;
  const c = Math.min(cut, Math.abs(dx), Math.abs(dy));
  if (first === "v")
    return [
      [ax, ay],
      [ax, by - Math.sign(dy) * c],
      [ax + Math.sign(dx) * c, by],
      [bx, by],
    ];
  return [
    [ax, ay],
    [bx - Math.sign(dx) * c, ay],
    [bx, ay + Math.sign(dy) * c],
    [bx, by],
  ];
}

/* -- one frame ------------------------------------------------------------------ */

/** Where a plate stands, and how much of it: what hides the dots behind it. */
export interface Standing extends Seat {
  /** It stands in the opening's seat, which goes where the opening goes:
      stated in that seat's space, not the screen's. */
  home?: boolean;
  alpha: [number, number, number];
  /** For a plate that is printing or leaving row by row: the band of the
      canvas, y0 to y1, its standing rows are in. Absent, it stands whole. */
  band?: ([number, number] | null)[];
  /** How much of each plate stands here, 0..1: its light follows it. */
  share: [number, number, number];
  /** A silhouette of its own for each of the pool's segments, on the
      canvas as it is (the seat's offsets are not added); null for none.
      Absent, each segment's own, in the seat. */
  poly?: (Int32Array | null)[];
}

/** Where what falls between the plates is shown while the stack is still
    landing: the seat, and how far each gap's rain has come on, the team's
    gap first. */
export interface Rain {
  seat: Seat;
  on: [number, number];
}

/** The layer's light on a turning stack: the middle of its top face, the
    plane of that face as a canvas transform, the light's reach on the plate
    in sites, and how much of it is left. */
export interface Glow {
  x: number;
  y: number;
  plane: [number, number, number, number];
  reach: number;
  alpha: number;
}

export interface Frame {
  /** Device px on the canvas, a dot's middle. */
  x: Float32Array;
  y: Float32Array;
  size: Uint8Array;
  style: Uint8Array;
  show: Uint8Array;
  /** For a dot shown through a word's window: how much of it. */
  alpha: Float32Array;
  /** How lit each plate is, team first. */
  level: [number, number, number];
  masks: Standing[];
  /** The stack's seat when every dot is on it: what may run and fall. */
  whole: Seat | null;
  state: "opening" | "hop1" | "steps" | "hop2" | "network";
  /** How far the opening's files have reeled into the stack. */
  reel: number;
  /** Each team's lane, once walked: 0..1. */
  walked: number[];
  /** The steps' clock while the stack stands in the steps, else -1. */
  p1: number;
  /** How far the opening has scrolled since the stack began to leave it,
      device px: where its seat is on a canvas that holds still. */
  ride: number;
  /** The whole stack stands in the opening's seat. */
  home: boolean;
  /** A falling dot's two trailing dots, x1 y1 x2 y2 a dot; NaN for none. */
  trail: Float32Array;
  trails: boolean;
  /** What falls between the plates, before the stack stands whole. */
  rain: Rain | null;
  /** The layer's light while the stack turns. */
  glow: Glow | null;
}

export function newFrame(n: number): Frame {
  return {
    x: new Float32Array(n),
    y: new Float32Array(n),
    size: new Uint8Array(n),
    style: new Uint8Array(n),
    show: new Uint8Array(n),
    alpha: new Float32Array(n),
    level: [1, 1, 1],
    masks: [],
    whole: null,
    state: "opening",
    reel: 0,
    walked: [0, 0, 0, 0, 0, 0],
    p1: -1,
    ride: 0,
    home: false,
    trail: new Float32Array(n * 4).fill(NaN),
    trails: false,
    rain: null,
    glow: null,
  };
}

/** What a frame is computed from: everything `world.ts` builds. */
export interface Stage {
  pool: Pool;
  /** Dot sizes by tier, device px. */
  sizes: readonly number[];
  /** A circle on a plate is an ellipse on screen: b over a. */
  squash: number;
  /** The march's cut, device px. */
  cut: number;
  /** A screen's height, device px: how far the opening scrolls in a hop. */
  screen: number;
  seatA: Seat;
  seatB: (p1: number) => Seat & { level: [number, number, number] };
  big: Targets;
  node: Targets;
  org: Org;
  /** The scan's order for the first hop. */
  scan1: Scan;
  /** The second hop: the stack's turn to face the reader. */
  turn: Turn;
  /** One site step of the lattice, across and down, device px. */
  step: readonly [number, number];
}

const at = [0, 0];
const tip = [0, 0];

function stand(S: Stage, F: Frame, seat: Seat, t: number, home: boolean) {
  const P = S.pool;
  for (let d = 0; d < P.count; d++) {
    if (P.host[d] >= 0) {
      F.show[d] = SHOW.no;
      continue;
    }
    let x = seat.ox + P.lx[d];
    let y = seat.oy + P.ly[d] + seat.lift[P.plate[d]];
    const amp = P.amp[d];
    if (amp > 0) {
      const a = P.phase[d] + P.rate[d] * t;
      x += Math.round(amp * Math.cos(a));
      y += Math.round(amp * S.squash * Math.sin(a));
    }
    F.x[d] = x;
    F.y[d] = y;
    F.size[d] = S.sizes[P.tier[d]];
    F.style[d] = P.style[d];
    F.show[d] = home ? SHOW.seat : SHOW.yes;
  }
  F.masks.push({ ...seat, home, alpha: [1, 1, 1], share: [1, 1, 1] });
  F.whole = seat;
  F.home = home;
}

/** A band that takes in everything: a row of dots is never this far off. */
const FAR = 1e6;

/**
 * What hides the dots behind a plate while the stack is between two seats.
 *
 * March sends a plate's rows in order, top of the screen first, and lands
 * them in the same order, so the silhouette that hides what is behind the
 * plate is cut to the rows still standing where it leaves and to the rows
 * already landed where it prints. Drift has no order: the silhouette fades.
 * Rigid moves the stack whole, so its silhouettes move with it.
 *
 * `home`: the seat it leaves is the opening's, which scrolls with its
 * section; what stands there is stated in that seat's own space.
 */
function masksOf(
  S: Stage,
  F: Frame,
  from: Seat,
  to: Seat,
  T: number,
  fly: Fly,
  spec: HopSpec,
  home: boolean,
  scan: Scan
) {
  if (fly === "rigid") {
    const e = ease(clamp01(T));
    F.masks.push({
      ox: Math.round(lerp(from.ox, to.ox, e)),
      oy: Math.round(lerp(from.oy - (home ? F.ride : 0), to.oy, e)),
      lift: [
        Math.round(lerp(from.lift[0], to.lift[0], e)),
        Math.round(lerp(from.lift[1], to.lift[1], e)),
        Math.round(lerp(from.lift[2], to.lift[2], e)),
      ],
      alpha: [1, 1, 1],
      share: [1, 1, 1],
    });
    return;
  }
  if (fly !== "march" && fly !== "scan") {
    const gone = 1 - seg(T, 0.02, 0.3);
    const come = seg(T, 0.72, 1);
    if (gone > 0)
      F.masks.push({ ...from, home, alpha: [gone, gone, gone], share: [gone, gone, gone] });
    if (come > 0) F.masks.push({ ...to, alpha: [come, come, come], share: [come, come, come] });
    return;
  }
  const pad = S.sizes[S.sizes.length - 1];
  const left: Standing = {
    ...from,
    home,
    alpha: [0, 0, 0],
    band: [null, null, null],
    share: [0, 0, 0],
  };
  const landed: Standing = { ...to, alpha: [0, 0, 0], band: [null, null, null], share: [0, 0, 0] };
  for (const p of [0, 1, 2]) {
    /* the rank whose dot is starting now, and the rank whose dot has landed;
       a scan's rows are a plate's ranks in the same order, top first */
    const [s0, s1] = scan.plates[p];
    const gone =
      fly === "scan" ? seg(T, s0, s1 + 1e-6) : seg(T, spec.lead[p], spec.lead[p] + spec.spread);
    const come =
      fly === "scan"
        ? seg(T, s0 + scan.dur, s1 + scan.dur + 1e-6)
        : seg(
            T,
            spec.lead[p] + spec.dur + spec.jitter,
            spec.lead[p] + spec.dur + spec.jitter + spec.spread
          );
    if (gone < 1) {
      left.alpha[p] = 1;
      left.share[p] = 1 - gone;
      left.band![p] =
        gone > 0 ? [from.oy + from.lift[p] + rowAt(S.pool, p, gone) - pad, FAR] : null;
    }
    if (come > 0) {
      landed.alpha[p] = 1;
      landed.share[p] = come;
      landed.band![p] = come < 1 ? [-FAR, to.oy + to.lift[p] + rowAt(S.pool, p, come) + pad] : null;
    }
  }
  if (left.alpha.some((v) => v > 0)) F.masks.push(left);
  if (landed.alpha.some((v) => v > 0)) F.masks.push(landed);
}

/** A falling dot's trailing dots, behind it on its own way. */
function trailOf(
  F: Frame,
  d: number,
  e: number,
  on: boolean,
  ax: number,
  ay: number,
  bx: number,
  by: number
) {
  const i = d * 4;
  F.trail[i] = NaN;
  F.trail[i + 2] = NaN;
  if (e >= 1 || !on) return;
  for (let k = 0; k < 2; k++) {
    const back = e - FALL.trail[k];
    if (back <= 0) return;
    fallTo(ax, ay, bx, by, back, tip);
    /* only while it is moving: a trail is how far it has come */
    if (Math.abs(tip[0] - F.x[d]) + Math.abs(tip[1] - F.y[d]) < 2) return;
    F.trail[i + k * 2] = Math.round(tip[0]);
    F.trail[i + k * 2 + 1] = Math.round(tip[1]);
  }
}

/** The first hop as a fall: out of the opening's seat, which goes with its
    section, down into the steps. */
function fall1(S: Stage, F: Frame, T: number, t: number) {
  const P = S.pool;
  const A = S.seatA;
  const B = S.seatB(0);
  const ride = Math.round(T * S.screen);
  F.ride = ride;
  F.trails = true;
  for (let d = 0; d < P.count; d++) {
    F.trail[d * 4] = NaN;
    F.trail[d * 4 + 2] = NaN;
    if (P.host[d] >= 0) {
      F.show[d] = SHOW.no;
      continue;
    }
    const p = P.plate[d];
    const e = clamp01((T - fallStart(P, d, FALL.lead1)) / FALL.dur);
    const ax = A.ox + P.lx[d];
    const ay = A.oy + P.ly[d] + A.lift[p];
    const amp = P.amp[d];
    const a = P.phase[d] + P.rate[d] * t;
    F.size[d] = S.sizes[P.tier[d]];
    F.style[d] = P.style[d];
    if (e <= 0) {
      F.x[d] = amp > 0 ? ax + Math.round(amp * Math.cos(a)) : ax;
      F.y[d] = amp > 0 ? ay + Math.round(amp * S.squash * Math.sin(a)) : ay;
      F.show[d] = SHOW.seat;
      continue;
    }
    const bx = B.ox + P.lx[d];
    const by = B.oy + P.ly[d] + B.lift[p];
    fallTo(ax, ay - ride, bx, by, e, at);
    if (amp > 0) {
      const still = (1 - 2 * e) * (1 - 2 * e);
      at[0] += amp * still * Math.cos(a);
      at[1] += amp * still * S.squash * Math.sin(a);
    }
    F.x[d] = Math.round(at[0]);
    F.y[d] = Math.round(at[1]);
    F.show[d] = SHOW.yes;
    trailOf(F, d, e, trails(P, d), ax, ay - ride, bx, by);
  }
  /* what hides the dots behind a plate goes with the plate: in its seat
     until its body leaves, then falling with it */
  const home: Standing = { ...A, home: true, alpha: [0, 0, 0], share: [0, 0, 0] };
  for (const p of [0, 1, 2] as const) {
    const eb = clamp01((T - bodyStart(FALL.lead1, p)) / FALL.dur);
    if (eb <= 0) {
      home.alpha[p] = 1;
      home.share[p] = 1;
      continue;
    }
    fallTo(A.ox, A.oy + A.lift[p] - ride, B.ox, B.oy + B.lift[p], eb, at);
    const lift: [number, number, number] = [0, 0, 0];
    lift[p] = Math.round(at[1]);
    const alpha: [number, number, number] = [0, 0, 0];
    alpha[p] = 1;
    F.masks.push({
      ox: Math.round(at[0]),
      oy: 0,
      lift,
      alpha,
      share: [...alpha] as [number, number, number],
    });
  }
  if (home.alpha.some((v) => v > 0)) F.masks.push(home);
}

function hop1(S: Stage, F: Frame, T: number, t: number, fly: Fly) {
  const P = S.pool;
  const A = S.seatA;
  const B = S.seatB(0);
  /* The opening scrolls a screen away while the hop plays. A dot that has
     not left yet stays in the opening's seat and goes with it; a dot on
     its way leaves from where that seat has got to. So the stack is never
     seen sliding against its own section before it flies. */
  const ride = Math.round(T * S.screen);
  F.ride = ride;
  for (let d = 0; d < P.count; d++) {
    if (P.host[d] >= 0) {
      F.show[d] = SHOW.no;
      continue;
    }
    const p = P.plate[d];
    const e =
      fly === "scan"
        ? clamp01((T - S.scan1.start[d]) / S.scan1.dur)
        : dotT(T, p, P.rank[d], P.h[d], fly, HOP1);
    const ax = A.ox + P.lx[d];
    const ay = A.oy + P.ly[d] + A.lift[p];
    const amp = P.amp[d];
    const a = P.phase[d] + P.rate[d] * t;
    F.size[d] = S.sizes[P.tier[d]];
    F.style[d] = P.style[d];
    if (e <= 0) {
      /* in its seat, as it stands at rest, in the seat's own space */
      F.x[d] = amp > 0 ? ax + Math.round(amp * Math.cos(a)) : ax;
      F.y[d] = amp > 0 ? ay + Math.round(amp * S.squash * Math.sin(a)) : ay;
      F.show[d] = SHOW.seat;
      continue;
    }
    if (fly === "scan") {
      /* a row on its way: rigid, on the grid, lit; no drift */
      scanTo(
        ax,
        ay - ride,
        B.ox + P.lx[d],
        B.oy + P.ly[d] + B.lift[p],
        e,
        S.step[0],
        S.step[1],
        at
      );
      /* landed, a crowd's dot takes up its drift again, as it stands at rest */
      const land = e >= 1 && amp > 0;
      F.x[d] = Math.round(at[0]) + (land ? Math.round(amp * Math.cos(a)) : 0);
      F.y[d] = Math.round(at[1]) + (land ? Math.round(amp * S.squash * Math.sin(a)) : 0);
      if (e < 1) F.style[d] = WRITING[p];
      F.show[d] = SHOW.yes;
      continue;
    }
    moveTo(
      ax,
      ay - ride,
      B.ox + P.lx[d],
      B.oy + P.ly[d] + B.lift[p],
      e,
      fly,
      P.h[d],
      S.cut,
      at,
      HOP1.first
    );
    if (amp > 0) {
      /* the team's drift lets go as a dot leaves and takes it back as it lands */
      const still = (1 - 2 * e) * (1 - 2 * e);
      at[0] += amp * still * Math.cos(a);
      at[1] += amp * still * S.squash * Math.sin(a);
    }
    F.x[d] = Math.round(at[0]);
    F.y[d] = Math.round(at[1]);
    F.show[d] = SHOW.yes;
  }
  masksOf(S, F, A, B, T, fly, HOP1, true, S.scan1);
}

/* -- what falls, while the stack lands --------------------------------------------- */

/** When a plate's body has landed in the steps, on the first hop's clock. */
function landed1(S: Stage, fly: Fly, p: number): number {
  switch (fly) {
    case "fall":
      return bodyStart(FALL.lead1, p) + FALL.dur;
    case "march":
      return HOP1.lead[p] + HOP1.spread + HOP1.jitter + HOP1.dur;
    case "scan":
      return S.scan1.plates[p][1] + S.scan1.dur;
    default:
      return 1;
  }
}

/** How long a gap's rain takes to come on, on the hop's clock. */
const RAIN_IN = 0.04;

/** The owner, 2026-10-14: "the data raindrops can appear a bit sooner
    because now they just appear out of nowhere." They fell only once the
    whole stack stood in the steps, so the hop's last frame had none and the
    next a gap full of them. A gap's rain now comes on as soon as both its
    plates have landed (in the fall, the layer's gap well before the team
    arrives), and the painter starts it from the top (`paint.ts`). */
function rainOf(S: Stage, T: number, fly: Fly): Rain | null {
  const on = [0, 1].map((g) => {
    const from = Math.max(landed1(S, fly, g), landed1(S, fly, g + 1));
    return seg(T, from, from + RAIN_IN);
  });
  return on[0] > 0 || on[1] > 0 ? { seat: S.seatB(0), on: [on[0], on[1]] } : null;
}

/* -- the turn ---------------------------------------------------------------------- */

/** The second hop's timing, on its own clock. The stack turns over the first
    `end` of it, on `flow`: under way the moment the steps let go (eased in,
    it would stand still while its section scrolled away, the dead space of
    round three), settling as it faces the reader. While it turns, each
    plate's dots gather on the plate to the lines its bar's cells stand on
    (`gather`), so the plate face on is its bar (`turn.ts`); `settle` only
    hands each dot to its cell, a pixel at most. The bar takes its own look
    column by column over `settle`, left to right, as a line is written;
    what a turned plate hides, and the layer's light, let go over `let`. */
export const TURN = {
  end: 0.74,
  gather: [0.28, 0.66] as const,
  settle: [0.6, 1] as const,
  let: [0.62, 0.8] as const,
} as const;

/** The layer's light on its top face, as a share of the plate's side: S4·E's
    halo reaches 0.62 of the plate's width on screen (`swarm/clear.ts`), and
    the plate is wider on screen than its side by the root of two. */
const GLOW_REACH = 0.62 / Math.SQRT2;

/** The second hop: the closed stack turns to face the reader as one object,
    crossing to the bars' place, and each dot then takes its cell. */
function turn2(S: Stage, F: Frame, T: number, t: number) {
  const P = S.pool;
  const R = S.turn;
  const G = S.big;
  const e = flow(seg(T, 0, TURN.end));
  const V = lensAt(R, e);
  const k = smooth(seg(T, TURN.settle[0], TURN.settle[1]));
  const g = smooth(seg(T, TURN.gather[0], TURN.gather[1]));
  for (let d = 0; d < P.count; d++) {
    if (P.host[d] >= 0) {
      F.show[d] = SHOW.no;
      continue;
    }
    /* on its plate, gathering to its cell's point on the plate's top */
    const p = P.plate[d];
    project(
      V,
      R,
      p,
      lerp(R.i[d], R.gi[d], g),
      lerp(R.j[d], R.gj[d], g),
      lerp(R.k[d], R.tall[p], g),
      at
    );
    const amp = P.amp[d];
    if (amp > 0 && e < 1) {
      /* the team's drift lets go as the plate turns */
      const still = (1 - e) * (1 - e);
      const a = P.phase[d] + P.rate[d] * t;
      at[0] += amp * still * Math.cos(a);
      at[1] += amp * still * S.squash * Math.sin(a);
    }
    F.x[d] = Math.round(lerp(at[0], G.x[d], k));
    F.y[d] = Math.round(lerp(at[1], G.y[d], k));
    /* its bar's look, its column's turn: a sweep from left to right */
    const bar = k >= 0.2 + 0.6 * (R.gi[d] / R.m);
    F.size[d] = bar ? G.size[d] : S.sizes[P.tier[d]];
    F.style[d] = bar ? G.style[d] : P.style[d];
    /* a dot bound for a word's place is let go as it settles */
    if (G.show[d] === SHOW.window) {
      F.show[d] = SHOW.window;
      F.alpha[d] = 1 - seg(k, 0.55, 0.95);
    } else F.show[d] = SHOW.yes;
  }
  /* each plate, and each solid on the agents' board, hides what is behind
     it through the same lens, until the bars take the dots */
  const hold = 1 - seg(T, TURN.let[0], TURN.let[1]);
  if (hold <= 0) return;
  const pad = Math.round(1.5 * S.step[1]);
  F.masks.push({
    ox: 0,
    oy: 0,
    lift: [0, 0, 0],
    alpha: [hold, hold, hold],
    share: [0, 0, 0],
    /* a box flattens to its plate's top as its dots gather there, or it
       would hide the plate below it once the plates stand a bar apart */
    poly: R.boxes.map((b) => {
      if (!b) return null;
      const top = R.tall[b.plate];
      return hullOf(V, R, { ...b, k0: lerp(b.k0, top, g), k1: lerp(b.k1, top, g) }, pad);
    }),
  });
  project(V, R, 1, R.m / 2, R.m / 2, R.tall[1], at);
  F.glow = { x: at[0], y: at[1], plane: topPlane(V), reach: GLOW_REACH * R.m, alpha: hold };
}

/** The share of a team's turn its last dot starts at, and how long one walks. */
const WALK = { stagger: 0.48, dur: 0.52 };

function network(S: Stage, F: Frame, p2: number) {
  const P = S.pool;
  const G = S.big;
  const N = S.node;
  const O = S.org;
  const st = networkAt(p2);
  const z = st.zoom;
  const back = seg(z, 0, 0.22);
  const small = z >= 0.5;
  for (let k = 0; k < F.walked.length; k++)
    F.walked[k] = seg(p2, turnOf(k) + TURN_LEN * 0.7, turnOf(k) + TURN_LEN);

  for (let d = 0; d < P.count; d++) {
    const team = O.team[d];
    const e =
      team < 0
        ? 0
        : seg(
            p2,
            turnOf(team) + O.order[d] * WALK.stagger * TURN_LEN,
            turnOf(team) + (O.order[d] * WALK.stagger + WALK.dur) * TURN_LEN
          );
    if (e <= 0) {
      /* in Marketing: the bars, drawing back to its node */
      if (P.host[d] >= 0) {
        F.show[d] = SHOW.no;
        continue;
      }
      F.x[d] = Math.round(lerp(G.x[d], N.x[d], z));
      F.y[d] = Math.round(lerp(G.y[d], N.y[d], z));
      F.size[d] = small ? N.size[d] : G.size[d];
      F.style[d] = N.style[d];
      if (G.show[d] === SHOW.window && back < 1) {
        F.show[d] = SHOW.window;
        F.alpha[d] = back;
      } else F.show[d] = SHOW.yes;
      continue;
    }
    /* on its way to a team: out of its cell to the ribbon's start (plumb,
       then level), along its wire, and off the ribbon's end into its seat:
       plumb down the node's own edge, then level along its row, so no dot
       crosses the team's name on the band */
    const lane = O.lanes[team][O.wire[d]];
    const nx = N.x[d];
    const ny = N.y[d];
    const ex = lane.pts[0];
    const ey = lane.pts[1];
    const up = Math.abs(ey - ny);
    const out = Math.abs(ex - nx);
    const run = O.reach[d];
    const tx = O.to.x[d];
    const ty = O.to.y[d];
    let inX = 0;
    let inY = 0;
    if (O.seated[d]) {
      along(lane, lane.len, tip);
      inX = Math.abs(tx - tip[0]);
      inY = Math.abs(ty - tip[1]);
    }
    const s = e * (up + out + run + inX + inY);
    const onLane = s - up - out;
    const off = onLane - run;
    if (e >= 1) {
      at[0] = tx;
      at[1] = ty;
    } else if (s <= up) {
      at[0] = nx;
      at[1] = ny + Math.sign(ey - ny) * s;
    } else if (onLane <= 0) {
      at[0] = nx + Math.sign(ex - nx) * (s - up);
      at[1] = ey;
    } else if (off <= 0) {
      along(lane, onLane, at);
    } else if (off <= inY) {
      at[0] = tip[0];
      at[1] = tip[1] + Math.sign(ty - tip[1]) * off;
    } else {
      at[0] = tip[0] + Math.sign(tx - tip[0]) * (off - inY);
      at[1] = ty;
    }
    F.x[d] = Math.round(at[0]);
    F.y[d] = Math.round(at[1]);
    F.size[d] = O.to.size[d];
    F.style[d] = O.to.style[d];
    F.show[d] = SHOW.yes;
  }
}

/** One frame: every dot's place at the clocks' reading, `t` seconds in. */
export function frameAt(S: Stage, c: Clocks, t: number, fly: Fly, F: Frame): Frame {
  F.masks.length = 0;
  F.whole = null;
  F.level = [1, 1, 1];
  F.reel = 0;
  F.p1 = -1;
  F.ride = 0;
  F.home = false;
  F.trails = false;
  F.rain = null;
  F.glow = null;
  F.walked.fill(0);
  if (c.q2 <= 0) {
    if (c.q1 <= 0) {
      F.state = "opening";
      stand(S, F, S.seatA, t, true);
    } else if (c.q1 < 1) {
      F.state = "hop1";
      F.reel = seg(c.q1, 0, 0.06);
      if (fly === "fall") fall1(S, F, c.q1, t);
      else hop1(S, F, c.q1, t, fly);
      F.rain = rainOf(S, c.q1, fly);
      const lit = arriveLight(c.q1);
      const own = S.seatB(0).level;
      F.level = [lerp(own[0], 1, lit), lerp(own[1], 1, lit), lerp(own[2], 1, lit)];
    } else {
      F.state = "steps";
      F.reel = 1;
      const B = S.seatB(c.p1);
      stand(S, F, B, t, false);
      F.level = B.level;
      F.p1 = c.p1;
    }
    return F;
  }
  F.reel = 1;
  const T2 = hop2T(c);
  if (T2 < 1) {
    F.state = "hop2";
    turn2(S, F, T2, t);
  } else {
    F.state = "network";
    network(S, F, c.p2);
  }
  return F;
}
