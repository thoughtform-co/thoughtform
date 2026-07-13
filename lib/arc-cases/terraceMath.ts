// Arc Cases Terrace — pure math for the Build-park cases screen
// (ADR-034, supersedes the ADR-033 orbit). The terrace is CLICK-owned:
// one damped arm level (the feature's only clock) drives the camera's
// lateral shift, the screen's rise-from-the-terrain envelope, and the
// substrate realm boost; the Build-band gate confines everything to the
// park. `dampLevel` / `arcBandFactor` carry over verbatim from the
// retired orbitMath — the band + epilogue-kill contract (and its
// services-ring exclusivity) is unchanged.
//
// Kept free of DOM/three so it stays unit-testable
// (tests/lib/arc-cases-terrace.test.ts). Consumed by
// components/landing/home-v2/arc-cases/ArcCasesTerraceScreen.tsx,
// FlyingCameraRig, useWorldDomTracker, and SubstrateTopography.

import { lerp, smootherstep } from "@/lib/services-ring/ringMath";

/** Number of production cases — one screen, four faces. */
export const CASE_COUNT = 4;

/** Wrapping prev/next step: slot 3 → 0 forward, 0 → 3 back. The
 *  cumulative-index + shortest-delta machinery died with the physical
 *  ring — a crossfading screen has no rotation to take "the short way". */
export function stepSlot(slot: number, dir: 1 | -1): number {
  return (((slot + dir) % CASE_COUNT) + CASE_COUNT) % CASE_COUNT;
}

/** Exponential damp rate (per second) for the arm level — ≈0.45s to
 *  settle. The ONLY clock the terrace owns: camera shift, screen rise,
 *  and realm boost all ride this level (disarm plays everything
 *  backwards); everything else is scroll-owned band gating. */
export const ARC_ARM_RATE = 2.2;

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

/** Build-band gate on the corridor paint clock: the terrace exists only
 *  once the intelligence station has resolved (stack accretion runs
 *  [0.875, 0.95]; park ≈ 0.9225), and never before. Rising edge only —
 *  paintProgress ends at 1.0 inside the Build station; the epilogue kill
 *  below owns the far side. */
export const ARC_BAND_IN: readonly [number, number] = [0.845, 0.9];

/** Epilogue kill window: the terrace is fully gone across the first tenth
 *  of the epilogue scroll (faster than the caption's BUILD_OUT [0, 0.22],
 *  and long before the corridor-exit dissipate that admits the services
 *  ring — the ADR-033 exclusivity contract, carried over unchanged). */
export const ARC_EPILOGUE_KILL: readonly [number, number] = [0.0, 0.1];

/** Scroll-owned visibility gate for the whole instrument — the product of
 *  the Build-band rise and the epilogue kill. Multiplied against the arm
 *  level every frame, so scrolling away collapses the terrace even if the
 *  store were somehow still armed (belt-and-suspenders under the
 *  auto-disarm watcher). */
export function arcBandFactor(paintProgress: number, epilogueProgress: number): number {
  const bandIn = smootherstep(ARC_BAND_IN[0], ARC_BAND_IN[1], paintProgress);
  const epilogueKill =
    1 - smootherstep(ARC_EPILOGUE_KILL[0], ARC_EPILOGUE_KILL[1], epilogueProgress);
  return bandIn * epilogueKill;
}

/* ── Camera lateral shift ────────────────────────────────────────── */

/** Full lateral camera shift at arm level 1, in world units. At the park
 *  the camera sits ~6.2 from the sphere; half a frame width there is
 *  ≈ 3.8 units, so 2.1 puts the sphere ~22% from the left edge with the
 *  SURFACES fan just left of centre. Lab-tunable 0–3. */
export const TERRACE_CAMERA_WINDOW: readonly [number, number] = [0, 0.72];
export const TERRACE_CLOAK_WINDOW: readonly [number, number] = [0.08, 0.86];

