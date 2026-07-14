/**
 * journeyScalars — the three-free scalar contract between the brandmark
 * journey (`lib/brandmark/journey.ts`) and the intelligence-layer scene.
 *
 * Extracted from `intelligenceLayerGeom.ts` (2026-07-14 perf pass):
 * the geom module imports `three` at module scope, and journey.ts's
 * static import of these two functions was the LAST chain pulling the
 * whole WebGL runtime into the landing route's First Load JS. Keep this
 * module free of `three` (and any other heavy import) — it sits in the
 * critical initial bundle. `intelligenceLayerGeom` re-exports everything
 * here, so scene-side consumers are unaffected.
 */

import { clamp01, lerp, smoothstep } from "@/lib/math";

// Re-exported (Phase-5 consolidation, 2026-07-14) so the brandmark
// journey + `intelligenceLayerGeom` consumers that import these from
// here keep working. `@/lib/math` is a pure leaf (no `three`), so this
// module stays out of the WebGL chunk — the whole point of its
// extraction.
export { clamp01, lerp, smoothstep };

export const SUBSTRATE_PHASE = {
  arriveOut: 0.04,
  handoffOut: 0.12,
  splitOut: 0.28,
  resolveIn: 0.22,
  resolveOut: 0.42,
} as const;

export interface SubstratePhases {
  handoff: number;
  split: number;
  resolve: number;
}

export function splitEnvelope(progress: number): SubstratePhases {
  return {
    handoff: smoothstep(SUBSTRATE_PHASE.arriveOut, SUBSTRATE_PHASE.handoffOut, progress),
    split: smoothstep(SUBSTRATE_PHASE.handoffOut, SUBSTRATE_PHASE.splitOut, progress),
    resolve: smoothstep(SUBSTRATE_PHASE.resolveIn, SUBSTRATE_PHASE.resolveOut, progress),
  };
}

export function vectorRingOpacity(progress: number): number {
  if (progress <= SUBSTRATE_PHASE.arriveOut) return 1;
  if (progress >= SUBSTRATE_PHASE.handoffOut) return 0;
  return 1 - smoothstep(SUBSTRATE_PHASE.arriveOut, SUBSTRATE_PHASE.handoffOut, progress);
}

/** ADR-014 rotation channel — no-op; triad is front-on (ADR-016). */
export function splitRotation(_progress: number): number {
  return 0;
}
