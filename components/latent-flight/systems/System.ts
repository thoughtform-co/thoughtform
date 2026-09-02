/**
 * components/latent-flight/systems/System — the contract every system signs.
 *
 * The engine runs systems IN ARRAY ORDER, and the order is the contract:
 * Boot → Input → Ship → Camera → Cosmos → Rail → Waypoint → Hud → Audio.
 * `update(dt)` runs on the fixed step (possibly several times per frame,
 * possibly zero); `render(alpha)` runs once per frame after every update,
 * with `alpha` the fraction of a step still owed, so a system that keeps a
 * previous and current state can interpolate. The HUD projects last, after
 * the camera has settled for the frame.
 *
 * `dt` is REAL time. A system that animates ambiently multiplies by
 * `world.clock.motionScale` (0 under reduced motion) or reads
 * `world.clock.t`, which is already parked; input-driven motion keeps the
 * real `dt`, because a keypress is the reader's own act.
 */

import type { World } from "../World";

export interface LfSystem {
  readonly name: string;
  /** Called once after the renderer exists and before the first frame. */
  init?(world: World): void;
  /** Fixed step. `dt` is always `FIXED_DT`. */
  update?(dt: number, world: World): void;
  /** Once per frame after all updates. `alpha` ∈ [0, 1). */
  render?(alpha: number, world: World): void;
  /** The stage box changed; `world.size` and the camera are already updated. */
  resize?(world: World): void;
  /** Release GPU resources and listeners. */
  dispose?(world: World): void;
}
