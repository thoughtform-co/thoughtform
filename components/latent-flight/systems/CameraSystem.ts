import * as THREE from "three";

import { damp } from "@/lib/latent-flight/hud/anchorMath";
import { courseAt } from "@/lib/latent-flight/flight/course";
import { SHIP } from "@/lib/latent-flight/flight/flightModel";

import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * CameraSystem — the ship's eye.
 *
 * The camera IS the vessel: posed from the course at the ship's (interpolated)
 * course parameter, offset by its lateral position inside the lattice, and
 * oriented along the course's parallel-transported frame — so a bend in the
 * route turns the whole view, rails and all, with no roll. On top of that
 * pose sit two head motions: the pointer's damped look (±6°) and a sway no
 * larger than 0.4° that scales with SPEED — the space holds perfectly still
 * when the vessel does, which is the corridor's own law and what lets the
 * lattice sit exactly on the chrome at rest.
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
  private m = new THREE.Matrix4();
  private vx = new THREE.Vector3();
  private vy = new THREE.Vector3();
  private vz = new THREE.Vector3();

  init(w: World): void {
    w.camera.position.set(0, 0, 0);
    w.camera.rotation.set(0, 0, 0);
    w.camera.up.set(0, 1, 0);
    this.pose(0, w);
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

  render(alpha: number, w: World): void {
    this.pose(alpha, w);
  }

  private pose(alpha: number, w: World): void {
    const sh = w.ship;
    const k = Math.max(0, Math.min(1, alpha));
    const s = sh.sPrev + (sh.s - sh.sPrev) * k;
    const x = sh.xPrev + (sh.x - sh.xPrev) * k;
    const y = sh.yPrev + (sh.y - sh.yPrev) * k;
    const c = courseAt(w.course, s);
    const cam = w.camera;
    cam.position.set(
      c.p[0] + c.n[0] * x + c.b[0] * y,
      c.p[1] + c.n[1] * x + c.b[1] * y,
      c.p[2] + c.n[2] * x + c.b[2] * y
    );
    // Local X = the frame's normal (right), local Y = its binormal (up),
    // local Z = −tangent (the camera looks down its own −Z).
    this.vx.set(c.n[0], c.n[1], c.n[2]);
    this.vy.set(c.b[0], c.b[1], c.b[2]);
    this.vz.set(-c.t[0], -c.t[1], -c.t[2]);
    this.m.makeBasis(this.vx, this.vy, this.vz);
    cam.quaternion.setFromRotationMatrix(this.m);

    const t = w.clock.t;
    const motion = w.clock.motionScale * Math.min(1, sh.v / SHIP.vMax);
    const yaw = YAW_AMP * Math.sin(t * 0.09) * motion - this.lookX * LOOK_MAX;
    const pitch = PITCH_AMP * Math.sin(t * 0.13 + 1.7) * motion - this.lookY * LOOK_MAX * 0.6;
    if (yaw !== 0) cam.rotateY(yaw);
    if (pitch !== 0) cam.rotateX(pitch);
    cam.updateMatrixWorld();
  }
}
