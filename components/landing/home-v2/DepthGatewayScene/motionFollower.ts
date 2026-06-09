/**
 * motionFollower — temporal smoothing for the depth corridor's
 * scroll-scrubbed reveal channels (2026-06-09 elegance pass).
 *
 * The corridor's choreography is scroll-scrubbed: every reveal is a
 * pure function of `paintProgress`. That keeps the world reversible,
 * but it also means a fast flick compresses an entire unfold (gimbal
 * bloom, cardinal fly-in, stack dock) into a couple of frames — the
 * layers "just appear". This module fixes that by letting a small set
 * of channels CHASE their scrubbed target through an exponential
 * damped follower, so each reveal always plays out over a minimum
 * wall-clock duration (~0.6s to settle) regardless of scroll speed,
 * while still converging to the exact scrubbed value when the user
 * parks. Reverse scroll simply chases backwards, so the corridor
 * stays fully reversible.
 *
 * Channels:
 *   - `panOffsetX`  — Thoughtform composition centering pan (world X).
 *   - `substrate` / `orbits` / `stack` — the three accretion reveals
 *     from `CORRIDOR_TIMELINE.accretion`.
 *
 * Architecture: this module is dependency-free (a mutable singleton +
 * pure update math, mirroring the `gyroTilt` pattern). The DRIVER —
 * `MotionFollowerDriver` in `DepthGatewayScene/index.tsx` — computes
 * the raw scrubbed targets from `sceneGeom` each frame (useFrame
 * priority -10, so it runs before every painter) and calls
 * {@link driveMotionFollower}. Consumers (R3F painters + DOM anchor
 * gates) read the smoothed values via the getters below instead of
 * recomputing the raw envelopes. DOM trackers run in their own rAF and
 * may read values up to one frame stale — invisible in practice.
 */

export interface MotionFollowerState {
  /** Smoothed Thoughtform centering pan offset (world X units). */
  panOffsetX: number;
  /** Smoothed accretion reveals (0..1 each). */
  substrate: number;
  orbits: number;
  stack: number;
}

/** Damping time constants (seconds), per channel. The follower covers
 *  ~63% of the remaining gap per tau, ~95% in 3·tau.
 *
 *  - `pan` is the Thoughtform centering pan — snappier (0.1s, ~0.3s
 *    settle) so the brandmark arrives at centre decisively as the
 *    camera dolly releases at `dollyHoldEnd`. With the previous shared
 *    0.2s the mark was still chasing centre well after the dolly had
 *    already started flying, which read as drifting past the beat.
 *  - `reveal` is the three accretion channels (substrate / orbits /
 *    stack) — keeps 0.2s (~0.6s settle) so the per-ring + globe-bloom
 *    gimbal unfold breathes. The sphere/orbit/stack reveals are
 *    intentionally dreamier than the camera-pan. */
const MOTION_FOLLOWER_TAU_PAN_S = 0.1;
const MOTION_FOLLOWER_TAU_REVEAL_S = 0.2;

/** `paintProgress` jump (per frame) above which we treat the change
 *  as a TELEPORT (hash nav, scroll restore on reload) and snap every
 *  channel instead of easing across half the corridor. Comfortably
 *  above anything a physical fling produces in one frame. */
const TELEPORT_PROGRESS_DELTA = 0.25;

/** Live smoothed channels. Mutated in place by the driver each frame;
 *  read via the getters so call sites stay grep-able. */
const state: MotionFollowerState = {
  panOffsetX: 0,
  substrate: 0,
  orbits: 0,
  stack: 0,
};

let lastPaintProgress: number | null = null;

/** Snap every channel straight to its target (no easing). Used on the
 *  first driven frame, while the stage is parked/armed, and on
 *  teleport-sized progress jumps. */
export function snapMotionFollower(targets: MotionFollowerState): void {
  state.panOffsetX = targets.panOffsetX;
  state.substrate = targets.substrate;
  state.orbits = targets.orbits;
  state.stack = targets.stack;
}

/**
 * Advance the follower one frame.
 *
 * @param targets       Raw scrubbed values at the CURRENT paintProgress.
 * @param dtSeconds     Frame delta (clamped internally).
 * @param paintProgress Current store paintProgress — used for teleport
 *                      detection only.
 * @param active        Store `active` flag. While the stage is not
 *                      actively pinned (parked above / armed / below)
 *                      the follower snaps so the entry state is
 *                      byte-identical to the un-smoothed corridor.
 */
export function driveMotionFollower(
  targets: MotionFollowerState,
  dtSeconds: number,
  paintProgress: number,
  active: boolean
): void {
  const teleport =
    lastPaintProgress === null ||
    Math.abs(paintProgress - lastPaintProgress) > TELEPORT_PROGRESS_DELTA;
  lastPaintProgress = paintProgress;

  if (!active || teleport) {
    snapMotionFollower(targets);
    return;
  }

  const dt = Math.min(0.1, Math.max(0, dtSeconds));
  if (dt <= 0) return;
  // Exponential chase — frame-rate independent: identical convergence
  // at 30 / 60 / 120 fps for the same wall-clock time. Per-channel tau
  // so the pan arrives decisively while the reveals breathe.
  const kPan = 1 - Math.exp(-dt / MOTION_FOLLOWER_TAU_PAN_S);
  const kReveal = 1 - Math.exp(-dt / MOTION_FOLLOWER_TAU_REVEAL_S);
  state.panOffsetX += (targets.panOffsetX - state.panOffsetX) * kPan;
  state.substrate += (targets.substrate - state.substrate) * kReveal;
  state.orbits += (targets.orbits - state.orbits) * kReveal;
  state.stack += (targets.stack - state.stack) * kReveal;
}

/** Smoothed Thoughtform centering pan offset (world X). Temporal
 *  counterpart of `getThoughtformCenterOffsetX(paintProgress)`. */
export function getSmoothedThoughtformOffsetX(): number {
  return state.panOffsetX;
}

/** Smoothed accretion reveals. Temporal counterpart of
 *  `getBrandmarkAccretionLayers(paintProgress)` — same shape so
 *  painters can swap call sites 1:1. */
export function getSmoothedAccretionLayers(): {
  substrate: number;
  orbits: number;
  stack: number;
} {
  return { substrate: state.substrate, orbits: state.orbits, stack: state.stack };
}
