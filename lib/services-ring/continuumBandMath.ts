// Continuum band — pure math for the MARK-BAND HIGHLIGHT (ADR-049 Update 3).
//
// The tool ↔ collaborator spectrum is the brandmark ITSELF: at #continuum the
// mark comes closer / bigger and its INNER HORIZONTAL BAND lights up left →
// right — repurposing the most important brand element instead of adding
// chrome (orbits/rails) around it. (Supersedes both the Update-1 DOM axis
// concept and the same-day waist-ring beam layer, which the owner rejected:
// "I don't want the orbits around it for that Continuum.")
//
// The highlight lives in the volumetric mark shader (volumetricShaders.ts):
// particles whose SETTLED home (aArmHome) falls inside a horizontal slab
// [bandY ± bandHalf] get selected; the band carries a soft BASE glow and a
// bright PENDULUM head that swings Tool ↔ Collaborator with a comet TRAIL
// decaying behind its direction of travel (owner: "left right left right
// like a pendulum keeps swinging… with a bit of a light trail so it's not
// just a block of light moving"). This module supplies the pure,
// unit-testable envelopes + defaults:
//
//   · bandGainT(formT)     — master gain vs the formation clock (identity 0
//     pre-continuum; the band only exists once the mark has begun re-inking).
//   · bandPendulumX(phase) — the head's x01, eased at the turnarounds like a
//     pendulum (slow at the extremes, fast through the middle); phase 0 = the
//     Tool end, so the first half-swing is always left → right.
//   · bandPendulumDir(phase) — ±1 direction of travel; the shader stretches
//     the trail opposite this.
//
// Kept free of DOM/three (tests/lib/continuum-band-math.test.ts). Consumed by
// VolumetricBrandmarkArtifact (lab path — /test/continuum-band) and, once the
// look is signed off, ported to the production BrandmarkPhysicsCore shaders.

import { clamp01, lerp } from "@/lib/math";
import { smootherstep } from "./ringMath";

/* ── Band slab geometry (mark-local units — the sampler normalizes the mark
 * to MARK_SCALE 1.74 full extent, i.e. ±0.87 half-extent) ─────────────────── */

/** Mark half-extent in sampler space (sampleBrandmark3D MARK_SCALE / 2). */
export const MARK_HALF_EXTENT = 0.87;

/** Band slab centre y (mark-local). 0 = the mark's vertical centre; nudge if
 *  the inner horizontal band sits off-centre in the GLB. Lab-tunable. */
export const BAND_Y = 0.0;
/** Band slab half-height. */
export const BAND_HALF = 0.1;
/** Softness of the slab's y edges (smoothstep feather). */
export const BAND_SOFT = 0.06;
/** Half-width of the band's x extent (clamp so the sweep normalization spans
 *  the mark's full width by default). */
export const BAND_X_HALF = MARK_HALF_EXTENT;

/* ── Highlight look ──────────────────────────────────────────────────────── */

/** Head (the bright travelling glow) gaussian half-width, in x01 units. */
export const BAND_HEAD_W = 0.07;
/** Head brightness relative to the base band glow. */
export const BAND_HEAD_GAIN = 1.1;
/** Point-size boost on lit band particles (× base size at full highlight). */
export const BAND_SIZE_BOOST = 0.32;
/** Resting base glow of the whole band (× the master gain) — the softly lit
 *  axis the pendulum head travels along, so the spectrum reads as a defined
 *  band rather than a lone comet in the dark. */
export const BAND_BASE_GAIN = 0.35;
/** Comet-trail e-folding length behind the head (x01 units) — the light
 *  smear that decays away opposite the direction of travel. */
export const BAND_TRAIL_LEN = 0.28;
/** Trail brightness at the head (decaying to 0 over BAND_TRAIL_LEN). */
export const BAND_TRAIL_GAIN = 0.6;

/* ── Envelopes over the formation clock (continuumFormT 0 → 1) ───────────── */

/** Master gain window — the highlight exists only once the mark's re-ink is
 *  under way (CONTINUUM_FORM_PRELUDE lands at 0.4 during the #about slide, so
 *  the band starts breathing in as the copy departs). The pendulum's first
 *  half-swing (Tool → Collaborator, phase 0) plays as the gain opens — the
 *  owner's "lights up left to right" entrance. */
export const BAND_GAIN_WINDOW: readonly [number, number] = [0.28, 0.45];

/** Master highlight gain for a formation level. Exactly 0 at formT = 0. */
export function bandGainT(formT: number): number {
  return smootherstep(BAND_GAIN_WINDOW[0], BAND_GAIN_WINDOW[1], clamp01(formT));
}

/* ── The pendulum (the resting left ↔ right swing) ──────────────────────────
 * The head swings Tool ↔ Collaborator continuously, eased at the turnarounds
 * exactly like a pendulum (slow at the extremes, fast through the middle —
 * the smootherstep of the triangle wave, the same shape as the shared crail
 * cadence). A comet trail (BAND_TRAIL_*) stretches BEHIND the direction of
 * travel so the motion reads as a light with a tail, not a block. The host
 * resets the phase to 0 at formation start so the first swing is always
 * left → right from Tool. */

/** Seconds per full swing cycle (left → right → left) — the crail cadence. */
export const BAND_SWING_PERIOD_S = 7;
/** Swing endpoints in x01 (slightly inset so the head's glow never clips at
 *  the band ends where the Tool/Collaborator labels dock). */
export const BAND_SWING_MIN = 0.04;
export const BAND_SWING_MAX = 0.96;

/** Pendulum head x01 for a phase ∈ [0, ∞): min at whole phases (Tool, left),
 *  max at half phases (Collaborator, right), eased at the turns. */
export function bandPendulumX(
  phase: number,
  min: number = BAND_SWING_MIN,
  max: number = BAND_SWING_MAX
): number {
  const p = phase - Math.floor(phase); // wrap to [0, 1)
  const tri = 1 - Math.abs(2 * p - 1); // 0 → 1 → 0 as p: 0 → 0.5 → 1
  return lerp(min, max, smootherstep(0, 1, tri));
}

/** Direction of travel for a phase: +1 while swinging right (first half of
 *  the cycle), −1 while swinging left — the trail stretches opposite this. */
export function bandPendulumDir(phase: number): 1 | -1 {
  const p = phase - Math.floor(phase);
  return p < 0.5 ? 1 : -1;
}

/* ── The launch (the navigator detaches from the mark's seat) ───────────────
 * The crail choreography the slider keeps (ADR-049 Update 6): the reticle
 * CONDENSES at the mark's centre — the "AI lives here" seat, x01 0.5 — and
 * LAUNCHES out to the Tool pole as the instrument snaps together, then the
 * pendulum swing takes over from phase 0 (Tool end, so its first half-swing
 * reads left → right). The host accumulates launchT on the clamped frame
 * delta (never a wall clock) and resets it with the pendulum phase whenever
 * the band closes, so every (re-)entry replays seat → Tool → swing. */

/** Seconds for the seat → Tool launch leg (the crail's launch timing). */
export const BAND_LAUNCH_S = 1.1;

/** Launch head x01 for a launch progress t ∈ [0, 1]: the seat (0.5) eased
 *  out to the Tool end (BAND_SWING_MIN — the pendulum's phase-0 position,
 *  so the launch hands off to the swing value-continuously). */
export function bandLaunchX(t: number): number {
  return lerp(0.5, BAND_SWING_MIN, smootherstep(0, 1, clamp01(t)));
}
