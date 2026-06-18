"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { DOCKED_INSTRUMENT_EPILOGUE_POSE } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedDissipate, getSmoothedEpilogueProgress } from "./motionFollower";
import {
  CAMERA_START,
  getCameraFov,
  getCameraLookAt,
  getCameraPosition,
  getCorridorExitCameraPose,
  getEpilogueCameraPose,
} from "./sceneGeom";

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
  // Eased 0..1 blend toward the docked pose. Lerping the effective
  // epilogue scrub between the live (landing) value and the held docked
  // pose means engaging/leaving the dock glides instead of snapping.
  const dockBlend = useRef(0);

  // One-time bootstrap + resize sync. R3F's <Canvas camera={...}> only
  // sets the initial position; we set position + lookAt + fov here so
  // the first frame frames CAMERA_START -> forward correctly. The fov
  // is aspect-aware (`getCameraFov`) so portrait viewports widen the
  // vertical FOV to preserve horizontal coverage, and re-applies on
  // resize/rotate. The DOM mirror camera in `useWorldDomTracker` reads
  // the SAME function, so canvas geometry and projected copy/brandmark
  // stay in sync. (ADR-018 mobile revision.)
  useEffect(() => {
    camera.position.set(...CAMERA_START);
    const [lx, ly, lz] = getCameraLookAt(0);
    camera.lookAt(lx, ly, lz);
    camera.up.set(0, 1, 0);

    const applyFov = () => {
      if ("fov" in camera && (camera as { fov: number }).fov !== undefined) {
        const aspect = window.innerWidth / window.innerHeight;
        (camera as { fov: number; updateProjectionMatrix: () => void }).fov = getCameraFov(aspect);
      }
      camera.updateProjectionMatrix();
    };
    applyFov();
    window.addEventListener("resize", applyFov);
    window.addEventListener("orientationchange", applyFov);
    return () => {
      window.removeEventListener("resize", applyFov);
      window.removeEventListener("orientationchange", applyFov);
    };
  }, [camera]);

  useFrame((_, delta) => {
    // Drive the rig from `paintProgress` so the camera sits at the
    // parked Thoughtform layout (progress 0) during the `armed` pre-
    // arm pass — mirrors the DOM tracker so DOM + R3F project from
    // the same camera the moment the stage pins.
    const { paintProgress, docked } = useDepthGatewayStore.getState().transform;

    // Epilogue v3 — once paintProgress saturates at 1 and the user
    // continues scrolling into the epilogue, `getEpilogueCameraPose`
    // takes over. At epilogueProgress = 0 the pose returns the parked
    // CAMERA_END frame so the corridor->epilogue handoff is a no-op
    // until the user actually starts scrolling past Build.
    //
    // 2026-06-11 smoothness pass: the pose flies the SMOOTHED scrub
    // from the motion follower, not the raw store value. The raw
    // scrub is quantized by wheel notches, and the flyover covers a
    // large spatial arc in ~2 viewports of scroll, so each notch
    // stepped the camera visibly. The follower (driven at priority
    // -10, before this rig) melts those steps into one continuous
    // exponential glide; planet grow + shell fades read the same
    // channel so the whole flyover moves on one clock. Scroll-back
    // eases the camera home through the same curve before the
    // corridor path resumes.
    const smoothedEp = getSmoothedEpilogueProgress();
    const dt = Math.min(0.1, Math.max(0, delta));
    const k = 1 - Math.exp(-dt / 0.28);
    dockBlend.current += ((docked ? 1 : 0) - dockBlend.current) * k;
    // CRITICAL: snap the dock blend to exactly 0 once we're fully out of the
    // epilogue (not docked AND no smoothed scrub). The blend decays
    // exponentially and never reaches 0 on its own, so after ANY dock visit it
    // lingered at a sub-perceptual positive value forever. That kept `ep > 0`
    // true, pinning the camera to the epilogue branch — and
    // `getEpilogueCameraPose(~0)` returns CAMERA_END, which teleported the
    // camera to the corridor's END pose even after the user scrolled back to a
    // mid-corridor station. The parked dolly (`getCameraPosition`) never
    // reapplied, so the substrate gimbal sat at the wrong camera distance and
    // collapsed into a diffuse point cloud until a full page refresh reset the
    // ref. The snap restores the corridor dolly the moment we leave the
    // epilogue. (The branch boundary stays continuous: getCameraPosition(1) ===
    // CAMERA_END === getEpilogueCameraPose(0).)
    if (!docked && smoothedEp <= 1e-4) dockBlend.current = 0;
    const ep = smoothedEp + (DOCKED_INSTRUMENT_EPILOGUE_POSE - smoothedEp) * dockBlend.current;
    if (ep > 1e-4) {
      const pose = getEpilogueCameraPose(ep);
      // ADR-021 corridor-exit zoom-dissipate: when the user scrolls
      // into #services, `useCorridorExitScroll` keeps `docked = true`
      // and ramps `dockProgress` (the single speed-ramped dissipate
      // clock) from 0 → 1 across the first viewport. The exit pose at dissipate 0
      // returns EXACTLY the docked pose by construction
      // (`getCorridorExitCameraPose(0) === getEpilogueCameraPose(
      // DOCKED_INSTRUMENT_EPILOGUE_POSE)`), so this lerp is identity
      // at engage and the camera continuously pulls in toward the
      // planet centre as the dissipate clock ramps. Reverse-scroll
      // releases dockProgress back to 0 (single-writer rule:
      // `useCorridorExitScroll` is the only writer of this channel
      // while `useDepthScroll` zeroes it on release), so the camera
      // returns to the docked-blend pose with no pop.
      // Fly the SMOOTHED dissipate (motionFollower) instead of the raw
      // store scrub so the fly-into-sphere melts wheel notches into one
      // glide, matching the epilogue flyover. The dissipate is already
      // shaped by `corridorExitSpeedRamp` (smootherstep) in
      // `useCorridorExitScroll`; the follower is a temporal FILTER on
      // top, NOT a second easing curve, so the single-authored-curve
      // contract holds (the welded brandmark + ticker fly the SAME
      // smoothed value, so they stay glued to this sphere). Easing from
      // 0 is a no-op at engage because `getCorridorExitCameraPose(0)`
      // === the docked pose by construction.
      const dissipate = docked ? getSmoothedDissipate() : 0;
      if (dissipate > 1e-4) {
        const exitPose = getCorridorExitCameraPose(dissipate);
        const t = dissipate;
        camera.position.set(
          pose.position[0] * (1 - t) + exitPose.position[0] * t,
          pose.position[1] * (1 - t) + exitPose.position[1] * t,
          pose.position[2] * (1 - t) + exitPose.position[2] * t
        );
        camera.lookAt(
          pose.lookAt[0] * (1 - t) + exitPose.lookAt[0] * t,
          pose.lookAt[1] * (1 - t) + exitPose.lookAt[1] * t,
          pose.lookAt[2] * (1 - t) + exitPose.lookAt[2] * t
        );
        return;
      }
      camera.position.set(...pose.position);
      camera.lookAt(...pose.lookAt);
      return;
    }

    const [x, y, z] = getCameraPosition(paintProgress);
    camera.position.set(x, y, z);
    const [lx, ly, lz] = getCameraLookAt(paintProgress);
    camera.lookAt(lx, ly, lz);
  });

  return null;
}
