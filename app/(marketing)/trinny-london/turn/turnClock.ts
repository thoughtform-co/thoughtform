/**
 * turnClock — the turn's arithmetic (ADR-095), pure and unit-tested.
 *
 * `#turn` is a station of `100svh (pin) + runway + 100svh (the overlap
 * `#trinny` slides over)` with a sticky full-viewport stage. Everything
 * that moves in the beat — the particle morph in the corridor canvas, the
 * four products' sweep, the structural orbits' fade — is a pure function of
 * the station's rect, so reverse scroll unwinds it exactly and nothing
 * rides a wall clock (ADR-021: no time-driven motion behind readable
 * content; the July motion-sickness ruling).
 *
 * Progress `p` runs 0 → 1 from the moment `#turn`'s top reaches the viewport
 * bottom (the last proof card starts to leave) to the end of the runway
 * (the stage has been pinned for `runway` px). Card 4 is an OPAQUE plate over
 * the parked mark until it has scrolled ~0.7vh (its plate spans ~18–98 % of
 * the viewport, the mark 32–77 %), so the particle morph opens at p 0.25 —
 * the first flight has to be visible — and settles by 0.80; the products
 * sweep in over 0.42–0.97, one after another.
 */

export const TURN_MORPH_START = 0.25;
export const TURN_MORPH_END = 0.8;
export const TURN_PRODUCT_START = 0.42;
export const TURN_PRODUCT_STAGGER = 0.07;
export const TURN_PRODUCT_SPAN = 0.34;
/** The arc each product sweeps before settling (radians), alternating sign. */
export const TURN_PRODUCT_SWEEP = Math.PI * 0.28;
/** How far outside its rest radius a product starts, as a fraction of the
 *  stage height. 0.45 sent every start past the stage's top edge, so the
 *  first thing seen of a product was a sliver crossing the frame line; at
 *  0.3 the sweep begins on stage, faded out, and reads as rotating into
 *  place around the mark rather than flying in from above. */
export const TURN_PRODUCT_REACH = 0.3;
/** Settled drift amplitude (px) — scroll-linked, bounded, no clock. */
export const TURN_DRIFT_PX = 6;

/**
 * Where the parked mark's centre sits on the stage, as a fraction of its
 * height: `0.5 + CENTER_Y_OFFSET / (2 · CENTER_DISTANCE · tan(FOV / 2))` with
 * the actor's weld constants (3.2, 0.1) and the corridor's landscape FOV
 * (38°) — 0.5 + 0.1 / 2.2035. The test re-derives it from those sources.
 */
export const TURN_MARK_CENTER_Y = 0.545;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smootherstep = (t: number) => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** The pinned scroll distance: the station less its pin and overlap viewports. */
export function turnRunway(height: number, vh: number): number {
  return Math.max(1, height - 2 * vh);
}

/** 0 when `#turn`'s top is at the viewport bottom, 1 when the runway is spent. */
export function turnProgress(top: number, height: number, vh: number): number {
  return clamp01((vh - top) / (vh + turnRunway(height, vh)));
}

/** The particle morph clock handed to the corridor. */
export function morphOf(p: number): number {
  return smootherstep((p - TURN_MORPH_START) / (TURN_MORPH_END - TURN_MORPH_START));
}

/** Product `k`'s own eased entrance. */
export function productEnter(k: number, p: number): number {
  return smootherstep((p - (TURN_PRODUCT_START + TURN_PRODUCT_STAGGER * k)) / TURN_PRODUCT_SPAN);
}

export interface ProductRest {
  /** Rest centre, px in the stage's own box. */
  cx: number;
  cy: number;
}

export interface ProductPose {
  /** Displacement from rest, px (the CSS `translate`). */
  dx: number;
  dy: number;
  /** Extra rotation, degrees, on top of the authored rest tilt. */
  dr: number;
  scale: number;
  opacity: number;
}

/**
 * Product `k`'s pose at progress `p`: an arc about the mark's centre from a
 * far start (`REACH` further out, `SWEEP` around, alternating direction) into
 * its rest, then a small scroll-linked drift once settled.
 */
export function productPose(
  k: number,
  p: number,
  rest: ProductRest,
  stageW: number,
  stageH: number
): ProductPose {
  const e = productEnter(k, p);
  const mx = stageW / 2;
  const my = stageH * TURN_MARK_CENTER_Y;
  const vx = rest.cx - mx;
  const vy = rest.cy - my;
  const restAngle = Math.atan2(vy, vx);
  const restRadius = Math.hypot(vx, vy);
  const sign = k % 2 === 0 ? 1 : -1;
  const angle = restAngle + (1 - e) * TURN_PRODUCT_SWEEP * sign;
  const radius = restRadius + (1 - e) * TURN_PRODUCT_REACH * stageH;
  const x = mx + radius * Math.cos(angle);
  const y = my + radius * Math.sin(angle);
  const drift = e * Math.sin(p * Math.PI * 3 + k * 1.7) * TURN_DRIFT_PX;
  return {
    dx: x - rest.cx,
    dy: y - rest.cy + drift,
    dr: (1 - e) * 20 * sign,
    scale: 0.7 + 0.3 * e,
    opacity: e,
  };
}
