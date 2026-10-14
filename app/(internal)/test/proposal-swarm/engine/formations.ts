/* What the swarm stands in once it has left the stack. PURE.

   Three formations, each a seat for every dot of the pool:

     BARS   the three plates turned to face the reader: three level bars,
            one a plate, each a grid of dots. A dot takes the bar's cell
            its place on its plate falls in (a column a site across, a row
            a unit from back to front, the back on top), so a plate turned
            face on and gathered to its cells' lines IS its bar, and every
            cell is taken.
     NODE   the same three bars at a team's size.
     ORG    Marketing keeps one dot a cell; the rest leave along the six
            routes and stand as the lanes, each team's first course and the
            outlines of its other two.

   A cell holds more dots than one. The first is its RESIDENT; the others
   stand on the same pixel at the same size in the same tone, so they are not
   seen until they leave. */

import { offset, type Pt } from "@/components/xb-proposal/kit/trace";

import { STYLE } from "../../stack-forms/swarm/dots";

import type { Pool } from "./pool";

/** Device px on the canvas. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Grid {
  cols: number;
  rows: number;
}

/** How a dot is shown. `seat`: it has not left the opening, and is drawn on
    the opening's own canvas, in that canvas's space. */
export const SHOW = { no: 0, yes: 1, window: 2, seat: 3 } as const;

/** A seat for every dot of the pool, in device px on the canvas. */
export interface Targets {
  x: Float32Array;
  y: Float32Array;
  size: Uint8Array;
  style: Uint8Array;
  show: Uint8Array;
}

const emptyTargets = (n: number): Targets => ({
  x: new Float32Array(n),
  y: new Float32Array(n),
  size: new Uint8Array(n),
  style: new Uint8Array(n),
  show: new Uint8Array(n),
});

const EDGE = [STYLE.teamLit, STYLE.layerLit, STYLE.agentsLit] as const;
const FILL = [STYLE.team, STYLE.layer, STYLE.agents] as const;
const QUIET = [STYLE.teamDim, STYLE.layerDim, STYLE.agentsDim] as const;

/* -- cells -------------------------------------------------------------------- */

export interface Cells {
  grid: Grid;
  /** Each dot's cell in its own plate's bar: `row * cols + col`. */
  cell: Int32Array;
  /** 1 for the one dot a cell shows. */
  resident: Uint8Array;
}

/** A bar's grid for a plate of `m` sites a side at `n` a unit: a column a
    site, a row a unit of depth and one more. */
export const gridOf = (m: number, n: number): Grid => ({ cols: m + 1, rows: n + 1 });

/** Where a cell is on its plate, in sites: its column across, its row from
    the back. */
export const cellSite = (g: Grid, cell: number): [number, number] => {
  const m = g.cols - 1;
  const n = g.rows - 1;
  return [cell % g.cols, (Math.floor(cell / g.cols) * m) / n];
};

/**
 * Each dot's cell, by its place on its plate (`i` across, `j` from the back,
 * in sites, as `turn.ts` reads them back): the column of its nearest site,
 * the row of its nearest unit. A cell's resident is the dot nearest its
 * point. A cell nothing falls in borrows a dot from the nearest cell that
 * can spare one, so every cell is taken.
 */
export function placeCells(pool: Pool, grid: Grid, i: Float32Array, j: Float32Array): Cells {
  const { cols, rows } = grid;
  const m = cols - 1;
  const n = rows - 1;
  const cell = new Int32Array(pool.count);
  const resident = new Uint8Array(pool.count);
  const far = (d: number, c: number) => {
    const [ci, cj] = cellSite(grid, c);
    return Math.abs(i[d] - ci) + Math.abs(j[d] - cj);
  };
  for (const plate of [0, 1, 2]) {
    const held: number[][] = Array.from({ length: cols * rows }, () => []);
    for (let d = 0; d < pool.own; d++) {
      if (pool.plate[d] !== plate) continue;
      const c = Math.min(m, Math.max(0, Math.round(i[d])));
      const r = Math.min(n, Math.max(0, Math.round((j[d] * n) / m)));
      cell[d] = r * cols + c;
      held[cell[d]].push(d);
    }
    for (let c = 0; c < held.length; c++) {
      if (held[c].length) continue;
      const [ci, cr] = [c % cols, Math.floor(c / cols)];
      let from = -1;
      let best = Infinity;
      for (let o = 0; o < held.length; o++) {
        if (held[o].length < 2) continue;
        const dist = Math.abs((o % cols) - ci) + Math.abs(Math.floor(o / cols) - cr) * (m / n);
        if (dist < best) [best, from] = [dist, o];
      }
      if (from < 0) continue;
      held[from].sort((p, q) => far(p, c) - far(q, c) || p - q);
      const d = held[from].shift()!;
      cell[d] = c;
      held[c].push(d);
    }
    held.forEach((ds, c) => {
      if (!ds.length) return;
      let best = ds[0];
      for (const d of ds)
        if (far(d, c) < far(best, c) || (far(d, c) === far(best, c) && d < best)) best = d;
      resident[best] = 1;
    });
  }
  /* a rider's cell is its host's: it is unseen there, on the same pixel */
  for (let d = pool.own; d < pool.count; d++) cell[d] = cell[pool.host[d]];
  return { grid, cell, resident };
}

