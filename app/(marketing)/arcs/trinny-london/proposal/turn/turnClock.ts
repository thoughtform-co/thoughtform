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
 * How far above the proposal's ground's BOTTOM edge its feather begins, in
 * viewports.
 *
 * ⚠ THE END OF THE GROUND IS GEOMETRY, NOT A CLOCK. A scroll-driven resolve
 * was built first and measured wrong both ways on a station only 1.29
 * viewports tall: wide enough to keep the record on coral and it left a step
 * against `#contact`; narrow enough to clear that seam and the colour went
 * while the drawing was still on screen. Feathering the field's own bottom
 * puts the end in one place however the reader arrives, and reverses for
 * free.
 *
 * ⚠ IN VIEWPORTS SINCE ADR-102, NOT AS A FRACTION OF THE CANVAS. The canvas
 * is viewport-sized and STICKY now (the station is a four-viewport scene, and
 * a canvas spanning it would be a 24-megapixel shader pass per scroll frame),
 * so a fraction of its own height would feather the bottom of EVERY frame.
 * `feather()` converts this back into the canvas's own fractions each frame
 * from where the ground's bottom actually is. 0.84 is the 0.42 of the
 * two-viewport canvas it replaces: the same document-space ramp.
 */
export const TURN_PROP_FEATHER_VH = 0.84;

/**
 * The feather, in the canvas's OWN fractions from its bottom (y-up, as the
 * shader reads `gl_FragCoord`): `lo` is where the ground's bottom edge sits,
 * `hi` is `TURN_PROP_FEATHER_VH` viewports above it. Everything above `hi`
 * paints in full; `hi ≤ 0` means the ground's end is still more than a
 * feather's length below the frame and nothing is touched.
 *
 * ⚠ AGAINST THE CANVAS'S RECT, NEVER THE VIEWPORT'S. While the canvas is
 * stuck its bottom IS the frame's bottom; once the ground's box leaves the
 * frame the canvas unsticks and scrolls with it, and its bottom becomes the
 * ground's own. Solving in the canvas's fractions is what makes the ramp
 * continuous across that moment.
 */
export function feather(
  groundBottom: number,
  canvasBottom: number,
  canvasH: number,
  vh: number
): { lo: number; hi: number } {
  const h = Math.max(1, canvasH);
  const lo = (canvasBottom - groundBottom) / h;
  return { lo, hi: lo + (TURN_PROP_FEATHER_VH * Math.max(1, vh)) / h };
}

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

/* ── The strike-in (ADR-101 §A) ───────────────────────────────────────────────
   Owner, 2026-09-14: _"the elements of the next section, where the studio
   stands, don't have to fly in … they need to have a glitch effect like we
   have on our homepage"_. (The phases had the same burst until ADR-102 took
   them into the scene, where they unroll out of their own head bands on the
   scene's clock instead.)

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

/* ── The scene (ADR-102) ──────────────────────────────────────────────
   Owner, 2026-09-14, on ADR-101's flight: it "jitters and lags"; it begins
   the moment the studio is entered; before anything moves on, the four nodes
   around the chip must COLLAPSE INWARDS "so it feels like one configuration";
   the chip then goes to the FAR LEFT and the plates open to the RIGHT of it,
   each unrolling out of its own head band; the title reveals with the first
   plate, the paragraph only after the third.

   `#proposition` is a sticky SCENE now: its stage pins on the same frame the
   record is struck in (q = 1 IS the station's top at the frame's top, so a
   pin cannot begin before the record has arrived — ADR-099's blank frame was
   a pin that did) and holds for `--tl-scene-runway`, with the phases beat
   seated absolutely over the board inside it. Every object the choreography
   touches is therefore viewport-STATIONARY while this clock runs, which is
   the whole cure for the jitter: a main-thread writer positioning a carrier
   against a page the COMPOSITOR is scrolling lands one frame behind it —
   "a displacement of exactly one wheel step, every step", the hero curtain's
   own measurement on this route — and a carrier moving between two boxes
   that do not move has nothing to be behind.

   ⚠ THE CLOCK IS IN VIEWPORT UNITS, NOT NORMALISED. `sv` is how many
   viewports the station's top has passed the frame's top, and every window
   below is authored in the same unit, so an edit to the runway can only
   TRUNCATE the scene — it cannot rescale every window with nothing failing,
   which a 0 → 1 clock would. `trinny-seam` reads the runway out of the sheet
   and pins `SCENE_END` under it.

   ⚠ EVERY WINDOW IS A PURE FUNCTION OF `sv` AND EVERY HAND-OVER TARGETS A
   BOX THAT IS NOT MOVING. Scrolling back plays the same frames in reverse;
   the one burst on the station (the arrival strike, on `q`) leaves at
   q ≤ 0.96, which is above the pin where `sv` is 0, so the two never meet. */

