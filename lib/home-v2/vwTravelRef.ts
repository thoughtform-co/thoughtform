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
  /** True while the runway is WITHIN REACH but not yet flown — the
   *  reader is a couple of viewports out, still in `#about`.
   *
   *  ⚠ IT EXISTS FOR SHADER COMPILATION, WHICH IS NOT A COST YOU CAN
   *  SEE UNTIL IT IS TOO LATE. three never compiles a material for an
   *  object it has not drawn, and the tunnel's group is `visible = false`
   *  for the whole page before the travel — so the FIRST FRAME OF THE
   *  DIVE was compiling two shaders, at the one moment the camera is
   *  moving fastest. The painter warms itself on this flag: one frame
   *  drawn at zero alpha, far enough out that a hitch has nowhere to
   *  land. */
  near: boolean;
  /** Damped scroll VELOCITY in runway-fractions-per-second — how fast
   *  the reader is moving through the tunnel right now, EMA-smoothed
   *  by the writer so a wheel notch is not a spike. Feeds the streak
   *  layer, the fog dilation and the card tilt: the Codrops finding is
   *  that velocity effects sell speed cheaper than DOF. 0 at rest. */
  velocity: number;
}

export const vwTravelRef: { current: VwTravel } = {
  current: {
    engaged: false,
    p: 0,
    entry: 0,
    flight: 0,
    rings: 0,
    near: false,
    velocity: 0,
  },
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
  t.near = false;
  t.velocity = 0;
}

/**
 * True only while the reader is DEEP inside the voidwalker time tunnel —
 * past the entry dive (`flight > 0.15`), before the foot (`flight < 0.9`)
 * and only when the runway is under the viewport (`engaged`).
 *
 * ⚠ PURE FUNCTION OF LIVE STATE. No latch, no cooldown, no history: a
 * reverse scroll immediately restores every painter that read this to
 * hide its geometry (`group.visible = false`). ADR-081 U1's whole
 * lesson at this seam — "the camera claim is POSITIONAL, not modal" —
 * carries here: hiding painters modally would give us this morning's
 * bug back the moment a reader hits reload on the wrong station.
 *
 * ⚠ THE WINDOW IS DELIBERATELY NARROW. The camera flies past the
 * parked brandmark at `VOID_ENTRY_OVERSHOOT = 1.6` world units into
 * the wormhole's cruise (`VOID_CRUISE_DISTANCE = 26` units), so by
 * `flight = 0.15` the camera is `1.6 + 0.15 × 26 ≈ 5.5` world units
 * past the mark — the shell, the accretion ring, the services card
 * ring, the arc card and the gateway groups are all definitively
 * behind the camera. Flipping them off shaves the largest per-frame
 * cost the trace found (20–34 ms during interior travel), while the
 * VoidwalkerTimeTunnel painter (which paints WHAT the camera sees)
 * stays on the entire runway.
 *
 * ⚠ Consumers MUST call this in `useFrame` and read the current live
 * value — never cache. The whole safety story rests on the read being
 * fresh every frame.
 */
export function vwTravelInterior(): boolean {
  const t = vwTravelRef.current;
  return t.engaged && t.flight > 0.15 && t.flight < 0.9;
}
