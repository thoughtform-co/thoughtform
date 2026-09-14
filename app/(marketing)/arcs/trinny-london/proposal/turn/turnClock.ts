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

/* ── The proposal's own arrival (ADR-095 U5, re-cut by ADR-099) ───────
   `#proposition` was a PINNED station whose record powered on once its stage
   parked. That is retired: the record is an arc beat that scrolls in, so `q`
   is the station's ARRIVAL — 0 when its top is at the viewport's bottom edge,
   1 when it reaches the top.

   ⚠ IT IS THE SAME SHAPE AS THE TURN'S OWN CLOCK, ONE VIEWPORT WIDE, and
   that is what makes the two beats overlap on purpose. ADR-099 set
   `--tl-prop-lead: 50svh`, which opened `q` at the turn's `p ≈ 0.77` and had
   the record half-arrived at `p = 1` — it RISES while the products are still
   leaving (they go 0.88 → 1.0), which was the answer to the defect a pin
   could not avoid: a pin cannot start until the thing above it has finished,
   so it could only ever follow the emptied stage with a bare frame in between.

   ⚠ AND THE LEAD IS 100svh SINCE ADR-101 §A, WHICH MOVES THE OVERLAP FROM
   HALF TO WHOLE. The record does not rise at all any more — it is STRUCK in,
   in place, seated, once the turn is spent (`arriveNext` below) — and a
   strike has to fire on a frame where the thing struck is already composed.
   At a full lead `q` reaches 1 on the SAME scroll position as `p`, so the
   products are gone (`TURN_PRODUCT_GONE` 1), the line is un-typed
   (`TURN_CTA_GONE` 1) and the head is on its datum, all at once. The named
   cost is the stretch from p 0.98 to 1.0 — about 55px at 1247h — where the
   frame is the coral ground and the mark's ghost and nothing else. That is
   the owner's own ordering: _"let's make sure it only happens when all the
   elements from the 'And now we bring this to Trinny London' section have
   faded out"_.

   ⚠ NO STAGE TERM, AND THAT DELETES A TRAP. The pinned clock had to measure
   the stage's own box (`padTop`, `stageH`) because `.station` padding put the
   pin 140px below the station's top — and its failure mode was silent: with
   the stage gone but the section kept, `q` pinned at 0 and the reveal channel
   latched the record invisible forever. An arrival reads one rect and has no
   such state. */

/**
 * How far the proposal has arrived, 0 → 1, off its own rect.
 *
 * `top` is the station's viewport-relative top. Unlike the pinned clock it
 * replaces, this is NON-ZERO during the turn's last quarter — deliberately:
 * `markVeil` adds on it, so the mark keeps going away as the record comes in
 * rather than waiting for a pin that no longer happens.
 */
export function propArrival(top: number, vh: number): number {
  return clamp01((vh - top) / Math.max(1, vh));
}

/**
 * The mark's extra fade, over the same arrival.
 *
 * ⚠ BOTH VALUES ARE DERIVED FROM THE LEAD, AND BOTH MOVED WITH IT
 * (ADR-101 §A). `--tl-prop-lead` went 50svh → 100svh so that the turn's
 * `p` and the proposal's `q` SATURATE TOGETHER, and the two ends of this
 * ramp are the two facts that keeps true:
 *
 *   q(p) = (p × 220 — 220 + lead) / 100, from `#turn`'s 100svh pin plus its
 *   120svh runway against a one-viewport arrival.
 *
 *   — `_IN` is the q at which `veilOf` saturates (p = `TURN_VEIL_FULL` 0.72):
 *     (0.72 × 220 — 120) / 100 = **0.384**. The second ramp opens exactly
 *     where the first ends, so the additive form still never races itself.
 *   — `_FULL` is the q at which the record lands, which under this lead IS
 *     q = 1 — the same scroll position as p = 1.
 *
 * ⚠ AT 50svh THESE WERE 0 AND 0.5 AND BOTH WERE RIGHT THEN. `_IN` 0 was safe
 * only because `q` opened at p 0.7727, past the first ramp's end; at this lead
 * it opens at p 0.5455, in the middle of it, and a 0 start would have the turn
 * and the arrival both moving the one channel that has exactly one owner.
 */
export const TURN_PROP_VEIL_IN = 0.384;
export const TURN_PROP_VEIL_FULL = 1;

export function propVeilRamp(q: number): number {
  return ramp(q, TURN_PROP_VEIL_IN, TURN_PROP_VEIL_FULL);
}

