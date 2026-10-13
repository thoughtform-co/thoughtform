/* "Marketing first, then every team.", drawn back to the organisation, as
   geometry (owner, 2026-10-13: "zoom out and see a full network of nodes …
   Marketing can then collapse and we see the other ones grow … they can also
   move up a bit because now they're super symmetrically connected …
   showcase how it's a smaller part of a bigger organizational node").

   PURE: the kit's trace module and nothing else, so
   `tests/lib/proposal-kit.test.ts` can walk every ribbon without a browser.

   What the view draws back to, in the section's own 1200 x 560 frame:
     · one housing, the organisation, in the Marketing frame's grammar;
     · Marketing inside it as one node among seven, its module of three
       courses at node size;
     · the six other teams, each a node of the same size, on four columns
       whose rows do not line up: nothing here mirrors anything;
     · a ribbon from Marketing to each, level and plumb runs with 45-degree
       cuts, through the gutters and the one lane the columns leave. */

import { jog, type Pt } from "../kit/trace";

export const ORG_FRAME = { w: 1200, h: 560 } as const;

/** The organisation: the Marketing frame's housing, at the frame's size. */
export const HOUSING = { x0: 30, x1: 1170, y0: 14, y1: 546, cut: 22, band: 34 } as const;

/** A team: the same housing at node size. Grown, it holds a module of three
    courses and one line under them; collapsed, its band and a sliver. */
export const NODE = { w: 208, h: 140, band: 28, cut: 12, collapsed: 42 } as const;

/** The module inside a node: the frontal camera's scale there, and where the
    middle of its three courses sits from the node's top-left corner. */
export const NODE_K = 0.58;
export const COURSES_AT = { dx: NODE.w / 2, dy: 72 } as const;
/** The middle of the line under the courses, from the node's top. */
export const STATE_DY = NODE.h - 17;
/** A node's words start this far in from its left edge. */
export const NODE_PAD = 14;

/** Marketing's seat: left of the middle and above it. */
export const MARKETING = { x: 350, y: 206 } as const;

export interface Seat {
  /** Whose seat, for the reader and the guard: `NetworkPlug`'s own names. */
  name: string;
  x: number;
  y: number;
  /** The side its ribbon arrives on. */
  side: "l" | "r";
}

/** The six other teams, in `NetworkPlug`'s order. Four columns; no two rows
    level. */
export const SEATS: readonly Seat[] = [
  { name: "Product design", x: 64, y: 84, side: "r" },
  { name: "Sales", x: 64, y: 318, side: "r" },
  { name: "Customer care", x: 640, y: 372, side: "l" },
  { name: "Technology", x: 640, y: 70, side: "l" },
  { name: "Operations", x: 928, y: 150, side: "l" },
  { name: "Finance", x: 928, y: 384, side: "l" },
];

/** Where a team's ribbon lands: the middle of its band, on the side it
    arrives on, so the port is there before the node has grown. */
export const portOf = (s: Seat): Pt => [s.side === "r" ? s.x + NODE.w : s.x, s.y + NODE.band / 2];

/** Where each ribbon leaves Marketing, by team: two on its left edge, four
    on its right, a ribbon's width and a gap apart. */
const LEAVE: readonly Pt[] = [
  [MARKETING.x, 252],
  [MARKETING.x, 306],
  [MARKETING.x + NODE.w, 318],
  [MARKETING.x + NODE.w, 252],
  [MARKETING.x + NODE.w, 274],
  [MARKETING.x + NODE.w, 296],
];

const CUT = 16;

/** Level out of `a`, a 45-degree cut onto a plumb run at `x`, a second cut,
    level into `b`: a ribbon through a gutter. */
export function channel(a: Pt, b: Pt, x: number, cut = CUT): Pt[] {
  const sx = Math.sign(x - a[0]) || 1;
  const sy = Math.sign(b[1] - a[1]) || 1;
  const ex = Math.sign(b[0] - x) || 1;
  return [
    a,
    [x - sx * cut, a[1]],
    [x, a[1] + sy * cut],
    [x, b[1] - sy * cut],
    [x + ex * cut, b[1]],
    b,
  ];
}

/* the plumb runs: the middle of the gutter left of Marketing, of the one
   right of it, and of the last one */
const GUTTER = { a: 311, b: 599, c: 888 };

/** Every ribbon's centre line, Marketing to its team, by team. */
export const ROUTES: readonly Pt[][] = [
  channel(LEAVE[0], portOf(SEATS[0]), GUTTER.a),
  /* Sales sits one short step down: a single jog, as the proposal's are */
  jog(LEAVE[1], portOf(SEATS[1]), LEAVE[1][0] - 20),
  channel(LEAVE[2], portOf(SEATS[2]), GUTTER.b),
  channel(LEAVE[3], portOf(SEATS[3]), GUTTER.b),
  /* the two far teams share the lane between Technology and Customer care */
  channel(LEAVE[4], portOf(SEATS[4]), GUTTER.c),
  channel(LEAVE[5], portOf(SEATS[5]), GUTTER.c),
];

/** A ribbon: its wires and their pitch. Finer than the proposal's eight at
    3.4, the view having drawn back. */
export const RIBBON = { wires: 5, pitch: 3 } as const;

/** The order the teams take their turn: alternating sides, near then far. */
export const TURNS = [0, 3, 1, 2, 4, 5] as const;
