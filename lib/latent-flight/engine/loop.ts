/**
 * lib/latent-flight/engine/loop — the fixed-timestep accumulator.
 *
 * THREE-FREE, and that is load-bearing: the engine's clock is the one piece
 * of the game that must be provable without a GPU, so it is a pure function
 * over numbers and a step callback. `LatentFlightEngine.tick` calls it once
 * per animation frame; every system's `update(dt)` runs inside `step`, at
 * most `MAX_STEPS` times, always with `FIXED_DT`. What is left in the
 * accumulator after the last whole step is returned as `alpha` (0 ≤ α < 1)
 * so `render` can interpolate between the previous and current simulation
 * states — a 60 Hz simulation stays smooth on a 120 Hz display.
 *
 * Two guards:
 *   - `MAX_FRAME_S` clamps the delta. A tab that comes back from the
 *     background reports seconds of "frame"; without the clamp the loop
 *     would spend them all catching up.
 *   - the spiral-of-death guard drops any time that would still be owed
 *     after `MAX_STEPS`. Time is dropped, never queued: a struggling device
 *     runs slow, it never stalls.
 */

/** Simulation step, seconds. 60 Hz. */
export const FIXED_DT = 1 / 60;
/** Most steps one frame may run before the remainder is dropped. */
export const MAX_STEPS = 4;
/** Largest frame delta the loop will believe, seconds. */
export const MAX_FRAME_S = 0.25;

export interface LoopResult {
  /** Time still owed after the whole steps, seconds (0 ≤ acc < FIXED_DT). */
  acc: number;
  /** Whole simulation steps run this frame (0 … MAX_STEPS). */
  steps: number;
  /** Interpolation factor for `render`: acc / FIXED_DT, in [0, 1). */
  alpha: number;
}

export function stepLoop(acc: number, frameS: number, step: (dt: number) => void): LoopResult {
  const delta = Number.isFinite(frameS) ? Math.min(Math.max(frameS, 0), MAX_FRAME_S) : 0;
  let owed = (Number.isFinite(acc) && acc > 0 ? acc : 0) + delta;
  let steps = 0;
  while (owed >= FIXED_DT && steps < MAX_STEPS) {
    step(FIXED_DT);
    owed -= FIXED_DT;
    steps++;
  }
  // Spiral guard: whatever is still owed after the cap is dropped, so a slow
  // device never accumulates a debt it can only pay by freezing.
  if (steps === MAX_STEPS && owed >= FIXED_DT) owed = 0;
  return { acc: owed, steps, alpha: owed / FIXED_DT };
}
