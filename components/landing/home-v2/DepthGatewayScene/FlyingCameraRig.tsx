"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { CAMERA_LOOK_AT, CAMERA_START, getCameraPosition } from "./sceneGeom";

/**
 * FlyingCameraRig — scroll-driven Z-axis camera dolly for the
 * home-v2 depth-gateway scene.
 *
 * Inspired by `ThreeGateway`'s `FlyingCamera` pattern (which sets
 * `camera.position.z = scrollProgress * cameraZMax`), but reads
 * progress imperatively from `depthGatewayStore` inside the R3F
 * frame loop instead of taking it as a prop. The store path keeps
 * the rig decoupled from React props — the rAF scroll hook
 * (`useDepthScroll`) is the single producer, this rig is the
 * single consumer.
 *
 * The camera follows a smoothstep'd lerp between `CAMERA_START` and
 * `CAMERA_END` (see `sceneGeom.ts`) and always looks at
 * `CAMERA_LOOK_AT` (the substrate body's eventual resting
 * position), so the framing stays steady across the dolly —
 * everything in the scene drifts naturally as the camera advances.
 */
export function FlyingCameraRig() {
  const { camera } = useThree();

  // One-time camera bootstrap. R3F's <Canvas camera={...}> prop sets
  // the initial position, but the look-at is not re-applied per
  // frame by default. We set both explicitly here so the first
  // frame (before any scroll has happened) frames CAMERA_START →
  // CAMERA_LOOK_AT correctly.
  useEffect(() => {
    camera.position.set(...CAMERA_START);
    camera.lookAt(...CAMERA_LOOK_AT);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    const { progress } = useDepthGatewayStore.getState().transform;
    const [x, y, z] = getCameraPosition(progress);
    camera.position.set(x, y, z);
    camera.lookAt(CAMERA_LOOK_AT[0], CAMERA_LOOK_AT[1], CAMERA_LOOK_AT[2]);
  });

  return null;
}

// Scratch vectors for any external consumer that needs camera
// projection math. Kept module-level so the per-frame allocation
// stays at zero.
export const _cameraScratch = {
  pos: new THREE.Vector3(),
  target: new THREE.Vector3(),
};
