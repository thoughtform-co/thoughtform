/* The swarm, as one pool of dots with an identity each. PURE.

   S4·E keeps its dots a population a plate, which is all a standing stack
   needs. A dot that has to leave its plate, cross the page and take a seat
   in another figure needs to be the same dot all the way, so the three
   plates are flattened here into one pool, in the order S4·E paints them
   (the agents, what stands on their board, the layer, the team), and each
   dot is told what it will need on the way:

     plate, seg   whose it is, and which run of the painter it belongs to
     u, v         where it stands across its plate, 0..1 each way
     rank         its turn in its plate when the plate prints, 0..1
     h            a number of its own, 0..1, for a start that is not its rank's

   RIDERS. "Then every team" asks for more green dots than the team's plate
   holds: six teams take a first course each. The extra dots are riders: they
   sit on a dot of the team's plate, unseen, until they leave Marketing. */

import { hash2, PLATES } from "../../stack-forms/model";
import { kOf, type Pop, type Scene } from "../../stack-forms/swarm/dots";

export interface Segment {
  plate: 0 | 1 | 2;
  from: number;
  to: number;
  /** The silhouette that hides what is behind it; empty for none. */
  mask: Int32Array;
  /** A solid on the agents' board: it travels whole. */
  block: boolean;
}

export interface Pool {
  count: number;
  /** The plates' own dots; the rest are riders. */
  own: number;
  /** Device px from the lattice's origin, at lift 0. */
  lx: Int32Array;
  ly: Int32Array;
  tier: Uint8Array;
  style: Uint8Array;
  amp: Float32Array;
  phase: Float32Array;
  rate: Float32Array;
  plate: Uint8Array;
  u: Float32Array;
  v: Float32Array;
  rank: Float32Array;
  h: Float32Array;
  /** The dot a rider sits on; -1 for a plate's own dot. */
  host: Int32Array;
  segs: Segment[];
  /** How many dots each plate owns, team first. */
  holds: [number, number, number];
  /** Where each plate's rows are by rank: `ly` at 33 even steps of it, so
      what hides the dots behind a plate can follow it as it prints. */
  rows: [Float32Array, Float32Array, Float32Array];
}

/** A plate's `ly` at a rank, 0..1. */
export function rowAt(pool: Pool, plate: number, rank: number): number {
  const rows = pool.rows[plate];
  const at = Math.min(1, Math.max(0, rank)) * (rows.length - 1);
  const i = Math.min(rows.length - 2, Math.floor(at));
  return rows[i] + (rows[i + 1] - rows[i]) * (at - i);
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export function buildPool(S: Scene, riders: number): Pool {
  const { L } = S;
  const [team, layer, agents] = S.plates;
  const parts: { pop: Pop; plate: 0 | 1 | 2; mask: Int32Array; block: boolean }[] = [
    { pop: agents.base, plate: 2, mask: agents.mask, block: false },
    ...agents.blocks.map((b) => ({ pop: b.pop, plate: 2 as const, mask: b.mask, block: true })),
    { pop: layer.base, plate: 1, mask: layer.mask, block: false },
    { pop: team.base, plate: 0, mask: team.mask, block: false },
  ];
  const own = parts.reduce((sum, p) => sum + p.pop.count, 0);
  const count = own + Math.max(0, riders);
  const P: Pool = {
    count,
    own,
    lx: new Int32Array(count),
    ly: new Int32Array(count),
    tier: new Uint8Array(count),
    style: new Uint8Array(count),
    amp: new Float32Array(count),
    phase: new Float32Array(count),
    rate: new Float32Array(count),
    plate: new Uint8Array(count),
    u: new Float32Array(count),
    v: new Float32Array(count),
    rank: new Float32Array(count),
    h: new Float32Array(count),
    host: new Int32Array(count).fill(-1),
    segs: [],
    holds: [0, 0, 0],
    rows: [new Float32Array(33), new Float32Array(33), new Float32Array(33)],
  };

  /* each plate's top row: a dot's place across its plate is read back
     through the lattice as if it stood there (a wall's dot lands on the
     edge it hangs from, which is where it belongs) */
  const tops = [
    kOf(L, PLATES[0].top),
    kOf(L, PLATES[1].top),
    kOf(L, PLATES[2].body[0].z1),
  ] as const;
  let at = 0;
  for (const part of parts) {
    const { pop, plate } = part;
    for (const run of pop.runs) for (let q = run.from; q < run.to; q++) P.style[at + q] = run.style;
    for (let q = 0; q < pop.count; q++) {
      const d = at + q;
      P.lx[d] = pop.x[q];
      P.ly[d] = pop.y[q];
      P.tier[d] = pop.tier[q];
      P.amp[d] = pop.amp[q];
      P.phase[d] = pop.phase[q];
      P.rate[d] = pop.rate[q];
      P.plate[d] = plate;
      const s = pop.x[q] / (L.a * L.g);
      const t = pop.y[q] / (L.b * L.g) + tops[plate];
      P.u[d] = clamp01((s + t) / 2 / L.m);
      P.v[d] = clamp01((t - s) / 2 / L.m);
      P.h[d] = hash2(pop.x[q], pop.y[q], 17 + plate);
    }
    P.segs.push({ plate, from: at, to: at + pop.count, mask: part.mask, block: part.block });
    P.holds[plate] += pop.count;
    at += pop.count;
  }

  /* a plate prints as a page does: row by row down the screen, each row
     left to right */
  for (const plate of [0, 1, 2] as const) {
    const mine: number[] = [];
    for (let d = 0; d < own; d++) if (P.plate[d] === plate) mine.push(d);
    mine.sort((p, q) => P.ly[p] - P.ly[q] || P.lx[p] - P.lx[q]);
    mine.forEach((d, i) => {
      P.rank[d] = mine.length > 1 ? i / (mine.length - 1) : 0;
    });
    const rows = P.rows[plate];
    for (let q = 0; q < rows.length; q++)
      rows[q] = P.ly[mine[Math.round((q / (rows.length - 1)) * (mine.length - 1))]] ?? 0;
  }
  /* what stands on the board travels whole: one turn and one number a solid */
  for (const seg of P.segs) {
    if (!seg.block) continue;
    let sum = 0;
    for (let d = seg.from; d < seg.to; d++) sum += P.rank[d];
    const rank = sum / Math.max(1, seg.to - seg.from);
    const h = P.h[seg.from];
    for (let d = seg.from; d < seg.to; d++) {
      P.rank[d] = rank;
      P.h[d] = h;
    }
  }

  /* the riders, spread evenly over the team's own dots */
  const teamSeg = P.segs[P.segs.length - 1];
  const span = teamSeg.to - teamSeg.from;
  for (let r = 0; r < count - own; r++) {
    const d = own + r;
    const host = teamSeg.from + (Math.floor((r * 7919) / 13) % Math.max(1, span));
    P.host[d] = host;
    P.lx[d] = P.lx[host];
    P.ly[d] = P.ly[host];
    P.tier[d] = P.tier[host];
    P.style[d] = P.style[host];
    P.plate[d] = 0;
    P.u[d] = P.u[host];
    P.v[d] = P.v[host];
    P.rank[d] = P.rank[host];
    P.h[d] = hash2(r, 3, 41);
  }
  if (count > own) {
    P.segs.push({ plate: 0, from: own, to: count, mask: new Int32Array(0), block: false });
  }
  return P;
}
