"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  CAMERA_FOV,
  CAMERA_START,
  getCameraLookAt,
  getCameraPosition,
  getCameraRoll,
} from "./sceneGeom";

/**
 * FlyingCameraRig — scroll-driven camera dolly for the home-v2
 * depth-corridor scene (ADR-018, REBUILT for the world-owned model).
 *
 * Reads the current global progress from the depth store and writes
 * the camera's position + lookAt + roll every frame. The camera path
 * is owned by `sceneGeom.ts`:
 *
 *   - Z dolly: smoothstep'd over the full stage progress.
 *   - X reframe: concentrated in passthrough-01 [0.18, 0.32], so by
 *     parked Diagnostic the camera is centred and world-origin
 *     objects project dead-centre.
 *   - Roll: tiny bell-curve "bank into the turn" peaked in the
 *     middle of passthrough-01.
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
    const { progress } = useDepthGatewayStore.getState().transform;
    const [x, y, z] = getCameraPosition(progress);
    camera.position.set(x, y, z);
    const [lx, ly, lz] = getCameraLookAt(progress);
    camera.lookAt(lx, ly, lz);
    // Apply roll AFTER lookAt so the up-vector tilt sticks. lookAt
    // resets the camera's up to (0,1,0); we then translate the
    // up-vector into a banked direction for the bell-curve roll.
    const roll = getCameraRoll(progress);
    if (roll !== 0) {
      camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    } else {
      camera.up.set(0, 1, 0);
    }
    camera.lookAt(lx, ly, lz);
  });

  return null;
}
