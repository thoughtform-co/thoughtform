/* D · IN, THEN OUT, as arithmetic. PURE.

   The four workstreams are four crowds of green dots on a line. Thoughtform
   is a swarm of gold dots that comes in drawn as its mark, settles inside
   every crowd (week one, on site), gathers round each crowd in turn and
   leaves a core of gold in it (weeks two and three, one owner at a time:
   the skill that crowd now keeps), hangs back over them, thinned (week
   four, remote), and leaves the frame (after). The cores stay, and the
   crowds pass work along a line between them on their own.

   Every place is a function of the runway's clock alone, in frame units
   (1200 × 460), so a still at any moment is repeatable. */

import { brandmarkPolylines } from "@/lib/brandmark/brandmarkPaths";

import { ease, held, lerp, type Pt, seg, smooth } from "./model";

export const D = {
  crowds: [270, 490, 710, 930] as const,
  crowdY: 250,
  /** A crowd's reach and its lattice pitch. */
  crowdR: 44,
  pitch: 9,
  /** A core's lattice: 4 × 3 at this pitch. */
  core: { cols: 4, rows: 3, pitch: 6 },
  /** The gold swarm: how many, and how many each crowd keeps. */
  swarm: 96,
  keep: 12,
  /** Where the mark is drawn, and how tall. */
  markAt: [600, 108] as Pt,
  markH: 96,
  /** Where the swarm hangs back in week four. */
  hover: [600, 84] as Pt,
  /** How far over a crowd the swarm huddles while it coaches it. */
  coachLift: 74,
  /** The line the crowds pass work along, after. */
  busY: 318,
} as const;

/** The act's stretches on the runway's clock (after its holds). */
export const ACT = {
  enter: [0, 0.12],
  embed: [0.12, 0.26],
  coach: [0.26, 0.66],
  lead: [0.66, 0.82],
  leave: [0.82, 1],
} as const;

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/* -- the crowds ------------------------------------------------------------------ */

/** Each crowd's dots: the lattice sites inside its reach, a little jittered. */
export const CROWD_DOTS: Pt[][] = D.crowds.map((cx, k) => {
  const out: Pt[] = [];
  const n = Math.ceil(D.crowdR / D.pitch);
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const x = i * D.pitch;
      const y = j * D.pitch * 0.82;
      if (Math.hypot(x, y / 0.82) > D.crowdR) continue;
      const h = hash(k * 1000 + i * 37 + j);
      out.push([cx + x + (h - 0.5) * 2.4, D.crowdY + y + (hash(h * 91) - 0.5) * 2.4]);
    }
  return out;
});

/** A crowd's core: where the gold it keeps stands. */
export function coreSite(k: number, q: number): Pt {
  const { cols, rows, pitch } = D.core;
  const c = q % cols;
  const r = Math.floor(q / cols) % rows;
  return [D.crowds[k] + (c - (cols - 1) / 2) * pitch, D.crowdY + (r - (rows - 1) / 2) * pitch];
}

/* -- the swarm ------------------------------------------------------------------- */

/** The mark, as dots: lattice sites inside its outline, as near `count` as
    the pitch allows, in order from the top. */
export const MARK_DOTS: Pt[] = (() => {
  const shapes = brandmarkPolylines(8);
  const xs = shapes.flatMap((s) => s.map((p) => p[0]));
  const ys = shapes.flatMap((s) => s.map((p) => p[1]));
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = D.markH / (y1 - y0);
  const inside = (x: number, y: number) =>
    shapes.some((pts) => {
      let hit = false;
      for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
        if (pts[a][1] > y !== pts[b][1] > y) {
          const cross = pts[a][0] + ((y - pts[a][1]) * (pts[b][0] - pts[a][0])) / (pts[b][1] - pts[a][1]);
          if (x < cross) hit = !hit;
        }
      }
      return hit;
    });
  /* find the pitch that seats about the swarm's count */
  let best: Pt[] = [];
  for (let pitch = 2; pitch < 12; pitch += 0.25) {
    const pts: Pt[] = [];
    const step = pitch / k;
    for (let y = y0 + step / 2; y < y1; y += step)
      for (let x = x0 + step / 2; x < x1; x += step)
        if (inside(x, y))
          pts.push([D.markAt[0] + (x - (x0 + x1) / 2) * k, D.markAt[1] + (y - (y0 + y1) / 2) * k]);
    if (pts.length <= D.swarm) {
      best = pts;
      break;
    }
  }
  /* pad to the swarm's count on the mark's own sites, so every dot has one */
  const out = best.slice();
  for (let i = 0; out.length < D.swarm; i++) out.push(best[i % best.length]);
  return out;
})();

/** Where a swarm dot comes in from: off the frame's left edge. */
const startOf = (d: number): Pt => [-40 - hash(d) * 120, 60 + hash(d + 0.5) * 340];
/** Where it leaves to: off the frame's top right. */
const exitOf = (d: number): Pt => [1240 + hash(d * 3) * 80, -30 - hash(d * 7) * 60];

