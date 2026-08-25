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
  /** Smoothed epilogue scrub (0..1). The post-Build flyover (camera
   *  pose + planet grow + shell fades) covers a large spatial arc in
   *  only ~2 viewports of scroll, so raw wheel-notch quantization
   *  reads as camera judder. Every epilogue consumer flies this
   *  chased value instead of the raw store scrub (2026-06-11
   *  smoothness pass). */
  epilogue: number;
  /** Smoothed dissipate / dock scrub (0..1). The corridor-exit
   *  zoom-dissipate (camera fly-INTO the sphere + dotted-shell radial
   *  scatter + particle fade) covers a large spatial arc in ~2
   *  viewports too, so the raw scroll-derived `dockProgress` reads as
   *  stepped under wheel input — the same problem the epilogue channel
   *  solves. Every SPHERE/CAMERA consumer flies THIS chased value so
   *  the whole exit glides on one clock and the welded DOM marks
   *  (brandmark + news ticker) stay glued to the canvas sphere
   *  (2026-06-18 elegance pass). */
  dissipate: number;
  /** Smoothed VOIDWALKER TIME TUNNEL flight (0..1, ADR-081). The travel
   *  runs fourteen viewports of scroll and the camera covers a long axial
   *  arc down the tunnel, so the raw wheel-quantized runway progress
   *  reads as stepped exactly the way the epilogue and dissipate scrubs
   *  did. Every travel consumer (the camera's dive + cruise, the tunnel
   *  painter's flow) flies THIS chased value so the whole flight glides
   *  on one clock. */
  voidTravel: number;
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
/** Epilogue flight chase. Slightly faster than the reveals so the
 *  camera feels attached to the scroll, but slow enough that wheel
 *  steps melt into one continuous glide (~0.55s settle). */
const MOTION_FOLLOWER_TAU_EPILOGUE_S = 0.18;
/** Dissipate (corridor-exit) chase. Matched to the epilogue so the
 *  zoom-dissipate exit reads as the same instrument as the epilogue
 *  flyover the user reads just before it — wheel steps melt into one
 *  glide instead of stepping the fly-into-sphere (~0.55s settle). */
const MOTION_FOLLOWER_TAU_DISSIPATE_S = 0.18;
/** Void-travel (time tunnel) chase. Matched to the dissipate it
 *  continues from — the reader falls out of the fly-into-sphere
 *  straight into the wormhole, and two different time constants across
 *  that seam would read as the camera changing hands. */
const MOTION_FOLLOWER_TAU_VOID_TRAVEL_S = 0.18;
/** STACK channel time constant — used TWICE (cascaded second-order
 *  chase, see below). The sources/surfaces dock is the corridor's
 *  final reveal and reads best as an editorial speed ramp: a single
 *  exponential has its maximum velocity at onset (ease-out only),
 *  which made the stack LEAP into frame on a flick. Cascading two
 *  exponentials gives the output zero initial velocity — a true
 *  slow-in / fast-middle / slow-out S-curve, the After-Effects-style
 *  ramp — while staying frame-rate independent and converging to
 *  the exact scrubbed value when the user parks (fully reversible).
 *  Settle ≈ 3·(2·tau) ≈ 1.0 s. (v3.12c stack-ramp pass.) */
const MOTION_FOLLOWER_TAU_STACK_S = 0.17;

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
  epilogue: 0,
  dissipate: 0,
  voidTravel: 0,
};

/** Intermediate stage of the stack's cascaded (second-order) chase:
 *  `stackMid` chases the raw target, `state.stack` chases `stackMid`.
 *  The composition has zero velocity at onset — the S-ramp. */
let stackMid = 0;

let lastPaintProgress: number | null = null;

/** Wall-clock timestamp (ms) of the previous driven frame, or 0 before
 *  the first drive. The R3F loop idles (`frameloop="demand"`) while the
 *  corridor is off-screen, so the follower simply STOPS ticking — its
 *  channels stay frozen at whatever value they held when the user
 *  scrolled away (often deep in the epilogue/docked pose). On scroll-
 *  back the scene re-engages and the follower resumes; without a reset
 *  it would glide from that stale value across the whole flight, which
 *  read as the camera sweeping back through the epilogue (or, paired
 *  with the demand-loop stall, a frame of wrong/blank pose). */