const isEdge = (g: Grid, c: number, r: number) =>
  r === 0 || r === g.rows - 1 || c === 0 || c === g.cols - 1;

/** The middle of a cell, on a whole pixel. */
const cellX = (R: Rect, g: Grid, c: number) => Math.round(R.x + ((c + 0.5) * R.w) / g.cols);
const cellY = (R: Rect, g: Grid, r: number) => Math.round(R.y + ((r + 0.5) * R.h) / g.rows);

/* -- the bars ------------------------------------------------------------------- */

export interface BarSizes {
  edge: number;
  fill: number;
}

/**
 * The three bars. `windows` are the stretches of each bar a word is set on
 * (x0, x1 in device px): the cells inside one, off the top and bottom rows,
 * are marked so the painter can hold them back while the word shows.
 */
export function barTargets(
  pool: Pool,
  cells: Cells,
  rects: readonly Rect[],
  sizes: BarSizes,
  windows?: readonly (readonly [number, number])[]
): Targets {
  const g = cells.grid;
  const T = emptyTargets(pool.count);
  const core = Math.max(1, Math.round(g.cols * 0.09));
  for (let d = 0; d < pool.count; d++) {
    const plate = pool.plate[d];
    const c = cells.cell[d] % g.cols;
    const r = Math.floor(cells.cell[d] / g.cols);
    const R = rects[plate];
    const edge = isEdge(g, c, r);
    const x = cellX(R, g, c);
    T.x[d] = x;
    T.y[d] = cellY(R, g, r);
    T.size[d] = edge ? sizes.edge : sizes.fill;
    /* the layer keeps its white-hot core, as a block at the bar's middle */
    const hot = plate === 1 && !edge && Math.abs(c - (g.cols - 1) / 2) <= core;
    T.style[d] = hot ? STYLE.layerHot : edge ? EDGE[plate] : FILL[plate];
    const w = windows?.[plate];
    const inWindow = !!w && r > 0 && r < g.rows - 1 && x >= w[0] && x <= w[1];
    T.show[d] = pool.host[d] >= 0 ? SHOW.no : inWindow ? SHOW.window : SHOW.yes;
  }
  return T;
}

/* -- the organisation ------------------------------------------------------------- */

/** A polyline with its running length, device px. */
export interface Lane {
  pts: Float32Array;
  cum: Float32Array;
  len: number;
}

export function laneOf(pts: readonly Pt[]): Lane {
  const flat = new Float32Array(pts.length * 2);
  const cum = new Float32Array(pts.length);
  pts.forEach((p, i) => {
    flat[i * 2] = p[0];
    flat[i * 2 + 1] = p[1];
    if (i > 0) cum[i] = cum[i - 1] + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
  });
  return { pts: flat, cum, len: cum[cum.length - 1] ?? 0 };
}

/** The point `s` px along a lane, into `out`. */
export function along(lane: Lane, s: number, out: Float64Array | number[]): void {
  const { pts, cum } = lane;
  const n = cum.length;
  if (n === 0) return;
  if (s <= 0) {
    out[0] = pts[0];
    out[1] = pts[1];
    return;
  }
  for (let i = 1; i < n; i++) {
    if (s <= cum[i] || i === n - 1) {
      const span = cum[i] - cum[i - 1];
      const t = span > 0 ? Math.min(1, (s - cum[i - 1]) / span) : 1;
      out[0] = pts[i * 2 - 2] + (pts[i * 2] - pts[i * 2 - 2]) * t;
      out[1] = pts[i * 2 - 1] + (pts[i * 2 + 1] - pts[i * 2 - 1]) * t;
      return;
    }
  }
}

export interface Org {
  /** Where every dot ends: Marketing's cell, or its seat with a team. */
  to: Targets;
  /** The team a dot leaves for, 0..5 in the seats' order; -1 stays. */
  team: Int8Array;
  /** Its turn within its team's, 0..1. */
  order: Float32Array;
  /** The wire of the ribbon it walks. */
  wire: Uint8Array;
  /** How far along its lane it goes: all of it, or to its station. */
  reach: Float32Array;
  /** 1 when it leaves the lane's end for a seat in the team's node. */
  seated: Uint8Array;
  /** Each team's ribbon, a lane a wire. */
  lanes: Lane[][];
  /** The wire the standing lane is on. */
  mid: number;
  /** How many dots took a seat away from Marketing. */
  left: number;
}

export interface OrgOptions {
  sizes: BarSizes & { station: number };
  /** Wires a ribbon, and the px between them. */
  wires: number;
  wirePitch: number;
  /** The least px between two standing dots of a lane. */
  stationPitch: number;
  /** The side each team's ribbon arrives on. */
  sides: readonly ("l" | "r")[];
}

