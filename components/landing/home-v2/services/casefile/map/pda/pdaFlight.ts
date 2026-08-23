/**
 * THE FLIGHT — where an object drawn in one reading's crop lands in another's.
 *
 * PURE. No react, no DOM, no clock. The caller reads ONE rect (the svg's own
 * box) and this decides the transform; `tests/lib/pda-flight.test.ts` checks
 * the arithmetic. A gesture reducer written inline is a gesture reducer nobody
 * can check, and the same is true of a projection — see `pdaWheel.ts`.
 *
 * ── Why a transform and not a viewBox tween ──────────────────────────────
 * The three readings are TERMINAL DISPLAY-SWITCHING, not zoom (owner): the
 * field never scales, the display changes what it shows. So the crop swaps as
 * a plain attribute — `viewBox` is not CSS-transitionable anyway — and the
 * ONE object that exists in both readings travels between its two homes. The
 * selected work is that object: reading 01 draws it as a cartridge in the
 * grid, reading 02 draws it as the core, and the core IS that cartridge at
 * `CORE_K`. Nothing else moves.
 *
 * ── The mapping ──────────────────────────────────────────────────────────
 * `xMidYMid meet` scales a crop by the MINIMUM of the two box ratios and
 * letterboxes the remainder, so a point's screen position is
 * `offset + (unit − crop origin) × meet`. Going from one crop to another is
 * that forward for the source and inverted for the destination.
 *
 * Two properties make this robust against everything the casefile does to
 * this subtree while it arrives:
 *
 *   · the box's own x/y NEVER ENTER the arithmetic, so the proof ladder's
 *     translate is invisible to it;
 *   · a uniform ancestor scale multiplies both meets equally, so it cancels
 *     out of the deltas AND out of `dk`.
 *
 * The two rects also happen to be near-similar — 250/193 against 176/136 is
 * a 0.09 % difference — so one uniform scale carries the whole morph without
 * the object visibly changing proportion on the way.
 */

/** Only the box's SIZE matters — see the note above on why. */
export interface FlightBox {
  width: number;
  height: number;
}

export interface FlightRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The start pose, in the DESTINATION's user units, for `flPdaDock`. */
export interface FlightVars {
  dx: number;
  dy: number;
  dk: number;
  /**
   * The starting rotation in degrees, relative to the destination's base
   * orientation (ADR-071). Optional so the work-card flight (1↔2) stays
   * byte-identical — no `dr` var, CSS falls back to `0deg`. The skill chip's
   * flight (2↔3) passes a non-zero value so the chip visibly rotates during
   * the transition, ending unrotated when it lands.
   */
  dr?: number;
}

/**
 * The travel, and the guard that keeps an interrupted flight honest.
 *
 * ⚠ THE DURATION IS DUPLICATED IN `pda.css` (`flPdaDock`) and the two must
 * move together. The guard is the duration plus a frame: a transition that
 * arrives while an object is still in the air would compute its start pose
 * from the SETTLED rect and teleport, and reading the painted pose instead
 * would cost a `getComputedStyle` this surface is not allowed to spend
 * (ADR-061 permits the click's rect reads and nothing more). Falling back to
 * the plain raster is the cheap, correct answer.
 */
export const PDA_FLIGHT_MS = 420;

/**
 * THE MORPH'S OWN CLOCK (ADR-071 U1) — the skill chip's shape morph runs
 * LONGER than the utility dock, deliberately.
 *
 * ⚠ **420ms ON THE DOCK'S CURVE MADE THE MORPH INVISIBLE, MEASURED.** The
 * dock's `cubic-bezier(0.22, 0.9, 0.3, 1)` is built for the work card — an
 * object that must feel snappy because it is the same drawing at both ends.
 * Sampled live, that curve put the chip's path 87 % of the way home inside
 * the first 100ms: the one gesture whose whole point is a VISIBLE shape
 * change played out in under seven frames, and the owner read it as nothing
 * happening followed by a fade. The morph takes 620ms on an ease-in-out
 * (`pda.css`), so the rectangle-becoming-a-wedge is on screen through the
 * middle of the travel instead of being spent before the eye arrives.
 *
 * ⚠ THE DURATION IS DUPLICATED IN `pda.css` (`flPdaChipMorph` +
 * `.fl-pda-chip-*`'s delays) and the two must move together.
 */
