/**
 * turnClock — the turn's arithmetic (ADR-095), pure and unit-tested.
 *
 * `#turn` is a station of `100svh (pin) + runway` with a sticky
 * full-viewport stage, and EVERYTHING in the beat is a pure function of its
 * rect: the particle morph in the corridor canvas, the products' arcs, the
 * ground's wash, the mark's veil and the headline's decode. Scrolling back
 * unwinds all five exactly, and nothing rides a wall clock — continuous
 * motion behind readable content is banned on this surface (ADR-021's
 * addendum, the motion-sickness ruling).
 *
 * Progress `p` runs 0 → 1 from the moment `#turn`'s top reaches the viewport
 * bottom (the last proof card starts to leave) to the end of the runway,
 * where the stage releases. The beat inside it:
 *
 *   0.00–0.20  the last card is still an opaque plate over the mark
 *   0.20–0.56  the particles re-form: our mark becomes theirs
 *   0.30–0.69  the four products sweep in, one after another
 *   0.36–0.68  the ground warms to their coral, from the frame inward
 *   0.56–0.72  the mark is veiled back — the beat has moved on from it
 *   0.62–0.78  the lines decode IN, in place, at the centre
 *   0.78–0.90  they hold, lit
 *   0.90–1.00  they decode back OUT and the ground resolves to parchment,
 *              so the proposal below starts clean and no edge ever shows
 */

export const TURN_MORPH_START = 0.2;
export const TURN_MORPH_END = 0.56;

export const TURN_PRODUCT_START = 0.3;
export const TURN_PRODUCT_STAGGER = 0.05;
export const TURN_PRODUCT_SPAN = 0.24;
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

export const TURN_WASH_IN = 0.36;
export const TURN_WASH_PEAK = 0.68;
export const TURN_WASH_OUT = 0.9;
export const TURN_WASH_END = 1;

export const TURN_VEIL_IN = 0.56;
export const TURN_VEIL_FULL = 0.72;
/** How far the mark is put away once the copy owns the centre. Not 1: it
 *  stays as a ghost behind the line rather than leaving the page. */
export const TURN_VEIL_MAX = 0.72;

export const TURN_CTA_IN = 0.62;
export const TURN_CTA_LIT = 0.78;
export const TURN_CTA_OUT = 0.9;
export const TURN_CTA_GONE = 1;

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

/** A smootherstep ramp between two progress marks. */
const ramp = (p: number, from: number, to: number) => smootherstep((p - from) / (to - from));

/** The pinned scroll distance: the station less the viewport it pins for. */
export function turnRunway(height: number, vh: number): number {
  return Math.max(1, height - vh);
}

/** 0 when `#turn`'s top is at the viewport bottom, 1 when the runway is spent. */
export function turnProgress(top: number, height: number, vh: number): number {
  return clamp01((vh - top) / (vh + turnRunway(height, vh)));
}

/** The particle morph clock handed to the corridor. */
export function morphOf(p: number): number {
  return ramp(p, TURN_MORPH_START, TURN_MORPH_END);
}

/** The ground's wash: swells to the copy's beat, resolves as it leaves. */
export function washOf(p: number): number {
  return ramp(p, TURN_WASH_IN, TURN_WASH_PEAK) * (1 - ramp(p, TURN_WASH_OUT, TURN_WASH_END));
}

/** How far the mark is put away, so the line can hold the centre. */
export function veilOf(p: number): number {
  return ramp(p, TURN_VEIL_IN, TURN_VEIL_FULL) * TURN_VEIL_MAX;
}

/** The copy's TYPE-IN clock: 0 → 1 across its own window. */
export function ctaInOf(p: number): number {
  return ramp(p, TURN_CTA_IN, TURN_CTA_LIT);
}

/** The copy's UN-TYPE clock: 0 until the line has held, then 0 → 1. Two
 *  clocks rather than one signed value, because the decode reads them as
 *  separate DIRECTIONS — in from blank, out to blank (the masthead law: it
 *  leaves the way it arrived, mirrored). */
export function ctaOutOf(p: number): number {
  return ramp(p, TURN_CTA_OUT, TURN_CTA_GONE);
}

/** The block's own ink. Up fast, so the scramble is SEEN resolving rather
 *  than fading in as a whole; out with the dissolve, so the link's outline
 *  never sits on the page around an empty string. */
export function ctaInkOf(p: number): number {
  return clamp01(ctaInOf(p) * 6) * (1 - ctaOutOf(p));
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
