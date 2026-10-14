/* Where every dot is, at any point of the scroll. PURE.

   The act is five states and the two hops between them, all read off the
   clocks (`clocks.ts`), so it plays both ways and a frame is repeatable:

     the opening   the stack closed in its seat (A)
     HOP 1         it leaves, plate by plate, and prints itself opened in the
                   steps' seat (B)
     the steps     the stack on the section's own clock: it travels, closes
     HOP 2         the three plates re-seat as three level bars
     the network   the bars shrink to Marketing's node as the view draws
                   back, then dots leave along each team's lane

   A HOP is never one move of the whole. Each dot has its own start (its
   plate's turn, then its row's, then a little of its own) and its own
   route, and how it goes is the page's one switch:

     march   a level run, a 45-degree cut, a plumb run: files of dots on
             lanes, a row landing as a row
     drift   a loose cloud: each dot starts when its own number says, and
             goes by a waypoint of its own on two straight legs
     rigid   every dot together on one straight line: the travel as it was,
             kept as the control */

import { type Clocks, arriveLight, hop2T, networkAt, TURN_LEN, turnOf } from "./clocks";
import { along, type Org, SHOW, type Targets } from "./formations";
import { type Pool, rowAt } from "./pool";

export type Fly = "march" | "drift" | "rigid";
export const FLIES: readonly Fly[] = ["march", "drift", "rigid"];

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
}

/* both end at 1 exactly: the last dot of the last plate lands as the hop does */
/* the first hop builds the stack from the ground up: the agents leave first
   and land first, then the layer, and the team last (owner, 2026-10-14:
   "it should be bottom, middle and THEN the first layer") */
export const HOP1: HopSpec = { lead: [0.21, 0.13, 0.05], spread: 0.26, jitter: 0.03, dur: 0.5 };
export const HOP2: HopSpec = { lead: [0, 0.08, 0.16], spread: 0.3, jitter: 0.04, dur: 0.5 };
const DRIFT_DUR = 0.55;

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
  if (fly === "drift") return ease(seg(T, h * (1 - DRIFT_DUR), h * (1 - DRIFT_DUR) + DRIFT_DUR));
  const start = spec.lead[plate] + rank * spec.spread + h * spec.jitter;
  return ease(seg(T, start, start + spec.dur));
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
  cut: number
): [number, number][] {
  const dx = bx - ax;
  const dy = by - ay;
  const c = Math.min(cut, Math.abs(dx), Math.abs(dy));
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
  alpha: [number, number, number];
  /** For a plate that is printing or leaving row by row: the band of the
      canvas, y0 to y1, its standing rows are in. Absent, it stands whole. */
  band?: ([number, number] | null)[];
  /** How much of each plate stands here, 0..1: its light follows it. */
  share: [number, number, number];
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
  seatA: Seat;
  seatB: (p1: number) => Seat & { level: [number, number, number] };
  big: Targets;
  node: Targets;
  org: Org;
  /** A dot's turn within its plate on the second hop. */
  rank2: Float32Array;
}

const at = [0, 0];
const tip = [0, 0];

function stand(S: Stage, F: Frame, seat: Seat, t: number) {
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
    F.show[d] = SHOW.yes;
  }
  F.masks.push({ ...seat, alpha: [1, 1, 1], share: [1, 1, 1] });
  F.whole = seat;
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
 */
