/* The stack-first opening's two figures, as geometry. PURE: the kit's trace
   module, the projection's one constant and the stack's own numbers, so
   `tests/lib/proposal-kit.test.ts` can walk every line without a browser.

   Both figures hang their lines on the same thing (owner, 2026-10-13: "a
   combination where you can really see the lines connecting to the different
   parts of the stack"): each plate's two PORTS, the middle of its left and of
   its right corner edge. A plate's corner edge is plumb in this projection,
   so a level line meets it square on.

     FLOW   the proposal's own flow, whole, round a smaller stack: the
            team's bus runs into the team's plate, the agents' plate runs
            out to the tools' bus, the layer is tied to its tab on one side
            and letters its three parts on the other.
     INDEX  the index and the names of round 02, each on a line to its plate. */

import { C30 } from "../iso";
import type { Pt } from "../kit/trace";
import { FRAME, HUB, TAB_Y } from "../plug/flowLayouts";

import { HERO_BOX, STACK } from "./travel";

/** The plates are eight units square (`NetworkPlug`'s `S`). */
const SIDE = 8;
/** Each plate's own depth, in units: the team's and the agents' boards
    (`PLATE.z1`), and the layer's three strata between them (`LayerPlate`). */
export const DEPTH = [0.4, 1.08, 0.4] as const;

const HALF = SIDE * C30 * STACK.unit;

export interface Port {
  left: Pt;
  right: Pt;
}

/** The closed stack's ports, team first, in the stack's own drawing units. */
export const PORTS: readonly Port[] = DEPTH.map((depth, i) => {
  const y = STACK.ref[1] - (depth / 2) * STACK.unit + i * STACK.closed;
  return { left: [STACK.ox - HALF, y], right: [STACK.ox + HALF, y] };
});

/* ------------------------------------------------------------------ */
/* FLOW: the team in at the top plate, the tools out of the bottom one. */
/* ------------------------------------------------------------------ */

const F = {
  /** The stack's box, in the frame's units (owner, 2026-10-13, twice: "the
      artifact in the middle … maybe we can make it a bit smaller"): its ink
      is as tall as the two columns beside it and a little wider than the
      ringed hub it replaces, which leaves a gutter a side wide enough for a
      line to be seen in and for the layer's three parts to sit on one. */
  side: 360,
  /** Both columns: as wide as each other, a stub off their bus (the stub is
      production's, 22), the same margin off the frame's edge. */
  col: 284,
  stub: 22,
  margin: 34,
  /** The rows of both columns, about the frame's middle: closer than
      production's 92, so the columns stand no taller than the stack. */
  pitch: 80,
  junction: 9,
  /** The layer's tie: where it leaves its tab's line, and its 45-degree cut. */
  tieX0: 760,
  cut: 16,
  /** The layer's three parts on its drop: the first tag's middle below the
      drop's turn, then the pitch between tags. */
  partsLead: 28,
  partsPitch: 40,
};