/** Which crowd a dot keeps to in week one, and its seat there: between the
    green, half a pitch off their lattice. */
function embedOf(d: number): Pt {
  const k = d % 4;
  const n = Math.floor(d / 4);
  const ring = Math.floor(Math.sqrt(n));
  const a = n * 2.39996 + k;
  const r = Math.min(D.crowdR - 4, 6 + ring * 7);
  return [D.crowds[k] + Math.cos(a) * r + D.pitch / 2, D.crowdY + Math.sin(a) * r * 0.82];
}
/** Its seat in the huddle over crowd `k`: a tight cloud, the keepers of
    the crowds still to come and the leavers. */
function coachOf(d: number, k: number): Pt {
  const n = d % 61;
  const a = n * 2.39996 + d * 0.01;
  const r = 2 + Math.sqrt(n) * 3.4;
  return [D.crowds[k] + Math.cos(a) * r, D.crowdY - D.coachLift + Math.sin(a) * r * 0.72];
}
/** Its seat in the week-four huddle: a small loose diamond. */
function hoverOf(d: number): Pt {
  const n = d - 4 * D.keep;
  const a = n * 2.39996;
  const r = 3 + Math.sqrt(n) * 4.2;
  return [D.hover[0] + Math.cos(a) * r, D.hover[1] + Math.sin(a) * r * 0.7];
}

/** The crowd a dot stays with, or -1 for one that leaves. */
export const keeperOf = (d: number) => (d < 4 * D.keep ? Math.floor(d / D.keep) : -1);

export interface Swarm {
  x: Float32Array;
  y: Float32Array;
  /** 0..1: how much of a dot shows (the huddle is thinned, the leavers go). */
  a: Float32Array;
  /** Which crowds have their core, 0..1 each. */
  kept: [number, number, number, number];
  /** How far gone the leavers are, 0..1. */
  gone: number;
  /** Week four's lines down to the crowds, 0..1. */
  remote: number;
  /** The crowd being coached, or -1. */
  coaching: number;
  stretch: keyof typeof ACT;
}

export function newSwarm(): Swarm {
  return {
    x: new Float32Array(D.swarm),
    y: new Float32Array(D.swarm),
    a: new Float32Array(D.swarm),
    kept: [0, 0, 0, 0],
    gone: 0,
    remote: 0,
    coaching: -1,
    stretch: "enter",
  };
}

const mix = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const stagger = (t: number, d: number, spread = 0.35) => {
  const s = hash(d * 13.7) * spread;
  return seg(t, s, s + 1 - spread);
};

/** Where every swarm dot is at the runway's clock `p`. */
export function swarmAt(p: number, out: Swarm = newSwarm()): Swarm {
  const t = held(p, 0.04, 0.06);
  const inStretch = (k: keyof typeof ACT) => seg(t, ACT[k][0], ACT[k][1]);
  const e0 = inStretch("enter");
  const e1 = inStretch("embed");
  const e2 = inStretch("coach");
  const e3 = inStretch("lead");
  const e4 = inStretch("leave");
  out.stretch =
    t < ACT.embed[0] ? "enter" : t < ACT.coach[0] ? "embed" : t < ACT.lead[0] ? "coach" : t < ACT.leave[0] ? "lead" : "leave";
  out.kept = [0, 1, 2, 3].map((k) => seg(e2, k / 4 + 0.1, k / 4 + 0.25)) as Swarm["kept"];
  out.coaching = out.stretch === "coach" ? Math.min(3, Math.floor(e2 * 4)) : -1;
  out.remote = Math.min(seg(e3, 0.3, 0.8), 1 - seg(e4, 0, 0.4));
  out.gone = e4;

  for (let d = 0; d < D.swarm; d++) {
    const keeper = keeperOf(d);
    let at: Pt;
    if (out.stretch === "enter") at = mix(startOf(d), MARK_DOTS[d], ease(stagger(e0, d)));
    else if (out.stretch === "embed") at = mix(MARK_DOTS[d], embedOf(d), ease(stagger(e1, d, 0.3)));
    else {
      /* weeks two and three: a huddle over each crowd in turn; a keeper
         drops from it into its crowd's core on that visit and stays */
      at = embedOf(d);
      for (let k = 0; k < 4; k++) {
        const w = seg(e2, k / 4, (k + 1) / 4);
        if (w <= 0) break;
        if (keeper >= 0 && keeper < k) break;
        at = mix(at, coachOf(d, k), smooth(seg(w, 0, 0.4)));
        if (keeper === k) at = mix(at, coreSite(k, d % D.keep), smooth(seg(w, 0.45, 0.85)));
      }
      if (keeper < 0 && out.stretch !== "coach") {
        at = mix(at, hoverOf(d), ease(stagger(e3, d, 0.3)));
        if (out.stretch === "leave") at = mix(at, exitOf(d), ease(stagger(e4, d, 0.4)));
      }
    }
    out.x[d] = at[0];
    out.y[d] = at[1];
    out.a[d] = keeper < 0 ? lerp(1, 0.5, seg(e3, 0, 0.6)) : 1;
  }
  return out;
}
