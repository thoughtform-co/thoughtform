/* The plug flow's three directions, as geometry. PURE: the kit's two pure
   modules and nothing else, so `tests/lib/proposal-kit.test.ts` can walk
   every line without a browser.

   All three are drawn in production's frame (1200 × 460, `PlugFlow`) and on
   its four rows, so each sits in the same box as the control it argues
   with. The hub is centred on the rows' own middle (234), where production
   sits it at the frame's (230): a four-unit correction that puts the bundle
   on the bus's centre. */

import { brackets, polar, rimStubs, rimTicks, spokes, type Pt } from "../kit/dial";
import { bearing, bundle, chevron, railTicks } from "../kit/trace";

export const FRAME = { w: 1200, h: 460 } as const;
/** The four rows everything hangs on: production's card rows. */
export const ROWS = [96, 188, 280, 372] as const;
const MID = 234;
export const HUB: Pt = [600, MID];
/** The tabs' line along the top, production's. */
export const TAB_Y = 24;
export const CHIP_W = 200;

/* The right-hand side production already draws straight: a bus, a tap and a
   stub per row, the cards. F1 keeps it whole. */
const BUS_X = 818;
const CARD_X0 = 840;
const CARD_X1 = 1166;

export interface Wire {
  pts: Pt[];
  /** Where the wire must start and end, for the guard. */
  from: Pt;
  to: Pt;
}

/* ------------------------------------------------------------------ */
/* F1 · TRACE: the same three parts, every line straight.              */
/* ------------------------------------------------------------------ */

const T = {
  railX: 34,
  chipX0: 50,
  collectX: 382,
  cut: 14,
  junction: 9,
  rings: [130, 112, 96] as const,
  core: 64,
};

function trace() {
  const chipX1 = T.chipX0 + CHIP_W;
  const half = T.junction / 2;
  /* each workstream runs level off its chip, then cuts 45 degrees onto the
     collector, toward the middle */
  const wires: Wire[] = ROWS.map((y) => {
    const s = y < MID ? 1 : -1;
    const to: Pt = [T.collectX, y + s * T.cut];
    return { pts: [[chipX1, y], [T.collectX - T.cut, y], to], from: [chipX1, y], to };
  });
  /* the collector: two plumb runs, each from the outer wire's landing to the
     junction's edge */
  const collector: Wire[] = [
    {
      pts: [
        [T.collectX, ROWS[0] + T.cut],
        [T.collectX, MID - half],
      ],
      from: [T.collectX, ROWS[0] + T.cut],
      to: [T.collectX, MID - half],
    },
    {
      pts: [
        [T.collectX, ROWS[3] - T.cut],
        [T.collectX, MID + half],
      ],
      from: [T.collectX, ROWS[3] - T.cut],
      to: [T.collectX, MID + half],
    },
  ];
  const rimR = T.rings[0];
  return {
    chips: ROWS.map((y) => ({ x: T.chipX0, y })),
    /* the rail the chips sit on: the page rail's own ladder, a major tick
       reaching each chip */
    rail: {
      x: T.railX,
      y0: ROWS[0] - 46,
      y1: ROWS[3] + 46,
      ticks: railTicks(ROWS[0] - 46, ROWS[3] + 46, 23, ROWS),
      minor: 5,
      major: T.chipX0 - T.railX,
    },
    wires,
    collector,
    junction: { at: [T.collectX, MID] as Pt, size: T.junction },
    bundleIn: { x0: T.collectX + half, x1: HUB[0] - rimR, y: MID },
    hub: {
      rings: T.rings,
      core: T.core,
      ticks: rimTicks(HUB, rimR, 6, 15, [0, 180]),
      stubs: rimStubs(HUB, rimR, 12, [0, 180]),
      brackets: brackets(HUB, rimR, 12, 14),
    },
    tie: { x: HUB[0], y0: TAB_Y + 18, y1: MID - rimR },
    bundleOut: { x0: HUB[0] + rimR, x1: BUS_X, y: MID },
    bus: { x: BUS_X, y0: ROWS[0], y1: ROWS[3] },
    cards: { x0: CARD_X0, x1: CARD_X1, rows: ROWS },
    tabs: { team: T.chipX0 + CHIP_W / 2, layer: HUB[0], run: (CARD_X0 + CARD_X1) / 2 },
  };
}
export const TRACE = trace();

