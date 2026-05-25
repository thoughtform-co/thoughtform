"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { CAMERA_FOV, CAMERA_START, getCameraLookAt, getCameraPosition } from "./sceneGeom";

/**
 * FlyingCameraRig — scroll-driven camera dolly for the home-v2
 * depth-corridor scene (ADR-018, REBUILT for the world-owned model).
 *
 * Reads the current global progress from the depth store and writes
 * the camera's position + lookAt every frame. The camera path is
 * owned by `sceneGeom.ts` and is a pure Z dolly: the camera holds
 * at `CAMERA_START.z` across the Thoughtform pan window, then
 * smoothsteps to `CAMERA_END.z` across the rest of the corridor.
 *
 * Look-at travels with the camera (LOOK_AHEAD units further down
 * the corridor) so the gaze always points INTO the next gate — the
 * perspective signal that reads as "we are flying forward".
 */
export function FlyingCameraRig() {
  const { camera } = useThree();

  // One-time bootstrap. R3F's <Canvas camera={...}> only sets the
  // initial position; we set position + lookAt + fov here so the
  // first frame frames CAMERA_START -> forward correctly.
  useEffect(() => {
    camera.position.set(...CAMERA_START);
    const [lx, ly, lz] = getCameraLookAt(0);
    camera.lookAt(lx, ly, lz);
    camera.up.set(0, 1, 0);
    if ("fov" in camera && (camera as { fov: number }).fov !== undefined) {
      (camera as { fov: number; updateProjectionMatrix: () => void }).fov = CAMERA_FOV;
      camera.updateProjectionMatrix();
    } else {
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  useFrame(() => {
    // Drive the rig from `paintProgress` so the camera sits at the
    // parked Thoughtform layout (progress 0) during the `armed` pre-
    // arm pass — mirrors the DOM tracker so DOM + R3F project from
    // the same camera the moment the stage pins.
    const { paintProgress } = useDepthGatewayStore.getState().transform;
    const [x, y, z] = getCameraPosition(paintProgress);
    camera.position.set(x, y, z);
    const [lx, ly, lz] = getCameraLookAt(paintProgress);
    camera.lookAt(lx, ly, lz);
  });

  return null;
}