export const PDA_MORPH_MS = 620;

/** ⚠ Must outlast the LONGEST arrival gesture — the morph now, not the
 *  dock. An interrupt landing inside either animation computes its start
 *  pose from a rect the object has not reached. */
export const PDA_FLIGHT_GUARD_MS = 650;

/** An SVG `viewBox` string as its four numbers. */
export function cropOf(viewBox: string): FlightRect {
  const [x, y, w, h] = viewBox.split(" ").map(Number);
  return { x, y, w, h };
}

/** `xMidYMin meet`: the minimum ratio, horizontal slack centred, vertical
 *  slack collected BELOW the drawing.
 *  ⚠ THE ANCHOR IS DUPLICATED in `PdaConsole`'s `preserveAspectRatio` and
 *  the two must move together: this arithmetic IS that attribute, and a
 *  drift puts the flight's start pose off by half the letterbox at every
 *  tall viewport (ADR-070 U3 — `YMid` → `YMin` so the drawing docks to the
 *  rail instead of floating below a void band). */
export function fitCrop(box: FlightBox, crop: FlightRect): { k: number; ox: number; oy: number } {
  const k = Math.min(box.width / crop.w, box.height / crop.h);
  return { k, ox: (box.width - crop.w * k) / 2, oy: 0 };
}

/**
 * `from` drawn in `fromCrop`, expressed as the pose that would put `to` —
 * drawn in `toCrop` — exactly on top of it.
 *
 * Both rects are measured CENTRE to CENTRE, because `flPdaDock` shares
 * `fl-pda-bloom`'s frame (`transform-box: fill-box`, a centred origin) and
 * one convention across the two is one thing less to get wrong.
 *
 * Returns `null` when there is nothing to fly through — a zero-size box (the
 * console is `display: none` below the desktop gate, where `getBoundingClientRect`
 * reports zeros and this arithmetic would divide by them), or any
 * non-finite result. A `null` means "raster instead", never "throw".
 */
export function pdaFlight(
  box: FlightBox,
  fromCrop: string | FlightRect,
  from: FlightRect,
  toCrop: string | FlightRect,
  to: FlightRect
): FlightVars | null {
  if (!(box.width >= 1) || !(box.height >= 1)) return null;
  if (!(from.w > 0) || !(from.h > 0) || !(to.w > 0) || !(to.h > 0)) return null;

  const c1 = typeof fromCrop === "string" ? cropOf(fromCrop) : fromCrop;
  const c2 = typeof toCrop === "string" ? cropOf(toCrop) : toCrop;
  if (!(c1.w > 0) || !(c1.h > 0) || !(c2.w > 0) || !(c2.h > 0)) return null;

  const f1 = fitCrop(box, c1);
  const f2 = fitCrop(box, c2);
  if (!(f1.k > 0) || !(f2.k > 0)) return null;

  /* The source's centre, forward into screen px, then back through the
     destination's crop. */
  const px = f1.ox + (from.x + from.w / 2 - c1.x) * f1.k;
  const py = f1.oy + (from.y + from.h / 2 - c1.y) * f1.k;
  const ux = c2.x + (px - f2.ox) / f2.k;
  const uy = c2.y + (py - f2.oy) / f2.k;

  const vars: FlightVars = {
    dx: ux - (to.x + to.w / 2),
    dy: uy - (to.y + to.h / 2),
    /* The ratio of the two objects' SCREEN widths — what the destination has
       to be scaled by to measure the same as the source did. */
    dk: (from.w * f1.k) / (to.w * f2.k),
  };

  return Number.isFinite(vars.dx) && Number.isFinite(vars.dy) && vars.dk > 0 ? vars : null;
}
