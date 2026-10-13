/* The stack, as data. PURE: no React, no DOM, no imports from the site.

   Three square plates, one above the other, and what each holds. Every
   drawing on this page is made from these numbers and nothing else, so five
   very different constructions stay the same object, and a picked one can be
   carried onto the proposal: the footprint, the depths and the pitches are
   the proposal's own (`components/xb-proposal`), restated here because a new
   design lab imports nothing from the surfaces it may later replace. */

export type Pt = readonly [number, number];
export type Tone = "green" | "gold" | "bone";

/** An axis-aligned solid in a plate's own space: x and y across the plate
    (0..SIDE), z up from the plate's floor. */
export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

/** Something on or in a plate that a drawing may show and letter. */
export interface Feature {
  id: string;
  /** The only words a drawing may put on it. */
  label: string;
  kind: "tile" | "stratum" | "chip" | "module" | "rail";
  box: Box;
}

/** A run across a plate's top, in plate (x, y): level and plumb legs with
    45-degree turns. */
export interface Trace {
  id: string;
  pts: readonly Pt[];
}

export interface Plate {
  i: 0 | 1 | 2;
  key: "team" | "layer" | "agents";
  n: "01" | "02" | "03";
  step: "Navigate" | "Encode" | "Build";
  name: "your team" | "the layer" | "your agents";
  tone: Tone;
  /** The layer is the one lit thing. */
  lit: boolean;
  /** What the plate holds, by name. `holds.length` is a count a drawing may show. */
  holds: readonly string[];
  /** The plate's solids, floor first. */
  body: readonly Box[];
  /** Its highest point. */
  top: number;
  features: readonly Feature[];
  traces: readonly Trace[];
}

/** A plate is eight units square. */
export const SIDE = 8;

const slab = (z0: number, z1: number): Box => ({ x0: 0, x1: SIDE, y0: 0, y1: SIDE, z0, z1 });
const tile = (x: number, y: number, s: number, z0: number, z1: number): Box => ({
  x0: x,
  x1: x + s,
  y0: y,
  y1: y + s,
  z0,
  z1,
});

/* -- the team: one board, four workstreams on it, the tools along an edge -- */

const TEAM_Z = 0.4;
const WORKSTREAMS: readonly [string, string, number, number][] = [
  ["strategy", "Creative strategy", 1.6, 0.6],
  ["production", "Creative production", 4.6, 1.9],
  ["review", "Creative review", 1.6, 3.8],
  ["ops", "Creative ops", 4.6, 5.0],
];

/* -- the layer: three strata, context at the base, then skills, then evals -- */

const STRATUM = { t: 0.28, gap: 0.12 };
const STRATA = ["Context", "Skills", "Evals"] as const;
const stratumAt = (n: number): Box => {
  const z0 = n * (STRATUM.t + STRATUM.gap);
  return slab(z0, z0 + STRATUM.t);
};
const LAYER_TOP = 2 * (STRATUM.t + STRATUM.gap) + STRATUM.t;

/* -- the agents: a board, one chip at its centre, four modules wired to it -- */

const BOARD_Z = 0.4;
const CHIP: Box = { x0: 3, x1: 5, y0: 3, y1: 5, z0: BOARD_Z, z1: 0.75 };
const MODULES: readonly [number, number][] = [
  [0.7, 0.7],
  [5.4, 1.4],
  [0.9, 5.5],
  [5.7, 5.6],
];
/** What the agents run in, in the order the proposal names them. */
const TOOLS = ["Claude", "Slack", "Shopify", "Ad accounts"] as const;

/** From a point on the chip's edge to a module's edge: one leg, a 45-degree
    jog half the shorter distance long, the other leg. */
function wire(from: Pt, to: Pt, first: "x" | "y"): Pt[] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const j = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5;
  const sx = Math.sign(dx) || 1;
  const sy = Math.sign(dy) || 1;
  return first === "x"
    ? [from, [to[0] - sx * j, from[1]], [to[0], from[1] + sy * j], to]
    : [from, [from[0], to[1] - sy * j], [from[0] + sx * j, to[1]], to];
}

