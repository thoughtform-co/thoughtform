import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionKind } from "@/lib/arcs/types";

/**
 * arcMotion — the pure math and shared constants of the terminal-motion
 * beat system (ADR-057). No DOM, no react runtime: the writer, the
 * decode scheduler, the server components and the unit tests all read
 * their numbers from here so a retune lands in one place.
 *
 * The model: each section is a PINNED STAGE followed by a fold TAIL.
 *
 *   approach │ the stage rides up with the page; the panel ladder
 *            │ scrubs in on `--sec-in`, saturating ~0.12vh before the
 *            │ section's top reaches the viewport top.
 *   park     │ the stage pins on its LAST viewport — its bottom meeting
 *            │ the viewport bottom. The masthead decodes here (the
 *            │ ADR-044 law: never on a travelling stage), then the
 *            │ plane folds LIFO on `--sec-out` and irises shut across
 *            │ the tail, with the stage held still the whole way.
 *   release  │ the plane is already empty, so what scrolls away is
 *            │ opaque void. No cover stack, no z-choreography between
 *            │ consecutive opaque beats (ADR-008 holds by construction).
 *
 * THE PIN IS `sticky; top: vh − stageH` — 0 for a fitting stage,
 * negative for a taller one. Measured on the real deck: at 1440×900 only
 * 15 of 23 sections fit a plain `top: 0` pin, and at 1280×720 only 7 —
 * this content is simply taller than a laptop viewport, and a plain top
 * pin would trap a tall stage's below-fold content behind the tail. The
 * negative offset lets a tall stage read through its overflow FIRST and
 * then pin on its last, fully visible viewport, which is the only frame
 * of it that is safe to fold. (And never `bottom: 0`: sticky-bottom
 * only restrains exit through the BOTTOM edge, so past the park it never
 * engages and the fold would play on a moving stage — shipped once,
 * caught by the reverse-scroll smoke.) Every beat gets the same exit;
 * the writer measures the offset with the same numbers `beatOut` parks
 * on, so the CSS pin and the clock can never disagree.
 *
 * There is no dead scroll in that tiling: every pixel of tail is fold.
 * If a beat feels sticky, SHORTEN THE TAIL — never add a hold
 * (ADR-056's "the dwell is the handoff, not a reading window").
 */

/**
 * THE single enhanced-tier gate. The hook, the ArcShell reveal split and
 * the terminal CSS release must agree exactly: the CSS release is
 * `(max-width: 960px), (prefers-reduced-motion: reduce)` — 960, NOT the
 * v1 reveal block's 900. A viewport between the two would get sticky
 * runways with no clocks writing to them, i.e. dead scroll bands.
 */
export const ARC_TERMINAL_MEDIA = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

/** Fold tails in svh — the scroll the pinned stage folds across. */
export const TAIL_STD = 70;
export const TAIL_INTER = 50;

/** Approach ratio at which `--sec-in` saturates (before the park). */
export const IN_SPAN = 0.88;
/** Band of the pin progress the fold occupies. */
export const OUT_START = 0.14;
export const OUT_END = 0.97;

/**
 * Write deadband (ADR-056 U4, measured): under 0.3% of an opacity ramp
 * and under 0.15px of travel. The CSS clamps saturate before the vars'
 * terminal values, so the zero-at-rest law holds structurally.
 */
export const WRITE_EPS = 0.0025;

/** Park band for the decode strike, and its derived re-arm mirror. */
export const PARK_STRIKE_PX = 2;
export const REARM_PX = 40;

/* ── THE MASTHEAD LAW (owner, twice: services 2026-07-27, arcs
   2026-08-01) ─────────────────────────────────────────────────────────
   The masthead NEVER moves and NEVER fades. It comes into view ONLY by
   typing, leaves ONLY by un-typing (the reverse effect), and both can
   happen only while it is screen-stationary. Whenever resolved text
   would otherwise travel, it force-blanks first. These constants are
   that law's numbers. */

/**
 * Smoothed `--sec-out` at which the downward exit begins un-typing.
 *
 * ⚠ THE MASTHEAD LEAVES LAST — it is the top of the LIFO ladder
 * (`--ci-off` 0.06 ⇒ `--co-off` 0.50), so it must still be readable
 * while the numbers, receipts and cards are already folding. An earlier
 * cut keyed this to the RAW ramp at 0.12, which fires ~107px into the
 * tail — inside the settle hold, where the smoothed channel is still
 * ~0.001 and NOTHING else has moved. The masthead vanished off a parked,
 * fully-legible section (owner, screenshots). Read the threshold on the
 * SMOOTHED channel so it means what it looks like: "a third of the way
 * through the visible fold".
 */
export const UNTYPE_OUT = 0.3;
/** Smoothed `--sec-out` the beat must come back under before a re-entry
 *  may re-type. DERIVED from UNTYPE_OUT, never a free literal (the
 *  ADR-056 U3 mirrored-threshold lesson). */