let lastDriveTime = 0;

/** Gap (ms) above which we treat the follower as having RESUMED from an
 *  off-screen idle rather than running frame-to-frame, and snap every
 *  channel to the live scrubbed target. A comfortable multiple of a
 *  60fps frame: continuous play ticks ~16ms apart, so only an
 *  off-screen idle (or backgrounded tab) opens a gap this large. */
const RESUME_IDLE_GAP_MS = 200;

/** Snap every channel straight to its target (no easing). Used on the
 *  first driven frame, while the stage is parked/armed, and on
 *  teleport-sized progress jumps. */
export function snapMotionFollower(targets: MotionFollowerState): void {
  state.panOffsetX = targets.panOffsetX;
  state.substrate = targets.substrate;
  state.orbits = targets.orbits;
  state.stack = targets.stack;
  stackMid = targets.stack;
  state.epilogue = targets.epilogue;
  state.dissipate = targets.dissipate;
  state.voidTravel = targets.voidTravel;
}

/**
 * Advance the follower one frame.
 *
 * @param targets       Raw scrubbed values at the CURRENT paintProgress.
 * @param dtSeconds     Frame delta (clamped internally).
 * @param paintProgress Current store paintProgress — used for teleport
 *                      detection only.
 * @param engaged       Store `active || armed || docked` flag. The follower
 *                      eases continuously across the active <-> armed
 *                      boundary so reverse scroll across the corridor entry
 *                      seam doesn't snap the parked composition into place
 *                      (the previous `!active` clause caused a visible
 *                      vertical bounce on scroll-back). Snapping is now
 *                      reserved for genuine teleports (hash nav, scroll
 *                      restore) and idle resumes (loop was off-screen).
 */
