import type { CrewOutput } from "@/lib/arcs/types";

/**
 * THE LOOP RETURN'S FIGURES, AS PARTICLES (ADR-153 U5, owner 2026-10-10:
 * "our leitmotif is the particle system diagrams"). One drawing per
 * `CrewOutput` kind, each the quantity the record states, in a 300 × 100
 * crop the case card's lane draws under `xMidYMid meet`:
 *
 *   field    one grain per asset, exactly `count` of them, brightening left
 *            to right across the month
 *   funnel   the pre-filled lines of copy, each a run of grains, streaming
 *            into the one copy editor who checks them
 *   tenfold  ten reviews, nine read by the agent, the tenth lifted to the
 *            person who takes it
 *   split    the month's ad count as one mass, fanning out into `parts`
 *            briefs
 *
 * One colour law, the house's: a gold grain is what runs, a green diamond is
 * a person and nothing else, a dawn hairline is structure.
 *
 * ⚠ COPIED FROM `substrateForms.tsx`'S GRAMMAR, NEVER IMPORTED: that module
 * is the casefile's and returns React marks; this one returns NUMBERS, so a
 * test can count the grains (the field's count is the record's own figure,
 * and the registry pins that figure to the line it says). The PRNG is the
 * owner's mockup's, unchanged.
 *
 * ⚠ SEEDED, so a render is the same drawing every time: a stray
 * `Math.random()` here would re-scatter the field on every server render and
 * every still.
 *
 * ⚠ THE FUNNEL'S TWELVE AND THE SPLIT'S SIX ARE ILLUSTRATIVE, not counts the
 * record states, which is why the card letters no figure caption under them.
 */

export const PARTICLE_VB = { w: 300, h: 100 } as const;

/** A square particle: top-left corner, side, alpha. */
export interface CrewGrain {
  x: number;
  y: number;
  s: number;
  a: number;
}

/** A person: a green diamond, centre and half-diagonal. */
export interface CrewPerson {
  cx: number;
  cy: number;
  r: number;
}

export interface CrewParticles {
  grains: readonly CrewGrain[];
  people: readonly CrewPerson[];
  /** Dawn hairlines, one path string each. */
  traces: readonly string[];
}

