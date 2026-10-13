/* S4·B · SWARM, BANDED: the homepage sphere's own material, on the stack
   (owner, 2026-10-13, of S4: "a bit too much like a Christmas decoration …
   more minimalistic", and of all of them: "it would be amazing if it would
   fit the aesthetic of our Arc 3D three.js thing on our homepage").

   What that sphere is made of, and so what this is made of: ONE hue. Gold
   dots laid in ROWS, the brightness running along each row; a few of them
   white-hot; a thin gold axis through the figure with a small solid
   arrowhead at each end; a diamond where a name meets it. Nothing falls,
   nothing drifts, nothing is scattered, and there is no field behind it.

   The three plates differ by how their rows are set, not by colour:
     team    few rows, wide apart, thinning to every other dot where it is
             airy. The four workstreams are the stretches where the rows
             close up.
     layer   every other row of the lattice, unbroken and bright: the one
             lit thing. Three bands down its walls are its three strata.
     agents  between the two; the chip and the four modules are knots where
             the rows close up.
   Every row runs its plate's full width and every plate's edge is whole and
   steady, so the square and its four corners are there before anything the
   plate holds (coordinator, 2026-10-13: the rows "start and stop at
   different places, so each reads as loose diagonal stripes").
   No React; the canvas is handed in. Every dot is whole device pixels on
   S4's own lattice, at its finest step (5 : 3), so a row is beaded. */

import { hash2, HEX, PLATES, poseAt } from "../model";

import {
  type Cells,
  cellsOf,
  fitLattice,
  inside,
  kOf,
  type Lattice,
  offsets,
  outline,
  px,
  py,
} from "./dots";
import type { SwarmPainter } from "./useSwarmCanvas";

/** A row wants a fine step along it, so the finest lattice only. */
const FINE = [[5, 3]] as const;
/** The axis runs this far past the stack at each end, in units. */
const AXIS_OUT = 0.95;
/** The brightness that runs along a row: its length and its period. */
const WAVE = { length: 5.2, period: 11 };

export interface BandPop {
  count: number;
  x: Int32Array;
  y: Int32Array;
  /** Device px. */
  size: Uint8Array;
  /** The dot's own light, 0..1, before the row's brightness passes over it. */
  base: Float32Array;
  /** How much of that light it keeps between two passes of brightness,
      0..1: 1 is steady, which is what an edge is. */
  floor: Float32Array;
  /** Where the dot is along its row, in units, and the row's own phase. */
  along: Float32Array;
  phase: Float32Array;
  hot: Uint8Array;
}

interface Dot {
  x: number;
  y: number;
  size: number;
  base: number;
  floor: number;
  along: number;
  phase: number;
  hot: boolean;
}

/** What a site of a row is. */
interface Bead {
  size: number;
  base: number;
  floor: number;
  hot?: boolean;
}

function pack(dots: Dot[]): BandPop {
  /* the white-hot ones last, so a frame changes paint once */
  const sorted = [...dots.filter((d) => !d.hot), ...dots.filter((d) => d.hot)];
  const n = sorted.length;
  const pop: BandPop = {
    count: n,
    x: new Int32Array(n),
    y: new Int32Array(n),
    size: new Uint8Array(n),
    base: new Float32Array(n),
    floor: new Float32Array(n),
    along: new Float32Array(n),
    phase: new Float32Array(n),
    hot: new Uint8Array(n),
  };
  sorted.forEach((d, q) => {
    pop.x[q] = d.x;
    pop.y[q] = d.y;
    pop.size[q] = d.size;
    pop.base[q] = d.base;
    pop.floor[q] = d.floor;
    pop.along[q] = d.along;
    pop.phase[q] = d.phase;
    pop.hot[q] = d.hot ? 1 : 0;
  });
  return pop;
}

export interface BandPlate {
  pop: BandPop;
  mask: Int32Array;
  /** Screen y of the top face's middle and of the floor's middle, at lift 0. */
  topY: number;
  floorY: number;
  /** The right-hand corner, mid-wall: where its name meets it. */
  corner: { x: number; y: number };
}

export interface BandScene {
  L: Lattice;
  plates: [BandPlate, BandPlate, BandPlate];
  /** The four workstreams' middles on the team's top, x then y, at lift 0. */
  people: Int32Array;
  /** The plates' own dots, all told. */
  dots: number;
  /** Where the names stand, device px from the left. */
  tagX: number;
}

const TAU = Math.PI * 2;

/** One row's phase: rows next to each other are not in step. */
const phaseOf = (plate: number, row: number, wall = 0) => hash2(row, plate * 7 + wall, 17) * TAU;

