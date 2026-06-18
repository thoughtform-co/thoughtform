/**
 * epilogueTimeline — single source of truth for the corridor's
 * post-Build epilogue (ADR-018 epilogue v3 "planet landing").
 *
 * The corridor saturates at `paintProgress === 1` (camera parked at
 * CAMERA_END, sphere parked at Intelligence). The epilogue then takes
 * over via the independent `epilogueProgress` channel (0..1) written
 * by `useDepthScroll`. Every painter that needs to react to the
 * epilogue reads its own SUB-BAND off this table so the choreography
 * stays declarative.
 *
 * v3 narrative (substrate-as-planet landing):
 *
 *   1. BUILD_OUT — Build chapter clears: header + sources/interfaces
 *      stack + Encode orbits + cardinal labels + gimbal armillary
 *      rings all fade out. Only the wireframe substrate globe stays,
 *      becoming the planet we're about to land on.
 *
 *   2. APPROACH — Camera flies in from the parked CAMERA_END toward
 *      the substrate. The substrate globe scales up to planet size
 *      (so the small instrument becomes a world). The pointer-bank
 *      on the gyro calms to 0 (planets don't wobble with the mouse).
 *      The DOM guiding-star brandmark fades — once we're inside the
 *      planet radius it would sit at the centre of the world.
 *
 *   3. LAND — Camera orbits up over the pole and tilts so the surface
 *      fills the bottom of the viewport and the limb of the planet
 *      reads as the horizon. We end "standing on the substrate".
 *
 *   4. TITLE_IN — "The labs just bet billions on the same layer."
 *      fades in at the top-centre of the viewport (in the sky above
 *      the horizon). The end of the 3D space; the title marks the
 *      transition to whatever section comes after.
 *
 * Authoring rule: bands are [start, end] in epilogueProgress space.
 * The stage's epilogue span is ~200svh after polish round 2
 * (2026-06-10; was 300svh), so each 0.1 of epilogueProgress is
 * ~20svh — about one fifth of a viewport.
 */

import { EPILOGUE_PLANET_GROW } from "@/components/landing/home-v2/DepthGatewayScene/shell/shellGeom";

/** Closed-form smoothstep used by every band consumer. Equivalent to
 *  GLSL's `smoothstep(a, b, p)` — eases the 0..1 ramp at both ends so
 *  band crossings don't kink. */
export function band(p: number, edge0: number, edge1: number): number {
  if (edge1 <= edge0) return p >= edge1 ? 1 : 0;
  const t = (p - edge0) / (edge1 - edge0);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}

/** Each band's [start, end] in epilogueProgress (0..1).
 *
 *  Polish round 2 (2026-06-10): bands retuned so the title fades
 *  in DURING the landing arc instead of after it, and the camera
 *  flight resolves earlier. Combined with the shorter physical
 *  epilogue span (200svh vs 300svh), the Build → "billions"
 *  handoff now resolves in ~1 viewport of scroll. */
export const EPILOGUE_BANDS = {
  /** Build header + ShellStack (sources / surfaces lanes + pips) +
   *  source/surface DOM labels + Encode orbits/cardinals + gimbal
   *  armillary rings fade OUT. Sized to match the Navigate->Encode
   *  and Encode->Build header fade windows so the Build chapter
   *  exits on the same cadence as the prior chapters. After this
   *  band the substrate is just the wireframe globe — the planet. */
  BUILD_OUT: { start: 0.0, end: 0.22 } as const,

  /** Camera flies in toward the substrate AND the substrate scales
   *  up to planet size. Polish round 2: end pulled 0.62 -> 0.56 so
   *  the planet grow finishes earlier, leaving room for LAND to
   *  start during APPROACH's back half. */
  APPROACH: { start: 0.1, end: 0.56 } as const,

  /** Camera orbits up over the pole and tilts so the surface fills
   *  the bottom of the viewport and the limb reads as the horizon.
   *  Polish round 2: window pulled 0.55/0.92 -> 0.48/0.86 so the
   *  landing arc resolves earlier and overlaps the title fade. */
  LAND: { start: 0.48, end: 0.86 } as const,

  /** Top-centre "billions" title fades in. Polish round 2:
   *  pulled 0.7/0.9 -> 0.52/0.74 so the title rises DURING the
   *  landing arc (~1 viewport into the epilogue at the new 200svh
   *  span) instead of waiting until after it (~2.1 viewports at
   *  the old 300svh span). */
  TITLE_IN: { start: 0.52, end: 0.74 } as const,
} as const;

/** Helper that returns the eased 0..1 reveal for a named band. */
export function epilogueBand(epilogueProgress: number, band_: keyof typeof EPILOGUE_BANDS): number {
  const w = EPILOGUE_BANDS[band_];
  return band(epilogueProgress, w.start, w.end);
}