/** The owner's mockup PRNG (`substrateForms.tsx`), unchanged. */
function rng(seed: number) {
  let t = seed;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable seed from a row id, so each lane draws its own scatter. */
export function crewSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A grain centred on (cx, cy). */
function grain(cx: number, cy: number, s: number, a: number): CrewGrain {
  return { x: r1(cx - s / 2), y: r1(cy - s / 2), s, a: Math.min(1, Math.max(0, a)) };
}

type Pt = readonly [number, number];

function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): [number, number] {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

const curve = (p0: Pt, p1: Pt, p2: Pt, p3: Pt) =>
  `M${r1(p0[0])} ${r1(p0[1])}C${r1(p1[0])} ${r1(p1[1])} ${r1(p2[0])} ${r1(p2[1])} ${r1(p3[0])} ${r1(p3[1])}`;

/* The drawing's inner box: every grain and every person stays inside it. */
const X0 = 14;
const X1 = 286;
const Y0 = 14;
const Y1 = 86;

/** One grain per unit, column by column, so a count that does not fill the
 *  last column leaves it partial rather than inventing marks. */
function field(count: number, R: () => number): CrewParticles {
  const w = X1 - X0;
  const h = Y1 - Y0;
  const rows = Math.max(1, Math.round(Math.sqrt((count * h) / w)));
  const cols = Math.ceil(count / rows);
  const px = w / cols;
  const py = h / rows;
  const grains: CrewGrain[] = [];
  for (let n = 0; n < count; n += 1) {
    const c = Math.floor(n / rows);
    const r = n % rows;
    const cx = X0 + (c + 0.5) * px + (R() - 0.5) * px * 0.6;
    const cy = Y0 + (r + 0.5) * py + (R() - 0.5) * py * 0.6;
    const s = R() < 0.2 ? 1.9 : 1.4;
    const a = 0.22 + 0.5 * (c / Math.max(1, cols - 1)) + R() * 0.26;
    grains.push(grain(cx, cy, s, a));
  }
  return { grains, people: [], traces: [] };
}

/** The pre-filled lines stream into the one person who checks them all,
 *  and the checked copy leaves past them. */
function funnel(lines: number, R: () => number): CrewParticles {
  const grains: CrewGrain[] = [];
  const traces: string[] = [];
  const person: CrewPerson = { cx: 238, cy: 50, r: 5 };
  const n = Math.max(1, lines);
  for (let i = 0; i < n; i += 1) {
    const y = n === 1 ? 50 : Y0 + ((Y1 - Y0) * i) / (n - 1);
    // A line of copy: a run of grains, its length varying like a text line.
    const len = 30 + R() * 40;
    for (let x = X0 + 1; x <= X0 + len; x += 3.4) {
      grains.push(grain(x + (R() - 0.5) * 0.8, y + (R() - 0.5) * 0.8, 1.3, 0.3 + R() * 0.3));
    }
    const p0: Pt = [X0 + len + 5, y];
    const p1: Pt = [X0 + len + 64, y];
    const p2: Pt = [person.cx - 70, person.cy + (y - person.cy) * 0.18];
    const p3: Pt = [person.cx - 9, person.cy];
    traces.push(curve(p0, p1, p2, p3));
    for (let k = 1; k <= 9; k += 1) {
      const t = k / 10;
      const [x, yy] = bezier(p0, p1, p2, p3, t);
      grains.push(grain(x, yy + (R() - 0.5) * 0.6, 1.5, 0.3 + 0.55 * t + R() * 0.1));
    }
  }
  // The checked copy, past the person.
  for (let k = 0; k < 6; k += 1) {
    grains.push(grain(person.cx + 12 + k * 7, person.cy + (R() - 0.5) * 1.2, 1.7, 0.85));
  }
  return { grains, people: [person], traces };
}

/** Ten reviews in a row: the agent reads nine, the tenth rises to the
 *  person who takes it. */
function tenfold(R: () => number): CrewParticles {
  const grains: CrewGrain[] = [];
  const y = 66;
  const first = 24;
  const last = 276;
  const step = (last - first) / 9;
  const lift: CrewPerson = { cx: last, cy: 22, r: 5 };
  for (let k = 0; k < 10; k += 1) {
    const cx = first + k * step;
    const lit = k === 9;
    for (let i = 0; i < 20; i += 1) {
      const ang = R() * Math.PI * 2;
      const rad = Math.sqrt(R()) * 9.5;
      const a = lit ? 0.7 + R() * 0.3 : 0.3 + R() * 0.35;
      grains.push(grain(cx + Math.cos(ang) * rad, y + Math.sin(ang) * rad * 0.8, 1.5, a));
    }
  }
  // The tenth, lifted: a short column of grains up to the person.
  for (let k = 1; k <= 4; k += 1) {
    grains.push(grain(last + (R() - 0.5) * 0.8, y - 10 - k * 6.5, 1.5, 0.55 + 0.1 * k));
  }
  return {
    grains,
    people: [lift],
    traces: [`M${last} ${y - 10}V${lift.cy + 8}`],
  };
}

/** The month's ad count as one mass, fanned out into its briefs. */
function split(parts: number, R: () => number): CrewParticles {
  const grains: CrewGrain[] = [];
  const traces: string[] = [];
  const mass: Pt = [46, 50];
  for (let i = 0; i < 120; i += 1) {
    const ang = R() * Math.PI * 2;
    const rad = Math.sqrt(R());
    const s = R() < 0.2 ? 1.9 : 1.4;
    grains.push(
      grain(
        mass[0] + Math.cos(ang) * rad * 30,
        mass[1] + Math.sin(ang) * rad * 32,
        s,
        0.3 + R() * 0.55
      )
    );
  }
  const n = Math.max(1, parts);
  const end = 266;
  for (let k = 0; k < n; k += 1) {
    const ey = n === 1 ? 50 : 16 + (68 * k) / (n - 1);
    const p0: Pt = [mass[0] + 34, mass[1]];
    const p1: Pt = [mass[0] + 100, mass[1]];
    const p2: Pt = [end - 74, ey];
    const p3: Pt = [end, ey];
    traces.push(curve(p0, p1, p2, p3));
    for (let i = 1; i <= 11; i += 1) {
      const t = i / 12;
      const [x, y] = bezier(p0, p1, p2, p3, t);
      grains.push(grain(x, y + (R() - 0.5) * 0.6, 1.5, 0.3 + 0.5 * t + R() * 0.1));
    }
    // The brief: one larger grain at the stream's end.
    grains.push(grain(end + 8, ey, 4, 0.95));
  }
  return { grains, people: [], traces };
}

/** The drawing for one row's output, the same every render for one seed. */
export function crewParticles(o: CrewOutput, seed: number): CrewParticles {
  const R = rng(seed);
  switch (o.kind) {
    case "field":
      return field(o.count, R);
    case "funnel":
      return funnel(o.lines, R);
    case "tenfold":
      return tenfold(R);
    case "split":
      return split(o.parts, R);
  }
}

/** Grains grouped by alpha (to a tenth), one subpath per grain: a handful of
 *  `<path>`s for a drawing of hundreds of marks. */
export function grainPaths(grains: readonly CrewGrain[]): { a: number; d: string }[] {
  const buckets = new Map<number, string[]>();
  for (const g of grains) {
    const a = Math.round(g.a * 10) / 10;
    const d = `M${g.x} ${g.y}h${g.s}v${g.s}h-${g.s}z`;
    const list = buckets.get(a);
    if (list) list.push(d);
    else buckets.set(a, [d]);
  }
  return [...buckets.entries()]
    .sort((p, q) => p[0] - q[0])
    .map(([a, ds]) => ({ a, d: ds.join("") }));
}

/** A person's diamond as one path. */
export function personPath(p: CrewPerson): string {
  return `M${p.cx} ${p.cy - p.r}L${p.cx + p.r} ${p.cy}L${p.cx} ${p.cy + p.r}L${p.cx - p.r} ${p.cy}Z`;
}
