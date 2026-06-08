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
 * The stage's epilogue span is ~300svh, so each 0.1 of
 * epilogueProgress is ~30svh — roughly one viewport.
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

/** Each band's [start, end] in epilogueProgress (0..1). */
export const EPILOGUE_BANDS = {
  /** Build header + ShellStack (sources / surfaces lanes + pips) +
   *  source/surface DOM labels + Encode orbits/cardinals + gimbal
   *  armillary rings fade OUT. Sized to match the Navigate->Encode
   *  and Encode->Build header fade windows so the Build chapter
   *  exits on the same cadence as the prior chapters. After this
   *  band the substrate is just the wireframe globe — the planet. */
  BUILD_OUT: { start: 0.0, end: 0.22 } as const,

  /** Camera flies in toward the substrate AND the substrate scales
   *  up to planet size. Wide window so the approach feels like a
   *  genuine spaceship descent, not a snap. Overlaps with the back
   *  half of BUILD_OUT so the planet is already starting to grow as
   *  the corridor chrome clears. */
  APPROACH: { start: 0.1, end: 0.62 } as const,

  /** Camera orbits up over the pole and tilts so the surface fills
   *  the bottom of the viewport and the limb reads as the horizon.
   *  Starts mid-APPROACH so the tilt and the grow blend into one
   *  continuous descent. */
  LAND: { start: 0.55, end: 0.92 } as const,

  /** Top-centre "billions" title fades in. Starts shortly before
   *  LAND finishes so the title is settled at peak landing. */
  TITLE_IN: { start: 0.7, end: 0.9 } as const,
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