/** Uniform scale multiplier applied to the gimbal assembly across
 *  the EPILOGUE APPROACH band so the substrate globe grows into a
 *  planet. Composes on top of the parked `GYRO_ASSEMBLY_SCALE` in
 *  `BrandmarkAccretionShell.useFrame` (canvas) and
 *  `sceneGeom.gyroAssemblyWorldPosition` (DOM cardinal labels — they
 *  fade during BUILD_OUT, but stay welded while they fade).
 *
 *  Returns 1 inside the calibrated corridor (epilogueProgress == 0)
 *  so the corridor is byte-identical to its pre-epilogue self. */
export function getEpiloguePlanetScale(epilogueProgress: number): number {
  return 1 + (EPILOGUE_PLANET_GROW - 1) * epilogueBand(epilogueProgress, "APPROACH");
}

/** The dock handoff holds the globe as a centered instrument backdrop
 *  (not the fully landed surface POV). A late orbital pose where TITLE_IN
 *  has resolved and the sphere arc is still clearly visible behind the
 *  services copy. The camera eases into this pose so docking never pops. */
export const DOCKED_INSTRUMENT_EPILOGUE_POSE = 0.62;

// ────────────────────────────────────────────────────────────────────
// Dissipate clock (ADR-021 — corridor-exit zoom-dissipate)
//
// The dissipate is a SECOND clock, independent of `epilogueProgress`.
// It is written by `useCorridorExitScroll` from the live #services
// rect (the same `(vh - servicesRect.top) / vh` shape the retired
// cover-plane sweep used for `--handoff-cover`) and stored on the
// depth store as `dockProgress` while `docked === true`.
//
// At dissipate 0 the canvas is still showing the parked / docked
// epilogue pose (sphere held, BILLIONS title visible). At dissipate 1
// the sphere has scattered outward and faded, the camera has flown
// into the planet's footprint, and the destination section's own
// dark surface owns the viewport.
//
// Sub-bands inside the dissipate clock — each painter reads its own
// reveal off this table so the choreography stays declarative.
// ────────────────────────────────────────────────────────────────────

export const DISSIPATE_BANDS = {
  /** Smoky occluder core sheds early so the dissipating shell never
   *  reveals a hard silhouette behind it. The core was the only
   *  normal-blended body in the sphere (every other element is
   *  additive); leaving it longer than the surface fade would leave
   *  a dark disc floating where the planet used to be. */
  CORE_SHED: { start: 0.0, end: 0.42 } as const,

  /** Shell vertices push radially outward across the whole dissipate.
   *  The cassette geometry stays put; only the dotted-shell radius
   *  multiplier is scaled, which (combined with PARTICLE_FADE) reads
   *  as the sphere "atomizing" outward into the camera. */
  SHELL_SCATTER: { start: 0.0, end: 1.0 } as const,

  /** All particle materials (globe dots, surface shell, ambient
   *  particles, atmosphere) fade to 0 across the back half so the
   *  canvas is effectively empty by dissipate ~0.9. */
  PARTICLE_FADE: { start: 0.42, end: 0.95 } as const,

  /** BILLIONS signal block + ticker opacity fade. The signal group +
   *  ticker now EXIT by translation (a full-viewport, scroll-coupled
   *  upward lift in `CorridorStationHeaders`), so the visible exit is the
   *  push-out, not the fade. This band is pushed late on purpose: by the
   *  time it starts the group has already cleared the top of the viewport
   *  on normal/tall viewports, so the fade is only a safety for short
   *  viewports and the dock release (it must reach 0 before the dock
   *  detaches at dissipate >= 0.999). Earlier tunings (0.04->0.42, then
   *  0.16->0.72) faded the text/ticker while it was still on screen, which
   *  read as "it just disappears" instead of "it gets pushed out". */
  SIGNAL_OUT: { start: 0.72, end: 0.95 } as const,
} as const;

/** Eased 0..1 reveal for a named dissipate band. Same shape as
 *  `epilogueBand`. */
export function dissipateBand(
  dissipateProgress: number,
  bandKey: keyof typeof DISSIPATE_BANDS
): number {
  const w = DISSIPATE_BANDS[bandKey];
  return band(dissipateProgress, w.start, w.end);
}

/** Corridor-exit speed ramp (ADR-021; elegance pass 2026-06-18).
 *
 * The ONLY authored easing curve applied to the Services dissipate
 * clock. Consumers use the result DIRECTLY (no second smoothstep) so
 * the sphere expansion reads as one authored curve — an earlier
 * revision stacked THREE smoothsteps (hook + `FlyingCameraRig` +
 * `getCorridorExitCameraPose`), which read as "wait, then lurch", so
 * that single-curve contract is preserved.
 *
 * Curve: `smootherstep` (`6t⁵ − 15t⁴ + 10t³`) — an ease-IN-OUT S with
 * ZERO velocity AND acceleration at both ends. The previous ease-OUT
 * cubic (`1 − (1 − t)³`) had its MAXIMUM velocity at `t = 0`, so the
 * camera leapt into the sphere the instant `#services` entered — the
 * "harsh, abrupt" onset. smootherstep starts the fly-in from rest and
 * settles gently, matching the zero-velocity-onset curves the epilogue
 * flight (`getEpilogueCameraPose`) already uses, so the corridor →
 * Services exit feels like the same instrument as the canvas → BILLIONS
 * epilogue ramp that precedes it.
 *
 * The sphere/camera consumers ALSO ride a temporal follower
 * (`getSmoothedDissipate`, mirroring the epilogue's motion-follower
 * channel) so wheel-notch quantization melts into a continuous glide —
 * the other half of what makes the epilogue read as fluid. That is a
 * temporal FILTER, not a second easing curve, so the single-authored-
 * curve contract above still holds.
 */
