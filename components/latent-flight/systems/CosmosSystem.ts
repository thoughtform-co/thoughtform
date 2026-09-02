import * as THREE from "three";

import { getDeviceTier } from "@/lib/hooks/useDeviceTier";
import { getCountMultiplier } from "@/lib/hooks/useQualityTier";
import { buildNoise, NOISE_SIZE } from "@/lib/latent-flight/noiseTexture";
import {
  PULSAR,
  crossing,
  normalize,
  phaseAt,
  pulsarFrame,
  starPosition,
  type PulsarFrame,
} from "@/lib/latent-flight/pulsar";
import { pulsarRef } from "@/lib/latent-flight/pulsarRef";

import { createDust, type Dust } from "../scene/Dust";
import { createNeutronStar, type NeutronStar } from "../scene/NeutronStar";
import { createSky, type Sky } from "../scene/Sky";
import { createFarStars, createNearStars, type StarLayer } from "../scene/Starfield";
import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * CosmosSystem — everything the vessel looks out at.
 *
 * Owns the sky, both star layers, the neutron star and the foreground dust,
 * and is the ONE writer of `pulsarRef`. Per frame it welds the sky and the
 * far stars to the camera, bills the corona, advances every time uniform
 * from the game clock, syncs the pixel ratio, turns the star and computes
 * the beam's crossing.
 *
 * The star is placed from its NDC seat at the current lens, and re-placed
 * on resize only while the vessel holds (BOOT / VISTA) — once it flies the
 * star is a world-fixed landmark.
 */

/** The star drawing's scale in world units per authored unit. */
const STAR_SCALE = 1.6;

function tierCount(desktop: number, tablet: number, mobile: number): number {
  const tier = getDeviceTier(window.innerWidth);
  const base = tier === "mobile" ? mobile : tier === "tablet" ? tablet : desktop;
  return Math.max(1, Math.round(base * getCountMultiplier()));
}

export class CosmosSystem implements LfSystem {
  readonly name = "cosmos";
  private noise: THREE.DataTexture | null = null;
  private sky: Sky | null = null;
  private far: StarLayer | null = null;
  private near: StarLayer | null = null;
  private star: NeutronStar | null = null;
  private dust: Dust | null = null;
  private frame: PulsarFrame | null = null;
  private prevCross = 0;
  private count = 0;

  init(w: World): void {
    const noise = new THREE.DataTexture(
      buildNoise(7, NOISE_SIZE),
      NOISE_SIZE,
      NOISE_SIZE,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
    noise.minFilter = THREE.LinearMipmapLinearFilter;
    noise.magFilter = THREE.LinearFilter;
    noise.generateMipmaps = true;
    noise.needsUpdate = true;
    this.noise = noise;

    this.sky = createSky(noise);
    this.far = createFarStars(tierCount(2400, 1400, 900));
    this.near = createNearStars(tierCount(900, 500, 300));
    this.star = createNeutronStar(noise);
    // The drawing at unit scale reads as a mark, not a body; the vista's hero
    // takes ~11 % of the frame's height at this scale (the field cage's L5.2
    // shell), still clear of the flight axis at centre.
    this.star.root.scale.setScalar(STAR_SCALE);
    this.dust = createDust(tierCount(600, 350, 180));

    // Reduced motion: no twinkle, no drift, the star parked in profile.
    this.near.material.uniforms.uTwinkle.value = w.clock.motionScale;

    w.scene.add(
      this.sky.group,
      this.far.points,
      this.near.points,
      this.star.root,
      this.star.flash,
      this.dust.points
    );
    this.place(w);
  }

  resize(w: World): void {
    if (w.fsm === "BOOT" || w.fsm === "VISTA") this.place(w);
  }

  private place(w: World): void {
    if (!this.star) return;
    const pos = starPosition(PULSAR.ndcX, PULSAR.ndcY, PULSAR.distance, w.camera.fov, w.camera.aspect);
    const cam = w.camera.position;
    const d = normalize([cam.x - pos[0], cam.y - pos[1], cam.z - pos[2]]);
    this.frame = pulsarFrame(d);
    this.star.setFrame(this.frame, pos);
    w.anchors.set("star", new THREE.Vector3(pos[0], pos[1], pos[2]));
  }

  render(_alpha: number, w: World): void {
    const { sky, far, near, star, dust, frame } = this;
    if (!sky || !far || !near || !star || !dust || !frame) return;
    const t = w.clock.t;
    const dpr = w.size.dpr;
    const cam = w.camera;

    sky.group.position.copy(cam.position);
    far.points.position.copy(cam.position);
    sky.setTime(t);

    far.material.uniforms.uPixelRatio.value = dpr;
    near.material.uniforms.uPixelRatio.value = dpr;
    near.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPixelRatio.value = dpr;
    dust.material.uniforms.uCamZ.value = cam.position.z;

    const phase = phaseAt(t);
    const c = crossing(frame, phase);
    star.setPhase(phase);
    star.setTime(t);
    star.setCrossing(c);
    star.billboard(cam.quaternion);

    if (c > 0.5 && this.prevCross <= 0.5) this.count += 1;
    this.prevCross = c;
    pulsarRef.current = { t, phase, crossing: c, count: this.count };
  }

  dispose(w: World): void {
    const { sky, far, near, star, dust } = this;
    if (sky) w.scene.remove(sky.group);
    if (far) w.scene.remove(far.points);
    if (near) w.scene.remove(near.points);
    if (star) w.scene.remove(star.root, star.flash);
    if (dust) w.scene.remove(dust.points);
    sky?.dispose();
    far?.dispose();
    near?.dispose();
    star?.dispose();
    dust?.dispose();
    this.noise?.dispose();
    this.sky = this.far = this.near = this.star = this.dust = null;
    this.noise = null;
    pulsarRef.current = { t: 0, phase: 0, crossing: 0, count: 0 };
  }
}