/** The rows of a wall: one a height, along the left wall and the right. */
function wallRows(
  L: Lattice,
  plate: number,
  rows: readonly number[],
  size: number,
  base: readonly [number, number],
  floor: number,
  out: Dot[]
) {
  rows.forEach((k, n) => {
    for (let i = 0; i <= L.m; i++)
      out.push({
        x: px(L, i, L.m),
        y: py(L, i, L.m, k),
        size,
        base: base[0],
        floor,
        along: i / L.n,
        phase: phaseOf(plate, n, 1),
        hot: false,
      });
    for (let j = 0; j < L.m; j++)
      out.push({
        x: px(L, L.m, j),
        y: py(L, L.m, j, k),
        size,
        base: base[1],
        floor,
        along: (L.m - j) / L.n,
        phase: phaseOf(plate, n, 2),
        hot: false,
      });
  });
}

/** Every site of the top face through `each`, which says what a site is
    (or that nothing stands there). `onRow` is true on the rows
    `j ≡ 0 (mod pitch)`; `onEdge` on the face's four edges, which a plate
    that is not all rows has to draw whole to be a square. */
function topRows(
  L: Lattice,
  plate: number,
  k: number,
  pitch: number,
  each: (i: number, j: number, onRow: boolean, onEdge: boolean) => Bead | null,
  out: Dot[]
) {
  for (let j = 0; j <= L.m; j++) {
    const onRow = j % pitch === 0;
    for (let i = 0; i <= L.m; i++) {
      const d = each(i, j, onRow, i === 0 || i === L.m || j === 0 || j === L.m);
      if (!d) continue;
      out.push({
        x: px(L, i, j),
        y: py(L, i, j, k),
        size: d.size,
        base: d.base,
        floor: d.floor,
        along: i / L.n,
        phase: phaseOf(plate, j),
        hot: d.hot ?? false,
      });
    }
  }
}

function plateOf(L: Lattice, i: 0 | 1 | 2, dots: Dot[]): BandPlate {
  const all: Cells = { i0: 0, i1: L.m, j0: 0, j1: L.m };
  const top = kOf(L, PLATES[i].body[PLATES[i].body.length - 1].z1);
  return {
    pop: pack(dots),
    mask: outline(L, all, 0, top),
    topY: py(L, L.m / 2, L.m / 2, top),
    floorY: py(L, L.m / 2, L.m / 2, 0),
    corner: { x: px(L, L.m, 0), y: py(L, L.m, 0, Math.round(top / 2)) },
  };
}