/**
 * The mark's veil, from both stations at once — the turn's own put-away plus
 * the proposal's arrival taking it the rest of the way.
 *
 * ⚠ ADDITIVE, NOT A `max()`, AND SINCE ADR-099 THE OVERLAP IS THE POINT.
 * Under the pinned clock `q` was 0 for the whole turn and the additive form
 * was merely safe; now `q` opens at `p ≈ 0.77` — but `veilOf` has already
 * saturated at `p = 0.72`, so the two never race: the turn takes the mark to
 * 0.72 and the arrival carries it to 0.94, continuously, landing exactly as
 * the record does (`TURN_PROP_VEIL_FULL` 0.5 of arrival IS `p = 1`). A
 * `max()` would read the same and say the wrong thing — that either could
 * win, when the contract is that the second only ever ADDS.
 */
export function markVeil(pTurn: number, q: number): number {
  return clamp01(veilOf(pTurn) + (TURN_VEIL_PROP_MAX - TURN_VEIL_MAX) * propVeilRamp(q));
}

/* ── The two strike-ins (ADR-101 §A) ──────────────────────────────────────────
   Owner, 2026-09-14: _"the elements of the next section, where the studio
   stands, don't have to fly in … they need to have a glitch effect like we
   have on our homepage"_, and the same for the beat after it.

   A strike is a BURST, not a scrub, so it cannot be a pure function of
   scroll the way everything else on this route is — it is ADR-021's one
   sanctioned exception: a bounded burst on a HYSTERESIS trigger, which is
   the proof card's own mechanism (ADR-097 U11). This is that trigger, pure:
   a three-state machine over one progress value, with the two thresholds
   apart so a reader resting on the edge cannot make it flicker.

   ⚠ `await` AND `out` PAINT THE SAME AND ARE NOT THE SAME STATE. Both hide
   the beat; `out` plays the 260ms reverse first, `await` has never been
   seen. Collapsing them would strike the record out on the way IN. */

export type Arrive = "await" | "in" | "out";

/**
 * The configuration strikes when the proposal has all but landed, which
 * under a 100svh lead is the frame the turn's own clock spends.
 *
 * ⚠ 0.98, NOT 1, AND THE DIFFERENCE IS MEASURED RATHER THAN CAUTIOUS.
 * `propArrival` is a `clamp01`, so `q === 1` is reachable only where the
 * station's top is at or above zero EXACTLY — and a converging roller (the
 * capture's, the smoke's) lands at top 0.22px, i.e. q 0.99983, with the
 * record still hidden and every stamp correct. A threshold no measurement
 * can rest on is a threshold that fires by luck.
 *
 * ⚠ AND 0.98 STILL SATISFIES THE OWNER'S ORDERING, which is about what is
 * ON SCREEN rather than about a number: q 0.99 is the turn's p 0.9955, where
 * `ctaInkOf` is **0.0009** and the loudest product's opacity is **0.0054**
 * (measured across all four; the LAST to leave is k = 0, not k = 3 - the
 * exit stagger runs backwards). The frame the record strikes into is empty
 * to three significant figures; what
 * is left of the arrival is 13px of scroll at 1269h.
 */
export const PROP_ARRIVE_IN = 0.99;
export const PROP_ARRIVE_OUT = 0.96;

/** The phases strike well before the seam lands, so a reader who stops
 *  mid-gesture is looking at three whole plates rather than at a beat still
 *  assembling (ADR-101 §B seats the head bands at t = 1). */
export const PHASES_ARRIVE_IN = 0.8;
export const PHASES_ARRIVE_OUT = 0.7;

/**
 * The next arrival state, given the last one and a progress value.
 *
 * ⚠ NaN LEAVES THE STATE ALONE. A rect read during a relayout can hand this
 * a non-finite value, and the one thing a burst must never do is fire because
 * a measurement was briefly unavailable.
 *
 * ⚠ AND A DEEP RELOAD SEEDS `in`, NOT `await`. Landing mid-page with `prev`
 * null and the value already past the threshold plays the strike once and ends
 * on the cascade's own identity — which is what the reader would have seen had
 * they scrolled to it. Seeding `await` there would leave the beat hidden until
 * they scrolled BACK and forward again.
 */
export function arriveNext(prev: Arrive | null, v: number, inAt: number, outAt: number): Arrive {
  const at = prev ?? "await";
  if (!Number.isFinite(v)) return at;
  if (v >= inAt) return "in";
  if (v <= outAt) return at === "in" ? "out" : at;
  return at;
}

/* ── The seam (ADR-101 §B) ────────────────────────────────────────────────
   `#offer`'s own clock, and the one the phases' strike is hung on. `t` runs
   0 → 1 from the frame `#phases`' top reaches the viewport's bottom — which
   IS the configuration seated, because `#proposition` is exactly one viewport
   — to the frame its plates row is fully in view. */

