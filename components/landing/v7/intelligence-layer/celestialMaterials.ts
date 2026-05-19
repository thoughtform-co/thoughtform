import * as THREE from "three";
import { atmosphereParticleFragment, atmosphereParticleVertex } from "./shaders/atmosphereParticle";
import { cometParticleFragment, cometParticleVertex } from "./shaders/cometParticle";
import { ringDashFragment, ringDashVertex } from "./shaders/ringDash";
import { sphereSurfaceFragment, sphereSurfaceVertex } from "./shaders/sphereSurface";

const GOLD = new THREE.Color("#caa554");
const DAWN = new THREE.Color("#e9d8a6");

export interface BodyTint {
  sphere: THREE.Color;
  ring: THREE.Color;
  atmosphere: THREE.Color;
}

export const BODY_TINTS: Record<"sources" | "substrate" | "surfaces", BodyTint> = {
  sources: {
    sphere: DAWN.clone().multiplyScalar(0.85),
    ring: GOLD.clone(),
    atmosphere: DAWN.clone(),
  },
  substrate: {
    sphere: GOLD.clone(),
    ring: GOLD.clone(),
    atmosphere: GOLD.clone(),
  },
  surfaces: {
    sphere: DAWN.clone(),
    ring: GOLD.clone().multiplyScalar(0.95),
    atmosphere: DAWN.clone().multiplyScalar(1.05),
  },
};

export function createSphereMaterial(tint: THREE.Color, opacity = 0.72): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: sphereSurfaceVertex,
    fragmentShader: sphereSurfaceFragment,
    uniforms: {
      uTint: { value: tint },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
      uFresnelPower: { value: 2.4 },
      uNoiseScale: { value: 1.8 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function createRingDashMaterial(color: THREE.Color, opacity = 0.7): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: ringDashVertex,
    fragmentShader: ringDashFragment,
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: opacity },
      uProgress: { value: 0 },
      uGlow: { value: 0.35 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export function createAtmosphereMaterial(
  color: THREE.Color,
  opacity = 0.55,
  pointSize = 3.2
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: atmosphereParticleVertex,
    fragmentShader: atmosphereParticleFragment,
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: opacity },
      uPointSize: { value: pointSize },
      uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function createCometMaterial(opacity = 0.65): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: cometParticleVertex,
    fragmentShader: cometParticleFragment,
    uniforms: {
      uColor: { value: GOLD.clone() },
      uOpacity: { value: opacity },
      uPointSize: { value: 4.2 },
      uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Shared low-poly sphere for all three bodies. */
export const SHARED_ICO_SPHERE = new THREE.IcosahedronGeometry(1, 4);
