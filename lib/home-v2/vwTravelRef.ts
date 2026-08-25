/**
 * vwTravelRef — the VOIDWALKER TIME TUNNEL's cross-root transport
 * (ADR-081).
 *
 * The through-line's DOM (the nested `VoidwalkerPortal` React root) and
 * the corridor R3F canvas are SEPARATE React trees. Per-scroll-frame
 * scalars cross that seam through a module ref, never React state and
 * never a store write per frame — the `corridorDissipateRef` /
 * `aboutStageProgressRef` precedent.
 *
 * Single-writer contract: `useVoidwalkerTravelScroll` is the only writer.
 * `VoidwalkerTimeTunnel` (the wormhole painter), `FlyingCameraRig` (the
 * dive into the brandmark and the cruise down the tunnel) and
 * `BrandmarkPhysicsCoreActor` (the near-camera part) read it inside
 * `useFrame`.
 *
 * ⚠ THREE-FREE, and that is load-bearing: a DOM component imports this,
 * so a `three` import here would drag the WebGL stack into the landing's
 * First Load JS (landing-performance doctrine).
 *
 * Every field rests at its disengaged value, so a consumer that reads it
 * while the travel is not running gets "no travel" rather than a stale
 * pose — the flag being off, a mobile visit, reduced motion and an
 * unmount all land on the same numbers.
 */

export interface VwTravel {
  /** True only while the capable-path travel stage is engaged (flag +
   *  media gate + no corridor fallback). */
  engaged: boolean;
  /** Runway progress 0..1 across the pinned travel stage. Clamps to 0
   *  above it and 1 below it — no latch, no release guard (ADR-046). */
  p: number;
  /** The ENTRY dive 0..1 — the camera's fall into the parked brandmark
   *  and the opening of the wormhole mouth. */
  entry: number;
  /** The linear flight scalar 0..1 down the tunnel. */
  flight: number;
  /** How many year-rings have passed the camera — the tunnel's
   *  graduation, shared with the DOM axis so the two cannot drift. */
  rings: number;
}

export const vwTravelRef: { current: VwTravel } = {
  current: { engaged: false, p: 0, entry: 0, flight: 0, rings: 0 },
};

/** Reset every channel to its disengaged rest value. Called by the
 *  writer on every disengage path so nothing downstream can fly at a
 *  pose the reader has scrolled away from. */
export function clearVwTravel(): void {
  const t = vwTravelRef.current;
  t.engaged = false;
  t.p = 0;
  t.entry = 0;
  t.flight = 0;
  t.rings = 0;
}