/**
 * Where `#phases`' top has to be for its plates row to be whole in the frame,
 * as a viewport-relative y.
 *
 * ⚠ FLOORED AT 0, AND THE FLOOR BINDS. At 1280×720 the row overflows its own
 * beat by 23px (pre-existing), so the honest landing is above the viewport's
 * top — and a negative target would run `t` past 1 and invert the ramp.
 * Floored, the seam simply lands with the row's foot a little low.
 */
export function seamLanding(vh: number, rowBottom: number): number {
  return Math.max(0, vh - rowBottom);
}

/** 0 when `#phases`' top is at the viewport's bottom, 1 at `s1`. */
export function seamProgress(phasesTop: number, vh: number, s1: number): number {
  return clamp01((vh - phasesTop) / Math.max(1, vh - s1));
}

/* — The carrier (ADR-101 §B) —
   Owner, 2026-09-14: _"The AI capability card at the center moves into the
   center of the screen, and then it copies itself left and right. That
   becomes the cards from the 'We propose a modular approach' section … I don't
   want fucking cross-dissolves. This really needs to be an elegant
   transformation of the element."_

   Three windows on one clock: DETACH (the chip lifts off the board and
   glides to the frame's centre), SPLIT (two copies un-hide on the frame all
   three coincide, then peel to the plates' columns), SEAT (all three travel
   to their head rects, changing box, cut and edge as they go). */

export const SEAM_DETACH_END = 0.25;
export const SEAM_SPLIT_END = 0.55;
/** The chip's corner cut, in the board's own units. ⚠ Pinned equal to
 *  `CUT.card` by `trinny-seam.test.ts` — the writer may not import
 *  `boardLayout` (a client module reaching into the arcs' server geometry),
 *  so the one number they share is asserted rather than shared. */
export const SEAM_CHIP_CUT = 20;

export interface SeamRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function seamDetach(t: number): number {
  return smootherstep(t / SEAM_DETACH_END);
}
export function seamSplit(t: number): number {
  return ramp(t, SEAM_DETACH_END, SEAM_SPLIT_END);
}
export function seamSeat(t: number): number {
  return ramp(t, SEAM_SPLIT_END, 1);
}

/**
 * One carrier's box at `t`.
 *
 * ⚠ ONE SUMMED EXPRESSION, NEVER A BRANCH — `productPose`'s own law, one
 * station up. The three legs are added into the same four terms rather than
 * switched between, so there is no seam where one window hands over to the
 * next, no state to get wrong scrolling back, and the continuity at 0.25 and
 * 0.55 is arithmetic rather than a tolerance (the test pins it at 1e-9).
 *
 * ⚠ AND `chip` AND `head` ARE LIVE, READ THIS FRAME. Both boxes move under
 * the scroll — the board is leaving the frame while the plates are entering
 * it — so a pose solved against a remembered rect lands wherever that rect
 * used to be. The two WELDS are what this buys: at t = 0 the carrier is
 * pixel-identical to the chip it covers, and at t = 1 to the head it becomes.
 */
export function seamCarrierRect(
  t: number,
  chip: SeamRect,
  centre: SeamRect,
  park: SeamRect,
  head: SeamRect
): SeamRect {
  const e1 = seamDetach(t);
  const e2 = seamSplit(t);
  const e3 = seamSeat(t);
  const f = (c: number, ce: number, pk: number, h: number) =>
    c + e1 * (ce - c) + e2 * (pk - ce) + e3 * (h - pk);
  return {
    x: f(chip.x, centre.x, park.x, head.x),
    y: f(chip.y, centre.y, park.y, head.y),
    w: f(chip.w, centre.w, park.w, head.w),
    h: f(chip.h, centre.h, park.h, head.h),
  };
}

/**
 * An svg's `xMidYMid meet` mapping: the scale, and the offset of the crop's
 * origin inside the element's own box.
 *
 * ⚠ `xMidYMid`, NOT `xMidYMin`. `pdaFlight.fitCrop` is the same arithmetic
 * with `oy` hardcoded to 0, because the map's svg anchors its crop to the TOP
 * (ADR-070 U3 — and that pairing is load-bearing there). The board anchors
 * MID, so borrowing that helper would land every carrier half a letterbox
 * high on a console taller than its crop.
 */
export function fitCropMid(
  box: { w: number; h: number },
  vb: { w: number; h: number }
): { k: number; ox: number; oy: number } {
  const k = Math.min(box.w / Math.max(1, vb.w), box.h / Math.max(1, vb.h));
  return { k, ox: (box.w - vb.w * k) / 2, oy: (box.h - vb.h * k) / 2 };
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