export const RETYPE_OUT = UNTYPE_OUT * 0.4;
/** Smoothed `--sec-out` past which any remaining text blanks instantly.
 *  The iris opens at 0.56; text must be gone before a crop could ever
 *  reach it (the "clipping bug, not a fold" law). This is the backstop
 *  for a fast scroll — a normal one finishes un-typing well before it.
 *  ORDERING IS THE CONTRACT: RETYPE < UNTYPE < FORCE_BLANK < iris. */
export const FORCE_BLANK_OUT = 0.5;
/** Cumulative upward travel (px) that reads as "leaving" and begins the
 *  un-type. Big enough that trackpad jitter or a nudge while reading
 *  never blanks the header, small enough to still leave pinned runway
 *  for the effect to play in place. (A reader sitting exactly AT the
 *  park has none above them — that path is the force-blank truncation.) */
export const UNTYPE_UP_PX = 12;
/** Stillness required before an upward re-entry re-types. Without it a
 *  flick up THROUGH a beat types-then-blanks in ~100ms — flicker, not
 *  choreography. Downward first arrivals strike immediately. */
export const STRIKE_SETTLE_MS = 180;
/** Reverse typewriter speed — deleting reads faster than typing. */
export const UNTYPE_CPS = 340;

/**
 * Sticky pin offset for the masthead of a beat TALLER than the viewport.
 * A tall stage has no all-visible park for its head (it has scrolled off
 * by the time the bottom pins), so the head sticky-pins here and the
 * content reads through beneath it — the home-page masthead relation.
 * JS writes this as `--arc-head-pin` so the CSS and the clock can never
 * disagree (gate parity).
 */
export function headPinOffset(vh: number): number {
  return Math.round(Math.min(88, Math.max(40, vh * 0.07)));
}

/** rootMargin for the near-set observer — keeps ≤3 beats in the frame. */
export const NEAR_MARGIN = "120% 0px 120% 0px";

/** Decode tuning (ServicesMasthead values, verbatim). */
export const TITLE_STAGGER_S = 0.18;
export const TYPE_CHARS_PER_S = 220;
export const TYPE_START_DELAY_S = 0.12;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Ken Perlin's smootherstep on an already-normalised ratio. */
export function smootherstep(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Normalise into [edge0, edge1] then smootherstep. */
export function smootherBand(value: number, edge0: number, edge1: number): number {
  if (edge1 <= edge0) return value >= edge1 ? 1 : 0;
  return smootherstep((value - edge0) / (edge1 - edge0));
}

/**
 * Arrival clock. `topVp` is the stage's top in viewport coordinates:
 * `vh` when the section's top edge touches the viewport bottom, 0 at the
 * park. Saturates at `IN_SPAN` of the approach.
 */
export function beatIn(topVp: number, vh: number): number {
  if (vh <= 0) return 1;
  return smootherBand(clamp01((vh - topVp) / vh), 0, IN_SPAN);
}

/**
 * Departure clock across the tail. The stage parks when its bottom meets
 * the viewport bottom — `topVp === vh − stageH` — and folds over the
 * `tailPx` of scroll that follows. For a stage shorter than the viewport
 * that park is exactly `topVp === 0`, so short and tall beats share one
 * formula. A beat with no tail (the close band) never folds.
 */
export function beatOut(topVp: number, vh: number, stageH: number, tailPx: number): number {
  if (tailPx <= 0) return 0;
  const parkTop = vh - stageH;
  return smootherBand(clamp01((parkTop - topVp) / tailPx), OUT_START, OUT_END);
}

/** Fold tail (svh) for a section kind. */
export function tailFor(kind: ArcSectionKind): number {
  return kind === "interstitial" ? TAIL_INTER : TAIL_STD;
}

/**
 * `close` is the page foot — there is nothing after it to hand off to,
 * so it gets no tail and never folds (a fold with nothing behind it
 * reads as the page eating itself).
 */
export function noTail(kind: ArcSectionKind): boolean {
  return kind === "close";
}

type RungProps = {
  "data-arc-panel"?: "";
  style?: CSSProperties;
};

/**
 * Spreadable rung props for a panel. Returns nothing at all in reveal
 * mode, which is what keeps v1 markup byte-identical.
 *
 * `ciOff` is the panel's place on the arrival ladder; its departure
 * offset is derived in CSS as `0.56 − --ci-off`, so a panel that arrives
 * late leaves early (LIFO). `dx`/`dy` are the panel's own dimension —
 * travel in on arrival, and the same axis continued INWARD on the fold.
 */
export function rung(motion: ArcMotion, ciOff: number, dx = 0, dy = 0): RungProps {
  if (motion !== "terminal") return {};
  const style: Record<string, string | number> = { "--ci-off": round3(ciOff) };
  if (dx) style["--dx"] = `${dx}px`;
  if (dy) style["--dy"] = `${dy}px`;
  return { "data-arc-panel": "", style: style as CSSProperties };
}

/** Ladder position for the i-th item of a repeating group, with a cap. */
export function ladder(base: number, step: number, index: number, cap: number): number {
  return Math.min(cap, base + step * index);
}

const round3 = (v: number) => Math.round(v * 1000) / 1000;
