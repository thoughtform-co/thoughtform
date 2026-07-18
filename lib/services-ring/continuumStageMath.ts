// Continuum rail stage — pure math for the #continuum "brandmark returns"
// beat (ADR-049; since Update 6 the tool ↔ collaborator slider is
// INTEGRATED INTO the mark's own horizontal wireframe band).
//
// Two clock families:
//
//   · The pinned-runway clock (0→1 across the #continuum runway, clamped
//     outside so the seams against #about and #practice are byte-stable
//     holds) drives the DOM copy: APPROACH (the formation's landing
//     settle), COPY (masthead + stops reveal), BG-IN (the fail-opaque
//     shield restores across the tail, completing at the unpin BEFORE the
//     ambient fade — the ADR-030 lockstep ordering invariant).
//   · The FORMATION clock (continuumFormT below — about-exit prelude →
//     inter-runway entry bridge → pinned landing) drives everything that
//     belongs to the MARK: its ink lift, pose release + hero scale boost,
//     the in-shader band highlight (continuumBandMath.bandGainT), and the
//     slider CHROME window (continuumChromeT — the reticle + Tool /
//     Collaborator caps that dock to the band's projected geometry), so
//     the whole instrument assembles DURING the approach and snaps
//     together by the pin instead of forming afterwards.
//
// The THUMB helpers document the spectrum geometry (the fallback `.crail`
// reticle's 7s loop): fraction f sweeps 1/6 ↔ 5/6 (Tool ↔ Collaborator
// stops) on a 7s ping-pong, and the arc angle a = π·(1 − f) maps a
// fraction onto a front arc. The live slider's motion lives in
// continuumBandMath (bandPendulumX / bandLaunchX — the same cadence).
//
// Kept free of DOM/three (tests/lib/continuum-stage-math.test.ts).

import { clamp01, lerp } from "@/lib/math";
import { aboutExitT } from "./aboutDeckMath";
import { smootherstep } from "./ringMath";

/* ── Continuum-stage beat windows (fractions of the pinned runway) ────────
 * Single source for the WebGL beat AND the DOM stage's CSS mirrors — the
 * beats must never drift apart. Runway = 150svh (continuum-stage.css);
 * the instrument itself assembles PRE-pin on the formation clock, so the
 * pinned travel is just the landing settle + the read hold + the tail. */

/** Beat 0 — the formation's landing settle: the last few percent of the
 *  mark's approach (continuumFormT reaches CONTINUUM_FORM_ENTRY at the
 *  pin; this window lands the remainder — a short, near-immediate
 *  settle, per the owner's "almost immediately snap together"). */
export const CONTINUUM_APPROACH_WINDOW: readonly [number, number] = [0, 0.12];

/** Beat 1 — the masthead + stops + readout + CTA reveal (scrubbed
 *  `--continuum-copy-in` with per-child --ci-off stagger). Fast: the
 *  instrument is already assembled when the pin lands, so the copy
 *  arrives with it rather than trailing a long formation. */
export const CONTINUUM_COPY_WINDOW: readonly [number, number] = [0.02, 0.3];

/** Runway tail — the fail-opaque shield restores (and every stage child
 *  dies with it) so #practice covers an already-shielded station BEFORE
 *  the ambient canvas is killed (the ADR-030 ordering invariant).
 *  Fractions of the SHORTER 150svh runway (50svh travel), so the window
 *  is wider than the old 200svh tune to keep the same on-screen ramp. */
export const CONTINUUM_BG_IN_WINDOW: readonly [number, number] = [0.85, 1.0];

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
export function continuumBgInT(continuumP: number): number {
  return smootherstep(CONTINUUM_BG_IN_WINDOW[0], CONTINUUM_BG_IN_WINDOW[1], clamp01(continuumP));
}

/** Fraction of the continuum formation that PRE-WARMS during the #about
 *  exit slide, so the brandmark re-inks and begins growing AS the
 *  copy/portrait slide away — the two beats read as one continuous motion
 *  instead of a hard cut at the pin. */
export const CONTINUUM_FORM_PRELUDE = 0.4;