export function buildBands(w: number, h: number, dpr: number): BandScene {
  const L = fitLattice(w, h, dpr, { lattices: FINE, margin: AXIS_OUT, pad: 0.03 });
  const { g, n } = L;
  /* a dim dot, a bright one, a white-hot one */
  const [s, b, hot] = [2 * g, 3 * g, 4 * g];

  /* a plate that is not all rows keeps its edge whole and steady */
  const edge: Bead = { size: s, base: 0.7, floor: 1 };

  /* -- the team: few rows, wide apart, thinning where it is airy -- */
  const team: Dot[] = [];
  const teamTop = kOf(L, PLATES[0].top);
  const tiles = PLATES[0].features.filter((f) => f.kind === "tile").map((f) => cellsOf(L, f.box));
  const wide = Math.max(4, Math.round(0.75 * n));
  wallRows(L, 0, [0], s, [0.5, 0.34], 1, team);
  topRows(
    L,
    0,
    teamTop,
    wide,
    (i, j, onRow, onEdge) => {
      if (onEdge) return edge;
      /* a workstream: the rows close up to every other one, and brighten */
      if (tiles.some((c) => inside(c, i, j)))
        return j % 2 === 0 ? { size: s, base: 0.95, floor: 0.7 } : null;
      if (!onRow) return null;
      /* a row runs the plate's full width; where two slow waves say it is
         airy it thins to every other dot, and never stops */
      const airy = Math.sin(i * 0.19 + j * 1.3) + Math.sin(i * 0.071 + j * 0.7 + 1.1) < -0.5;
      return airy && (i & 1) === 1 ? null : { size: s, base: 0.56, floor: 0.62 };
    },
    team
  );

  /* -- the layer: every other row, unbroken and bright -- */
  const layer: Dot[] = [];
  const layerTop = kOf(L, PLATES[1].top);
  /* one band a stratum, where the stratum stands: clear of the top's edge */
  const strata = PLATES[1].body.map((box) => kOf(L, box.z0));
  wallRows(L, 1, [...new Set(strata)], b, [1, 0.72], 0.52, layer);
  topRows(
    L,
    1,
    layerTop,
    2,
    (i, j, onRow) => {
      if (!onRow && j !== L.m) return null;
      /* a few white-hot, never together: one in forty, none next to another */
      const isHot = hash2(i >> 1, j >> 1, 5) < 0.05 && (i & 1) === 0 && j % 4 === 0;
      return { size: isHot ? hot : b, base: 1, floor: 0.52, hot: isHot };
    },
    layer
  );

  /* -- the agents: between the two, knotted where something stands -- */
  const agents: Dot[] = [];
  const board = kOf(L, PLATES[2].body[0].z1);
  const solids = PLATES[2].features.map((f) => ({
    chip: f.kind === "chip",
    cells: cellsOf(L, f.box),
  }));
  const mid = Math.max(3, Math.round(0.5 * n));
  wallRows(L, 2, [0], s, [0.5, 0.34], 1, agents);
  topRows(
    L,
    2,
    board,
    mid,
    (i, j, onRow, onEdge) => {
      if (onEdge) return edge;
      const on = solids.find((c) => inside(c.cells, i, j));
      /* a module: every other row, at full light; the chip, the larger dot */
      if (on)
        return j % 2 === 0 ? { size: on.chip ? b : s, base: 1, floor: on.chip ? 0.88 : 0.9 } : null;
      return onRow ? { size: s, base: 0.54, floor: 0.64 } : null;
    },
    agents
  );

  const plates: BandScene["plates"] = [
    plateOf(L, 0, team),
    plateOf(L, 1, layer),
    plateOf(L, 2, agents),
  ];
  const people = Int32Array.from(
    tiles
      .flatMap((c) => [
        px(L, (c.i0 + c.i1) / 2, (c.j0 + c.j1) / 2),
        py(L, (c.i0 + c.i1) / 2, (c.j0 + c.j1) / 2, teamTop),
      ])
      .map(Math.round)
  );
  return {
    L,
    plates,
    people,
    dots: plates.reduce((sum, p) => sum + p.pop.count, 0),
    tagX: px(L, L.m, 0) + Math.round(3.1 * 2 * L.b * g * n),
  };
}

/* -- paint ----------------------------------------------------------------- */

type Ctx = CanvasRenderingContext2D;

const rgbOf = (hex: string) =>
  [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)).join(", ");
const GOLD = rgbOf(HEX.gold);

function drawRows(ctx: Ctx, plate: BandPlate, dy: number, t: number) {
  const { pop } = plate;
  let hot = -1;
  ctx.fillStyle = HEX.gold;
  for (let q = 0; q < pop.count; q++) {
    if (pop.hot[q] !== hot) {
      hot = pop.hot[q];
      ctx.fillStyle = hot ? HEX.bone : HEX.gold;
    }
    /* the brightness running along the row: a slow sine, sharpened so the
       lit stretch is shorter than the dim one, as it is on the sphere */
    const wave =
      0.5 + 0.5 * Math.sin((pop.along[q] / WAVE.length - t / WAVE.period) * TAU + pop.phase[q]);
    const floor = pop.floor[q];
    const lit = floor + (1 - floor) * wave * wave;
    ctx.globalAlpha = pop.base[q] * (hot ? Math.max(0.8, lit) : lit);
    const size = pop.size[q];
    ctx.fillRect(pop.x[q] - (size >> 1), pop.y[q] + dy - (size >> 1), size, size);
  }
  ctx.globalAlpha = 1;
}

function mask(ctx: Ctx, poly: Int32Array, dy: number) {
  ctx.fillStyle = HEX.void;
  ctx.beginPath();
  ctx.moveTo(poly[0], poly[1] + dy);
  for (let q = 2; q < poly.length; q += 2) ctx.lineTo(poly[q], poly[q + 1] + dy);
  ctx.closePath();
  ctx.fill();
}

/** A hairline of the axis, a device pixel a grain wide. */
function line(ctx: Ctx, L: Lattice, x0: number, y0: number, x1: number, y1: number) {
  ctx.fillStyle = `rgba(${GOLD}, 0.78)`;
  const [w, half] = [L.g, L.g >> 1];
  if (x0 === x1) ctx.fillRect(x0 - half, Math.min(y0, y1), w, Math.abs(y1 - y0));
  else ctx.fillRect(Math.min(x0, x1), y0 - half, Math.abs(x1 - x0), w);
}

