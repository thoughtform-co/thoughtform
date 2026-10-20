/* What the drum carries: the offices of the people and the circuits of the
   machine. PURE, seeded.

   Both are laid out over the whole disc in the drum's own turning frame
   (p, q); the painter rotates them by the flywheel's angle and shows each
   only through its own sectors, so as the drum turns, floors pass under the
   slanted bar and come out the other side as circuits.

   Drawn as the image studies draw them: rooms with walls of real height
   (cubicles, meeting rooms, a corridor through), desks as low boxes, people
   standing; the machine as dense routed traces in buses, vias, and dies that
   step up in two tiers. */

import { R, type P2 } from "./geometry";

export interface Wall {
  a: P2;
  b: P2;
}
export interface Desk {
  at: P2;
  w: number;
  d: number;
}
export interface Person {
  at: P2;
  live: boolean;
}
export interface Trace {
  pts: P2[];
}
export interface Die {
  at: P2;
  s: number;
  tiers: number;
}
export interface Contents {
  walls: Wall[];
  desks: Desk[];
  people: Person[];
  traces: Trace[];
  dies: Die[];
  vias: P2[];
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CELL = 9; // one office bay
const REACH = R * 0.9; // contents stay inside the gold rim

export function contentsOf(seed = 11): Contents {
  const rnd = mulberry(seed);
  const walls: Wall[] = [];
  const desks: Desk[] = [];
  const people: Person[] = [];
  const n = Math.ceil(REACH / CELL);
  const within = ([p, q]: P2, m = 0) => Math.hypot(p, q) < REACH - m;

  // offices: bays on a grid; every third column is a corridor (no walls
  // across it); each bay is a cubicle row, a meeting room or open floor
  for (let i = -n; i <= n; i++) {
    const corridor = ((i % 4) + 4) % 4 === 0;
    for (let j = -n; j <= n; j++) {
      const x0 = i * CELL;
      const y0 = j * CELL;
      const c: P2 = [x0 + CELL / 2, y0 + CELL / 2];
      if (!within(c, 3)) continue;
      const edge = (a: P2, b: P2, door: boolean) => {
        if (!within(a, 1) || !within(b, 1)) return;
        if (door) {
          const t = 0.3 + rnd() * 0.4;
          walls.push({ a, b: [a[0] + (b[0] - a[0]) * (t - 0.15), a[1] + (b[1] - a[1]) * (t - 0.15)] });
          walls.push({ a: [a[0] + (b[0] - a[0]) * (t + 0.15), a[1] + (b[1] - a[1]) * (t + 0.15)], b });
        } else walls.push({ a, b });
      };
      if (corridor) {
        if (rnd() < 0.35) people.push({ at: [c[0] + (rnd() - 0.5) * 4, c[1] + (rnd() - 0.5) * 7], live: rnd() < 0.2 });
        continue;
      }
      if (rnd() < 0.7) edge([x0, y0], [x0 + CELL, y0], rnd() < 0.35);
      if (rnd() < 0.55) edge([x0, y0], [x0, y0 + CELL], rnd() < 0.35);
      const kind = rnd();
      if (kind < 0.42) {
        // a cubicle pair: a low spine wall, desks either side, people at them
        edge([x0 + 1, c[1]], [x0 + CELL - 1, c[1]], false);
        edge([c[0], y0 + 1], [c[0], c[1]], false);
        desks.push({ at: [x0 + CELL * 0.3, c[1] - 1.6], w: 3.2, d: 1.4 }, { at: [x0 + CELL * 0.7, c[1] + 1.6], w: 3.2, d: 1.4 });
        const count = 1 + Math.floor(rnd() * 3);
        for (let k = 0; k < count; k++) people.push({ at: [x0 + 1.5 + rnd() * (CELL - 3), c[1] + (rnd() < 0.5 ? -3 : 3)], live: rnd() < 0.12 });
      } else if (kind < 0.7) {
        // a meeting room: walls round it, a door, a table, people round it
        edge([x0, y0], [x0 + CELL, y0], false);
        edge([x0, y0], [x0, y0 + CELL], true);
        edge([x0 + CELL, y0], [x0 + CELL, y0 + CELL], false);
        edge([x0, y0 + CELL], [x0 + CELL, y0 + CELL], rnd() < 0.5);
        desks.push({ at: c, w: 4.4, d: 2.2 });
        const count = 2 + Math.floor(rnd() * 4);
        for (let k = 0; k < count; k++) {
          const a = (k / count) * Math.PI * 2 + rnd() * 0.3;
          people.push({ at: [c[0] + Math.cos(a) * 3.3, c[1] + Math.sin(a) * 2.4], live: rnd() < 0.12 });
        }
      } else {
        // open floor: a long bench, a few people standing
        desks.push({ at: c, w: 6, d: 1.6 });
        const count = Math.floor(rnd() * 3);
        for (let k = 0; k < count; k++) people.push({ at: [c[0] + (rnd() - 0.5) * 7, c[1] + (rnd() < 0.5 ? -2.4 : 2.4)], live: rnd() < 0.12 });
      }
    }
  }

  // circuits: buses of parallel traces routed on a 45° grid, single traces
  // between them, vias at their ends, dies in two tiers
  const traces: Trace[] = [];
  const vias: P2[] = [];
  const dirs: P2[] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  const route = (start: P2, d0: number, segs: number, offset: P2) => {
    const pts: P2[] = [[start[0] + offset[0], start[1] + offset[1]]];
    let p = start;
    let d = d0;
    for (let s = 0; s < segs; s++) {
      const len = 3 + Math.floor(rnd() * 8);
      const step = dirs[d]!;
      // a 45° jog before the turn, as routed traces do
      const next: P2 = [p[0] + step[0] * len, p[1] + step[1] * len];
      if (!within(next, 3)) break;
      const turn = rnd() < 0.5 ? 1 : 3;
      const nd = (d + turn) % 4;
      const jog: P2 = [next[0] + (dirs[nd]![0] + step[0]) * 2, next[1] + (dirs[nd]![1] + step[1]) * 2];
      pts.push([next[0] + offset[0], next[1] + offset[1]], [jog[0] + offset[0], jog[1] + offset[1]]);
      p = jog;
      d = nd;
    }
    return pts;
  };
  for (let k = 0; k < 170; k++) {
    const r = Math.sqrt(rnd()) * (REACH - 6);
    const a = rnd() * Math.PI * 2;
    const start: P2 = [Math.round((Math.cos(a) * r) / 2) * 2, Math.round((Math.sin(a) * r) / 2) * 2];
    const d0 = Math.floor(rnd() * 4);
    const segs = 2 + Math.floor(rnd() * 4);
    const width = rnd() < 0.55 ? 1 + Math.floor(rnd() * 4) : 1;
    const perp = dirs[(d0 + 1) % 4]!;
    // the same route offset across, so a bus keeps its lines parallel
    const seed2 = rnd() * 1e9;
    for (let w = 0; w < width; w++) {
      const local = mulberry(seed2);
      const pts: P2[] = [];
      let p = start;
      let d = d0;
      pts.push([p[0] + perp[0] * w * 1.1, p[1] + perp[1] * w * 1.1]);
      for (let s = 0; s < segs; s++) {
        const len = 3 + Math.floor(local() * 9);
        const step = dirs[d]!;
        const next: P2 = [p[0] + step[0] * len, p[1] + step[1] * len];
        if (!within(next, 4)) break;
        const nd = (d + (local() < 0.5 ? 1 : 3)) % 4;
        pts.push([next[0] + perp[0] * w * 1.1, next[1] + perp[1] * w * 1.1]);
        p = next;
        d = nd;
      }
      if (pts.length < 2) continue;
      traces.push({ pts });
      vias.push(pts[pts.length - 1]!);
    }
  }
  for (let k = 0; k < 260; k++) {
    const r = Math.sqrt(rnd()) * (REACH - 4);
    const a = rnd() * Math.PI * 2;
    const pts = route([Math.cos(a) * r, Math.sin(a) * r], Math.floor(rnd() * 4), 1 + Math.floor(rnd() * 3), [0, 0]);
    if (pts.length < 2) continue;
    traces.push({ pts });
    vias.push(pts[pts.length - 1]!);
    if (rnd() < 0.5) vias.push(pts[0]!);
  }
  const dies: Die[] = [];
  for (let k = 0; k < 28; k++) {
    const r = Math.sqrt(rnd()) * (REACH - 12);
    const a = rnd() * Math.PI * 2;
    dies.push({ at: [Math.cos(a) * r, Math.sin(a) * r], s: 4 + rnd() * 6, tiers: rnd() < 0.5 ? 2 : 1 });
  }

  return { walls, desks, people, traces, dies, vias };
}
