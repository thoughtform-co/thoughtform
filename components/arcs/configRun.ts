/**
 * configRun — the configuration, drawn as one run (the X-Bionic proposal,
 * 2026-10-10; the owner's eight-step outline, approved "Draw it"). Pure,
 * server-safe, no react: numbers and path strings, so a test can count them.
 *
 *   1  the layer      the vision's "Your layer" as a key plan: the gold slab
 *                     with one lane per workstream, the lit one in front
 *   2  the job        a cone opens from that lane onto ONE panel: the
 *                     workstream's jobs across its head, ads design lit
 *   3  the ends       the job's three inputs on the left (the renders, the
 *                     voice, the brief) and the finished ad on the right
 *   4  adopt          the upper run: made with Claude, a green diamond at
 *                     every step, a person checking it
 *   5  write it down  the band between the runs: two of those checks fall
 *                     into it and are kept, as a skill and as evals
 *   6  automate       the lower run: one continuous line through two gates
 *                     (the evals, ticked down from the band) to one person,
 *                     asked before it goes out
 *
 * One colour law, the house's (`crewParticles`): a gold grain is what runs,
 * a green diamond is a person and nothing else, a hairline is structure, and
 * ink grains are the material (the inputs and the ad).
 *
 * ⚠ THE SVG LETTERS NOTHING. Every word is DOM, seated at a fraction of the
 * crop (`seats`), so no label sits on a drawn face and every collision is a
 * DOM box a test can measure (`pluginLayer`'s rule).
 * ⚠ SEEDED, never `Math.random()`: a render is the same drawing every time.
 * ⚠ The PRNG and the grain helpers are COPIED from `crewParticles` (private
 * there), never re-imported through a widened export.
 */
import { crewSeed, grainPaths, personPath } from "./crewParticles";
import type { CrewGrain } from "./crewParticles";
import { ISO_ANGLE } from "./framing/iso";

/** The crop, in drawing units. Every coordinate below is written against it. */
export const CFG_VB = { w: 1200, h: 470 } as const;

type Pt = readonly [number, number];

/** The steps a part of the drawing belongs to: what lights it on the runway
 *  and what the three states dim. */
export type CfgStep = 1 | 2 | 3 | 4 | 5 | 6;

/** One mark, in draw order inside its step. `a` is set on grains only. */
export interface CfgMark {
  cls:
    | "plate"
    | "plate-side"
    | "lane-lit"
    | "seam"
    | "cone"
    | "panel"
    | "rule"
    | "frame"
    | "frame-back"
    | "trace"
    | "node"
    | "band"
    | "eval"
    | "tick"
    | "gate"
    | "cta"
    | "grain-gold"
    | "grain-ink"
    | "person";
  d: string;
  a?: number;
}

export interface CfgGroup {
  step: CfgStep;
  marks: CfgMark[];
}

export interface CfgSeat {
  /** Fractions of the crop, for `--ax` / `--at`. */
  ax: number;
  at: number;
}

export interface ConfigRunDrawing {
  vb: typeof CFG_VB;
  groups: CfgGroup[];
  seats: {
    layer: CfgSeat;
    list: CfgSeat;
    head: CfgSeat;
    inputs: readonly [CfgSeat, CfgSeat, CfgSeat];
    rows: readonly [CfgSeat, CfgSeat, CfgSeat];
    keys: { skill: CfgSeat; evals: CfgSeat };
    output: CfgSeat;
  };
}

/* ── The helpers, copied from `crewParticles` ──────────────────────────── */

