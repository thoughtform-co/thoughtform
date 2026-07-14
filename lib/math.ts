/**
 * math — canonical scalar math kernel (Phase-5 consolidation, 2026-07-14
 * sweep).
 *
 * This is the SINGLE canonical home for the five scalar helpers that were
 * previously re-declared ~58 times across app/, components/, and lib/:
 * `clamp01`, `clamp`, `lerp`, `smoothstep`, and `smootherstep`. The bodies
 * here are lifted verbatim from `lib/home-v2/corridorMap.ts` (the prior
 * de-facto source of truth), plus a canonical `clamp(v, min, max)`.
 *
 * Painters, hooks, and geometry modules MUST import these from
 * `@/lib/math` and MUST NOT re-declare them locally. A handful of the old
 * homes (`corridorMap`, `services-ring/ringMath`, `particle-geometry/math`,
 * `lib/utils`, `stores/depthGatewayStore`) re-export from here so existing
 * import paths keep working.
 *
 * Argument-order convention: `smoothstep` and `smootherstep` use the GLSL
 * order `(edge0, edge1, x)` — edges first, sample last — matching the GPU
 * builtin and the corridor codebase. `x` is remapped to 0..1 across
 * `[edge0, edge1]`, clamped, then shaped by the Hermite / Perlin
 * polynomial.
 *
 * NOTE ON DEGENERATE / NON-FINITE INPUTS: these canonical bodies do NOT
 * guard `edge1 <= edge0` and `clamp01` passes `NaN` through as `NaN`
 * (`NaN < 0` and `NaN > 1` are both false). Several call sites deliberately
 * use variants with a degenerate-edge early return or a `NaN -> 0` /
 * non-finite guard; those keep their own local implementations by design
 * and are NOT consolidated here.
 */

/** Clamp `v` into [0, 1]. Passes `NaN` through unchanged. */
export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Clamp `v` into [min, max]. */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Linear interpolation from `a` to `b` by `t` (unclamped). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** GLSL-order smoothstep: Hermite `3t² − 2t³` S-curve, `x` remapped and
 *  clamped across `[edge0, edge1]`. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Ken Perlin's smootherstep — like `smoothstep` but with zero 1st AND
 *  2nd derivatives at both ends, so a ramp accelerates and settles more
 *  gently. GLSL argument order `(edge0, edge1, x)`. */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