/** Camera X offset for an arm level — linear, EXACT 0 at level 0 (the
 *  flag-off / disarmed frames carry no residue; the epilogue kill in
 *  `arcBandFactor` guarantees 0 before the planet flyover). Applied
 *  additively to BOTH camera position.x and lookAt.x (pure translation,
 *  forward stays −Z) in FlyingCameraRig AND useWorldDomTracker's mirror
 *  camera — the two MUST read the same channel or DOM copy desyncs. */
export function terraceCameraEnvelope(level: number): number {
  return smootherstep(TERRACE_CAMERA_WINDOW[0], TERRACE_CAMERA_WINDOW[1], level);
}

/** Terrain-contour lift window (consumed by the shared terrain shader). */
export function terraceCloakEnvelope(level: number): number {
  return smootherstep(TERRACE_CLOAK_WINDOW[0], TERRACE_CLOAK_WINDOW[1], level);
}

/* ── Screen rise ─────────────────────────────────────────────────── */

/** How far below its parked pose the screen starts, in world units —
 *  buried in the terrain, rising through the point field on arm. */
export const TERRACE_RISE_DEPTH = 1.4;

/** Arm-level window across which the rise plays (smootherstep). */
export const TERRACE_RISE_WINDOW: readonly [number, number] = [0.2, 0.9];

/** Arm-level window across which the screen fades in — front-loaded so
 *  the slab is visible while still emerging from the ground. */
export const TERRACE_FADE_WINDOW: readonly [number, number] = [0.3, 0.68];

export interface TerraceEnvelope {
  /** 0 = fully buried, 1 = parked. */
  riseT: number;
  opacity: number;
}

/** Rise + fade envelope from the arm level. EXACT zero at level = 0 and
 *  exact identity at level = 1 (the flag-off / disarmed frames carry no
 *  residue). Reversible by construction: the level falling plays the
 *  same envelope out. */
export function terraceRiseEnvelope(level: number): TerraceEnvelope {
  return {
    riseT: smootherstep(TERRACE_RISE_WINDOW[0], TERRACE_RISE_WINDOW[1], level),
    opacity: smootherstep(TERRACE_FADE_WINDOW[0], TERRACE_FADE_WINDOW[1], level),
  };
}

/* ── Substrate realm boost ───────────────────────────────────────── */

/** Target for the substrate realm envelope while the terrace is armed:
 *  the ground the screen stands on resolves fully (the scroll envelope
 *  is only ~0.72 at the park), and returns to scroll ownership on
 *  disarm. `max` keeps scroll ahead whenever scroll IS ahead — the
 *  boost can only add, never suppress (scroll-symmetric on the way
 *  out of the band). */
export function terraceRealmTarget(scrollEnvelope: number, level: number): number {
  return Math.max(scrollEnvelope, level);
}

/* ── Armed dims (DOM overlays only) ──────────────────────────────── */

/** How far the SURFACES stack-label DOM chips (Cursor / Claude / Web
 *  app …) sink while the terrace is armed — their anchors project onto
 *  the centre of the shifted frame, straight over the screen, and text
 *  crossing the screenshot reads as noise. The CANVAS streams/pips stay
 *  fully lit (the surfaces fan remains visible frame-left — the owner's
 *  framing call); only the label text recedes. */
export const TERRACE_SURFACE_LABEL_DIM = 0.8;

/** SOURCES label chips sink softly — mostly off-frame after the shift;
 *  present but recessive. */
export const TERRACE_SOURCE_LABEL_DIM = 0.35;

/** Caption-card iris while armed — the fixed bottom-centre Build
 *  caption otherwise overlaps the screen's footer band. Restores on
 *  disarm (rides the same damped level). */
export const TERRACE_CAPTION_DIM = 0.8;

/* ── Content crossfade ───────────────────────────────────────────── */

/** Per-second damp rate for the case-face crossfade on step (~0.17s to
 *  settle) — snappy enough that rapid stepping reads as responsive, slow
 *  enough to read as a feed swap rather than a hard cut. */
export const TERRACE_CROSSFADE_RATE = 6;