function flow() {
  const k = F.side / HERO_BOX.w;
  /* the team's and the agents' ports sit the same distance above and below
     the frame's middle, so the figure turns onto itself about its centre */
  const mid = (PORTS[0].left[1] + PORTS[2].left[1]) / 2;
  const box = { x: HUB[0] - F.side / 2, y: HUB[1] - (mid - HERO_BOX.y) * k, side: F.side };
  const seat = (p: Pt): Pt => [box.x + (p[0] - HERO_BOX.x) * k, box.y + (p[1] - HERO_BOX.y) * k];
  const ports = PORTS.map((p) => ({ left: seat(p.left), right: seat(p.right) }));

  const rows = [-1.5, -0.5, 0.5, 1.5].map((n) => HUB[1] + n * F.pitch);
  const chipX0 = F.margin;
  const busIn = chipX0 + F.col + F.stub;
  const cardX1 = FRAME.w - F.margin;
  const cardX0 = cardX1 - F.col;
  const busOut = cardX0 - F.stub;
  const half = F.junction / 2;
  const [team, layer, agents] = ports;
  /* the layer's two lines each run plumb down the middle of a gutter: the
     tie on the right, above the way out; the drop on the left, below the
     way in. So the gold turns about the centre as the flow does. */
  const tieX = Math.round((layer.right[0] + busOut) / 2);
  const dropX = Math.round((layer.left[0] + busIn) / 2);
  const dropY = layer.left[1] + F.cut;
  const parts = [0, 1, 2].map((n) => [dropX, dropY + F.partsLead + n * F.partsPitch] as Pt);

  return {
    k,
    box,
    ports,
    rows,
    col: F.col,
    chips: rows.map((y) => ({ x: chipX0, y })),
    cards: { x0: cardX0, x1: cardX1, rows },
    /* the team's side: a stub a workstream onto one bus, as the tools' is */
    team: {
      bus: [
        [busIn, rows[0]],
        [busIn, rows[3]],
      ] as Pt[],
      stubs: rows.map(
        (y) =>
          [
            [chipX0 + F.col, y],
            [busIn, y],
          ] as Pt[]
      ),
      junction: { at: [busIn, team.left[1]] as Pt, size: F.junction },
    },
    tools: {
      bus: [
        [busOut, rows[0]],
        [busOut, rows[3]],
      ] as Pt[],
      stubs: rows.map(
        (y) =>
          [
            [busOut, y],
            [cardX0, y],
          ] as Pt[]
      ),
      junction: { at: [busOut, agents.right[1]] as Pt, size: F.junction },
    },
    /** In: off the team's bus, level, into the team's plate. */
    runIn: [[busIn + half, team.left[1]], team.left] as Pt[],
    /** Out: off the agents' plate, level, onto the tools' bus. */
    runOut: [agents.right, [busOut - half, agents.right[1]]] as Pt[],
    /** The layer's tie: along its tab's line, down the free gutter, in. */
    tie: [
      [F.tieX0, TAB_Y],
      [tieX - F.cut, TAB_Y],
      [tieX, TAB_Y + F.cut],
      [tieX, layer.right[1] - F.cut],
      [tieX - F.cut, layer.right[1]],
      layer.right,
    ] as Pt[],
    /** The layer's drop: out of its plate's other edge, down the gutter,
        ending in the last of its parts. */
    drop: [layer.left, [dropX + F.cut, layer.left[1]], [dropX, dropY], parts[2]] as Pt[],
    /** Context, Skills, Evals: three tags on the drop, each centred on it. */
    parts,
    /* each tab centred over what it heads, as production seats them */
    tabs: { team: chipX0 + F.col / 2, layer: HUB[0], run: cardX0 + F.col / 2, y: TAB_Y },
  };
}
export const FLOW = flow();

/* ------------------------------------------------------------------ */
/* INDEX: a number and a name a plate, each on a level line to it.     */
/* ------------------------------------------------------------------ */

const I = {
  /** How far past the crop a line runs before its words, and the air
      between the line's end and them, in the stack's units. */
  reach: 64,
  pad: 14,
};

function index() {
  const x0 = HERO_BOX.x - I.reach;
  const x1 = HERO_BOX.x + HERO_BOX.w + I.reach;
  return {
    leads: PORTS.map((p) => ({
      left: [[x0, p.left[1]], p.left] as Pt[],
      right: [p.right, [x1, p.right[1]]] as Pt[],
    })),
    index: PORTS.map((p) => [x0 - I.pad, p.left[1]] as Pt),
    names: PORTS.map((p) => [x1 + I.pad, p.right[1]] as Pt),
  };
}
export const INDEX = index();

/** A point of the stack's drawing as fractions of the donor's crop, for
    words seated over it. */
export const inCrop = (p: Pt): Pt => [
  (p[0] - HERO_BOX.x) / HERO_BOX.w,
  (p[1] - HERO_BOX.y) / HERO_BOX.h,
];
