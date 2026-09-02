import * as THREE from "three";

import { buildStars } from "@/lib/latent-flight/starCatalog";
import { VISTA } from "@/lib/latent-flight/vistaPalette";

import { rawColor } from "./color";

import { starFragment, starVertex } from "../shaders/points";

/**
 * Two star layers.
 *   far   a shell at r 300 whose GROUP is welded to the camera's position
 *         every frame (zero parallax = infinity; rotation is never copied,
 *         so the sky turns correctly with yaw). Paint-only, no twinkle —
 *         the corridor's law: no idle motion in the deep bed.
 *   near  a world shell at 40–140 that parallaxes once flight begins, and
 *         the only layer that twinkles (the bright quintile, ±12 %).
 */

export interface StarLayer {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  dispose(): void;
}

function makeLayer(
  count: number,
  seed: number,
  rMin: number,
  rMax: number,
  pointSize: number,
  twinkle: number,
  opacity: number
): StarLayer {
  const layout = buildStars(count, seed, rMin, rMax);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(layout.positions, 3));
  geometry.setAttribute("aMag", new THREE.BufferAttribute(layout.mag, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(layout.phase, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: starVertex,
    fragmentShader: starFragment,
    uniforms: {
      uPointSize: { value: pointSize },
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },
      uTwinkle: { value: twinkle },
      uSoft: { value: rawColor(VISTA.dawnSoft) },
      uDawn: { value: rawColor(VISTA.dawn) },
      uHot: { value: rawColor(VISTA.dawnHot) },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return {
    points,
    material,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

export function createFarStars(count: number): StarLayer {
  const layer = makeLayer(count, 1201, 300, 300, 1.9, 0, 0.95);
  layer.points.renderOrder = -1;
  return layer;
}

export function createNearStars(count: number): StarLayer {
  const layer = makeLayer(count, 3407, 40, 140, 1.8, 1, 0.9);
  layer.points.renderOrder = 0;
  return layer;
}