export function driveMotionFollower(
  targets: MotionFollowerState,
  dtSeconds: number,
  paintProgress: number,
  engaged: boolean
): void {
  const nowMs = typeof performance !== "undefined" ? performance.now() : 0;
  const resumedAfterIdle = lastDriveTime > 0 && nowMs - lastDriveTime > RESUME_IDLE_GAP_MS;
  lastDriveTime = nowMs;

  const teleport =
    lastPaintProgress === null ||
    Math.abs(paintProgress - lastPaintProgress) > TELEPORT_PROGRESS_DELTA;
  lastPaintProgress = paintProgress;

  // Snap only on real discontinuities: teleport (hash nav, scroll
  // restore), idle resume (the demand-mode loop was off-screen and
  // would otherwise glide from a stale value), or while the stage is
  // fully disengaged (off-screen — no observer to see the snap). The
  // `active <-> armed` boundary is intentionally NOT a snap: at the
  // corridor entry seam, paintProgress is a continuous 0 across both
  // states, so easing across the toggle is a no-op for armed-from-
  // forward but kills the visible snap-back when scrolling reverse
  // across the seam after having been active.
  if (!engaged || teleport || resumedAfterIdle) {
    snapMotionFollower(targets);
    return;
  }

  // Epilogue-channel teleport: paintProgress is pinned at 1 across
  // the whole epilogue, so a hash-nav / scroll-restore jump WITHIN
  // the epilogue never trips the paintProgress check above. A gap
  // this size cannot come from physical scrolling between frames —
  // snap the channel rather than gliding across half the flight.
  if (Math.abs(targets.epilogue - state.epilogue) > 0.5) {
    state.epilogue = targets.epilogue;
  }
  // Dissipate-channel teleport: same reasoning as the epilogue channel
  // — paintProgress stays pinned at 1 through the dock, so a hash-nav /
  // scroll-restore landing mid-dissipate would otherwise glide the
  // camera across half the fly-into-sphere. Snap on a non-physical gap.
  if (Math.abs(targets.dissipate - state.dissipate) > 0.5) {
    state.dissipate = targets.dissipate;
  }
  // Void-travel teleport: paintProgress is pinned at 1 for the whole
  // tunnel, so a hash-nav / scroll-restore landing mid-flight would
  // otherwise glide the camera down the entire wormhole. Same reasoning,
  // same threshold as the two channels above.
  if (Math.abs(targets.voidTravel - state.voidTravel) > 0.5) {
    state.voidTravel = targets.voidTravel;
  }

  const dt = Math.min(0.1, Math.max(0, dtSeconds));
  if (dt <= 0) return;
  // Exponential chase — frame-rate independent: identical convergence
  // at 30 / 60 / 120 fps for the same wall-clock time. Per-channel tau
  // so the pan arrives decisively while the reveals breathe.
  const kPan = 1 - Math.exp(-dt / MOTION_FOLLOWER_TAU_PAN_S);
  const kReveal = 1 - Math.exp(-dt / MOTION_FOLLOWER_TAU_REVEAL_S);
  const kEpilogue = 1 - Math.exp(-dt / MOTION_FOLLOWER_TAU_EPILOGUE_S);
  const kStack = 1 - Math.exp(-dt / MOTION_FOLLOWER_TAU_STACK_S);
  const kDissipate = 1 - Math.exp(-dt / MOTION_FOLLOWER_TAU_DISSIPATE_S);
  const kVoidTravel = 1 - Math.exp(-dt / MOTION_FOLLOWER_TAU_VOID_TRAVEL_S);
  state.panOffsetX += (targets.panOffsetX - state.panOffsetX) * kPan;
  state.substrate += (targets.substrate - state.substrate) * kReveal;
  state.orbits += (targets.orbits - state.orbits) * kReveal;
  // Stack: cascaded second-order chase (target → stackMid → state) —
  // zero-velocity onset gives the sources/surfaces dock its
  // editorial slow-in / slow-out ramp. See TAU_STACK_S note above.
  stackMid += (targets.stack - stackMid) * kStack;
  state.stack += (stackMid - state.stack) * kStack;
  state.epilogue += (targets.epilogue - state.epilogue) * kEpilogue;
  // Settle the epilogue chase exactly on target once the remaining
  // gap is sub-perceptual, so the parked pose is byte-identical to
  // the scrub (no asymptotic micro-creep in the camera).
  if (Math.abs(targets.epilogue - state.epilogue) < 0.0004) {
    state.epilogue = targets.epilogue;
  }
  state.dissipate += (targets.dissipate - state.dissipate) * kDissipate;
  // Same sub-perceptual settle as the epilogue so the docked / parked
  // pose lands exactly on the scrubbed dissipate (no micro-creep in
  // the fly-into-sphere when the user holds at a scroll position).
  if (Math.abs(targets.dissipate - state.dissipate) < 0.0004) {
    state.dissipate = targets.dissipate;
  }
  state.voidTravel += (targets.voidTravel - state.voidTravel) * kVoidTravel;
  // Same sub-perceptual settle as its neighbours, so a reader parked at a
  // beat sits at exactly the scrubbed depth with no micro-creep in the
  // tunnel behind them.
  if (Math.abs(targets.voidTravel - state.voidTravel) < 0.0004) {
    state.voidTravel = targets.voidTravel;
  }
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

/** Smoothed epilogue scrub. Temporal counterpart of the store's
 *  `epilogueProgress`. Camera pose, planet grow, and shell fades all
 *  fly THIS value so the whole flyover moves on one clock — smoothing
 *  only the camera would let the planet's scale step against it. */
export function getSmoothedEpilogueProgress(): number {
  return state.epilogue;
}

/** Smoothed dissipate scrub. Temporal counterpart of the store's
 *  `dockProgress` (the corridor-exit zoom-dissipate clock). The camera
 *  fly-into-sphere, the dotted-shell radial scatter + particle fade,
 *  and the welded DOM marks (brandmark + news ticker) all fly THIS
 *  value so the exit moves on one clock and the welds stay glued to
 *  the canvas sphere — smoothing only the camera would let the welded
 *  marks step against it. Driven only while docked (target falls back
 *  to 0 otherwise, so reverse-scroll eases the fly-in back out). */
export function getSmoothedDissipate(): number {
  return state.dissipate;
}

/** Smoothed VOIDWALKER TIME TUNNEL flight (0..1, ADR-081). Temporal
 *  counterpart of `vwTravelRef.current.flight`. */
export function getSmoothedVoidTravel(): number {
  return state.voidTravel;
}
