/* A · Lanes: the handover, as work that flows. PURE.

   Each workstream's chip feeds one straight lane, running right, the way the
   work goes. At first the lanes are specks: the work is there, nobody runs
   it on Claude yet. Thoughtform is one gold dot. It drops in from above
   onto the bus beside the chips, steps a few sites into the first lane, and
   the team's first runner sets off from the chip, passes it and runs the
   lane to its end; the lane is laid where the runner has been. The gold
   steps back onto the bus and down to the next lane, top down, one at a
   time. After the fourth it drops off the foot of the frame and is gone.

   The lanes keep running in green, and more runners set off on each the
   longer it runs: what was built compounds in the team's hands. At rest it
   is four lanes, each with its people on it, and no gold.

     the owner, 2026-10-14: "I come in, the team takes over, I move on" */

import {
  type Dots,
  drop,
  flow,
  type Geom,
  lerp,
  put,
  seg,
  type Sketch,
  STYLE,
  TRAIL,
} from "./core";

/** When the gold drops in, and how long each lane is its turn, seconds. */
const IN: [number, number] = [0.6, 1.4];
const TURN = 2.1;
/** Sites the gold steps into a lane before the team's runner passes it. */
const INTO = 6;
/** A runner's way down its lane, seconds, and when each sets off after the
    lane's first: closer and closer, then one a second for good. */
const RUN = 2.6;
const NEXT = [0, 1.6, 2.8, 3.7] as const;
const EVERY = 0.7;

/** The gold: a dot and four arms a site out, a diamond at this grain. */
function gold(D: Dots, G: Geom, x: number, y: number) {
  const { P, sizes } = G;
  put(D, x, y - P, sizes[1], STYLE.layerLit);
  put(D, x - P, y, sizes[1], STYLE.layerLit);
  put(D, x + P, y, sizes[1], STYLE.layerLit);
  put(D, x, y + P, sizes[1], STYLE.layerLit);
  put(D, x, y, sizes[3], STYLE.layerLit);
}

export function lanes(G: Geom): Sketch {
  const { P, sizes, rows } = G;
  const x0 = G.chipEdge + P;
  const sites = Math.max(2, Math.round((G.right - x0) / P) + 1);
  const start = (i: number) => IN[1] + i * TURN;
  /* the team's first runner sets off as the gold steps in */
  const first = (i: number) => start(i) + 0.25;
  const out = start(3) + 1.35;
  const gone = out + 1;
  const above = -3 * P;
  const below = G.h + 3 * P;

  /** Where the gold is at `t`, or null; and whether it is falling, and from where. */
  const goldAt = (t: number): { x: number; y: number; fall?: [number, number, number] } | null => {
    if (t < IN[0] || t >= gone) return null;
    if (t < IN[1]) {
      const e = drop(seg(t, IN[0], IN[1]));
      return { x: G.bus, y: lerp(above, rows[0], e), fall: [above, rows[0], e] };
    }
    if (t >= out) {
      const e = drop(seg(t, out, gone));
      return { x: G.bus, y: lerp(rows[3], below, e), fall: [rows[3], below, e] };
    }
    const i = Math.min(3, Math.floor((t - IN[1]) / TURN));
    const s = start(i);
    const y = rows[i];
    if (t < s + 0.35) return { x: G.bus + Math.round(INTO * flow(seg(t, s, s + 0.35))) * P, y };
    if (t < s + 0.9) return { x: G.bus + INTO * P, y };
    if (t < s + 1.25)
      return { x: G.bus + Math.round(INTO * (1 - flow(seg(t, s + 0.9, s + 1.25)))) * P, y };
    if (i === 3 || t < s + 1.35) return { x: G.bus, y };
    /* down the bus to the next lane, a site at a time */
    const e = flow(seg(t, s + 1.35, s + TURN));
    return { x: G.bus, y: y + Math.round(((rows[i + 1] - y) * e) / P) * P };
  };

  /** When each runner on lane `i` set off, up to `t`. */
  const setOff = (i: number, t: number): number[] => {
    const f = first(i);
    if (t < f) return [];
    const all: number[] = [];
    for (const n of NEXT) if (f + n <= t) all.push(f + n);
    const last = f + NEXT[NEXT.length - 1];
    for (let k = Math.max(1, Math.floor((t - RUN - last) / EVERY)); last + k * EVERY <= t; k++)
      all.push(last + k * EVERY);
    return all.filter((s) => t - s < RUN);
  };

  return {
    rest: gone + RUN,
    routes: [
      [
        [G.bus, above],
        [G.bus, below],
      ],
      ...rows.map((y): [number, number][] => [
        [x0, y],
        [x0 + (sites - 1) * P, y],
      ]),
    ],
    frame(t, D) {
      D.n = 0;
      /* the bus beside the chips: specks */
      for (let y = rows[0]; y <= rows[3]; y += P) put(D, G.bus, y, sizes[0], STYLE.agentsDim);
      rows.forEach((y, i) => {
        /* a lane is three sites deep. Before it runs, only its middle file
           is there, in specks; a site is laid, all three deep, once the
           lane's first runner has been past it */
        const run = t - first(i);
        const laid = run <= 0 ? 0 : Math.floor((run / RUN) * sites) + 1;
        for (let j = 0; j < sites; j++) {
          const x = x0 + j * P;
          if (j < laid) {
            put(D, x, y - P, sizes[0], STYLE.agentsDim);
            put(D, x, y, sizes[1], STYLE.agents);
            put(D, x, y + P, sizes[0], STYLE.agentsDim);
          } else put(D, x, y, sizes[0], STYLE.agentsDim);
        }
        /* the team's runners: a packet of work, three deep, with two
           columns trailing it a size smaller each, stepping site to site */
        for (const s of setOff(i, t)) {
          const at = Math.floor(((t - s) / RUN) * sites);
          const tail = [
            [0, sizes[2], sizes[3], STYLE.teamLit],
            [1, sizes[1], sizes[2], STYLE.teamLit],
            [2, sizes[0], sizes[1], STYLE.team],
          ] as const;
          for (const [back, edge, mid, style] of tail) {
            const j = at - back;
            if (j < 0 || j >= sites) continue;
            const x = x0 + j * P;
            put(D, x, y - P, edge, style);
            put(D, x, y, mid, style);
            put(D, x, y + P, edge, style);
          }
        }
      });
      const at = goldAt(t);
      if (at) {
        if (at.fall) {
          /* a falling dot trails two smaller ones, as S4·E's drops do */
          const [a, b, e] = at.fall;
          const s = Math.sqrt(e);
          for (const [back, tier] of TRAIL) {
            if (s - back <= 0) break;
            put(D, at.x, lerp(a, b, drop(s - back)), sizes[tier], STYLE.fallGold);
          }
        }
        gold(D, G, at.x, Math.round(at.y));
      }
    },
  };
}
