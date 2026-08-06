import type { PdaView } from "./pdaRecord";

/**
 * THE WHEEL, WHILE THE POINTER IS ON THE INSTRUMENT.
 *
 * PURE. No react, no DOM, no `window` — the console owns the listener, this
 * owns the decision, and `tests/lib/pda-wheel.test.ts` owns the arithmetic.
 * A gesture reducer written inline is a gesture reducer nobody can check.
 *
 * ── What this reverses, and how far ──────────────────────────────────────
 * The 2026-07-15 pass RETIRED a wheel-snap hijack on this same stage so that
 * scrubbing over the card ring read as continuous scroll (`ServicesStage`).
 * That ruling stands for the ring. This is a narrower thing and it is the
 * owner's ask (2026-08-06): the map is a bounded instrument with THREE
 * readings, and while the pointer is over it the wheel changes the reading
 * instead of the directory row underneath.
 *
 * ── THE RELEASE IS THE WHOLE SAFETY ARGUMENT ─────────────────────────────
 * Out of readings in the direction of travel, the wheel is handed straight
 * back — `capture: false`, no `preventDefault`, the corridor keeps moving.
 * Without that a reader who scrolls onto the map is in a trap, and this beat
 * is scroll-pinned, so a trap here is a trap on the whole page. Every other
 * constant in this file is comfort; that one is the contract.
 *
 * ── One step per gesture, not one step per event ─────────────────────────
 * A trackpad fling is hundreds of events with deltas of 1–3px. A threshold
 * alone would walk all three readings in a frame, so a step also opens a
 * LOCKOUT — during which the wheel is still ours (releasing mid-gesture
 * would leak the tail of the fling into the page) but changes nothing. The
 * lockout is set just under the scan sweep: a reading whose entrance the
 * reader never sees may as well be a swap.
 */

/** The readings, low to high. Mirrors `PdaView`; `1` is THE WORK. */
export const PDA_VIEW_MIN = 1;
export const PDA_VIEW_MAX = 3;

/**
 * Accumulated pixels before a step. One mouse notch is 100–120px in
 * `DOM_DELTA_PIXEL`, so a notch is one reading; a trackpad reaches it in a
 * few frames of a deliberate swipe and never on a stray touch.
 */
export const WHEEL_STEP_THRESHOLD = 90;

/** Silence longer than this ends the gesture and empties the accumulator. */
export const WHEEL_GESTURE_GAP_MS = 180;

/** Dead time after a step. Just under `flPdaScan`'s 620ms sweep. */
export const WHEEL_STEP_LOCKOUT_MS = 470;

/** Fallbacks for the two non-pixel delta modes. */
const LINE_PX = 16;
const PAGE_PX = 800;

export interface PdaWheelState {
  /** Pixels accumulated in the current gesture, signed. */
  acc: number;
  /** When the last step was accepted. */
  steppedAt: number;
  /** When the last wheel event arrived, for gesture-gap detection. */
  lastAt: number;
}

/** Rest. `-Infinity` so the first event is never inside a lockout or gesture. */
export const PDA_WHEEL_REST: PdaWheelState = {
  acc: 0,
  steppedAt: Number.NEGATIVE_INFINITY,
  lastAt: Number.NEGATIVE_INFINITY,
};

export interface PdaWheelInput {
  deltaY: number;
  /** `WheelEvent.deltaMode`: 0 pixel, 1 line, 2 page. */
  deltaMode: number;
  /** `WheelEvent.timeStamp`, in ms. */
  at: number;
  view: PdaView;
  /** Viewport height, for `DOM_DELTA_PAGE`. */
  pageHeight?: number;
}

export interface PdaWheelResult {
  /** The reading to move to, or null to leave it where it is. */
  next: PdaView | null;
  /** Whether the instrument owns this event — i.e. `preventDefault`. */
  capture: boolean;
  state: PdaWheelState;
}

/** Wheel delta in pixels, whatever unit the device reports. */
export function normalizeWheelDelta(
  deltaY: number,
  deltaMode: number,
  pageHeight: number = PAGE_PX
): number {
  if (deltaMode === 1) return deltaY * LINE_PX;
  if (deltaMode === 2) return deltaY * (pageHeight || PAGE_PX);
  return deltaY;
}

/**
 * One wheel event against the current reading.
 *
 * The caller keeps `state` in a ref and does exactly two things with the
 * result: `preventDefault()` when `capture`, and change the reading when
 * `next` is non-null.
 */
export function pdaWheelStep(state: PdaWheelState, input: PdaWheelInput): PdaWheelResult {
  const delta = normalizeWheelDelta(input.deltaY, input.deltaMode, input.pageHeight);
  const dir = Math.sign(delta);

  // A horizontal gesture (or a null one) was never ours.
  if (dir === 0) return { next: null, capture: false, state };

  // THE RELEASE. No reading left this way ⇒ the page gets its wheel back, and
  // the accumulator empties so re-entering does not inherit a stale run-up.
  if (dir > 0 ? input.view >= PDA_VIEW_MAX : input.view <= PDA_VIEW_MIN) {
    return { next: null, capture: false, state: { ...PDA_WHEEL_REST, lastAt: input.at } };
  }

  // A pause or a REVERSAL starts the run-up over. Without the reversal check,
  // scrolling back up would first have to pay off the downward accumulator.
  const fresh = input.at - state.lastAt > WHEEL_GESTURE_GAP_MS || Math.sign(state.acc) !== dir;
  const acc = fresh ? delta : state.acc + delta;

  // Inside the lockout the wheel stays OURS (see the header) but moves
  // nothing, and the run-up restarts from the far side of it.
  if (input.at - state.steppedAt < WHEEL_STEP_LOCKOUT_MS) {
    return {
      next: null,
      capture: true,
      state: { acc: 0, steppedAt: state.steppedAt, lastAt: input.at },
    };
  }

  if (Math.abs(acc) < WHEEL_STEP_THRESHOLD) {
    return {
      next: null,
      capture: true,
      state: { acc, steppedAt: state.steppedAt, lastAt: input.at },
    };
  }

  return {
    next: (input.view + dir) as PdaView,
    capture: true,
    state: { acc: 0, steppedAt: input.at, lastAt: input.at },
  };
}
