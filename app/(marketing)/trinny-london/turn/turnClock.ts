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
 *   0.88–1.00  the products sweep back OUT, the way they came
 *   0.90–1.00  the lines decode back OUT
 *
 * …and the stage then hands a bare warmed ground to the proposal, whose own
 * elements power on in place over it (`propInOf`). The ground itself does
 * NOT resolve — it carries into `#proposition` (U4).
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

/**
 * THE PRODUCTS LEAVE (ADR-095 U5, owner 2026-09-10: _"those canisters or
 * these products should move off the screen, and the elements from the next
 * section should just come into view"_).
 *
 * ⚠ UNTIL NOW THEY NEVER LEFT. `productPose` had an entrance and no exit, so
 * the four settled at `--tm-o` 1 and stayed there until the whole station
 * scrolled away under the proposal — which is precisely the "parallax paint
 * flying over it" the owner named. A slab rising over a lit scene is the
 * thing ADR-095 U1 already deleted once; this is the same gesture one station
 * later, and the answer is the same: clear the stage on its OWN clock rather
 * than let the next one cover it.
 *
 * They leave the way they arrived — outward along the arc they swept in on,
 * the stagger reversed so the LAST to land is the FIRST to go — which is the
 * masthead law's shape (it leaves the way it arrived, mirrored). The stage's
 * `overflow: hidden` takes them off screen; the fade is the tail, not the
 * gesture.
 *
 * 0.88 LEADS the line's un-type (`TURN_CTA_OUT` 0.90) by a sliver on purpose:
 * the products go, then the line, and the ground the proposal inherits is
 * bare. Reverse scroll unwinds it exactly — still one pure function of `p`.
 */
export const TURN_PRODUCT_OUT = 0.88;
export const TURN_PRODUCT_GONE = 1;
/** How far past its rest a product travels on the way out, as a fraction of
 *  the stage height. Larger than `REACH`: the entrance had to begin ON stage
 *  to read as a rotation into place, where the exit has to actually clear
 *  the frame. */
export const TURN_PRODUCT_LEAVE = 0.55;

export const TURN_WASH_IN = 0.36;
export const TURN_WASH_PEAK = 0.68;
/**
 * How much of the proposal's own height the ground feathers away over, at its
 * bottom edge.
 *
 * ⚠ THE END OF THE GROUND IS GEOMETRY, NOT A CLOCK. A scroll-driven resolve
 * was built first and measured wrong both ways on a station only 1.29
 * viewports tall: wide enough to keep the record on coral and it left a step
 * against `#contact`; narrow enough to clear that seam and the colour went
 * while the drawing was still on screen. Feathering the field's own bottom
 * puts the end in one place however the reader arrives, and reverses for
 * free. 0.42 begins it just under where the drawing ends.
 */
export const TURN_PROP_FADE = 0.42;

export const TURN_VEIL_IN = 0.56;
export const TURN_VEIL_FULL = 0.72;
/** How far the mark is put away once the copy owns the centre. Not 1: it
 *  stays as a ghost behind the line rather than leaving the page. */
export const TURN_VEIL_MAX = 0.72;
/**
 * …and how far it is put away once the PROPOSAL owns the page (ADR-095 U5,
 * owner: _"to make sure that the brand mark in the back doesn't really
 * dominate too much, we can fade it out a bit as the next section scrolls
 * into view with the elements"_).
 *
 * ⚠ THE SECOND RAMP RIDES `#proposition`'s OWN APPROACH, not more of the
 * turn's runway, because that is what the owner tied it to — the mark fades
 * as the elements arrive, so the two are one gesture. `veilOf` saturates at
 * p 0.72 and holds; `propVeilOf` takes it the rest of the way.
 *
 * ⚠ AND IT IS STILL NEVER 1. `brandmarkMorphRef.veil` puts the mark BACK,
 * not away (the ref's own law). At 0.94 it is a watermark behind the drawing
 * — present, and the reason the proposal reads as the same page rather than a
 * new one. 0.90 was the first cut and it was measurably too present: the
 * ring crossed the layer band and the mark's own glyph read through the
 * plates, which is the "doesn't really dominate too much" the owner asked
 * about. This is the one dial on the effect.
 */
export const TURN_VEIL_PROP_MAX = 0.94;

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

/**
 * The ground's wash: swells to the copy's beat and then STAYS.
 *
 * ⚠ IT NO LONGER RESOLVES (owner, 2026-09-10: "it's important that the
 * gradient doesn't change colour — when you enter the Trinny section, that
 * gradient can stay that shader"). U1 ran it back to parchment over
 * 0.90–1.00 so the proposal met the page's own ground and no edge was drawn;
 * the answer to that edge is now the proposal carrying the SAME field
 * (`propWashOf`), not the field going away before it. The client's colour
 * takes the page from the turn onward, which is the dial ADR-095 left open.
 */