/* ------------------------------------------------------------------ */
/* F2 · BEARING: the hub is the dial; the team arrives on bearings.    */
/* ------------------------------------------------------------------ */

const B = {
  chipX0: 50,
  rim: 168,
  /** rim · quiet · gold dashed · the station ring · inner */
  rings: [168, 150, 130, 108, 88] as const,
  core: 64,
  station: 108,
  tagR: 140,
  /** Context, Skills, Evals: clear of the west (the bearings) and the east
      (the way out). */
  parts: [-125, -55, 62] as const,
  rowPitch: 46,
  /** The readout sits nearer the dial than production's cards: its rows are
      one line each, and the title needs the width at 1280. */
  busX: 794,
  readX0: 814,
};

function bearingLayout() {
  const chipX1 = B.chipX0 + CHIP_W;
  const lines: Wire[] = ROWS.map((y) => {
    const pts = bearing([chipX1, y], HUB, B.rim);
    return { pts, from: pts[0], to: pts[1] };
  });
  /* the angles the bearings enter on, so no rim tick is drawn under one */
  const entries = lines.map(
    (l) => (Math.atan2(l.to[1] - HUB[1], l.to[0] - HUB[0]) * 180) / Math.PI
  );
  const rowsY = [-1.5, -0.5, 0.5, 1.5].map((k) => MID + k * B.rowPitch);
  return {
    chips: ROWS.map((y) => ({ x: B.chipX0, y })),
    lines,
    chevrons: lines.map((l) => chevron(l.from, l.to, 8)),
    dial: {
      rim: B.rim,
      rings: B.rings,
      core: B.core,
      ticks: rimTicks(HUB, B.rim, 6, 15, [0, ...entries.map((a) => (a + 360) % 360)]),
      stubs: rimStubs(HUB, B.rim, 13, [0, 180]),
      spokes: spokes(HUB, B.rings[2], B.rings[4]),
    },
    parts: B.parts.map((deg) => ({
      node: polar(HUB, B.station, deg),
      tag: polar(HUB, B.tagR, deg),
    })),
    tie: { x: HUB[0], y0: TAB_Y + 18, y1: MID - B.rim },
    bundleOut: { x0: HUB[0] + B.rim, x1: B.busX, y: MID },
    bus: { x: B.busX, y0: rowsY[0], y1: rowsY[3] },
    /* the interfaces as one ruled readout: four rows sharing their edges */
    readout: {
      x0: B.readX0,
      x1: CARD_X1,
      y0: rowsY[0] - B.rowPitch / 2,
      y1: rowsY[3] + B.rowPitch / 2,
      rows: rowsY,
    },
    tabs: { team: B.chipX0 + CHIP_W / 2, layer: HUB[0], run: (B.readX0 + CARD_X1) / 2 },
  };
}
export const BEARING = bearingLayout();

/* ------------------------------------------------------------------ */
/* F3 · AXIS: the mark's own bar is the datum everything hangs off.    */
/* ------------------------------------------------------------------ */

/** The brandmark's horizontal bar in its own viewBox (430.99 × 436), read
    off `lib/brandmark/brandmarkPaths.ts`: it runs y 218.81 to 236.58, from
    x 29.1 to 430.98 (425.75 on its lower edge, the end being cut aslant). */
export const MARK_BAR = { y0: 218.81, y1: 236.58, x0: 29.1, x1: 430.98, x1Low: 425.75 } as const;
const MARK_BOX = { w: 430.99, h: 436 } as const;

