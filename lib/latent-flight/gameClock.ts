/**
 * lib/latent-flight/gameClock — the game's one clock.
 *
 * Every animated thing in the scene (twinkle, the pulsar's spin, the haze
 * drift, the boot cues) reads `t` from here and nothing reads wall time
 * directly. `advanceClock` is the ONE writer, called once per frame by the
 * engine with the frame's real delta, clamped so a backgrounded tab does not
 * jump the world forward when it returns.
 *
 * `motionScale` is the reduced-motion switch, resolved once at mount: 1 runs
 * the world, 0 parks it. Painters multiply their time-driven terms by it
 * rather than branching on the media query themselves, so "reduced motion"
 * is one number in one place.
 */

/** Largest single advance the clock will accept, seconds. */
export const MAX_CLOCK_STEP_S = 0.1;

export interface GameClock {
  /** Elapsed game time, seconds. Monotonic. */
  t: number;
  /** Frames rendered since start. */
  frame: number;
  /** 1 = the world moves; 0 = reduced motion, the world is parked. */
  motionScale: number;
}

export function createGameClock(motionScale = 1): GameClock {
  return { t: 0, frame: 0, motionScale: motionScale > 0 ? 1 : 0 };
}

/** Advance by a real frame delta (seconds), clamped and scaled by
 *  `motionScale`. Returns the delta actually applied. */
export function advanceClock(clock: GameClock, deltaS: number): number {
  const d = Number.isFinite(deltaS) ? Math.min(Math.max(deltaS, 0), MAX_CLOCK_STEP_S) : 0;
  const applied = d * clock.motionScale;
  clock.t += applied;
  clock.frame += 1;
  return applied;
}
