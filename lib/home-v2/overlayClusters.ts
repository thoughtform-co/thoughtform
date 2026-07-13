/**
 * overlayClusters — pure geometry for the Arc's diegetic detail overlays
 * (ADR-032 Update 1). Shell-local offset math, no DOM/store, unit-tested.
 *
 * Encode: skill chips bloom in a RADIAL FAN around each cardinal node,
 * spread about that cardinal's OUTWARD ray so they radiate away from the
 * sphere. Build: tool chips CASCADE inward-left off the Web-app surface
 * chip (there is only ~0.4 world-units of headroom to the RIGHT of the
 * surfaces column before the HUD rail, so nothing may fan outward).
 *
 * All returned offsets are shell-local deltas added to a base anchor
 * position by the resolvers in `sceneGeom.ts`. Constants are lab-tunable
 * (see `/test/corridor-reveals`); the FUNCTIONS are what the tests pin.
 */

import type { SkillCardinal } from "@/components/landing/home-v2/reveals/revealData";

// ── Encode skill fan ──────────────────────────────────────────────────

export interface SkillFanTuning {
  /** Total angular spread of the fan (radians), about the outward ray. */
  spreadRad: number;
  /** Rotation of the fan centre off the pure outward ray (radians). */
  biasRad: number;
  /** Radial distance of each chip from the cardinal node (shell-local). */
  radius: number;
}

/** Per-cardinal fan tuning. N (judgment) / S (craft) spread WIDE so their
 *  chips go lateral — clearing the station-header band above and the Build
 *  kicker below. E (taste) spreads moderately; W (voice) is a single chip
 *  straight out. Lab-tunable. */
export const SKILL_FAN_TUNING: Record<SkillCardinal, SkillFanTuning> = {
  judgment: { spreadRad: 2.1, biasRad: 0, radius: 0.5 },
  craft: { spreadRad: 2.1, biasRad: 0, radius: 0.5 },
  taste: { spreadRad: 1.2, biasRad: 0, radius: 0.55 },
  voice: { spreadRad: 1.2, biasRad: 0, radius: 0.5 },
};

/**
 * Shell-local [dx, dy] offset of skill chip `slotIdx` (of `clusterSize`)
 * from its cardinal node. `cardinalAngleRad` is the cardinal's outward
 * direction (`SHELL_PRIMITIVES[i].angleRad`: N=π/2, E=0, S=−π/2, W=π).
 * Chips are placed at angle = outward ± spread, so they never enter the
 * sphere body (they sit outboard of a node that is already at radius ~1).
 * A single-chip cluster sits exactly on the outward ray.
 */
export function skillFanOffset(
  cardinalAngleRad: number,
  cardinal: SkillCardinal,
  slotIdx: number,
  clusterSize: number
): readonly [number, number] {
  const { spreadRad, biasRad, radius } = SKILL_FAN_TUNING[cardinal];
  const t = clusterSize > 1 ? slotIdx / (clusterSize - 1) : 0.5;
  const theta = cardinalAngleRad + biasRad + (t - 0.5) * spreadRad;
  return [Math.cos(theta) * radius, Math.sin(theta) * radius];
}

// ── Build tool cascade ────────────────────────────────────────────────

/** Vertical step between cascaded tool chips (shell-local). */
export const BUILD_TOOL_STEP_Y = 0.3;
/** Inward (−X, toward the sphere) inset of the cascade from the surfaces
 *  column. MUST be negative — the ~0.4-unit headroom is to the RIGHT of
 *  the column, so the cascade branches LEFT/inward instead. */
export const BUILD_TOOL_INSET_X = -0.6;

/**
 * Shell-local [dx, dy] offset of build-tool chip `idx` (of 4) from the
 * Web-app surface chip's anchor. The four chips stack vertically, centred
 * on the Web-app row, all inset inward-left of the column so they read as
 * a branch off the pipeline (never consuming the right-edge headroom).
 */
export function buildToolOffset(idx: number): readonly [number, number] {
  return [BUILD_TOOL_INSET_X, (1.5 - idx) * BUILD_TOOL_STEP_Y];
}
