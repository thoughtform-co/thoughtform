import * as THREE from "three";

import { VISTA } from "@/lib/latent-flight/vistaPalette";

import { rawColor } from "./color";

import { bandFragment, hazeFragment, skyVertex } from "../shaders/sky";

/**
 * The sky: two BackSide spheres welded to the camera, painted first.
 *   haze  r 240 — the isoline field, the instrument's reading of latent space
 *   band  r 250 — the warm dust band, tilted 62° off the flight axis
 * Both write no depth and test none: they are behind everything by
 * construction, and the far stars at r 300 must not be occluded by a sphere
 * that is closer only because it is a sky.
 */

export interface Sky {
  group: THREE.Group;
  setTime(t: number): void;
  dispose(): void;
}

const BAND_TILT = (62 * Math.PI) / 180;

export function createSky(noise: THREE.Texture): Sky {
  const group = new THREE.Group();

  const hazeMat = new THREE.ShaderMaterial({
    vertexShader: skyVertex,
    fragmentShader: hazeFragment,
    uniforms: {
      uNoise: { value: noise },
      uDawn: { value: rawColor(VISTA.dawn) },
      uAlpha: { value: 1 },
      uDrift: { value: 0 },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const haze = new THREE.Mesh(new THREE.SphereGeometry(240, 48, 32), hazeMat);
  haze.renderOrder = -3;
  haze.frustumCulled = false;

  // The band's "up" is the normal of its great circle: the flight axis (−Z)
  // tilted by 62° toward +Y so the band crosses the sky at a slant.
  const bandUp = new THREE.Vector3(0, Math.cos(BAND_TILT), -Math.sin(BAND_TILT)).normalize();
  const bandMat = new THREE.ShaderMaterial({
    vertexShader: skyVertex,
    fragmentShader: bandFragment,
    uniforms: {
      uNoise: { value: noise },
      uDawn: { value: rawColor(VISTA.dawn) },
      uBandUp: { value: bandUp },
      uAlpha: { value: 0.045 },
      uDrift: { value: 0 },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const band = new THREE.Mesh(new THREE.SphereGeometry(250, 48, 32), bandMat);
  band.renderOrder = -2;
  band.frustumCulled = false;

  group.add(haze, band);

  return {
    group,
    setTime(t) {
      hazeMat.uniforms.uDrift.value = t * 0.004;
      bandMat.uniforms.uDrift.value = t * 0.0015;
    },
    dispose() {
      haze.geometry.dispose();
      band.geometry.dispose();
      hazeMat.dispose();
      bandMat.dispose();
    },
  };
}
