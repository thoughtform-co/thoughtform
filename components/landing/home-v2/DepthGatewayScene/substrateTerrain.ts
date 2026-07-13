/**
 * substrateTerrain — the pure heightfield math of the substrate realm
 * (the latent-topography valley below the Build station flight line).
 *
 * The relief math extracted from `SubstrateTopography.tsx` so the
 * constants + `terrainHeight()` live in one testable module with no
 * three and no DOM — importable from anywhere in the corridor.
 *
 * The constants here are the single source of truth; `SubstrateTopography`
 * imports them back. Do NOT retune them here without re-checking the
 * realm composition at the Build park (ADR-018 "same landmarks every
 * visit" — the field is deterministic).
 */

import { STATION_INTELLIGENCE } from "./sceneGeom";

// ── Camera-frame constants (desktop tuning view) ────────────────

export const INT_Z = STATION_INTELLIGENCE.position[2];
/** Camera Z when parked at Build — terrain composition + unfurl
 *  depth normalization are computed against this viewpoint. */
export const PARK_CAM_Z = INT_Z + STATION_INTELLIGENCE.parkDistance;

/** tan(horizontal half-FOV) at the desktop tuning frame: 38°
 *  vertical FOV, ~16:9 aspect. Used for frustum-width row sizing
 *  and the unfurl's lateral-fan screen-x term. */
export const HFOV_TAN = 0.612;

// ── Terrain layout ───────────────────────────────────────────────

/** Terrain Z span. The near edge starts where ground first enters
 *  the parked camera's lower frame edge (≈ 8 units ahead at the
 *  valley depth below) — nearer rows would never be visible from
 *  the park and would only waste points. */
export const REALM_Z_NEAR = INT_Z - 1.5;
export const REALM_Z_FAR = INT_Z - 52;

/** Row Z distribution bias (> 1 packs rows toward the near edge —
 *  perspective compresses the far rows on screen anyway). */
export const REALM_ROW_BIAS = 1.18;

/** Row width margin past the frustum so the valley always bleeds
 *  past the frame edges. */
export const REALM_WIDTH_MARGIN = 1.14;

/** Valley placement (v3.13 landscape-legibility revision). The
 *  camera stays exactly where the corridor parks it — the TERRAIN
 *  owns the read. Base floor is high enough to register as a
 *  landscape inside Build while still clearing the sphere/copy band;
 *  the stronger far lift keeps the horizon line present. */
export const REALM_BASE_Y = -2.75;
export const REALM_HORIZON_LIFT = 0.72;

/** Valley cross-profile: the floor stays deep under the optical
 *  axis and BOWLS upward toward the frame edges — distant ridge
 *  flanks rising at the periphery. */
export const REALM_BOWL_RISE = 1.12;
export const REALM_BOWL_POWER = 1.8;

/** Relief amplitude: calm basin floor, stronger ridges at the
 *  flanks. */
export const REALM_BASIN_AMP = 0.26;
export const REALM_EDGE_AMP = 1.25;
export const REALM_EDGE_POWER = 1.65;

/** Hard ceiling so no crest ever climbs toward the sphere/copy
 *  band even where the sine stack aligns with the bowl rise. */
export const REALM_Y_CEILING = -1.05;

// ── Heightfield ──────────────────────────────────────────────────

/** Layered-sine relief over the valley bowl. */
export function terrainHeight(x: number, z: number, edgeT: number, rowT: number): number {
  const rolling =
    0.42 * Math.sin(x * 0.19 + z * 0.115 + 1.7) +
    0.27 * Math.sin(x * 0.45 - z * 0.085 + 4.2) +
    0.6 * Math.sin(x * 0.065 + z * 0.05 + 2.4);
  const amp = REALM_BASIN_AMP + REALM_EDGE_AMP * Math.pow(edgeT, REALM_EDGE_POWER);
  const bowl = REALM_BOWL_RISE * Math.pow(edgeT, REALM_BOWL_POWER);
  const base = REALM_BASE_Y + rowT * REALM_HORIZON_LIFT + bowl;
  return Math.min(REALM_Y_CEILING, base + rolling * amp);
}
