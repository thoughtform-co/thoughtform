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

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

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
