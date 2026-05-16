/**
 * lib/webgl/probe — single source of truth for WebGL feasibility.
 *
 * Three sites previously inlined identical probe code:
 *
 *   - `useSigilChoreography.ts` (retired in ADR-013)
 *   - `BrandmarkParticleCanvas.tsx`
 *   - `IntelligenceLayerPortal.tsx`
 *
 * Consolidating here ensures every consumer agrees on what "WebGL
 * available" means, and lets us memoise the result so we don't pay
 * the canvas-context cost more than once per session.
 *
 * The probe creates a throwaway canvas, requests a WebGL 2 context
 * (falling back to WebGL 1 or experimental-WebGL), and returns
 * whether the context could be acquired. We don't keep the probe
 * context around — Three.js / R3F create their own.
 */

let cachedResult: boolean | null = null;

export function probeWebGL(): boolean {
  if (typeof document === "undefined") return false;
  if (cachedResult !== null) return cachedResult;
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    cachedResult = ctx != null;
  } catch {
    cachedResult = false;
  }
  return cachedResult;
}
