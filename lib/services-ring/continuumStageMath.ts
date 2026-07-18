// Continuum rail stage — pure math for the #continuum "brandmark returns"
// beat (ADR-049; spectrum = the crail instrument formed FROM the mark
// since Update 4).
//
// One clock (the continuum stage clock, 0→1 across the pinned #continuum
// runway), clamped outside its range so the seams against #about (above)
// and #practice (below) are byte-stable holds. Four scrubbed envelopes:
//
//   1. APPROACH (continuumApproachT) — the receded mark lifts from its
//      ~0.30 about-ambient ink to CONTINUUM_MARK_INK and eases back toward
//      the parked pose (RECEDE release). Consumed by the WebGL mark
//      opacity/pose (BrandmarkPhysicsCoreActor) via continuumFormT.
//   2. COPY (continuumCopyT) — the DOM stage's masthead reveals (the
//      CSS-var mirror, `--continuum-copy-in`, with per-child --ci-off
//      stagger — the about-stage.css recipe).
//   3. RAIL-FORM (continuumRailFormT) — the crail instrument FORMS out of
//      the re-emerged mark (`--continuum-rail-form`): the dashed guide
//      rail + bearings + brackets wipe OUTWARD from the mark's centre,
//      the stops bloom centre-out beneath, and the reticle condenses at
//      the mark before its launch gate arms (the data-continuum-formed
//      hysteresis below).
//   4. BG-IN (continuumBgInT) — the fail-opaque shield restores across the
//      runway tail, completing at the unpin (i.e. as #practice's top
//      reaches the viewport) BEFORE the ambient fade even starts (the
//      ADR-030 lockstep ordering invariant, inherited from ADR-047).
//
// The THUMB helpers document the spectrum geometry the DOM instrument
// draws (mirroring the fallback `.crail` reticle's 7s loop): fraction f
// sweeps 1/6 ↔ 5/6 (Tool ↔ Collaborator stops) on a 7s ping-pong, and
// the arc angle a = π·(1 − f) maps a fraction onto a front arc. The 3D
// ContinuumWaistRail consumer was retired in Update 1; the fractions are
// the single source for the DOM rail's tick/travel percentages.
//
// Kept free of DOM/three (tests/lib/continuum-stage-math.test.ts).

import { clamp01, lerp } from "@/lib/math";
import { aboutExitT } from "./aboutDeckMath";
import { smootherstep } from "./ringMath";

/* ── Continuum-stage beat windows (fractions of the pinned runway) ────────
 * Single source for the WebGL beat AND the DOM stage's CSS mirrors — the
 * beats must never drift apart. Runway = 200svh (continuum-stage.css). */

/** Beat 0 — the mark re-emerges + eases closer; the waist ring
 *  re-brightens; the thumb's opacity gate opens. Starts at 0 (the
 *  #continuum pin coincides with the about tail, so the lift picks up in
 *  the same wheel motion that finished #about). */
export const CONTINUUM_APPROACH_WINDOW: readonly [number, number] = [0, 0.3];

/** Beat 0, trailing — the masthead reveals. (The spectrum stops ride the
 *  RAIL-FORM envelope below since Update 4 — they belong to the
 *  instrument's centre-out bloom, not the masthead's editorial reveal.) */
export const CONTINUUM_COPY_WINDOW: readonly [number, number] = [0.06, 0.38];

/** Beat 1 — the crail instrument FORMS out of the mark: the dashed guide
 *  rail + bearings + register brackets wipe outward from the mark's
 *  centre (a scrubbed clip-path release — never scaleX, which would
 *  stretch the dash pattern), the three stops bloom centre-out beneath
 *  (per-child `--cs-off` against this envelope), and the navigator
 *  reticle condenses at the mark across the tail. Overlaps the back half
 *  of APPROACH so mark-return and instrument-formation read as one
 *  continuous motion; completes well before the BG-IN shield tail. */
export const CONTINUUM_RAIL_FORM_WINDOW: readonly [number, number] = [0.12, 0.44];

/** Runway tail — the fail-opaque shield restores (and every stage child
 *  dies with it) so #practice covers an already-shielded station BEFORE
 *  the ambient canvas is killed (the ADR-030 ordering invariant). */
export const CONTINUUM_BG_IN_WINDOW: readonly [number, number] = [0.92, 1.0];

export function continuumApproachT(continuumP: number): number {
  return smootherstep(
    CONTINUUM_APPROACH_WINDOW[0],
    CONTINUUM_APPROACH_WINDOW[1],
    clamp01(continuumP)
  );
}
export function continuumCopyT(continuumP: number): number {
  return smootherstep(CONTINUUM_COPY_WINDOW[0], CONTINUUM_COPY_WINDOW[1], clamp01(continuumP));
}
export function continuumRailFormT(continuumP: number): number {
  return smootherstep(
    CONTINUUM_RAIL_FORM_WINDOW[0],
    CONTINUUM_RAIL_FORM_WINDOW[1],
    clamp01(continuumP)
  );
}
export function continuumBgInT(continuumP: number): number {
  return smootherstep(CONTINUUM_BG_IN_WINDOW[0], CONTINUUM_BG_IN_WINDOW[1], clamp01(continuumP));
}

