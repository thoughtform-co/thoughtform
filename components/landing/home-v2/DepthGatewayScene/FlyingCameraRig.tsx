"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { CAMERA_FOV, CAMERA_START, getCameraLookAt, getCameraPosition } from "./sceneGeom";

/**
 * FlyingCameraRig — scroll-driven camera dolly for the home-v2
 * depth-corridor scene (ADR-018).
 *
 * Reads the eased `cameraT` directly from the depth store and
 * lerps the camera between `CAMERA_START` and `CAMERA_END`, with a
 * forward-looking gaze point so each frame the camera looks INTO
 * the corridor rather than at a fixed world centre.
 *
 * The lookAt point travels with the camera (always LOOK_AHEAD
 * units further down the corridor) which is the perspective signal
 * that makes the user feel like they are flying forward through
 * gates.
 */
export function FlyingCameraRig() {
  const { camera } = useThree();

  // One-time camera bootstrap. R3F's <Canvas camera={...}> prop
  // sets the initial position, but the look-at + fov are not
  // re-applied per frame by default. We set both explicitly here so
  // the first frame frames CAMERA_START → forward correctly.
  useEffect(() => {
    camera.position.set(...CAMERA_START);
    // Look forward into the corridor on first frame.
    const [lx, ly, lz] = getCameraLookAt(0);
    camera.lookAt(lx, ly, lz);
    if ("fov" in camera && (camera as { fov: number }).fov !== undefined) {
      (camera as { fov: number; updateProjectionMatrix: () => void }).fov = CAMERA_FOV;
      camera.updateProjectionMatrix();
    } else {
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  useFrame(() => {
    const { cameraT } = useDepthGatewayStore.getState().transform;
    const [x, y, z] = getCameraPosition(cameraT);
    camera.position.set(x, y, z);
    const [lx, ly, lz] = getCameraLookAt(cameraT);
    camera.lookAt(lx, ly, lz);
  });

  return null;
}