export const PLATES: readonly [Plate, Plate, Plate] = [
  {
    i: 0,
    key: "team",
    n: "01",
    step: "Navigate",
    name: "your team",
    tone: "green",
    lit: false,
    holds: WORKSTREAMS.map((w) => w[1]),
    body: [slab(0, TEAM_Z)],
    top: TEAM_Z,
    features: [
      ...WORKSTREAMS.map(
        ([id, label, x, y]): Feature => ({
          id,
          label,
          kind: "tile",
          box: tile(x, y, 2.6, TEAM_Z, TEAM_Z),
        })
      ),
      {
        id: "tools",
        label: "The tools they have",
        kind: "rail",
        box: { x0: 0.25, x1: 1.25, y0: 0.3, y1: 7.7, z0: TEAM_Z, z1: TEAM_Z },
      },
    ],
    traces: [],
  },
  {
    i: 1,
    key: "layer",
    n: "02",
    step: "Encode",
    name: "the layer",
    tone: "gold",
    lit: true,
    holds: [...STRATA],
    body: STRATA.map((_, n) => stratumAt(n)),
    top: LAYER_TOP,
    features: STRATA.map(
      (label, n): Feature => ({
        id: label.toLowerCase(),
        label,
        kind: "stratum",
        box: stratumAt(n),
      })
    ),
    traces: [],
  },
  {
    i: 2,
    key: "agents",
    n: "03",
    step: "Build",
    name: "your agents",
    tone: "bone",
    lit: false,
    holds: [...TOOLS],
    body: [slab(0, BOARD_Z)],
    top: CHIP.z1,
    features: [
      { id: "chip", label: "Claude Enterprise", kind: "chip", box: CHIP },
      ...MODULES.map(
        ([x, y], n): Feature => ({
          id: `agent-${n + 1}`,
          label: TOOLS[n],
          kind: "module",
          box: tile(x, y, 1.4, BOARD_Z, 0.62),
        })
      ),
    ],
    traces: [
      { id: "to-1", pts: wire([3.0, 3.6], [1.4, 2.1], "x") },
      { id: "to-2", pts: wire([4.4, 3.0], [5.4, 2.1], "y") },
      { id: "to-3", pts: wire([3.6, 5.0], [2.3, 6.2], "y") },
      { id: "to-4", pts: wire([5.0, 4.4], [6.4, 5.6], "x") },
    ],
  },
];

/* -- the pose -------------------------------------------------------------- */

/** The proposal draws the stack at 26px a unit; its pitches are in those px. */
export const PROPOSAL_UNIT = 26;
/** Closed, as the opening and the hand-over show it; opened, as far as the
    steps' section opens it on a short screen. (That section can reach 300 on
    a tall one, where the plates stand mostly in air; `reach` asks for it.) */
export const PITCH_PX = { closed: 72, opened: 170, far: 300 } as const;

export interface Pose {
  /** 0 closed, 1 opened. */
  open: number;
  /** The distance from one plate's floor to the next, in units. */
  pitch: number;
  /** Each plate's floor, in units of z. The layer holds still; the team rises
      and the agents fall, as the proposal opens the stack about its middle. */
  lift: readonly [number, number, number];
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export function poseAt(open: number, reach: "opened" | "far" = "opened"): Pose {
  const o = clamp01(open);
  const px = PITCH_PX.closed + (PITCH_PX[reach] - PITCH_PX.closed) * o;
  const pitch = px / PROPOSAL_UNIT;
  return { open: o, pitch, lift: [pitch, 0, -pitch] };
}

/** The numbers a drawing may print, and nothing else: all of them true. */
export interface Facts {
  plates: 3;
  side: number;
  /** Units between floors, to two places. */
  pitch: number;
  /** 0..100. */
  openPct: number;
  /** Top of the team's plate to the agents' floor, in units, to two places. */
  height: number;
}

export function factsOf(pose: Pose): Facts {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    plates: 3,
    side: SIDE,
    pitch: r2(pose.pitch),
    openPct: Math.round(pose.open * 100),
    height: r2(pose.lift[0] + PLATES[0].top - pose.lift[2]),
  };
}
