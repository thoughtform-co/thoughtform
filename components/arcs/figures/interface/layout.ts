/**
 * The interface figure's layout (ADR-156 U4): a piece of work at the top,
 * and downstream from it two ways of getting it done.
 *
 * · BEFORE, on the left: the zoomed-out copy of the capability stack, as the
 *   flow it really was. Ten hand-offs in a snake (prompt, image, edit,
 *   video, brief, PRD, workflow, tool, vibe-coded app, review), two rework
 *   loops back, and a finish at the end of it.
 * · NOW, on the right: the frontier model as a brain of circuits, three
 *   sockets on top (context, problems, evals) and one gold output under it.
 *
 * The particles' routes are polylines in the viewBox; `particleAt` places a
 * particle as a pure function of the beat's progress. The left route stops
 * at every tile (a hand-off waits); the right route runs straight through.
 *
 * ⚠ PURE: the tests and the figure read the same numbers.
 */

import { brainDrawing, type Brain } from "./brain";

export const VB = { w: 1200, h: 700 } as const;

export const WORK = { x: 480, y: 20, w: 240, h: 92 } as const;
const SPLIT_Y = 146;

export interface Tile {
  id: string;
  x: number;
  y: number;
  /** A thumbnail from the capability stack, where the step made one. */
  thumb?: string;
}

const TILE = { w: 104, h: 62 } as const;
export const TILE_SIZE = TILE;

/** The snake, in order: row one left to right, row two back, row three on. */
export const BEFORE_TILES: Tile[] = [
  { id: "prompt", x: 92, y: 222 },
  { id: "image", x: 212, y: 222, thumb: "/images/ThoughtForm_v1.webp" },
  { id: "edit", x: 332, y: 222 },
  { id: "video", x: 452, y: 222, thumb: "/arcs/posters/smug-owl.jpg" },
  { id: "brief", x: 452, y: 342 },
  { id: "prd", x: 332, y: 342 },
  { id: "workflow", x: 212, y: 342 },
  { id: "tool", x: 212, y: 462, thumb: "/arcs/ux-meetup/photocraft.webp" },
  { id: "app", x: 332, y: 462 },
  { id: "review", x: 452, y: 462 },
];
export const BEFORE_END = { x: 332, y: 574 } as const;

/** Two rework loops: a step sends the work back to an earlier one. */
export const REWORK: readonly [number, number][] = [
  [5, 1],
  [9, 6],
];

export const BRAIN_AT = { ox: 740, oy: 236 } as const;
export const OUTPUT = { x: 956, y: 594 } as const;

export function brain(): Brain {
  return brainDrawing(BRAIN_AT.ox, BRAIN_AT.oy);
}

/** The socket boxes, above the brain and spread wider than its sockets, so
 *  their words never touch; each is wired down to its own socket. */
export function socketBoxes(b: Brain): { x: number; y: number }[] {
  const mid = b.sockets[1].x;
  return [-128, 0, 128].map((dx) => ({ x: mid + dx, y: 186 }));
}

type P = { x: number; y: number };

/** The wire from the work, down and split, to both ways. */
export function splitWires(b: Brain): string {
  const sx = WORK.x + WORK.w / 2;
  const left = `M${sx} ${WORK.y + WORK.h} L${sx} ${SPLIT_Y} L${BEFORE_TILES[0].x} ${SPLIT_Y} L${BEFORE_TILES[0].x} ${BEFORE_TILES[0].y - TILE.h / 2}`;
  const boxes = socketBoxes(b);
  const right = `M${sx} ${SPLIT_Y} L${boxes[2].x} ${SPLIT_Y} M${boxes[0].x} ${SPLIT_Y} L${boxes[0].x} ${boxes[0].y - 14} M${boxes[1].x} ${SPLIT_Y} L${boxes[1].x} ${boxes[1].y - 14} M${boxes[2].x} ${SPLIT_Y} L${boxes[2].x} ${boxes[2].y - 14}`;
  const into = b.sockets.map((s, i) => `M${boxes[i].x} ${boxes[i].y + 14} L${s.x} ${s.y}`).join(" ");
  const out = `M${b.exit.x} ${b.exit.y} L${b.exit.x} ${OUTPUT.y - 22}`;
  return `${left} ${right} ${into} ${out}`;
}

/** The snake's own wires: tile to tile, then down to the finish. */
export function beforeWires(): string {
  const pts = BEFORE_TILES.map((t) => `${t.x} ${t.y}`);
  return `M${pts.join(" L")} L${BEFORE_TILES[9].x} ${BEFORE_END.y} L${BEFORE_END.x} ${BEFORE_END.y}`;
}

