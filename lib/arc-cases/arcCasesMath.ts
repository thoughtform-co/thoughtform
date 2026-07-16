// Arc Cases — pure math for the click-owned cases reveal at the Build
// park. One damped arm level (the feature's only clock) plays the reveal
// in and out; the Build-band gate confines it to the park; slot stepping
// walks the four cases. `dampLevel` / `arcBandFactor` carry over verbatim
// from the retired orbitMath — the band + epilogue-kill contract is
// unchanged.
//
// EXCLUSIVITY CONTRACT: the epilogue kill [0, 0.1] drives the reveal to
// zero across the first tenth of the epilogue scroll, long before the
// corridor-exit dissipate that admits the services ring (which needs
// epilogueProgress ≥ 0.72). The two are provably disjoint — pinned by
// tests/lib/arc-cases-math.test.ts (ARC_EPILOGUE_KILL[1] < 0.72). Never
// weaken either clock so their windows overlap.
//
// Kept free of DOM/three so it stays unit-testable. Consumed by
// lib/stores/arcCasesStore.ts.

import { clamp01 } from "@/lib/math";
import { lerp, smootherstep } from "@/lib/services-ring/ringMath";

/** Number of production cases — one reveal, four faces. */
export const CASE_COUNT = 4;

/** Wrapping prev/next step: slot 3 → 0 forward, 0 → 3 back. The
 *  cumulative-index + shortest-delta machinery died with the physical
 *  ring — a crossfading reveal has no rotation to take "the short way". */
export function stepSlot(slot: number, dir: 1 | -1): number {
  return (((slot + dir) % CASE_COUNT) + CASE_COUNT) % CASE_COUNT;
}

/** Exponential damp rate (per second) for the arm level — ≈0.4s to settle.
 *  The ONLY clock the reveal owns (disarm plays it backwards); everything else
 *  is scroll-owned band gating. Bumped 2.2 → 2.4 (2026-07-16) so the tools card
 *  materialises a touch faster on click; the fold still completes ≈403 ms in
 *  (−ln(1−ARC_FOLD_DONE)/rate), safely inside the smoke's fold window. */
export const ARC_ARM_RATE = 2.4;

/** Frame-rate-independent exponential damp toward `target`. */
export function dampLevel(
  current: number,
  target: number,
  dtSeconds: number,
  rate: number = ARC_ARM_RATE
): number {
  const dt = Math.max(0, dtSeconds);
  return lerp(current, target, 1 - Math.exp(-rate * dt));
}

/* ── Scroll gate (verbatim from the retired orbitMath — the contract
   pinned by the vitest exclusivity test) ─────────────────────────── */

/** Build-band gate on the corridor paint clock: the reveal exists only
 *  once the intelligence station has resolved (stack accretion runs
 *  [0.875, 0.95]; park ≈ 0.9225), and never before. Rising edge only —
 *  paintProgress ends at 1.0 inside the Build station; the epilogue kill
 *  below owns the far side. */
export const ARC_BAND_IN: readonly [number, number] = [0.845, 0.9];

/** Epilogue kill window: the reveal is fully gone across the first tenth
 *  of the epilogue scroll (faster than the caption's BUILD_OUT [0, 0.22],
 *  and long before the corridor-exit dissipate that admits the services
 *  ring — the exclusivity contract, carried over unchanged). */
export const ARC_EPILOGUE_KILL: readonly [number, number] = [0.0, 0.1];

/** Scroll-owned visibility gate for the whole instrument — the product of
 *  the Build-band rise and the epilogue kill. Multiplied against the arm
 *  level every frame, so scrolling away collapses the reveal even if the
 *  store were somehow still armed (belt-and-suspenders under the
 *  auto-disarm watcher). */
export function arcBandFactor(paintProgress: number, epilogueProgress: number): number {
  const bandIn = smootherstep(ARC_BAND_IN[0], ARC_BAND_IN[1], paintProgress);
  const epilogueKill =
    1 - smootherstep(ARC_EPILOGUE_KILL[0], ARC_EPILOGUE_KILL[1], epilogueProgress);
  return bandIn * epilogueKill;
}

/* ── Label fade (ADR-035) ─────────────────────────────────────────
   The terminal reveal's signature move: on arm the sources/surfaces
   DOM labels DISAPPEAR while the canvas pips/streams stay lit to frame
   the panel. The fade is driven by the same damped arm level the
   overlay writes — read by `gateStackLabel` (sceneGeom) for every
   stack-label element. */

/** Level window across which the stack labels fade to nothing. The
 *  labels are fully gone by `level = 0.55` — i.e. by mid-arm, BEFORE
 *  the two converging halves meet at the centre seam (the panel lands
 *  on a clean field, never over half-lit chips). */
export const ARC_LABEL_FADE_OUT: readonly [number, number] = [0, 0.55];

