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

export class CameraSystem implements LfSystem {
  readonly name = "camera";

  init(w: World): void {
    w.camera.position.set(0, 0, 0);
    w.camera.rotation.set(0, 0, 0);
    w.camera.up.set(0, 1, 0);
  }

  render(_alpha: number, w: World): void {
    const t = w.clock.t;
    const k = w.clock.motionScale;
    const yaw = YAW_AMP * Math.sin(t * 0.09) * k;
    const pitch = PITCH_AMP * Math.sin(t * 0.13 + 1.7) * k;
    w.camera.rotation.set(pitch, yaw, 0);
  }
}