/** Nothing moves: the owner's delay, and the room the arrival's 1.6 s ladder
 *  needs before the board is asked to come apart. */
export const SCENE_DWELL_END = 0.4;
/** The board's head, its dek and the ledger CLOSE on the scrubbed aperture. */
export const SCENE_WITHDRAW = [0.4, 0.7] as const;
/** The nodes fold into the chip in the reverse of the assembly's order — the
 *  last to arrive is the first to go home. */
export const SCENE_FOLD_ORDER = ["reach", "tools", "layer", "seat"] as const;
export const SCENE_FOLD_START = 0.58;
export const SCENE_FOLD_SPAN = 0.3;
export const SCENE_FOLD_STAGGER = 0.07;
/**
 * Inside a node's own fold window it SHRINKS first and TRAVELS second.
 *
 * ⚠ NOT A TASTE CHOICE. The roles paint seat · layer · card · tools · reach,
 * so the tools and the reach paint OVER the chip: a full-size node sliding to
 * the chip's centre crosses its edge on top of it, which reads as going over
 * the chip rather than into it. Shrunk to ~1/7 before its travel starts, a
 * node is a mark riding its own ribbon home by the time it reaches that edge,
 * and the last of it goes as it enters.
 */
export const SCENE_FOLD_SHRINK_END = 0.7;
export const SCENE_FOLD_TRAVEL_START = 0.3;
export const SCENE_FOLD_FADE_START = 0.8;
export const SCENE_FOLD_MIN_SCALE = 0.02;
/** The chip's group is hidden and carrier 0 is shown on its box, welded. */
export const SCENE_HANDOVER = 1.12;
/**
 * Carrier `i`'s travel: 0 is the chip to plate 1's head band (the slide to
 * the far left), 1 is plate 1's band to plate 2's, 2 is plate 2's to plate
 * 3's. A copy starts pixel-identical ON the band it peels off, so nothing is
 * hidden at its start; at its end the real band takes over and the plate
 * unrolls out of it.
 */
export const SCENE_CARRY: readonly (readonly [number, number])[] = [
  [1.14, 1.5],
  [1.65, 1.98],
  [2.14, 2.46],
];
/** Plate `i`'s body unrolls out of its band: the clip's bottom edge runs
 *  from the head's own height to the plate's. */
export const SCENE_UNROLL: readonly (readonly [number, number])[] = [
  [1.52, 1.78],
  [2.0, 2.26],
  [2.48, 2.74],
];
/** The section's title opens as the first band lands … */
export const SCENE_TITLE = [1.34, 1.64] as const;
/** … and its paragraph only once the third plate is whole (owner). */
export const SCENE_INTRO = [2.78, 3.02] as const;
/** Everything real and stationary from here; the runway must reach it. */
export const SCENE_END = 3.18;
/**
 * The words decode over the MIDDLE of a carrier's travel.
 *
 * ⚠ THEY START LATE. A copy is born pixel-identical ON the band it peels off,
 * and a decode that began at 0 shuffled the band's own words under the reader
 * while nothing had yet moved — measured on the still, the real band reading
 * "3G O BBOUT THREE WEEKS". The carrier holds its source's words until it has
 * visibly separated, then transforms in flight.
 * ⚠ AND THEY LAND EARLY: `seamDecodeFrame` is exact at its ends, so at `u`
 * 0.999 it is still shuffling a glyph, and the frame that hands over to the
 * real band would carry one wrong letter. The last stretch is a pure geometry
 * move, which is also the easier thing to read.
 */
export const SCENE_DECODE_START = 0.2;
export const SCENE_DECODE_END = 0.9;

/** A carrier's decode clock from its travel progress: 0 until it has
 *  separated, 1 before it lands. */
export function decodeClock(e: number): number {
  return clamp01((e - SCENE_DECODE_START) / (SCENE_DECODE_END - SCENE_DECODE_START));
}

/** How many viewports the station's top has passed the frame's top, clamped
 *  to the runway. 0 is the pin; `runwayVh` is the release. */
export function sceneProgress(top: number, vh: number, runwayVh: number): number {
  const sv = -top / Math.max(1, vh);
  // `<= 0`, so a top of exactly 0 is +0 and not −0 (which prints as "-0.00").
  return sv <= 0 ? 0 : sv > runwayVh ? runwayVh : sv;
}

