import { damp } from "@/lib/latent-flight/hud/anchorMath";

import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * CameraSystem — the ship's eye.
 *
 * Scene 1: the camera holds at the origin looking down −Z with a bounded
 * drift no larger than 0.4°, on the game clock (so a parked clock parks the
 * drift). Flight (M3) will pose the camera from the course parameter; the
 * pointer look (M2) adds a damped head offset on top of whatever the pose
 * is. Nothing here reads input yet.
 */

const YAW_AMP = 0.006;
const PITCH_AMP = 0.004;
/** The pointer look's reach, radians: ±6° across the deadzone box. */
const LOOK_MAX = (6 * Math.PI) / 180;
const LOOK_TAU_S = 0.18;

export class CameraSystem implements LfSystem {
  readonly name = "camera";
  private lookX = 0;
  private lookY = 0;

  init(w: World): void {
    w.camera.position.set(0, 0, 0);
    w.camera.rotation.set(0, 0, 0);
    w.camera.up.set(0, 1, 0);
  }

  update(dt: number, w: World): void {
    // The head follows the pointer, damped; reduced motion snaps.
    if (w.reducedMotion) {
      this.lookX = w.look.x;
      this.lookY = w.look.y;
      return;
    }
    this.lookX = damp(this.lookX, w.look.x, LOOK_TAU_S, dt);
    this.lookY = damp(this.lookY, w.look.y, LOOK_TAU_S, dt);
  }

  render(_alpha: number, w: World): void {
    const t = w.clock.t;
    const k = w.clock.motionScale;
    const yaw = YAW_AMP * Math.sin(t * 0.09) * k - this.lookX * LOOK_MAX;
    const pitch = PITCH_AMP * Math.sin(t * 0.13 + 1.7) * k - this.lookY * LOOK_MAX * 0.6;
    w.camera.rotation.set(pitch, yaw, 0);
  }
}