export function corridorExitSpeedRamp(rawProgress: number): number {
  const t = Math.max(0, Math.min(1, rawProgress));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Radial scatter multiplier for the dotted-shell radius across the
 *  dissipate clock. Returns 1.0 at dissipate 0 (parked / docked, no
 *  scatter), grows to `1 + DISSIPATE_SHELL_SCATTER_AMP` at dissipate
 *  1. Applied multiplicatively on top of the existing
 *  `unfold.shellRadiusMul` and the epilogue planet scale, so all the
 *  existing radius lerps remain byte-identical when dissipate is 0. */
export const DISSIPATE_SHELL_SCATTER_AMP = 1.8;
export function dissipateShellScatter(dissipateProgress: number): number {
  return 1 + DISSIPATE_SHELL_SCATTER_AMP * dissipateBand(dissipateProgress, "SHELL_SCATTER");
}

/** Atmosphere fresnel-rim ENVELOPE across the dissipate clock —
 *  a brief BLOOM peak followed by a fade to 0. Composes
 *  multiplicatively with the existing APPROACH-band atmosphere
 *  reveal (caller does the multiply), so the resting epilogue
 *  atmosphere is untouched when dissipate is 0 (envelope returns 1).
 *
 *  Shape: 1 at dissipate 0 (no change) → peak ~1.8 at dissipate 0.35
 *  (the bloom moment, like a thin Earth atmosphere flaring just
 *  before atmospheric re-entry) → 0 by dissipate 0.92. */
const DISSIPATE_ATMOSPHERE_PEAK_AT = 0.35;
const DISSIPATE_ATMOSPHERE_PEAK_MUL = 1.8;
const DISSIPATE_ATMOSPHERE_END = 0.92;
export function dissipateAtmosphereEnvelope(dissipateProgress: number): number {
  if (dissipateProgress <= 0) return 1;
  if (dissipateProgress >= DISSIPATE_ATMOSPHERE_END) return 0;
  if (dissipateProgress < DISSIPATE_ATMOSPHERE_PEAK_AT) {
    const t = band(dissipateProgress, 0, DISSIPATE_ATMOSPHERE_PEAK_AT);
    return 1 + (DISSIPATE_ATMOSPHERE_PEAK_MUL - 1) * t;
  }
  // Falling edge from peak → 0.
  const t = band(dissipateProgress, DISSIPATE_ATMOSPHERE_PEAK_AT, DISSIPATE_ATMOSPHERE_END);
  return DISSIPATE_ATMOSPHERE_PEAK_MUL * (1 - t);
}

/** Per-painter opacity multiplier across the dissipate. Returns 1 at
 *  dissipate 0 (no change), ramps to 0 across PARTICLE_FADE so the
 *  sphere is gone by ~dissipate 0.95. Caller multiplies onto its
 *  existing `uOpacity` so dissipate 0 keeps the epilogue pose intact. */
export function dissipateOpacityMultiplier(dissipateProgress: number): number {
  return 1 - dissipateBand(dissipateProgress, "PARTICLE_FADE");
}

/** Default opacity floor for interior sphere particles during the
 *  dissipate. The narrative is "we have entered the sphere" — the
 *  surface shell scatters outward and dissolves, but ambient particles
 *  inside the volume remain visible (muted) so the camera reads as
 *  flying THROUGH the sphere rather than into an empty hole. */
export const DISSIPATE_INTERIOR_OPACITY_FLOOR = 0.18;

/** Interior-particle opacity multiplier — same shape as
 *  `dissipateOpacityMultiplier` (1 at dissipate 0, monotonic across
 *  PARTICLE_FADE), but it settles on `floor` instead of 0 at the tail
 *  so the interior cloud stays softly visible after the surface shell
 *  has dissolved. Caller multiplies onto its existing `uOpacity` so
 *  dissipate 0 stays byte-identical to the parked epilogue pose. */
export function dissipateInteriorOpacityMultiplier(
  dissipateProgress: number,
  floor: number = DISSIPATE_INTERIOR_OPACITY_FLOOR
): number {
  const f = Math.max(0, Math.min(1, floor));
  return 1 - (1 - f) * dissipateBand(dissipateProgress, "PARTICLE_FADE");
}

/** Smoky occluder-core opacity multiplier — sheds early on CORE_SHED
 *  so the dissipating shell never reveals a hard silhouette disc. */
export function dissipateCoreMultiplier(dissipateProgress: number): number {
  return 1 - dissipateBand(dissipateProgress, "CORE_SHED");
}