export function washOf(p: number): number {
  return ramp(p, TURN_WASH_IN, TURN_WASH_PEAK);
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

/**
 * Product `k`'s own eased exit, 0 → 1. The stagger runs BACKWARDS — the last
 * product to arrive is the first to leave — so the group empties from the
 * outside in rather than replaying its own entrance order.
 */
export function productExit(k: number, p: number, n = 4): number {
  const rank = n - 1 - k;
  const span = TURN_PRODUCT_GONE - TURN_PRODUCT_OUT;
  const stagger = (span * 0.35) / Math.max(1, n - 1);
  const from = TURN_PRODUCT_OUT + stagger * rank;
  return smootherstep((p - from) / (TURN_PRODUCT_GONE - from));
}

/* ── The proposal's own arrival (ADR-095 U5) ─────────────────────────────
   `#proposition` is a pinned station now, the turn's own shape: `100svh` of
   pin plus a runway, with a sticky stage. Everything the beat does is
   expressed against the PINNED stretch of it — the elements are blank while
   the stage travels and power on once it has stopped, which is the whole
   mechanism (nothing can be seen sliding if nothing is visible while
   anything moves).

   ⚠ THE PIN IS NOT AT THE STATION'S TOP, AND ASSUMING IT WAS SHIPPED THE
   DEFECT IN MINIATURE. `.station` carries its own top padding — 140px at
   1920×1247, measured — so the sticky stage is still 140px short of its pin
   in the frame the station's top reaches the viewport top. A clock written
   against the station's rect alone opened the reveal 45px into a 140px
   travel, i.e. the record lit while it was still moving. And the size of the
   error is viewport-dependent (140 of 748px of runway at 1920, 140 of 432 at
   1280×720), so no single literal could have hidden it either.

   So the clock measures THE STAGE'S OWN TRAVEL: `padTop` is where the stage
   sits inside the station, and the travel is what is left of the station
   after the stage's own box. Both come off the layout in `measure()`. */

/**
 * How far into the stage's PINNED stretch the reader is, 0 → 1.
 *
 * `top` is the station's viewport-relative top, `padTop` the stage's offset
 * inside it, `stageH` the stage's height. Exactly 0 for the whole approach,
 * which is what keeps the turn's own beat byte-identical.
 */
export function propPinnedProgress(
  top: number,
  height: number,
  padTop: number,
  stageH: number
): number {
  const travel = Math.max(1, height - padTop - stageH);
  return clamp01((-top - padTop) / travel);
}

/** The elements' power-on window, in pinned-stretch units. It opens just
 *  after the pin (not ON it — a reveal that starts in the same frame the
 *  stage stops moving reads as the motion continuing) and settles well
 *  before the release. */
export const TURN_PROP_IN = 0.06;
export const TURN_PROP_LIT = 0.46;

export function propInOf(q: number): number {
  return ramp(q, TURN_PROP_IN, TURN_PROP_LIT);
}

/** The mark's extra fade, over the same arrival. */
export const TURN_PROP_VEIL_IN = 0;
export const TURN_PROP_VEIL_FULL = 0.5;

export function propVeilRamp(q: number): number {
  return ramp(q, TURN_PROP_VEIL_IN, TURN_PROP_VEIL_FULL);
}

/**
 * The mark's veil, from both stations at once — the turn's own put-away plus
 * the proposal's arrival taking it the rest of the way.
 *
 * ⚠ ADDITIVE, NOT A `max()`, and `q` is what makes that safe: it is exactly
 * 0 until `#proposition`'s stage has pinned, so during the whole turn this
 * IS `veilOf(p)` to the last bit. A `max()` of two ramps that both start at 0
 * would have been the same value and a worse contract — it would not say
 * that the second one only ever ADDS.
 */
export function markVeil(pTurn: number, q: number): number {
  return clamp01(veilOf(pTurn) + (TURN_VEIL_PROP_MAX - TURN_VEIL_MAX) * propVeilRamp(q));
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
 * its rest, a small scroll-linked drift once settled, and then the same arc
 * run OUTWARD again as the beat ends (ADR-095 U5).
 *
 * ⚠ ONE ANGLE AND ONE RADIUS CARRY BOTH DIRECTIONS. The entrance offsets and
 * the exit offsets are summed into the same two terms rather than branched
 * on, so there is no seam where one hands over to the other and no state to
 * get wrong scrolling back up — `e` and `x` are both pure in `p`, and their
 * windows do not overlap.
 */
export function productPose(
  k: number,
  p: number,
  rest: ProductRest,
  stageW: number,
  stageH: number,
  n = 4
): ProductPose {
  const e = productEnter(k, p);
  const x0 = productExit(k, p, n);
  const mx = stageW / 2;
  const my = stageH * TURN_MARK_CENTER_Y;
  const vx = rest.cx - mx;
  const vy = rest.cy - my;
  const restAngle = Math.atan2(vy, vx);
  const restRadius = Math.hypot(vx, vy);
  const sign = k % 2 === 0 ? 1 : -1;
  /* Out the way it came: the sweep continues in the SAME rotational sense,
     so a product that turned clockwise into place keeps turning clockwise
     out of frame rather than reversing over its own path. */
  const angle = restAngle + (1 - e + x0) * TURN_PRODUCT_SWEEP * sign;
  const radius =
    restRadius + (1 - e) * TURN_PRODUCT_REACH * stageH + x0 * TURN_PRODUCT_LEAVE * stageH;
  const px = mx + radius * Math.cos(angle);
  const py = my + radius * Math.sin(angle);
  const drift = e * (1 - x0) * Math.sin(p * Math.PI * 3 + k * 1.7) * TURN_DRIFT_PX;
  return {
    dx: px - rest.cx,
    dy: py - rest.cy + drift,
    dr: (1 - e + x0) * 20 * sign,
    /* The exit keeps growing past 1 — a body leaving toward the reader,
       which is what stops it reading as a shrink into the distance. */
    scale: 0.7 + 0.3 * e + 0.22 * x0,
    /* ⚠ THE FADE IS THE TAIL, NOT THE GESTURE. It only bites over the last
       third of the exit, so the product is genuinely off the frame edge by
       the time it stops being drawn — the stage's `overflow: hidden` does
       the work and the opacity just stops a sliver flickering at the clip. */
    opacity: e * clamp01((1 - x0) * 3),
  };
}