/** Stack-label opacity multiplier as a function of the arm level:
 *  1 at rest (labels fully present), 0 by `ARC_LABEL_FADE_OUT[1]`
 *  (labels gone). Smootherstep down so the fade eases in and out with
 *  the arm/disarm envelope rather than stepping. */
export function arcLabelFade(level: number): number {
  return 1 - smootherstep(ARC_LABEL_FADE_OUT[0], ARC_LABEL_FADE_OUT[1], level);
}

/* ── Reveal phasing (ADR-041) ─────────────────────────────────────────
   The reveal plays as two ORDERED phases of the one damped arm level so
   the nodes fold and latch onto the (still-invisible) card frame BEFORE
   the card materializes into it — instead of both moving together off a
   single linear read. Both are pure functions of the same `level`, so the
   whole beat stays reversible: close plays it backwards for free (card
   dissolves, then the nodes unfold, then the labels return). No new clock,
   no new scroll writer — the phase split lives entirely here. */

/** Level at which the node-stream fold is COMPLETE. The fold input is a
 *  bare clamped ratio of the arm level up to this point; the fold's own
 *  smootherstep (`arcLatchEnvelope`) supplies the easing, so do NOT ease
 *  here too (double-easing would stall the fold's start). Sits just above
 *  the label fade-out end (0.55) so the labels are gone before the lines
 *  arrive on the card edges. */
export const ARC_FOLD_DONE = 0.62;

/** Fold-phase input for `arcLatchEnvelope`: the arm level remapped so the
 *  fold runs 0→1 across `[0, ARC_FOLD_DONE]` and holds at 1 above it.
 *  Clamped, monotonic non-decreasing in `level`. */
export function arcFoldInput(level: number): number {
  return clamp01(level / ARC_FOLD_DONE);
}

/** Level window across which the CARD materializes — opens exactly as the
 *  fold lands (`ARC_FOLD_DONE`, so the ordering is strict: the card has
 *  ZERO presence for any level at which the fold is not yet complete) and
 *  finishes just BELOW full arm (0.9, 2026-07-16) so the card reaches full
 *  presence decisively instead of crawling up the damp's asymptotic tail —
 *  it reads as appearing a touch quicker on click. Because `smootherstep` is
 *  flat at its start the card still emerges gently right off the latch, so
 *  there's no dead beat between the nodes arriving and the screen appearing.
 *  The lower bound is unchanged, so the fold→card ordering invariant holds. */
export const ARC_CARD_PHASE: readonly [number, number] = [ARC_FOLD_DONE, 0.9];

/** Card presence 0..1 as a function of the arm level: 0 until the fold is
 *  essentially done (`ARC_CARD_PHASE[0]`), smoothersteps up to 1 at full
 *  arm. Every CARD read (material opacities, visibility, depth-write
 *  hysteresis, the stepper) uses this instead of the raw level, so the
 *  card never leads the nodes. Monotonic non-decreasing in `level`. */
export function arcCardPresence(level: number): number {
  return smootherstep(ARC_CARD_PHASE[0], ARC_CARD_PHASE[1], level);
}

/* ── Sigil settle gate (ADR-041) ──────────────────────────────────────
   The "VIEW THE CASES" sigil (a world-anchored marker at the sphere's
   front pole) only offers itself once the sources/surfaces notes have
   SETTLED into position — the owner's sequencing ("the panel comes AFTER
   the notes change position/shape"), applied to the TRIGGER. Read against
   the smoothed `stack` accretion follower (the same signal ShellStack folds
   the notes on). Shared by the sigil's opacity painter (`gateSigil`,
   sceneGeom) AND its `inert` gate (`ArcCasesSigil`) so the visual fade-in
   and the focusability arrive on ONE threshold. NOTE this gate deliberately
   excludes the card-fade: while armed the sigil is visually hidden (the card
   covers it) but stays focusable, so Escape can return focus to the trigger
   that opened the reveal.

   MEASURED against the live corridor (dev, 1600×900) — the smoothed stack
   reads ≈0.72 at paintProgress 0.90 (notes still flying in), ≈0.79 at the
   camera park (0.9225), and ≥0.96 by 0.95 (accretion `peakAt`). This window
   is therefore [0.70, 0.84]: the sigil is ~0 while the notes are visibly
   accreting, arrives WITH the park, and is fully lit as they land. Do NOT
   push it toward the accretion peak (a [0.72, 0.96] first pass only went
   live at paint 0.95, which left barely 270px of scroll before the epilogue
   kill — the trigger was effectively unreachable). Re-measure before
   retuning. */
export const ARC_SIGIL_SETTLE: readonly [number, number] = [0.7, 0.84];

/** Sigil settle factor 0..1 from the smoothed stack reveal — 0 before the
 *  notes have moved, 1 once they've landed. */
export function sigilSettle(stack: number): number {
  return smootherstep(ARC_SIGIL_SETTLE[0], ARC_SIGIL_SETTLE[1], stack);
}