/** A small solid arrowhead, its tip at (x, y), pointing along (dx, dy). */
function arrow(ctx: Ctx, L: Lattice, x: number, y: number, dx: number, dy: number) {
  const [len, half] = [9 * L.g, 4 * L.g];
  ctx.fillStyle = HEX.gold;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * len - dy * half, y - dy * len - dx * half);
  ctx.lineTo(x - dx * len + dy * half, y - dy * len + dx * half);
  ctx.closePath();
  ctx.fill();
}

/** A diamond node, `r` grains from middle to point. */
function diamond(ctx: Ctx, L: Lattice, x: number, y: number, r: number, fill: string) {
  const d = r * L.g;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y - d);
  ctx.lineTo(x + d, y);
  ctx.lineTo(x, y + d);
  ctx.lineTo(x - d, y);
  ctx.closePath();
  ctx.fill();
}

export function paintBands(
  ctx: Ctx,
  S: BandScene,
  open: number,
  t: number,
  el: HTMLElement,
  dpr: number
) {
  const { L } = S;
  const off = offsets(L, poseAt(open));
  const [team, layer, agents] = S.plates;
  const unit = 2 * L.b * L.g * L.n;
  const out = Math.round(AXIS_OUT * unit);
  const cx = L.ox;
  /* a plate's back corner stands half its diagonal above its middle on
     screen, its front corner as far below: the axis has to clear both */
  const reach = L.m * L.b * L.g;
  const tipTop = team.topY + off[0] - reach - out;
  const tipBottom = agents.floorY + off[2] + reach + out;
  ctx.clearRect(0, 0, L.w, L.h);

  /* painter's order, the ground as the mask: what is under a plate is hidden
     until it clears the plate's front corner, the axis included */
  line(ctx, L, cx, agents.topY + off[2], cx, tipBottom);
  arrow(ctx, L, cx, tipBottom, 0, 1);

  mask(ctx, agents.mask, off[2]);
  drawRows(ctx, agents, off[2], t);
  line(ctx, L, cx, layer.floorY + off[1], cx, agents.topY + off[2]);
  diamond(ctx, L, cx, agents.topY + off[2], 3, HEX.gold);

  mask(ctx, layer.mask, off[1]);
  drawRows(ctx, layer, off[1], t);
  /* the second axis lies in the layer's own plane, corner to corner */
  const across = L.m * L.a * L.g + out;
  const ly = layer.topY + off[1];
  line(ctx, L, cx - across, ly, cx + across, ly);
  arrow(ctx, L, cx - across, ly, -1, 0);
  arrow(ctx, L, cx + across, ly, 1, 0);
  line(ctx, L, cx, team.floorY + off[0], cx, ly);
  diamond(ctx, L, cx, ly, 3, HEX.gold);

  mask(ctx, team.mask, off[0]);
  drawRows(ctx, team, off[0], t);
  /* people, as the homepage marks them: four small green diamonds */
  for (let q = 0; q < S.people.length; q += 2)
    diamond(ctx, L, S.people[q], S.people[q + 1] + off[0], 3, HEX.green);
  line(ctx, L, cx, tipTop, cx, team.topY + off[0]);
  arrow(ctx, L, cx, tipTop, 0, -1);
  diamond(ctx, L, cx, team.topY + off[0], 3, HEX.gold);

  /* each plate's name: a diamond where it meets the plate, a dotted run out */
  const tags = el.querySelectorAll<HTMLElement>("[data-sfs-tag]");
  S.plates.forEach((p, i) => {
    const y = i === 1 ? ly : p.corner.y + off[i];
    /* the layer's name hangs off its own axis, a node past the arrowhead */
    const from = i === 1 ? cx + across + 9 * L.g : p.corner.x;
    diamond(ctx, L, from, y, 3, HEX.gold);
    ctx.fillStyle = `rgba(${GOLD}, 0.5)`;
    for (let x = from + 12 * L.g; x < S.tagX - 6 * L.g; x += 6 * L.g)
      ctx.fillRect(x, y - (L.g >> 1), L.g, L.g);
    const tag = tags[i];
    if (tag) {
      tag.style.left = `${S.tagX / dpr}px`;
      tag.style.top = `${y / dpr}px`;
    }
  });

  const total = el.querySelector<HTMLElement>("[data-sfs-fact='dots']");
  const text = S.dots.toLocaleString("en-US").replace(/,/g, " ");
  if (total && total.textContent !== text) total.textContent = text;
}

export const BANDS: SwarmPainter<BandScene> = { build: buildBands, paint: paintBands };