/* ── Reticle-launch hysteresis (`data-continuum-formed`) ─────────────────
 * The reticle's PING-PONG POSITION is the one channel that cannot be a
 * pure scrub (it is the fallback crail's autonomous 7s loop, sanctioned
 * since the original station): its CSS animation timeline starts when
 * useContinuumStageScroll stamps `data-continuum-formed` on the stage —
 * the launch keyframe then plays the reticle from the mark's centre out
 * to the Tool pole before the loop takes over ("the navigator detaches
 * from the mark"). Opacity stays scrubbed (`--continuum-rail-form` tail),
 * reaching 0 exactly at RESET_BELOW, so clearing the attribute on reverse
 * scroll never snaps a visible reticle back to centre. The SET/CLEAR gap
 * keeps a frame straddling one threshold from strobing the timeline. */

/** Stamp `data-continuum-formed` when continuumRailFormT crosses this. */
export const CONTINUUM_RETICLE_LAUNCH_AT = 0.98;
/** Clear it only once continuumRailFormT falls back below this (also the
 *  foot of the reticle/trail opacity ramp in continuum-stage.css — keep
 *  in lockstep). */
export const CONTINUUM_RETICLE_RESET_BELOW = 0.88;

/** Fraction of the continuum formation that PRE-WARMS during the #about
 *  exit slide, so the brandmark re-inks and the waist ring begins
 *  re-brightening AS the copy/portrait slide away — the two beats read as
 *  one continuous motion instead of a hard cut at the pin. The remaining
 *  (1 − prelude) lands across the continuum approach proper. */
export const CONTINUUM_FORM_PRELUDE = 0.4;

/** THE continuum-formation clock. 0 → CONTINUUM_FORM_PRELUDE across the
 *  #about exit slide, plateaus across the inter-runway gap (the two clamped
 *  clocks are disjoint by page order — about p = 1 while continuum p = 0 for
 *  ~100svh), then continuumApproachT takes over via max-compose and carries
 *  it to 1. Monotone along the journey, reversible, and IDENTITY 0 before
 *  the exit begins (continuumFormT(≤0.74, 0) === 0) so every pre-exit frame
 *  is byte-identical to the pre-slide baseline. Consumed by the mark ink
 *  lift (BrandmarkPhysicsCoreActor) and the waist re-brighten
 *  (CorridorArmillary); a future WebGL continuum band reads the same clock. */
export function continuumFormT(aboutP: number, continuumP: number): number {
  return Math.max(CONTINUUM_FORM_PRELUDE * aboutExitT(aboutP), continuumApproachT(continuumP));
}

/* ── Mark prominence tunables ─────────────────────────────────────────────
 * Consumed by BrandmarkPhysicsCoreActor. Identity at continuumApproachT = 0
 * (flag-off / pre-continuum byte-identical — the ADR-030 unit-pin
 * discipline carried through ADR-047). */

/** Target ink the receded mark lifts to across the approach — mid-
 *  prominence: clearer than the ~0.30 about ambient, subtler than the
 *  #services centerpiece (parked ~0.84–1.0). */
export const CONTINUUM_MARK_INK = 0.6;

/** Fraction of the #services EXIT_RECEDE_* scale/distance push released
 *  across the approach, so the mark eases ~halfway back toward the parked
 *  pose ("comes closer / more present") without fully re-docking. */
export const CONTINUUM_RECEDE_RELEASE = 0.5;

/** Master-opacity multiplier the waist ring lerps TOWARD across the
 *  approach (> 1 brightens: shell-waist's 0.68 base × ~1.3 ≈ 0.88; the
 *  OrbitRing material write is capped at 1.0). Meridian + card tracks keep
 *  the plain orbitExitGetter and stay cleared. */
export const CONTINUUM_WAIST_LEVEL = 1.3;

/* ── Waist-ring thumb (the tool ↔ collaborator spectrum on the mark) ──────
 * Mirrors the DOM `.crail` reticle: fraction f ∈ [THUMB_F_MIN, THUMB_F_MAX]
 * ping-pongs over THUMB_PERIOD_S seconds (the `crailSlideLarge` 7s loop),
 * eased at the turn-arounds. */

export const THUMB_PERIOD_S = 7;
/** Tool (left) stop — the DOM crail's `100% / 6`. */
export const THUMB_F_MIN = 1 / 6;
/** Collaborator (right) stop — the DOM crail's `500% / 6`. */
export const THUMB_F_MAX = 5 / 6;
/** The three labelled stops (Tool · AI lives here · Collaborator) — tick
 *  diamonds ride these fractions. */
export const THUMB_TICK_FRACTIONS: readonly number[] = [THUMB_F_MIN, 0.5, THUMB_F_MAX];

/** Ping-pong fraction for a phase ∈ [0, 1): 0 → THUMB_F_MIN (Tool),
 *  0.5 → THUMB_F_MAX (Collaborator), 1 → THUMB_F_MIN. Eased at the turns
 *  (smootherstep of the triangle wave), matching the DOM crail's
 *  ease-out slide. */
export function continuumThumbFraction(phase: number): number {
  const p = phase - Math.floor(phase); // wrap to [0, 1)
  const tri = 1 - Math.abs(2 * p - 1); // 0 → 1 → 0 as p: 0 → 0.5 → 1
  return lerp(THUMB_F_MIN, THUMB_F_MAX, smootherstep(0, 1, tri));
}

/** Waist-ring parametric angle for a thumb fraction f: the front arc
 *  a = π·(1 − f), so f = THUMB_F_MIN (Tool) sits left (a ≈ 150°,
 *  cos a < 0) and f = THUMB_F_MAX (Collaborator) sits right (a ≈ 30°,
 *  cos a > 0). The local ring point is then (cos a · r, sin a · r · ecc, 0)
 *  inside the ring's tilted group (the HologramOrbits node parametrization).
 */
export function continuumThumbAngle(f: number): number {
  return Math.PI * (1 - f);
}