/** A smootherstep ramp across one of the windows above. */
export function sceneWindow(sv: number, from: number, to: number): number {
  return ramp(sv, from, to);
}

/** Once the withdraw has opened the arrival strike may never replay over the
 *  folded board (a deep reload seeds `in`); the writer stamps this and the
 *  strike's rules are scoped away from it. */
export function scenePast(sv: number): boolean {
  return sv >= SCENE_WITHDRAW[0];
}

/** The board's own head and the ledger: 1 open, 0 closed to the centre slit. */
export function propClose(sv: number): number {
  return 1 - ramp(sv, SCENE_WITHDRAW[0], SCENE_WITHDRAW[1]);
}
export function titleOpen(sv: number): number {
  return ramp(sv, SCENE_TITLE[0], SCENE_TITLE[1]);
}
export function introOpen(sv: number): number {
  return ramp(sv, SCENE_INTRO[0], SCENE_INTRO[1]);
}

export function foldWindow(k: number): readonly [number, number] {
  const from = SCENE_FOLD_START + SCENE_FOLD_STAGGER * k;
  return [from, from + SCENE_FOLD_SPAN];
}

export interface FoldPose {
  /** The group's centre displacement, in the board's own user units. */
  fx: number;
  fy: number;
  scale: number;
  opacity: number;
}

export interface Centre {
  cx: number;
  cy: number;
}

/** Node `k`'s (in `SCENE_FOLD_ORDER`) pose: identity before its window, a
 *  vanished mark on the chip's centre after it. */
export function foldPose(k: number, sv: number, node: Centre, chip: Centre): FoldPose {
  const [from, to] = foldWindow(k);
  const e = ramp(sv, from, to);
  if (e <= 0) return { fx: 0, fy: 0, scale: 1, opacity: 1 };
  const shrink = smootherstep(e / SCENE_FOLD_SHRINK_END);
  const travel = smootherstep((e - SCENE_FOLD_TRAVEL_START) / (1 - SCENE_FOLD_TRAVEL_START));
  const fade = clamp01((e - SCENE_FOLD_FADE_START) / (1 - SCENE_FOLD_FADE_START));
  return {
    fx: travel * (chip.cx - node.cx),
    fy: travel * (chip.cy - node.cy),
    scale: 1 - (1 - SCENE_FOLD_MIN_SCALE) * shrink,
    opacity: 1 - fade,
  };
}

/** Lane `k`'s retract, 0 → 1, in step with its node's travel: the wire's far
 *  end follows the mark home. */
export function wireRetract(k: number, sv: number): number {
  const [from, to] = foldWindow(k);
  const e = ramp(sv, from, to);
  return smootherstep((e - SCENE_FOLD_TRAVEL_START) / (1 - SCENE_FOLD_TRAVEL_START));
}

/** The chip's group is put away from the hand-over on: the carrier is the
 *  chip from that frame, and it becomes the plates. */
export function chipAway(sv: number): boolean {
  return sv >= SCENE_HANDOVER;
}

/**
 * Carrier `i`'s travel progress and whether it is on stage. Carrier 0 is born
 * at the hand-over and waits on the chip's box until its slide opens; the two
 * copies exist only for their own travel.
 */
export function carrierWindow(i: number, sv: number): { e: number; live: boolean } {
  const [from, to] = SCENE_CARRY[i];
  const start = i === 0 ? SCENE_HANDOVER : from;
  return { e: ramp(sv, from, to), live: sv >= start && sv < to };
}

export type PlateState = "held" | "unroll" | null;

/** Plate `i` is HELD (nothing of it paints) until its band has landed, UNROLLS
 *  out of that band, and is then its own resting self. */
export function plateState(i: number, sv: number): PlateState {
  if (sv < SCENE_CARRY[i][1]) return "held";
  if (sv < SCENE_UNROLL[i][1]) return "unroll";
  return null;
}

/** Where plate `i`'s clip bottom sits, px from its own top: its head's height
 *  until the unroll opens, its full height once it has. */
export function unrollY(i: number, sv: number, headH: number, plateH: number): number {
  const [from, to] = SCENE_UNROLL[i];
  return headH + (plateH - headH) * ramp(sv, from, to);
}

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

/** One box between two, at `e`. At 0 it IS `a` and at 1 it IS `b` — those
 *  two frames are the welds, so they are exact rather than nearly. */
export function lerpRect(a: SeamRect, b: SeamRect, e: number): SeamRect {
  return {
    x: a.x + (b.x - a.x) * e,
    y: a.y + (b.y - a.y) * e,
    w: a.w + (b.w - a.w) * e,
    h: a.h + (b.h - a.h) * e,
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