const A = {
  markH: 184,
  ring: 124,
  pad: 12,
  arm: 14,
  /** Chips above and below the datum. */
  lift: 78,
  /** Half a chip's height, in the frame's units, for where a stub lands. */
  chipHalf: 16,
  readHalf: 24,
  westCols: [34, 252] as const,
  eastCols: [748, 966] as const,
  /** Context, Skills, Evals on the ring, clear of the brackets and the tie. */
  parts: [-112, -68, 68] as const,
  tagR: 154,
};

function axis() {
  const k = A.markH / MARK_BOX.h;
  const barMid = (MARK_BAR.y0 + MARK_BAR.y1) / 2;
  const mark = {
    k,
    x: HUB[0] - (MARK_BOX.w * k) / 2,
    y: MID - barMid * k,
  };
  /* the bar's two ends and its half thickness, in the frame */
  const west = mark.x + MARK_BAR.x0 * k;
  const east = mark.x + MARK_BAR.x1Low * k;
  const half = ((MARK_BAR.y1 - MARK_BAR.y0) * k) / 2;
  const datum = (x0: number, x1: number) =>
    bundle(
      [
        [x0, MID],
        [x1, MID],
      ],
      3,
      half
    );
  const stub = (x: number, up: boolean, reach: number): Wire => {
    const from: Pt = [x, up ? MID - A.lift + reach : MID + A.lift - reach];
    const to: Pt = [x, up ? MID - half : MID + half];
    return { pts: [from, to], from, to };
  };
  const quad = (cols: readonly [number, number]) =>
    /* up-left, down-left, up-right, down-right: time and order read east */
    [
      { x: cols[0], y: MID - A.lift, up: true },
      { x: cols[0], y: MID + A.lift, up: false },
      { x: cols[1], y: MID - A.lift, up: true },
      { x: cols[1], y: MID + A.lift, up: false },
    ];
  const westX = A.westCols.map((x) => x + CHIP_W / 2);
  const eastX = A.eastCols.map((x) => x + CHIP_W / 2);
  return {
    mark,
    half,
    datumWest: datum(A.westCols[0], west),
    datumEast: datum(east, A.eastCols[1] + CHIP_W),
    ends: { west, east, x0: A.westCols[0], x1: A.eastCols[1] + CHIP_W },
    ring: {
      r: A.ring,
      ticks: rimTicks(HUB, A.ring, 6, 15, [0, 180]),
      stubs: rimStubs(HUB, A.ring, 12, [0, 180]),
      brackets: brackets(HUB, A.ring, A.pad, A.arm),
    },
    chips: quad(A.westCols),
    reads: quad(A.eastCols),
    stubsWest: westX.flatMap((x) => [stub(x, true, A.chipHalf), stub(x, false, A.chipHalf)]),
    stubsEast: eastX.flatMap((x) => [stub(x, true, A.readHalf), stub(x, false, A.readHalf)]),
    tapsWest: westX.map((x) => [x, MID] as Pt),
    tapsEast: eastX.map((x) => [x, MID] as Pt),
    parts: A.parts.map((deg) => ({
      node: polar(HUB, A.ring, deg),
      tag: polar(HUB, A.tagR, deg),
    })),
    tie: { x: HUB[0], y0: TAB_Y + 18, y1: MID - A.ring },
    tabs: {
      team: (A.westCols[0] + A.westCols[1] + CHIP_W) / 2,
      layer: HUB[0],
      run: (A.eastCols[0] + A.eastCols[1] + CHIP_W) / 2,
    },
  };
}
export const AXIS = axis();

/** Every connector of a direction, for the guard: straight lines only. */
export const STRAIGHT_LINES: Record<"trace" | "axis", Pt[][]> = {
  trace: [...TRACE.wires.map((w) => w.pts), ...TRACE.collector.map((w) => w.pts)],
  axis: [
    ...AXIS.datumWest,
    ...AXIS.datumEast,
    ...AXIS.stubsWest.map((w) => w.pts),
    ...AXIS.stubsEast.map((w) => w.pts),
  ],
};
