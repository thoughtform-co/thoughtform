import * as THREE from "three";

import { buildDust } from "@/lib/latent-flight/starCatalog";
import { VISTA } from "@/lib/latent-flight/vistaPalette";

import { rawColor } from "./color";

import { dustFragment, dustVertex } from "../shaders/points";

/**
 * Foreground dust — the near-field motes that give parallax and, once the
 * ship moves, the speed streaks. Perfectly still at velocity 0: the space
 * holds when the reader stops. Camera-relative wrap over `DUST_SPAN`.
 */

export const DUST_SPAN = 40;

export interface Dust {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  dispose(): void;
}

export function createDust(count: number): Dust {
  const layout = buildDust(count, 8807, 20, 13, DUST_SPAN);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(layout.positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(layout.seed, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: dustVertex,
    fragmentShader: dustFragment,
    uniforms: {
      uPointSize: { value: 1.2 },
      uPixelRatio: { value: 1 },
      uTravel: { value: 0 },
      uSpan: { value: DUST_SPAN },
      uVelocity: { value: 0 },
      uColor: { value: rawColor(VISTA.dawn) },
      uOpacity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 2;
  return {
    points,
    material,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
