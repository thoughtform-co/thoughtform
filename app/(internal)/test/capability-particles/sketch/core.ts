/* What every sketch shares. PURE.

   A sketch draws in the opening's own frame (`PlugFlow`, 1200 x 460 units),
   right of the four workstream chips, which stay as words on the page. It is
   one function of time: `frame(t, out)` writes every dot it shows at `t`
   seconds into `out`, and nothing else. No dot has an alpha: a dot arrives
   and leaves by moving, and only its size says how much of it there is
   (S4·E's own rule, "size, not paint, is what fades").

   Colours are S4·E's styles (`stack-forms/swarm/dots.ts`): green is the
   people, gold the one lit thing, bone the structure. */

import { FLOW } from "@/components/xb-proposal/stack/heroLayouts";

import { STYLE } from "../../stack-forms/swarm/dots";

export { STYLE };

/** The figure on the canvas, device px. */
export interface Geom {
  /** Device px a frame unit. */
  u: number;
  /** The grain: device px a CSS px, rounded. */
  g: number;
  /** The figure's box on the canvas. */
  w: number;
  h: number;
  /** The site pitch, device px. */
  P: number;
  /** Dot sizes by tier, device px: a speck, small, the body, the head. */
  sizes: readonly [number, number, number, number];
  /** Frame units to device px, snapped to the pitch from the frame's origin. */
  X: (x: number) => number;
  Y: (y: number) => number;
  /** The four workstreams' rows, top first, device px. */
  rows: readonly number[];
  /** Where a chip's edge is, and the bus beside them, device px. */
  chipEdge: number;
  bus: number;
  /** The figure's right reach, device px. */
  right: number;
}

/** The frame's own width, in its units. */
export const FRAME_W = 1200;
export const FRAME_H = 460;

export function geomOf(w: number, h: number, dpr: number): Geom {
  const g = Math.max(1, Math.round(dpr));
  const u = w / FRAME_W;
  const P = 6 * g;
  const snap = (v: number) => Math.round(v / P) * P;
  const X = (x: number) => snap(x * u);
  const Y = (y: number) => snap(y * u);
  return {
    u,
    g,
    w,
    h,
    P,
    sizes: [g, 2 * g, 3 * g, 4 * g],
    X,
    Y,
    rows: FLOW.rows.map(Y),
    chipEdge: X(FLOW.team.stubs[0][0][0]),
    bus: X(FLOW.team.stubs[0][1][0]),
    right: X(FLOW.cards.x1),
  };
}

/** The dots a frame shows, in paint order. */
export interface Dots {
  n: number;
  x: Int32Array;
  y: Int32Array;
  size: Uint8Array;
  style: Uint8Array;
}

export const newDots = (cap: number): Dots => ({
  n: 0,
  x: new Int32Array(cap),
  y: new Int32Array(cap),
  size: new Uint8Array(cap),
  style: new Uint8Array(cap),
});

/** One dot more, if there is room for it. */
export function put(D: Dots, x: number, y: number, size: number, style: number): void {
  if (D.n >= D.x.length) return;
  D.x[D.n] = Math.round(x);
  D.y[D.n] = Math.round(y);
  D.size[D.n] = size;
  D.style[D.n] = style;
  D.n++;
}

export interface Sketch {
  /** Every dot at `t` seconds, into `out` (cleared first). */
  frame(t: number, out: Dots): void;
  /** When the story has played and the figure is at rest, seconds. */
  rest: number;
  /** The routes it moves dots along, for the guard: level, plumb or 45. */
  routes: [number, number][][];
}

/** The styles that are gold: the one lit thing. */
export const GOLD = new Set<number>([STYLE.layerDim, STYLE.layer, STYLE.layerLit, STYLE.fallGold]);

/* -- the arithmetic of motion ---------------------------------------------------- */

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Off at once, settling as it lands (the swarm's own). */
export const flow = (t: number) => 1 - (1 - t) * (1 - t);
/** Easy in, easy out (owner, ADR-104). */
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** A fall: slow off the edge, faster as it goes, as a drop does. */
export const drop = (t: number) => t * t;

/** S4·E's trail behind a falling dot: how far back on its way, and its tier. */
export const TRAIL = [
  [0.06, 2],
  [0.12, 1],
  [0.18, 0],
] as const;