/** The rework loops, as arcs bowing out to the left of the snake. */
export function reworkArcs(): string[] {
  return REWORK.map(([from, to]) => {
    const a = BEFORE_TILES[from];
    const b = BEFORE_TILES[to];
    const bow = Math.min(a.x, b.x) - 70;
    return `M${a.x - TILE.w / 2} ${a.y} C${bow} ${a.y} ${bow} ${b.y} ${b.x - TILE.w / 2} ${b.y + 8}`;
  });
}

// ── The particles ──────────────────────────────────────────────────────────

/** The left route: through every tile, stopping at each. */
function leftRoute(): { pts: P[]; stops: number[] } {
  const sx = WORK.x + WORK.w / 2;
  const pts: P[] = [
    { x: sx, y: WORK.y + WORK.h / 2 },
    { x: sx, y: SPLIT_Y },
    { x: BEFORE_TILES[0].x, y: SPLIT_Y },
    ...BEFORE_TILES.map((t) => ({ x: t.x, y: t.y })),
    { x: BEFORE_TILES[9].x, y: BEFORE_END.y },
    { x: BEFORE_END.x, y: BEFORE_END.y },
  ];
  // A stop at every tile (indexes 3..12) and at the finish.
  const stops = [...BEFORE_TILES.map((_, i) => i + 3), pts.length - 1];
  return { pts, stops };
}

/** A right route through socket `k`, the brain and out. */
function rightRoute(b: Brain, k: number): P[] {
  const sx = WORK.x + WORK.w / 2;
  const box = socketBoxes(b)[k];
  const centre = { x: BRAIN_AT.ox + 180, y: BRAIN_AT.oy + 116 };
  return [
    { x: sx, y: WORK.y + WORK.h / 2 },
    { x: sx, y: SPLIT_Y },
    { x: box.x, y: SPLIT_Y },
    { x: box.x, y: box.y },
    b.sockets[k],
    centre,
    b.exit,
    { x: OUTPUT.x, y: OUTPUT.y },
  ];
}

function along(pts: readonly P[], t: number): P {
  const lens: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = lens[lens.length - 1];
  const d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    if (d <= lens[i]) {
      const u = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u };
    }
  }
  return pts[pts.length - 1];
}

/** Along a route with stops: each stop holds the particle for `dwell` of its
 *  run; the legs between share the rest. */
function withStops(pts: readonly P[], stops: readonly number[], t: number, dwell: number): P {
  const legs = stops.length;
  const legT = (1 - dwell * legs) / legs;
  let at = 0;
  let from = 0;
  for (let k = 0; k < legs; k++) {
    const to = stops[k];
    const seg = pts.slice(from, to + 1);
    if (t < at + legT) return along(seg, (t - at) / legT);
    at += legT;
    if (t < at + dwell) return pts[to];
    at += dwell;
    from = to;
  }
  return pts[pts.length - 1];
}

export const PARTICLES = 48;
/** How long the slow way and the new way take, in the beat's progress. */
export const BEFORE_RUN = 0.86;
export const NOW_RUN = 0.26;
const START = 0.1;

function seeded(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export interface Particle {
  x: number;
  y: number;
  side: 0 | 1;
  alpha: number;
  gold: boolean;
}

/** Every particle at progress `s`: inside the work until `START`, then down. */
export function particlesAt(s: number, b: Brain): Particle[] {
  const left = leftRoute();
  const out: Particle[] = [];
  for (let i = 0; i < PARTICLES; i++) {
    const side = (i % 2) as 0 | 1;
    const j = Math.floor(i / 2);
    const delay = START + j * 0.006;
    const jx = (seeded(i) - 0.5) * 18;
    const jy = (seeded(i + 99) - 0.5) * 10;
    if (s < delay) {
      // In the work: a slow swirl inside its frame.
      const a = seeded(i + 7) * Math.PI * 2 + s * 6;
      const r = 14 + seeded(i + 3) * 26;
      out.push({ x: WORK.x + WORK.w / 2 + Math.cos(a) * r * 1.8, y: WORK.y + WORK.h / 2 + Math.sin(a) * r * 0.5, side, alpha: 0.9, gold: false });
      continue;
    }
    if (side === 0) {
      const t = (s - delay) / BEFORE_RUN;
      const p = withStops(left.pts, left.stops, t, 0.045);
      out.push({ x: p.x + jx * 0.5, y: p.y + jy * 0.5, side, alpha: 0.9, gold: false });
    } else {
      const t = (s - delay) / NOW_RUN;
      const p = along(rightRoute(b, j % 3), t);
      out.push({ x: p.x + jx * 0.4, y: p.y + jy * 0.4, side, alpha: 0.95, gold: t > 0.55 });
    }
  }
  return out;
}