function rng(seed: number) {
  let t = seed;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function grain(cx: number, cy: number, s: number, a: number): CrewGrain {
  const side = r1(s);
  return { x: r1(cx - side / 2), y: r1(cy - side / 2), s: side, a: clamp(a, 0, 1) };
}

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

const poly = (ps: readonly Pt[]) => `M${ps.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L")}Z`;
const sq = (cx: number, cy: number, s: number) =>
  `M${r1(cx - s / 2)} ${r1(cy - s / 2)}h${s}v${s}h-${s}z`;
const seat = (x: number, y: number): CfgSeat => ({
  ax: Math.round((x / CFG_VB.w) * 10000) / 10000,
  at: Math.round((y / CFG_VB.h) * 10000) / 10000,
});

/* ── A path as segments, sampled by arc length ─────────────────────────── */

type Seg = { line: [Pt, Pt] } | { cubic: [Pt, Pt, Pt, Pt] };

function segPath(segs: readonly Seg[]): string {
  let out = "";
  let at: Pt | null = null;
  for (const s of segs) {
    if ("line" in s) {
      const [a, b] = s.line;
      if (!at || at[0] !== a[0] || at[1] !== a[1]) out += `M${r1(a[0])} ${r1(a[1])}`;
      out += `L${r1(b[0])} ${r1(b[1])}`;
      at = b;
    } else {
      const [p0, p1, p2, p3] = s.cubic;
      if (!at || at[0] !== p0[0] || at[1] !== p0[1]) out += `M${r1(p0[0])} ${r1(p0[1])}`;
      out += `C${r1(p1[0])} ${r1(p1[1])} ${r1(p2[0])} ${r1(p2[1])} ${r1(p3[0])} ${r1(p3[1])}`;
      at = p3;
    }
  }
  return out;
}

/** Dense samples along the segments, with the running length at each. */
function samples(segs: readonly Seg[]): { x: number; y: number; l: number }[] {
  const pts: [number, number][] = [];
  for (const s of segs) {
    if ("line" in s) {
      const [a, b] = s.line;
      const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
      for (let i = pts.length ? 1 : 0; i <= n; i += 1) {
        const t = i / n;
        pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    } else {
      const [p0, p1, p2, p3] = s.cubic;
      for (let i = pts.length ? 1 : 0; i <= 96; i += 1) pts.push(bezier(p0, p1, p2, p3, i / 96));
    }
  }
  let l = 0;
  return pts.map(([x, y], i) => {
    if (i > 0) l += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
    return { x, y, l };
  });
}

/**
 * Grains every `step` units along the segments. `shape(t)` sets each grain's
 * side and alpha from where it is on the path (0 at the start, 1 at the end);
 * a grain whose x falls in a `gap` is left out, so a diamond or a gate stands
 * clear of the line it sits on.
 */
function along(
  segs: readonly Seg[],
  R: () => number,
  o: {
    step: number;
    jitter: number;
    shape: (t: number) => { s: number; a: number };
    gaps?: readonly [number, number][];
  }
): CrewGrain[] {
  const pts = samples(segs);
  const total = pts[pts.length - 1].l;
  const out: CrewGrain[] = [];
  let k = 0;
  for (let l = 0; l <= total; l += o.step) {
    while (k < pts.length - 1 && pts[k + 1].l < l) k += 1;
    const p = pts[k];
    const q = pts[Math.min(k + 1, pts.length - 1)];
    const f = q.l > p.l ? (l - p.l) / (q.l - p.l) : 0;
    const x = p.x + (q.x - p.x) * f + (R() - 0.5) * o.jitter;
    const y = p.y + (q.y - p.y) * f + (R() - 0.5) * o.jitter;
    if (o.gaps?.some(([g0, g1]) => x > g0 && x < g1)) continue;
    const { s, a } = o.shape(total ? l / total : 0);
    out.push(grain(x, y, s, a));
  }
  return out;
}

/** Bucketed grains, one mark per alpha: the gold or the ink. */
function grainMarks(grains: readonly CrewGrain[], tone: "gold" | "ink"): CfgMark[] {
  return grainPaths(grains).map(({ a, d }) => ({ cls: `grain-${tone}` as const, d, a }));
}

/* ── The garment, the one product drawn: renders in, the ad out ────────── */

/** A shirt on a unit box, its collar open: the render and the ad's figure. */
const SHIRT: readonly Pt[] = [
  [0.32, 0],
  [0.42, 0.08],
  [0.5, 0.12],
  [0.58, 0.08],
  [0.68, 0],
  [1, 0.18],
  [0.9, 0.42],
  [0.78, 0.32],
  [0.78, 1],
  [0.22, 1],
  [0.22, 0.32],
  [0.1, 0.42],
  [0, 0.18],
];

function inside(poly_: readonly Pt[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = poly_.length - 1; i < poly_.length; j = i, i += 1) {
    const [xi, yi] = poly_[i];
    const [xj, yj] = poly_[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** The shirt in ink grains, lit from the left like a studio render. */
function garment(x0: number, y0: number, side: number, R: () => number): CrewGrain[] {
  const out: CrewGrain[] = [];
  const step = 2.6;
  for (let y = 0; y <= side; y += step) {
    for (let x = 0; x <= side; x += step) {
      const jx = x + (R() - 0.5) * 1.2;
      const jy = y + (R() - 0.5) * 1.2;
      const fx = jx / side;
      if (!inside(SHIRT, fx, jy / side)) continue;
      const a = clamp(0.35 + 0.45 * (1 - fx) + (R() - 0.5) * 0.2, 0.25, 0.9);
      out.push(grain(x0 + jx, y0 + jy, 1.3 + R() * 0.4, a));
    }
  }
  return out;
}

/** A line of type as words of grains: what a page of copy looks like from a
 *  distance, set ragged, never lettered. */
function prose(x0: number, y: number, len: number, R: () => number, a0: number, a1: number) {
  const out: CrewGrain[] = [];
  let x = x0;
  while (x < x0 + len) {
    const word = 3 + Math.floor(R() * 5);
    for (let i = 0; i < word && x < x0 + len; i += 1) {
      out.push(grain(x, y, 1.3, a0 + R() * (a1 - a0)));
      x += 3.2;
    }
    x += 4.2;
  }
  return out;
}

/* ── The key plan: the vision's layer, its lanes as the workstreams ─────── */

const RISE = Math.tan((ISO_ANGLE * Math.PI) / 180);
const PLAN = { x: 8, y: 193, side: 92, lane: 23, thick: 9 } as const;

/** A point on the plan's top: `u` along a lane, `v` across, back to front. */
function plan(u: number, v: number, z = 0): Pt {
  return [PLAN.x + u + v, PLAN.y + RISE * (v - u) + z];
}

/* ── The rows: where every run, gate and person sits ─────────────────── */

const ROW_A = 140;
const ROW_C = 372;
const RUN_X0 = 505;
const RUN_X1 = 950;
/** A person at every step of the adopted run; the two whose checks are
 *  kept stand over the evals, and the last stands over the ask. */
const CHECK_X = [590, 660, 730, 800, 870, 940] as const;
const EVAL_X = [800, 870] as const;
const ASK_X = 940;
const NODE: Pt = [460, 269];
const EXIT: Pt = [990, 269];
const PERSON_R = 6;
const BAND = { x0: 712, x1: 945, y0: 206, y1: 294 } as const;
const AD = { x0: 1020, y0: 204, w: 104, h: 130 } as const;

/**
 * The whole drawing for a run. `lanes` is the layer's workstream count (four
 * on the record); `lit` the lane the cone opens from, counted back to front.
 */
export function configRun(seedId: string, lanes = 4, lit = lanes - 1): ConfigRunDrawing {
  const R = rng(crewSeed(seedId));
  const groups: CfgGroup[] = [];

  /* 1 · the layer ------------------------------------------------------ */
  {
    const { side, lane, thick } = PLAN;
    const depth = lane * lanes;
    const L = plan(0, 0);
    const T = plan(side, 0);
    const Rr = plan(side, depth);
    const B = plan(0, depth);
    const down = (p: Pt): Pt => [p[0], p[1] + thick];
    const marks: CfgMark[] = [
      { cls: "plate-side", d: poly([L, B, down(B), down(L)]) },
      { cls: "plate-side", d: poly([B, Rr, down(Rr), down(B)]) },
      { cls: "plate", d: poly([L, T, Rr, B]) },
      {
        cls: "lane-lit",
        d: poly([plan(0, lit * lane), plan(side, lit * lane), plan(side, (lit + 1) * lane), plan(0, (lit + 1) * lane)]),
      },
      {
        cls: "seam",
        d: Array.from({ length: lanes - 1 }, (_, i) => {
          const [a, b] = [plan(0, (i + 1) * lane), plan(side, (i + 1) * lane)];
          return `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`;
        }).join(""),
      },
    ];
    /* Every lane carries work; the lit one runs, brightening along its
       length, and the rest are a faint record of theirs. */
    const quiet: CrewGrain[] = [];
    const bright: CrewGrain[] = [];
    for (let k = 0; k < lanes; k += 1) {
      const on = k === lit;
      const rows = on ? [lane * 0.32, lane * 0.68] : [lane * 0.5];
      for (const dv of rows) {
        for (let u = 5; u <= side - 5; u += on ? 3 : 6) {
          if (!on && R() < 0.35) continue;
          const [x, y] = plan(u + (R() - 0.5) * 1.4, k * lane + dv + (R() - 0.5) * 3);
          const t = u / side;
          if (on) bright.push(grain(x, y, 1.5 + R() * 0.6, 0.45 + 0.5 * t));
          else quiet.push(grain(x, y, 1.2 + R() * 0.4, 0.2 + R() * 0.2));
        }
      }
    }
    marks.push(...grainMarks(quiet, "gold"), ...grainMarks(bright, "gold"));
    groups.push({ step: 1, marks });
  }

  /* 2 · the job: the cone and the panel --------------------------------- */
  {
    const [cx0, cy0] = plan(PLAN.side, lit * PLAN.lane);
    const [cx1, cy1] = plan(PLAN.side, (lit + 1) * PLAN.lane);
    groups.push({
      step: 2,
      marks: [
        { cls: "cone", d: `M${r1(cx0)} ${r1(cy0)}L236 12M${r1(cx1)} ${r1(cy1)}L236 442` },
        { cls: "panel", d: "M236 12H1176L1192 28V458H252L236 442Z" },
        { cls: "rule", d: "M236 54H1192" },
      ],
    });
  }

  /* 3 · the ends: three inputs in, the ad out --------------------------- */
  {
    const marks: CfgMark[] = [];
    const ink: CrewGrain[] = [];
    /* The renders: two cards, the front one holding the product. */
    marks.push({ cls: "frame-back", d: "M264 130V124H316V168H308" });
    marks.push({ cls: "frame", d: "M256 130H308V174H256Z" });
    ink.push(...garment(266, 136, 32, R));
    /* The voice: a page of copy, five ragged lines. */
    [70, 64, 70, 52, 40].forEach((len, i) => ink.push(...prose(256, 251 + i * 9, len, R, 0.35, 0.75)));
    /* The brief: a card of fields, a key and its value per row. */
    marks.push({ cls: "frame", d: "M256 364H316V414H256Z" });
    [374, 384, 394, 404].forEach((y, i) => {
      for (let x = 262; x <= 276; x += 3) ink.push(grain(x, y, 1.3, 0.8));
      const end = 300 + ((i * 7) % 11);
      for (let x = 280; x <= end; x += 3) ink.push(grain(x, y, 1.3, 0.45));
    });
    /* The strands: each input into the one node, brightening as it goes. */
    const strands: Seg[][] = [
      [{ line: [[322, 149], [420, 149]] }, { cubic: [[420, 149], [445, 149], [435, 269], NODE] }],
      [{ line: [[332, 269], NODE] }],
      [{ line: [[322, 389], [420, 389]] }, { cubic: [[420, 389], [445, 389], [435, 269], NODE] }],
    ];
    marks.push({ cls: "trace", d: strands.map(segPath).join("") });
    for (const s of strands) {
      ink.push(
        ...along(s, R, {
          step: 3.4,
          jitter: 0.8,
          shape: (t) => ({ s: 1.4 + 0.4 * t, a: 0.25 + 0.55 * t }),
        })
      );
    }
    /* The finished ad: the same garment, a headline, a line, a button. */
    marks.push({ cls: "frame", d: `M${AD.x0} ${AD.y0}h${AD.w}v${AD.h}h-${AD.w}z` });
    ink.push(...garment(AD.x0 + 24, AD.y0 + 12, 56, R));
    for (let x = AD.x0 + 12; x <= AD.x0 + 80; x += 2.6) ink.push(grain(x, AD.y0 + 84, 1.6, 0.8));
    for (let x = AD.x0 + 12; x <= AD.x0 + 60; x += 2.6) ink.push(grain(x, AD.y0 + 91, 1.6, 0.8));
    for (let x = AD.x0 + 12; x <= AD.x0 + 70; x += 2.8) ink.push(grain(x, AD.y0 + 100, 1.2, 0.45));
    marks.push({ cls: "cta", d: `M${AD.x0 + 12} ${AD.y0 + 108}h40v12h-40z` });
    /* The exit strand, node to ad. */
    const exit: Seg[] = [{ line: [[EXIT[0] + 3, EXIT[1]], [AD.x0, EXIT[1]]] }];
    marks.push({ cls: "trace", d: segPath(exit) });
    ink.push(...along(exit, R, { step: 3.4, jitter: 0.6, shape: () => ({ s: 1.6, a: 0.8 }) }));
    marks.push(...grainMarks(ink, "ink"));
    marks.push({ cls: "node", d: sq(NODE[0], NODE[1], 6) + sq(EXIT[0], EXIT[1], 6) });
    groups.push({ step: 3, marks });
  }

  /** A run's gold, along a row from the fork to the exit. */
  const runGrains = (y: number, gaps: readonly [number, number][]) =>
    along([{ line: [[RUN_X0, y], [RUN_X1, y]] }], R, {
      step: 4.2,
      jitter: 2,
      gaps,
      shape: () => ({ s: 1.8 + R() * 0.6, a: 0.55 + R() * 0.35 }),
    });
  const forkTo = (y: number): Seg[] => [
    { cubic: [[NODE[0] + 3, NODE[1]], [485, NODE[1]], [483, y], [RUN_X0, y]] },
  ];
  const exitFrom = (y: number): Seg[] => [
    { cubic: [[RUN_X1, y], [968, y], [972, EXIT[1]], [EXIT[0] - 3, EXIT[1]]] },
  ];
  const curveGrains = (segs: Seg[], rising: boolean) =>
    along(segs, R, {
      step: 4,
      jitter: 0.8,
      shape: (t) => ({ s: 1.6 + 0.4 * (rising ? t : 1 - t), a: 0.45 + 0.4 * (rising ? t : 1 - t) }),
    });

  /* 4 · adopt: the upper run, a person at every step -------------------- */
  {
    const fork = forkTo(ROW_A);
    const exit = exitFrom(ROW_A);
    const gold = [
      ...curveGrains(fork, true),
      ...runGrains(ROW_A, CHECK_X.map((x) => [x - 10, x + 10] as [number, number])),
      ...curveGrains(exit, false),
    ];
    groups.push({
      step: 4,
      marks: [
        { cls: "trace", d: segPath(fork) + segPath(exit) },
        ...grainMarks(gold, "gold"),
        ...CHECK_X.map((x) => ({ cls: "person" as const, d: personPath({ cx: x, cy: ROW_A, r: PERSON_R }) })),
      ],
    });
  }

  /* 5 · write it down: the band, the skill's course, the evals ---------- */
  {
    const gold: CrewGrain[] = [];
    /* The skill: a written course, dense, the house's lane grain. */
    for (let y = 222; y <= 238; y += 3.2) {
      for (let x = 795; x <= 935; x += 3.2) {
        gold.push(grain(x + (R() - 0.5) * 0.8, y + (R() - 0.5) * 0.8, 1.4 + R() * 0.5, 0.5 + R() * 0.45));
      }
    }
    /* Two checks fall from the adopted run and are kept. */
    for (const x of EVAL_X) {
      for (let y = ROW_A + PERSON_R + 6; y <= 216; y += 4) {
        const t = (y - ROW_A) / (216 - ROW_A);
        gold.push(grain(x + (R() - 0.5) * 1.6, y, 1.4 + 0.5 * t, 0.3 + 0.55 * t));
      }
    }
    groups.push({
      step: 5,
      marks: [
        { cls: "band", d: `M${BAND.x0} ${BAND.y0}H${BAND.x1}V${BAND.y1}H${BAND.x0}Z` },
        ...grainMarks(gold, "gold"),
        { cls: "eval", d: EVAL_X.map((x) => sq(x, 270, 10)).join("") },
      ],
    });
  }

  /* 6 · automate: one line through the gates to one person -------------- */
  {
    const fork = forkTo(ROW_C);
    const exit = exitFrom(ROW_C);
    const gold = [
      ...curveGrains(fork, true),
      ...runGrains(ROW_C, [
        ...EVAL_X.map((x) => [x - 8, x + 8] as [number, number]),
        [ASK_X - 10, ASK_X + 10],
      ]),
      ...curveGrains(exit, false),
    ];
    groups.push({
      step: 6,
      marks: [
        { cls: "trace", d: segPath(fork) + segPath(exit) },
        { cls: "tick", d: EVAL_X.map((x) => `M${x} 276V${ROW_C - 6}`).join("") },
        ...grainMarks(gold, "gold"),
        { cls: "gate", d: EVAL_X.map((x) => sq(x, ROW_C, 10)).join("") },
        { cls: "person", d: personPath({ cx: ASK_X, cy: ROW_C, r: PERSON_R }) },
      ],
    });
  }

  return {
    vb: CFG_VB,
    groups,
    seats: {
      /* Above the plan's back corner, in the room the slant leaves. */
      layer: seat(PLAN.x, 140),
      /* Under the plan, clear of the cone's lower edge. */
      list: seat(PLAN.x, 252),
      /* Centred in the panel's head band. */
      head: seat(256, 33),
      /* Each input's label stands over its drawing. */
      inputs: [seat(256, 117), seat(256, 244), seat(256, 357)],
      /* Over the adopted run, beside the band, under the automated run. */
      rows: [seat(515, ROW_A - 12), seat(515, (BAND.y0 + BAND.y1) / 2), seat(515, ROW_C + 14)],
      keys: { skill: seat(724, 230), evals: seat(724, 270) },
      output: seat(AD.x0 + AD.w / 2, AD.y0 + AD.h + 10),
    },
  };
}
