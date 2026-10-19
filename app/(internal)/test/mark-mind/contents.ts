/* What the drum carries: the offices of the people and the circuits of the
   machine. PURE, seeded.

   Both are laid out over the whole disc in the drum's own turning frame
   (p, q); the painter rotates them by the flywheel's angle and shows each
   only through its own sectors, so as the drum turns, floors pass under the
   slanted bar and come out the other side as circuits. */

import { R, type P2 } from "./geometry";

export interface Wall {
  a: P2;
  b: P2;
}
export interface Desk {
  at: P2;
  w: number;
  d: number;
  turned: boolean;
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

const CELL = 16; // one office bay
const REACH = R * 0.9; // contents stay inside the gold rim

export function contentsOf(seed = 7): Contents {
  const rnd = mulberry(seed);
  const walls: Wall[] = [];
  const desks: Desk[] = [];
  const people: Person[] = [];
  const n = Math.ceil(REACH / CELL);
  const within = ([p, q]: P2, m = 0) => Math.hypot(p, q) < REACH - m;

  // offices: bays on a grid, a wall on some of each bay's north and west
  // edges (doors left as gaps), desks in pairs, people standing among them
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const x0 = i * CELL;
      const y0 = j * CELL;
      const c: P2 = [x0 + CELL / 2, y0 + CELL / 2];
      if (!within(c, 4)) continue;
      const edge = (a: P2, b: P2) => {
        if (!within(a) || !within(b)) return;
        if (rnd() < 0.3) {
          // a door: the wall in two pieces
          const t = 0.35 + rnd() * 0.3;
          const m1: P2 = [a[0] + (b[0] - a[0]) * (t - 0.14), a[1] + (b[1] - a[1]) * (t - 0.14)];
          const m2: P2 = [a[0] + (b[0] - a[0]) * (t + 0.14), a[1] + (b[1] - a[1]) * (t + 0.14)];
          walls.push({ a, b: m1 }, { a: m2, b });
        } else walls.push({ a, b });
      };
      if (rnd() < 0.62) edge([x0, y0], [x0 + CELL, y0]);
      if (rnd() < 0.62) edge([x0, y0], [x0, y0 + CELL]);
      const kind = rnd();
      if (kind < 0.55) {
        // open plan: a pair of desks, people at them
        const turned = rnd() < 0.5;
        const dx = turned ? 0 : 3.2;
        const dy = turned ? 3.2 : 0;
        desks.push({ at: [c[0] - dx, c[1] - dy], w: turned ? 6 : 2.6, d: turned ? 2.6 : 6, turned });
        desks.push({ at: [c[0] + dx, c[1] + dy], w: turned ? 6 : 2.6, d: turned ? 2.6 : 6, turned });
        const count = 1 + Math.floor(rnd() * 3);
        for (let k = 0; k < count; k++) people.push({ at: [c[0] + (rnd() - 0.5) * 10, c[1] + (rnd() - 0.5) * 10], live: rnd() < 0.12 });
      } else if (kind < 0.8) {
        // a meeting table, people round it
        desks.push({ at: c, w: 7, d: 3.4, turned: false });
        const count = 2 + Math.floor(rnd() * 3);
        for (let k = 0; k < count; k++) {
          const a = (k / count) * Math.PI * 2 + rnd() * 0.4;
          people.push({ at: [c[0] + Math.cos(a) * 5.2, c[1] + Math.sin(a) * 3.6], live: rnd() < 0.12 });
        }
      }
    }
  }

  // circuits: routed traces on a 45° grid, vias at their ends, a few dies
  const traces: Trace[] = [];
  const vias: P2[] = [];
  const dirs: P2[] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [Math.SQRT1_2, Math.SQRT1_2],
    [-Math.SQRT1_2, Math.SQRT1_2],
    [Math.SQRT1_2, -Math.SQRT1_2],
    [-Math.SQRT1_2, -Math.SQRT1_2],
  ];
  for (let k = 0; k < 150; k++) {
    const r = Math.sqrt(rnd()) * (REACH - 4);
    const a = rnd() * Math.PI * 2;
    let p: P2 = [Math.round((Math.cos(a) * r) / 2) * 2, Math.round((Math.sin(a) * r) / 2) * 2];
    const pts: P2[] = [p];
    let d = Math.floor(rnd() * 4);
    const segs = 2 + Math.floor(rnd() * 4);
    for (let s = 0; s < segs; s++) {
      const len = 4 + Math.floor(rnd() * 10);
      const step = dirs[d]!;
      const next: P2 = [p[0] + step[0] * len, p[1] + step[1] * len];
      if (!within(next, 2)) break;
      pts.push(next);
      p = next;
      // turn by 45° either way, as routed traces do
      const turn = rnd() < 0.5 ? 1 : -1;
      d = d < 4 ? (rnd() < 0.5 ? 4 + ((d + (turn > 0 ? 0 : 3)) % 4) : d) : (d - 4 + (turn > 0 ? 1 : 0)) % 4;
    }
    if (pts.length < 2) continue;
    traces.push({ pts });
    vias.push(pts[pts.length - 1]!);
    if (rnd() < 0.4) vias.push(pts[0]!);
  }
  const dies: Die[] = [];
  for (let k = 0; k < 10; k++) {
    const r = Math.sqrt(rnd()) * (REACH - 14);
    const a = rnd() * Math.PI * 2;
    dies.push({ at: [Math.cos(a) * r, Math.sin(a) * r], s: 6 + rnd() * 6 });
  }

  return { walls, desks, people, traces, dies, vias };
}
