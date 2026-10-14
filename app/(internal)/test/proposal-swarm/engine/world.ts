/* Everything a frame is computed from, built once a size. PURE.

   `measure.ts` reads where the three sections seat their figures; this turns
   those boxes into the swarm's world: the lattice, S4·E's own scene on it,
   the pool, the stack's two seats, the bars, the organisation and the
   opening's files. Every number of the page's geometry is read from the
   module that owns it, never restated. */

import { C30 } from "@/components/xb-proposal/iso";
import { U_FRONT } from "@/components/xb-proposal/network/NetworkOrg";
import {
  COURSE_GAP,
  COURSE_H,
  COURSES,
  END_K,
  S as PLATE_SIDE,
  STACK_AT,
  W as NET_W,
  ZC_END,
} from "@/components/xb-proposal/network/NetworkPlug";
import {
  COURSES_AT,
  MARKETING,
  NODE_K,
  RIBBON,
  ROUTES,
  SEATS,
} from "@/components/xb-proposal/network/orgLayout";
import { CARDS, W as FLOW_W } from "@/components/xb-proposal/plug/PlugFlow";
import { FLOW } from "@/components/xb-proposal/stack/heroLayouts";
import { HERO_BOX, STACK } from "@/components/xb-proposal/stack/travel";

import { PLATES } from "../../stack-forms/model";
import { type Falls, wingFalls } from "../../stack-forms/swarm/clear";
import {
  buildScene,
  inside,
  kOf,
  type Lattice,
  offsets,
  type Scene,
} from "../../stack-forms/swarm/dots";

import { type Runways, stepsAt, type StepsReading } from "./clocks";
import type { Seat, Stage } from "./flight";
import { assignCells, barTargets, gridOf, orgTargets, type Rect } from "./formations";
import { latticeAt, type Pick, pickLattice, plateWidth, poseOfGap } from "./lattice";
import { buildPool } from "./pool";
import { buildTraces, type Traces } from "./traces";

type Pt = readonly [number, number];

/** A box in CSS px on the canvas. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What the page is measured for. Every box is where its figure stands
    while its section is at rest, in the canvas's own space. */
export interface Metrics {
  vh: number;
  dpr: number;
  runways: Runways;
  /** The opening: the stack's square, and the flow's frame. */
  flowStage: Box;
  flowFig: Box;
  /** The steps: the plates' column. */
  esStage: Box;
  /** The network: its frame. */
  xnFig: Box;
}

export interface World extends Stage {
  metrics: Metrics;
  pick: Pick;
  L: Lattice;
  scene: Scene;
  /** S4·E's own: what falls onto the layer, and onto the agents. */
  falls: [Falls, Falls];
  /** The three plates' thickness in rows. */
  thick: [number, number, number];
  traces: Traces;
  /** The steps' reading at `p1`, for the words beside the plates. */
  steps: (p1: number) => StepsReading;
  /** The dots the three plates are made of. */
  dots: number;
}

/** Half a part's tag, in the flow's frame units, with a little air. */
const TAG = { w: 44, h: 19 };

/** A plate's width in the proposal's drawing, in drawing units. */
const PLATE_W = 2 * PLATE_SIDE * C30 * STACK.unit;