/**
 * The organisation. `node` is Marketing at a team's size (every dot of the
 * pool on its cell); `teamRects` are each team's three bars; `routes` each
 * team's ribbon, Marketing first.
 *
 * A team takes: its first course whole, in the people's green (the page says
 * "Navigate next" under it); the outlines of the other two, quiet; and its
 * lane, a file of standing dots. Marketing gives only what it can spare: one
 * dot stays on every cell of its own three bars.
 */
export function orgTargets(
  pool: Pool,
  cells: Cells,
  node: Targets,
  teamRects: readonly (readonly Rect[])[],
  routes: readonly (readonly Pt[])[],
  o: OrgOptions
): Org {
  const g = cells.grid;
  const n = pool.count;
  const to: Targets = {
    x: node.x.slice(),
    y: node.y.slice(),
    size: node.size.slice(),
    style: node.style.slice(),
    show: node.show.slice(),
  };
  const org: Org = {
    to,
    team: new Int8Array(n).fill(-1),
    order: new Float32Array(n),
    wire: new Uint8Array(n),
    reach: new Float32Array(n),
    seated: new Uint8Array(n),
    lanes: routes.map((route) =>
      Array.from({ length: o.wires }, (_, w) =>
        laneOf(offset(route, (w - (o.wires - 1) / 2) * o.wirePitch))
      )
    ),
    mid: (o.wires - 1) >> 1,
    left: 0,
  };

  /* what each plate can spare, shuffled by each dot's own number so the dots
     that leave for one team come from all over the bar */
  const spare: number[][] = [[], [], []];
  for (let d = 0; d < n; d++) if (!cells.resident[d]) spare[pool.plate[d]].push(d);
  for (const list of spare) list.sort((p, q) => pool.h[q] - pool.h[p] || q - p);

  const seat = (d: number, team: number, x: number, y: number, size: number, style: number) => {
    to.x[d] = x;
    to.y[d] = y;
    to.size[d] = size;
    to.style[d] = style;
    to.show[d] = SHOW.yes;
    org.team[d] = team;
    org.left++;
  };

  const edgeCells: [number, number][] = [];
  for (let r = 0; r < g.rows; r++)
    for (let c = 0; c < g.cols; c++) if (isEdge(g, c, r)) edgeCells.push([c, r]);

  routes.forEach((_, team) => {
    const lanes = org.lanes[team];
    const fromLeft = o.sides[team] === "l";
    /* the first course, whole: the far end of the bar is filled first, so no
       dot walks past one already seated */
    const first = teamRects[team][0];
    for (let r = 0; r < g.rows; r++)
      for (let c = 0; c < g.cols; c++) {
        const d = spare[0].pop();
        if (d === undefined) break;
        const edge = isEdge(g, c, r);
        seat(
          d,
          team,
          cellX(first, g, c),
          cellY(first, g, r),
          edge ? o.sizes.edge : o.sizes.fill,
          edge ? EDGE[0] : FILL[0]
        );
        const far = fromLeft ? 1 - c / (g.cols - 1) : c / (g.cols - 1);
        org.order[d] = 0.3 + 0.45 * (1 - far) + 0.05 * (r / g.rows);
        org.wire[d] = (c + r) % o.wires;
        org.reach[d] = lanes[org.wire[d]].len;
        org.seated[d] = 1;
      }
    /* the other two, as outlines: not yet begun */
    for (const plate of [1, 2]) {
      const R = teamRects[team][plate];
      edgeCells.forEach(([c, r], i) => {
        const d = spare[plate].pop();
        if (d === undefined) return;
        seat(d, team, cellX(R, g, c), cellY(R, g, r), o.sizes.fill, QUIET[plate]);
        org.order[d] = 0.72 + 0.28 * (i / edgeCells.length);
        org.wire[d] = i % o.wires;
        org.reach[d] = lanes[org.wire[d]].len;
        org.seated[d] = 1;
      });
    }
  });

  /* the lanes last, with the gold that is left: a file of standing dots a
     team, no closer together than `stationPitch` */
  const total = org.lanes.reduce((sum, l) => sum + l[org.mid].len, 0);
  const pitch = Math.max(o.stationPitch, total / Math.max(1, spare[1].length));
  const at = [0, 0];
  routes.forEach((_, team) => {
    const lane = org.lanes[team][org.mid];
    for (let s = pitch / 2; s < lane.len; s += pitch) {
      const d = spare[1].pop();
      if (d === undefined) return;
      along(lane, s, at);
      seat(d, team, Math.round(at[0]), Math.round(at[1]), o.sizes.station, FILL[1]);
      /* the farthest station is walked to first */
      org.order[d] = 0.3 * (1 - s / lane.len);
      org.wire[d] = org.mid;
      org.reach[d] = s;
      org.seated[d] = 0;
    }
  });
  return org;
}
