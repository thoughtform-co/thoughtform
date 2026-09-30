/**
 * compassGateScreenRef — the Thoughtform compass gate's line work in SCREEN
 * space, published by `ThoughtformCompassGate` only while a reader asks.
 *
 * WHY. A DOM drawing that must BECOME this gate (the thoughtform-workshop
 * route's About turn, ADR-137 U3: the About orbit's rings and dots morph
 * into the gate's squares and dots) has to land on the gate's pixels exactly,
 * and the gate is not a still: it breathes (a slow Z spin), its orbit dots
 * turn, and its centre rides a wall-clock follower. So the gate projects its
 * own points once per frame and the reader follows them.
 *
 * ⚠ OPT-IN, AND FREE WHEN NOBODY ASKS. The gate checks `wanted` and does
 * nothing else when it is false, so `/` and every other route pay one
 * boolean read per frame. A reader sets it while it needs the data and
 * clears it when it parks.
 *
 * ⚠ CANVAS-LOCAL CSS PX. Points are `(ndc·½ + ½) × size`, the canvas
 * wrapper's own box; the reader adds that box's viewport offset. The gate
 * updates the camera's and its own world matrices before projecting, so the
 * points are THIS frame's (the camera rig runs earlier in the same loop).
 *
 * ⚠ THE COLOUR IS MULTIPLIED BY ALPHA TWICE. The canvas is `alpha: true,
 * premultipliedAlpha: false` under three's NormalBlending, so a line of
 * colour C and opacity a lands at `C·a² + page·(1 − a)` in both themes (the
 * grey the light theme shows). A DOM stroke matches it with
 * `rgb(C·a)` at `stroke-opacity: a` — `compassGateInk` below.
 *
 * Vanilla module ref (not Zustand): mutated every frame, one polling
 * reader, no React re-render — `brandmarkScreenRectRef`'s shape. THREE-FREE,
 * so a DOM route can import it without the corridor's graph.
 */

/** The gate's two inks (`ThoughtformCompassGate` reads these). */
export const COMPASS_GATE_DAWN = "#ebe3d6";
export const COMPASS_GATE_GOLD = "#caa554";

/** Per-ring ink, outermost first. */
export const COMPASS_RING_INK = [
  COMPASS_GATE_DAWN,
  COMPASS_GATE_DAWN,
  COMPASS_GATE_GOLD,
  COMPASS_GATE_GOLD,
] as const;

/** Per-ring dash pattern in world units (`null` = solid), outermost first —
 *  the v7 SVG dasharrays scaled 1/200. */
export const COMPASS_RING_DASH: readonly ({ dashSize: number; gapSize: number } | null)[] = [
  { dashSize: 0.005, gapSize: 0.025 },
  null,
  { dashSize: 0.01, gapSize: 0.035 },
  { dashSize: 0.005, gapSize: 0.015 },
];

/** The phase nodes' ink is gold; the orbit dots are gold then dawn. */
export const COMPASS_ORBIT_INK = [COMPASS_GATE_GOLD, COMPASS_GATE_DAWN] as const;

export interface CompassGateScreen {
  /** True on a frame the gate painted and projected. */
  valid: boolean;
  /** performance.now() at the write. */
  stamp: number;
  /** The canvas's effective device-pixel ratio: a WebGL line is one
   *  drawing-buffer pixel, i.e. `1 / dpr` CSS px. */
  dpr: number;
  /** CSS px per world unit on the ring plane — how a world-unit dash or dot
   *  radius reads on screen. */
  unitPx: number;
  /** 4 rings × TL, TR, BR, BL × (x, y). */
  rings: number[];
  ringAlpha: number[];
  /** 4 cardinal stubs × (inner, outer) × (x, y): top, bottom, left, right. */
  cross: number[];
  /** 8 ticks × (inner, outer) × (x, y), at 30/60/120/150/210/240/300/330°. */
  ticks: number[];
  bearingAlpha: number;
  /** 3 phase nodes (navigate, encode, build) × (x, y), radius px, alpha. */
  phase: number[];
  phaseR: number[];
  phaseAlpha: number[];
  /** 3 connectors × (from, to) × (x, y). */
  conn: number[];
  connAlpha: number[];
  /** 2 orbit dots (gold, dawn) × (x, y), radius px, alpha. */
  orbit: number[];
  orbitR: number[];
  orbitAlpha: number[];
}

function empty(): CompassGateScreen {
  return {
    valid: false,
    stamp: 0,
    dpr: 1,
    unitPx: 0,
    rings: new Array(32).fill(0),
    ringAlpha: new Array(4).fill(0),
    cross: new Array(16).fill(0),
    ticks: new Array(32).fill(0),
    bearingAlpha: 0,
    phase: new Array(6).fill(0),
    phaseR: new Array(3).fill(0),
    phaseAlpha: new Array(3).fill(0),
    conn: new Array(12).fill(0),
    connAlpha: new Array(3).fill(0),
    orbit: new Array(4).fill(0),
    orbitR: new Array(2).fill(0),
    orbitAlpha: new Array(2).fill(0),
  };
}

export const compassGateScreenRef: { wanted: boolean; current: CompassGateScreen } = {
  wanted: false,
  current: empty(),
};

/**
 * A DOM ink that lands where the gate's WebGL ink lands: `rgb(C·a)` at
 * opacity `a`, which CSS composites to `C·a² + under·(1 − a)`.
 */
export function compassGateInk(
  hex: string,
  a: number
): { rgb: [number, number, number]; a: number } {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return { rgb: [r * a, g * a, b * a], a };
}
