/**
 * epilogueTimeline — single source of truth for the corridor's
 * post-Build epilogue (ADR-018 epilogue v4 "the flywheel in practice").
 *
 * The corridor saturates at `paintProgress === 1` (camera parked at
 * CAMERA_END, sphere parked at Intelligence). The epilogue then takes
 * over via the independent `epilogueProgress` channel (0..1) written
 * by `useDepthScroll`. Every painter that needs to react to the
 * epilogue reads its own SUB-BAND off this table so the choreography
 * stays declarative.
 *
 * v4 narrative (the flywheel in practice):
 *
 *   1. HEADER_OUT — Build station header ("Build on the substrate.")
 *      fades out so the centred cartouche cedes the frame to the
 *      docked artifact + the new flywheel panel.
 *
 *   2. DOCK — The whole substrate composition (gimbal sphere +
 *      sources lanes + surfaces fan + per-row chips + cardinal
 *      labels + projected brandmark) shrinks and slides RIGHT into
 *      the +X half of the viewport. Camera stays parked at
 *      CAMERA_END — the WORLD docks, not the camera.
 *
 *   3. TITLE_IN — The flywheel panel's kicker + title "The flywheel
 *      in practice." fades up on the LEFT half of the viewport.
 *
 *   4. FRAME_1 / FRAME_2 / FRAME_3 — Three retro-futuristic HUD
 *      frames scroll into view one by one and ACCUMULATE
 *      (Navigate / Encode / Build applied practically). Each frame
 *      stays visible once revealed; the panel ends with all three
 *      stacked beside the docked artifact.
 *
 * Design contract: every band consumer composes additively with the
 * parked corridor. At `epilogueProgress === 0` every band returns 0,
 * so the corridor->epilogue handoff is byte-identical inside the
 * calibrated corridor.
 *
 * Authoring rule: bands are [start, end] in epilogueProgress space.
 * The stage's epilogue span is ~440svh after v4 (2026-06-10 flywheel
 * pass; was 200svh planet-landing tail), so each 0.10 of
 * epilogueProgress is ~44svh — about half a viewport.
 */

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
 *  v4 (2026-06-10 flywheel pass): the planet-landing bands
 *  (BUILD_OUT / APPROACH / LAND / TITLE_IN-billions) are gone. The
 *  artifact stays visible — sphere, lanes, surface fan, chips, the
 *  Navigate/Encode/Build cardinal labels, and the projected
 *  brandmark all dock together. Only the Build station HEADER fades
 *  (HEADER_OUT) because it would compete with the flywheel title. */
export const EPILOGUE_BANDS = {
  /** Build station header ("Build on the substrate.") fades out so
   *  the docked artifact + flywheel panel claim the frame. The
   *  rest of the Build composition (sources / surfaces / chips /
   *  cardinals / brandmark) STAYS — it is what we are docking. */
  HEADER_OUT: { start: 0.0, end: 0.1 } as const,

  /** The whole gyro assembly (sphere + lanes + fan + chips +
   *  cardinals + projected brandmark) shrinks and slides right into
   *  the +X half of the viewport. Camera stays parked. Composes
   *  through `getEpilogueDockTransform` in `sceneGeom.ts`. */
  DOCK: { start: 0.04, end: 0.24 } as const,

  /** Flywheel panel TITLE ("The flywheel in practice.") fades up on
   *  the LEFT half. Starts a touch before DOCK ends so the artifact
   *  is on its way to its docked seat as the title arrives. */
  TITLE_IN: { start: 0.14, end: 0.28 } as const,

  /** Frame 1 — 01 NAVIGATE: every team starts here. Workshop
   *  manifest. Scrolls into view; once revealed, persists. */
  FRAME_1: { start: 0.28, end: 0.46 } as const,

  /** Frame 2 — 02 ENCODE: the work feeds the layer. Record
   *  pipeline. Persists. */
  FRAME_2: { start: 0.48, end: 0.66 } as const,

  /** Frame 3 — 03 BUILD: patterns become tools. Pattern detector
   *  graduating to a tool. Persists. */
  FRAME_3: { start: 0.68, end: 0.86 } as const,
} as const;

/** Helper that returns the eased 0..1 reveal for a named band. */
export function epilogueBand(epilogueProgress: number, band_: keyof typeof EPILOGUE_BANDS): number {
  const w = EPILOGUE_BANDS[band_];
  return band(epilogueProgress, w.start, w.end);
}

// ── Dock transform tunables ──────────────────────────────────────
//
// `getEpilogueDockTransform` in `sceneGeom.ts` reads these to compute
// the per-frame world-X offset + uniform scale applied to the gyro
// assembly during the DOCK band. They live here next to the bands so
// the whole epilogue choreography stays in one declarative file.

/** Final dock offset in NDC half-width units at peak DOCK. The
 *  assembly centre slides this fraction of the camera frustum's
 *  half-width at the parked Build distance into the +X half of the
 *  viewport. 0.28 puts the sphere centre at ~64% viewport width.
 *  Tuned against the SURFACE chips, which anchor `left-center` at
 *  their fan tips and extend RIGHT (outward): at 0.42 the chips
 *  cropped past the right HUD rail; 0.28 (paired with the 0.54
 *  dock scale) keeps the rightmost chip clear of the right depth
 *  gauge's tick numbers on 1280-1680 viewports. */
export const EPILOGUE_DOCK_OFFSET_NDC = 0.28;

/** Final uniform scale multiplier applied to the gyro assembly at
 *  peak DOCK (composes with parked `GYRO_ASSEMBLY_SCALE`). 0.54
 *  shrinks the sphere to ~54% of its parked apparent size — small
 *  enough that both chip columns clear the flywheel panel (left)
 *  and the depth gauge (right), large enough that the lanes /
 *  surface fan / chip column still read as a live diagram, not a
 *  thumbnail. */
export const EPILOGUE_DOCK_SCALE = 0.54;