function masksOf(
  S: Stage,
  F: Frame,
  from: Seat,
  to: Seat | null,
  T: number,
  fly: Fly,
  spec: HopSpec
) {
  if (fly === "rigid" && to) {
    const e = ease(clamp01(T));
    F.masks.push({
      ox: Math.round(lerp(from.ox, to.ox, e)),
      oy: Math.round(lerp(from.oy, to.oy, e)),
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
  if (fly !== "march") {
    const gone = 1 - seg(T, 0.02, 0.3);
    const come = seg(T, 0.72, 1);
    if (gone > 0) F.masks.push({ ...from, alpha: [gone, gone, gone], share: [gone, gone, gone] });
    if (to && come > 0)
      F.masks.push({ ...to, alpha: [come, come, come], share: [come, come, come] });
    return;
  }
  const pad = S.sizes[S.sizes.length - 1];
  const left: Standing = { ...from, alpha: [0, 0, 0], band: [null, null, null], share: [0, 0, 0] };
  const landed: Standing | null = to
    ? { ...to, alpha: [0, 0, 0], band: [null, null, null], share: [0, 0, 0] }
    : null;
  for (const p of [0, 1, 2]) {
    /* the rank whose dot is starting now, and the rank whose dot has landed */
    const gone = seg(T, spec.lead[p], spec.lead[p] + spec.spread);
    const come = seg(
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
    if (landed && to && come > 0) {
      landed.alpha[p] = 1;
      landed.share[p] = come;
      landed.band![p] = come < 1 ? [-FAR, to.oy + to.lift[p] + rowAt(S.pool, p, come) + pad] : null;
    }
  }
  if (left.alpha.some((v) => v > 0)) F.masks.push(left);
  if (landed && landed.alpha.some((v) => v > 0)) F.masks.push(landed);
}

function hop1(S: Stage, F: Frame, T: number, t: number, fly: Fly) {
  const P = S.pool;
  const A = S.seatA;
  const B = S.seatB(0);
  for (let d = 0; d < P.count; d++) {
    if (P.host[d] >= 0) {
      F.show[d] = SHOW.no;
      continue;
    }
    const p = P.plate[d];
    const e = dotT(T, p, P.rank[d], P.h[d], fly, HOP1);
    moveTo(
      A.ox + P.lx[d],
      A.oy + P.ly[d] + A.lift[p],
      B.ox + P.lx[d],
      B.oy + P.ly[d] + B.lift[p],
      e,
      fly,
      P.h[d],
      S.cut,
      at
    );
    const amp = P.amp[d];
    if (amp > 0) {
      /* the team's drift lets go as a dot leaves and takes it back as it lands */
      const still = (1 - 2 * e) * (1 - 2 * e);
      const a = P.phase[d] + P.rate[d] * t;
      at[0] += amp * still * Math.cos(a);
      at[1] += amp * still * S.squash * Math.sin(a);
    }
    F.x[d] = Math.round(at[0]);
    F.y[d] = Math.round(at[1]);
    F.size[d] = S.sizes[P.tier[d]];
    F.style[d] = P.style[d];
    F.show[d] = SHOW.yes;
  }
  masksOf(S, F, A, B, T, fly, HOP1);
}

function hop2(S: Stage, F: Frame, T: number, t: number, fly: Fly) {
  const P = S.pool;
  const B = S.seatB(1);
  const G = S.big;
  for (let d = 0; d < P.count; d++) {
    if (P.host[d] >= 0) {
      F.show[d] = SHOW.no;
      continue;
    }
    const p = P.plate[d];
    const e = dotT(T, p, S.rank2[d], P.h[d], fly, HOP2);
    moveTo(B.ox + P.lx[d], B.oy + P.ly[d] + B.lift[p], G.x[d], G.y[d], e, fly, P.h[d], S.cut, at);
    const amp = P.amp[d];
    if (amp > 0 && e < 0.5) {
      /* the team's drift lets go as a dot leaves; a bar holds still */
      const still = (1 - 2 * e) * (1 - 2 * e);
      const a = P.phase[d] + P.rate[d] * t;
      at[0] += amp * still * Math.cos(a);
      at[1] += amp * still * S.squash * Math.sin(a);
    }
    F.x[d] = Math.round(at[0]);
    F.y[d] = Math.round(at[1]);
    F.size[d] = Math.round(lerp(S.sizes[P.tier[d]], G.size[d], e));
    F.style[d] = e < 0.5 ? P.style[d] : G.style[d];
    /* a dot bound for a word's place is let go as it lands */
    if (G.show[d] === SHOW.window) {
      F.show[d] = SHOW.window;
      F.alpha[d] = 1 - seg(e, 0.55, 0.95);
    } else F.show[d] = SHOW.yes;
  }
  masksOf(S, F, B, null, T, fly, HOP2);
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
  F.walked.fill(0);
  if (c.q2 <= 0) {
    if (c.q1 <= 0) {
      F.state = "opening";
      stand(S, F, S.seatA, t);
    } else if (c.q1 < 1) {
      F.state = "hop1";
      F.reel = seg(c.q1, 0, 0.06);
      hop1(S, F, c.q1, t, fly);
      const lit = arriveLight(c.q1);
      const own = S.seatB(0).level;
      F.level = [lerp(own[0], 1, lit), lerp(own[1], 1, lit), lerp(own[2], 1, lit)];
    } else {
      F.state = "steps";
      F.reel = 1;
      const B = S.seatB(c.p1);
      stand(S, F, B, t);
      F.level = B.level;
      F.p1 = c.p1;
    }
    return F;
  }
  F.reel = 1;
  const T2 = hop2T(c);
  if (T2 < 1) {
    F.state = "hop2";
    hop2(S, F, T2, t, fly);
  } else {
    F.state = "network";
    network(S, F, c.p2);
  }
  return F;
}