/** Formation level the ENTRY bridge carries the mark to by the pin
 *  (ADR-049 Update 5; retimed by Update 6). The pre-pin entry clock
 *  (continuumStageProgressRef.entry: the runway's top traveling
 *  viewport-bottom → viewport-top) spans the inter-runway gap where the
 *  about clock has clamped to 1 and the runway clock still clamps at 0 —
 *  without it the formation plateaued at CONTINUUM_FORM_PRELUDE for that
 *  whole ~100svh stretch and the handoff read as grow → dead stall → grow
 *  ("too jaggy"). 0.95: the mark + slider are essentially ASSEMBLED as
 *  the pin arrives ("almost immediately snap together"); the pinned
 *  approach window lands only the last sliver as an arrival settle. */
export const CONTINUUM_FORM_ENTRY = 0.95;

/** Slider-chrome window over the FORMATION clock — the navigator reticle
 *  + the Tool / Collaborator caps (the DOM chrome docked to the band's
 *  projected geometry) fade in across the entry ramp's tail, completing
 *  AT CONTINUUM_FORM_ENTRY — i.e. exactly as the section pins, the
 *  instrument clicks together over the already-lit band. Identity 0 at
 *  formT 0 (nothing docks before the band exists). */
export const CONTINUUM_CHROME_WINDOW: readonly [number, number] = [0.78, 0.95];

/** Slider-chrome opacity for a formation level. Exactly 0 at formT = 0. */
export function continuumChromeT(formT: number): number {
  return smootherstep(CONTINUUM_CHROME_WINDOW[0], CONTINUUM_CHROME_WINDOW[1], clamp01(formT));
}

/** THE continuum-formation clock — max-compose of three eased, value-nested
 *  segments, each easing to zero slope where the next picks up (C1 along
 *  the scroll journey — no kinks, no dead plateau):
 *
 *    1. PRELUDE  0 → 0.4   across the #about exit slide (aboutExitT);
 *    2. ENTRY    0.4 → 0.75 across the inter-runway gap (the entry clock —
 *       the runway top traveling viewport-bottom → the pin), gated so a
 *       zero entry contributes nothing (identity discipline; on the real
 *       page the about plateau masks the gate edge by geometry: entry
 *       starts exactly where aboutP clamps to 1);
 *    3. APPROACH 0.75 → 1  across the pinned runway's approach window,
 *       gated the same way (continuumP = 0 exactly until the pin, where
 *       entry has already delivered 0.75 — the seam is continuous).
 *
 *  Monotone along the journey, reversible, IDENTITY 0 before the exit
 *  begins (continuumFormT(≤0.74, 0, 0) === 0) so every pre-exit frame is
 *  byte-identical to the pre-slide baseline, and constant 1 below the
 *  runway. Consumed by the mark ink lift + recede release + scale boost
 *  (BrandmarkPhysicsCoreActor). */
export function continuumFormT(aboutP: number, continuumP: number, entryP = 0): number {
  const prelude = CONTINUUM_FORM_PRELUDE * aboutExitT(aboutP);
  const entry =
    entryP > 0
      ? lerp(CONTINUUM_FORM_PRELUDE, CONTINUUM_FORM_ENTRY, smootherstep(0, 1, clamp01(entryP)))
      : 0;
  const approach =
    continuumP > 0 ? lerp(CONTINUUM_FORM_ENTRY, 1, continuumApproachT(continuumP)) : 0;
  return Math.max(prelude, entry, approach);
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
 *  across the formation. 1 = the pose returns FULLY to the parked
 *  #services scale/distance (ADR-049 Update 5, owner: the mark should be
 *  "way bigger" at the vision beat — was 0.5, a halfway release that left
 *  the mark ~87% of parked apparent size). CONTINUUM_SCALE_BOOST below
 *  then carries it PAST parked. */
export const CONTINUUM_RECEDE_RELEASE = 1;

/** Scale multiplier the mark grows TOWARD (riding the same formation
 *  clock) ON TOP of the fully-released parked pose — the vision-beat hero
 *  size, deliberately LARGER than the #services centerpiece. Identity at
 *  formT = 0 (byte-identical pre-exit); with the full recede release the
 *  continuum mark reads ~1.45× its previous apparent size. */
export const CONTINUUM_SCALE_BOOST = 1.25;

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
