/**
 * epilogueTimeline — single source of truth for the corridor's
 * post-Build epilogue (ADR-018 epilogue v4.1 "flywheel in practice,
 * Glyphic grid").
 *
 * The corridor saturates at `paintProgress === 1` (camera parked at
 * CAMERA_END, sphere parked at Intelligence). The epilogue then takes
 * over via the independent `epilogueProgress` channel (0..1) written
 * by `useDepthScroll`. Every painter that needs to react to the
 * epilogue reads its own SUB-BAND off this table so the choreography
 * stays declarative.
 *
 * v4.2 narrative (dock RIGHT + centred Glyphic-style grid):
 *
 *   1. HEADER_OUT — Build station header ("Build on the substrate.")
 *      fades out so the centred cartouche cedes the frame to the
 *      docked artifact + the new flywheel panel.
 *
 *   2. DOCK — The whole substrate composition (gimbal sphere +
 *      sources lanes + surfaces fan + per-row chips + cardinal
 *      labels + projected brandmark) shrinks and slides RIGHT into
 *      the +X half of the viewport. Camera stays parked at
 *      CAMERA_END — the WORLD docks, not the camera. (v4.1 docked
 *      leftward; v4.2 flips it back rightward and pulls the panel
 *      toward centre instead of hugging the right HUD rail.)
 *
 *   3. TITLE_IN — The flywheel panel's kicker + title "The flywheel
 *      in practice." fades up on the LEFT half of the viewport.
 *
 *   4. GRID_IN — Three minimal cards (Navigate / Encode / Build)
 *      settle as a STATIC GRID below the title. The panel applies
 *      a small per-card stagger off this single band so the three
 *      cards arrive together (within ~6svh) instead of revealing
 *      sequentially. Once landed they rest — there is no
 *      accumulating reveal in v4.1; the rest of the epilogue scroll
 *      is read time before the next section.
 *
 * Design contract: every band consumer composes additively with the
 * parked corridor. At `epilogueProgress === 0` every band returns 0,
 * so the corridor->epilogue handoff is byte-identical inside the
 * calibrated corridor.
 *
 * Authoring rule: bands are [start, end] in epilogueProgress space.
 * The stage's epilogue span is ~280svh after v4.1 (2026-06-10 Glyphic
 * grid pass; was 440svh in v4 with three accumulating frames), so
 * each 0.10 of epilogueProgress is ~28svh — about a third of a
 * viewport.
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
 *  v4.1 (2026-06-10 Glyphic grid pass): the FRAME_1/2/3 sequential
 *  reveals collapse into one `GRID_IN` band — the three cards now
 *  settle as a static grid (with a small per-card stagger applied
 *  inside `CorridorFlywheelPanel`) instead of accumulating one at a
 *  time. The epilogue stage shrinks from 440svh (v4) to 280svh (v4.1)
 *  to match the calmer choreography; DOCK keeps the same physical
 *  ~88svh runway, just at a higher fraction of the shorter epilogue. */
export const EPILOGUE_BANDS = {
  /** Build station header ("Build on the substrate.") fades out so
   *  the docked artifact + flywheel panel claim the frame. The
   *  rest of the Build composition (sources / surfaces / chips /
   *  cardinals / brandmark) STAYS — it is what we are docking. */
  HEADER_OUT: { start: 0.0, end: 0.16 } as const,

  /** The whole gyro assembly (sphere + lanes + fan + chips +
   *  cardinals + projected brandmark) shrinks and slides RIGHT into
   *  the +X half of the viewport. Camera stays parked. Composes
   *  through `getEpilogueDockTransform` in `sceneGeom.ts`. v4.2
   *  span: 0.06..0.38 of a 280svh epilogue ≈ 90svh, matching v4's
   *  88svh runway so the dock animation itself reads identically. */
  DOCK: { start: 0.06, end: 0.38 } as const,

  /** Flywheel panel TITLE ("The flywheel in practice.") fades up on
   *  the LEFT half. Starts before DOCK ends so the artifact is on
   *  its way to its docked seat as the title arrives. */
  TITLE_IN: { start: 0.22, end: 0.42 } as const,

  /** Single base band for the three Navigate / Encode / Build
   *  cards. `CorridorFlywheelPanel` derives a per-card window from
   *  this base + `GRID_IN_STAGGER` so the cards arrive together
   *  (~6svh apart) instead of revealing one at a time. After 0.66
   *  the cards rest; the trail to 1.0 (~95svh) is read time before
   *  the next section. */
  GRID_IN: { start: 0.42, end: 0.62 } as const,
} as const;

/** Per-card offset applied to `GRID_IN.start` / `GRID_IN.end` by the
 *  flywheel panel. `cardIndex * GRID_IN_STAGGER` shifts each card's
 *  band so Encode lands ~6svh after Navigate and Build ~6svh after
 *  Encode. Small enough that the eye reads the three as one settle,
 *  not a cascade. */
export const GRID_IN_STAGGER = 0.02;

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

/** Final dock offset in NDC half-width units at peak DOCK. POSITIVE
 *  in v4.2 because the assembly docks RIGHT (the flywheel panel now
 *  claims the LEFT half, pulled toward centre rather than hugging a
 *  HUD rail — Glyphic reference). The assembly centre slides this
 *  fraction of the camera frustum's half-width at the parked Build
 *  distance into the +X half of the viewport. +0.42 puts the sphere
 *  centre at ~71% viewport width. Tuned against the SOURCE chips
 *  (anchored `right-center` at their lane tips, extending LEFT
 *  toward the flywheel panel) and the SURFACE chips (anchored
 *  `left-center` at the fan tips, extending RIGHT toward the right
 *  HUD rail): +0.42 paired with the 0.54 dock scale keeps the
 *  rightmost surface chip clear of the right depth gauge's tick
 *  numbers and the leftmost source chip clear of the panel column
 *  on 1280-1680 viewports.
 *
 *  v4.2 tune (2026-06-11): +0.24 (was a brief +0.42 mirror that
 *  shoved the surface fan off the right edge). The offset is the
 *  centre shift in NDC half-widths — screen shift ≈ offset * vw/2 —
 *  so +0.24 lands the docked sphere centre at ~68% viewport width:
 *  far enough right to read as "on the right", close enough that
 *  the surface fan clears the right HUD rail and the source lanes
 *  clear the centred flywheel panel on the left. */
export const EPILOGUE_DOCK_OFFSET_NDC = 0.24;

/** Final uniform scale multiplier applied to the gyro assembly at
 *  peak DOCK (composes with parked `GYRO_ASSEMBLY_SCALE`). v4.2:
 *  0.48 (was 0.54) — a touch smaller so the docked diagram fits
 *  the slot between the centred flywheel panel (left) and the
 *  right HUD rail without the source/surface fans crowding either.
 *  Still large enough that the lanes / surface fan / chip column
 *  read as a live diagram, not a thumbnail. */
export const EPILOGUE_DOCK_SCALE = 0.48;
