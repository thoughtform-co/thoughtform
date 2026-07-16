// Viewport-first seat projection helpers (extracted from the ADR-046 dock
// math when the dock was superseded by the ADR-047 about deck-flip stage —
// the math is feature-agnostic).
//
// The contract: a WebGL object that must land on a DOM rect derives its
// target VIEWPORT-FIRST every frame (CSS-px slot rect → NDC → camera space
// at the object's live depth → world → parent-local), never from a stored
// world offset — so camera dollies, parent recedes, pointer-look residue,
// resize, and DPR steps are all compensated automatically
// (BEST-PRACTICES "Compose responsive 3D scenes in viewport space";
// the ADR-034 terrace precedent).
//
// Pure and DOM/three-free — unit-tested in tests/lib/viewport-seat.test.ts.

import { clamp01 } from "@/lib/math";

// Re-exported so callers can clamp their own blend inputs consistently.
export { clamp01 };

/** CSS-pixel slot centre → NDC (y up). Returns `fallback` when the viewport
 *  is unmeasurable (SSR, zero-size). */
export function seatNdcFromRect(
  cx: number,
  cy: number,
  viewportW: number,
  viewportH: number,
  fallback: readonly [number, number]
): readonly [number, number] {
  if (viewportW <= 0 || viewportH <= 0) return fallback;
  return [(cx / viewportW) * 2 - 1, -((cy / viewportH) * 2 - 1)];
}

/** World-space height that projects to `slotHpx` CSS pixels at camera-space
 *  depth `camDepth` under a perspective camera whose HALF-fov tangent is
 *  `halfFovTan` (= tan(fovRad / 2), precomputed once per frame by the
 *  consumer): the visible frustum height at depth d is 2·d·tan(fov/2), of
 *  which the slot occupies slotHpx / viewportHpx. */
export function seatWorldHeight(
  slotHpx: number,
  viewportHpx: number,
  camDepth: number,
  halfFovTan: number
): number {
  if (viewportHpx <= 0) return 0;
  return (slotHpx / viewportHpx) * 2 * camDepth * halfFovTan;
}