export function buildWorld(m: Metrics, o: { n?: number } = {}): World {
  const { dpr } = m;
  const kA = m.flowStage.w / HERO_BOX.w;
  const kB = m.esStage.w / STACK.vbW;
  const pick = pickLattice(PLATE_W * Math.min(kA, kB), dpr, o.n);
  const L = latticeAt(pick, dpr);
  const scene = buildScene(0, 0, dpr, L);
  const row = L.b * L.g;

  const tops = PLATES.map((p) => kOf(L, p.body[p.body.length - 1].z1)) as [number, number, number];
  const board = kOf(L, PLATES[2].body[0].z1);
  const blocks = scene.plates[2].blocks;
  const onAgents = (i: number, j: number) => blocks.find((b) => inside(b.cells, i, j))?.k ?? board;
  const falls: [Falls, Falls] = [wingFalls(L, 101, () => tops[1]), wingFalls(L, 211, onAgents)];

  /* -- the stack's two seats: the layer's floor, at its middle, is the point
        both sections' drawings are stated for ------------------------------- */
  const seatAt = (cx: number, cy: number, gap: number): Seat => ({
    ox: Math.round(cx * dpr),
    oy: Math.round(cy * dpr) - L.m * row,
    lift: offsets(L, poseOfGap(gap)),
  });
  const seatA = seatAt(
    m.flowStage.x + (STACK.ref[0] - HERO_BOX.x) * kA,
    m.flowStage.y + (STACK.ref[1] + STACK.closed - HERO_BOX.y) * kA,
    STACK.closed
  );
  const steps = (p1: number) => stepsAt(p1, m.esStage.w, m.esStage.h);
  const seatB = (p1: number) => {
    const r = steps(p1);
    return {
      ...seatAt(
        m.esStage.x + STACK.ref[0] * r.k,
        m.esStage.y + r.ty + (STACK.ref[1] + r.gap) * r.k,
        r.gap
      ),
      level: r.level,
    };
  };

  /* -- the bars, in the network's own frame ----------------------------------- */
  const unit = (m.xnFig.w / NET_W) * dpr;
  const NX = (x: number) => m.xnFig.x * dpr + x * unit;
  const NY = (y: number) => m.xnFig.y * dpr + y * unit;
  /* the frontal camera's own arithmetic (`camIso` with no yaw and no pitch) */
  const barsAt = (cx: number, cy: number, u: number): Rect[] =>
    [0, 1, 2].map((i) => ({
      x: NX(cx - (PLATE_SIDE / 2) * u),
      y: NY(cy + u * (COURSE_GAP * i + ZC_END)),
      w: PLATE_SIDE * u * unit,
      h: COURSE_H * u * unit,
    }));
  const bigRects = barsAt(STACK_AT[0], STACK_AT[1], U_FRONT * END_K);
  const nodeRects = barsAt(
    MARKETING.x + COURSES_AT.dx,
    MARKETING.y + COURSES_AT.dy,
    U_FRONT * NODE_K
  );
  const teamRects = SEATS.map((s) =>
    barsAt(s.x + COURSES_AT.dx, s.y + COURSES_AT.dy, U_FRONT * NODE_K)
  );
  /* the three courses are lettered on the bars (`.xn-course`: 16 units in
     from the bar's left edge, PT Mono at 11 units and never under 10px,
     tracked 0.15em), so each bar keeps that stretch clear */
  const font = Math.max(10, (11 * m.xnFig.w) / NET_W) * dpr;
  const windows = COURSES.map((words, i): [number, number] => {
    const x0 = bigRects[i].x + 16 * unit;
    return [x0 - 0.8 * font, x0 + words.length * 0.75 * font + 0.8 * font];
  });

  const grid = gridOf(L.m, L.n);
  const cellCount = grid.cols * grid.rows;
  /* six teams take a first course each; the team's plate gives what it has
     past one dot a cell, and riders make up the rest */
  const riders = Math.max(0, SEATS.length * cellCount - (scene.plates[0].dots - cellCount));
  const pool = buildPool(scene, riders);
  const cells = assignCells(pool, grid);
  const sizes = scene.sizes;
  const big = barTargets(pool, cells, bigRects, { edge: sizes[3], fill: sizes[2] }, windows);
  const node = barTargets(pool, cells, nodeRects, { edge: sizes[2], fill: sizes[1] });
  const org = orgTargets(
    pool,
    cells,
    node,
    teamRects,
    ROUTES.map((route) => route.map(([x, y]): Pt => [NX(x), NY(y)])),
    {
      sizes: { edge: sizes[2], fill: sizes[1], station: sizes[1] },
      wires: 3,
      wirePitch: RIBBON.pitch * 1.5 * unit,
      stationPitch: 7 * dpr,
      sides: SEATS.map((s) => s.side),
    }
  );
  const rank2 = new Float32Array(pool.count);
  for (let d = 0; d < pool.count; d++) rank2[d] = (cells.cell[d] % grid.cols) / (grid.cols - 1);

  /* -- the opening's files, in the flow's own frame ------------------------------ */
  const fu = (m.flowFig.w / FLOW_W) * dpr;
  const FX = (x: number) => m.flowFig.x * dpr + x * fu;
  const FY = (y: number) => m.flowFig.y * dpr + y * fu;
  const corner = (i: 0 | 1 | 2, side: "left" | "right"): Pt => [
    seatA.ox + scene.plates[i][side].x,
    seatA.oy + scene.plates[i][side].y + seatA.lift[i],
  ];
  const ports = {
    teamLeft: corner(0, "left"),
    layerLeft: corner(1, "left"),
    layerRight: corner(1, "right"),
    agentsRight: corner(2, "right"),
  };
  const cutPx = FY(FLOW.tie[2][1]) - FY(FLOW.tie[1][1]);
  const tie = FLOW.tie.map(([x, y]): [number, number] => [FX(x), FY(y)]);
  tie[3][1] = ports.layerRight[1] - cutPx;
  tie[4][1] = ports.layerRight[1];
  tie[5] = [ports.layerRight[0], ports.layerRight[1]];
  const drop = FLOW.drop.map(([x, y]): [number, number] => [FX(x), FY(y)]);
  drop[0] = [ports.layerLeft[0], ports.layerLeft[1]];
  drop[1][1] = ports.layerLeft[1];
  drop[2][1] = ports.layerLeft[1] + cutPx;
  const traces = buildTraces(
    {
      rows: FLOW.rows.map(FY),
      chipEdge: FX(FLOW.team.stubs[0][0][0]),
      busIn: FX(FLOW.team.stubs[0][1][0]),
      busOut: FX(FLOW.tools.stubs[0][0][0]),
      cardEdge: FX(FLOW.tools.stubs[0][1][0]),
      tie,
      drop,
      lit: CARDS.map((c) => !!c.lit),
    },
    ports,
    L.a * L.g,
    /* the layer's three parts are tags set on its drop: a file passes behind
       a tag, as the hairline did */
    FLOW.parts.map(([x, y]) => ({
      x0: FX(x - TAG.w),
      x1: FX(x + TAG.w),
      y0: FY(y - TAG.h),
      y1: FY(y + TAG.h),
    }))
  );

  return {
    metrics: m,
    pick,
    L,
    scene,
    falls,
    thick: tops,
    pool,
    sizes,
    squash: L.b / L.a,
    cut: 3 * L.n * row,
    seatA,
    seatB,
    big,
    node,
    org,
    rank2,
    traces,
    steps,
    dots: scene.plates.reduce((sum, p) => sum + p.dots, 0),
  };
}

/** The plate's width the lattice gives, CSS px: what the page reports. */
export const widthOf = (w: World) => plateWidth(w.pick, w.metrics.dpr);
