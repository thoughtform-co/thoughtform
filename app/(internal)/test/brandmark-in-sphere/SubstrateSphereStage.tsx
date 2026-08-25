"use client";

/**
 * SubstrateSphereStage — drops the real Navigate substrate sphere
 * (`ShellSubstrateGyro`) into the lab Canvas at origin, fully
 * revealed and frozen.
 *
 * The production sphere is normally driven by the depth-corridor
 * scroll (`useDepthGatewayStore`) + the temporal motion follower
 * (`motionFollower.ts`). Replicating the corridor scroll here would
 * pull in `HomeV2Page`, the corridor scroll hook, gate timeline
 * math, and the camera rig — none of which we want for a lab. So we
 * minimally satisfy the sphere's reads:
 *
 *   1. `useDepthGatewayStore.transform.active = true` so the sphere
 *      doesn't early-bail in its `useFrame`. `paintProgress ~ 0.42`
 *      lands inside the substrate accretion window
 *      (`CORRIDOR_TIMELINE.accretion.substrate = { 0.30, 0.42 }`)
 *      so the raw target reveal is 1.
 *   2. `useGyroLabStore.enabled = true` (the production default) so
 *      `BrandmarkAccretionShell`-style consumers know we're on the
 *      gyro path. This lab uses `ShellSubstrateGyro` directly, but
 *      the store is also read by the gimbal's idle-spin uniform.
 *   3. A `useFrame(-10)` driver calls `snapMotionFollower` every
 *      frame with `substrate: 1` so the smoothed reveal channel the
 *      gyro reads stays pinned at 1 and the unfold cascade
 *      saturates.
 *
 * Cleanup on unmount restores both stores so the route stays scoped
 * (mirrors `NavigateGyroscopePage`'s scoping pattern).
 *
 * Lab-only: production paths are unchanged.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { ShellSubstrateGyro } from "@/components/landing/home-v2/DepthGatewayScene/shell/ShellSubstrateGyro";
import {
  driveMotionFollower,
  snapMotionFollower,
} from "@/components/landing/home-v2/DepthGatewayScene/motionFollower";
import { GYRO_LAB_DEFAULTS, useGyroLabStore } from "@/lib/stores/gyroLabStore";
import {
  INITIAL_TRANSFORM,
  useDepthGatewayStore,
  type DepthGatewayTransform,
} from "@/lib/stores/depthGatewayStore";

/** PaintProgress that lands inside (and slightly past) the substrate
 *  accretion window so `getBrandmarkAccretionLayers(progress).substrate`
 *  is saturated at 1 (window is [0.30, 0.42]). */
const FROZEN_PAINT_PROGRESS = 0.5;

/** The sphere's outer dotted-shell radius at the parked Navigate
 *  read is roughly `globeRadius × DOTTED_SHELL_RADIUS_MUL ×
 *  GYRO_ASSEMBLY_SCALE` ≈ 0.72 × 1.32 × 1.18 ≈ 1.12 world units.
 *  This wrapper scale matches the production
 *  `BrandmarkAccretionShell` group scale so the camera framing
 *  matches the production Navigate park. */
export const LAB_GYRO_ASSEMBLY_SCALE = 1.18;

export interface SubstrateSphereStageProps {
  /** Hide the sphere entirely (still keeps the freeze harness
   *  running so the Canvas paints a stable scene). */
  showSphere: boolean;
  /** Mirror of the production fallback flag — when true the gyro
   *  skips its idle spin / drift. */
  reducedMotion?: boolean;
}

/**
 * MotionFollowerSnapDriver — runs at useFrame priority -10 so the
 * follower is up-to-date BEFORE `ShellSubstrateGyro`'s own useFrame
 * reads `getSmoothedAccretionLayers()`. Snaps every channel each
 * frame so the sphere stays at full reveal regardless of HMR /
 * re-mount timing.
 */
function MotionFollowerSnapDriver() {
  useFrame((_, delta) => {
    // Snap directly so wall-clock easing never under-shoots reveal=1
    // on the first paint. After the first snap the follower would
    // converge anyway, but `driveMotionFollower` would also fight
    // any other R3F canvas that mounts the production driver — by
    // snapping every frame we keep the lab idempotent.
    snapMotionFollower({
      panOffsetX: 0,
      substrate: 1,
      orbits: 0,
      stack: 0,
      epilogue: 0,
      dissipate: 0,
      // ADR-081's channel. The lab never travels, so it stays parked at 0.
      voidTravel: 0,
    });
    // Touch driveMotionFollower to keep the import live — if any
    // future refactor moves the snap inside `drive`, we want the
    // lab's behaviour preserved.
    void driveMotionFollower;
    void delta;
  }, -10);
  return null;
}

export function SubstrateSphereStage({
  showSphere,
  reducedMotion = false,
}: SubstrateSphereStageProps) {
  // Cache the previous store states once (on mount) so the unmount
  // cleanup restores whatever the page was using before — keeps the
  // lab idempotent if the user navigates away and back.
  const prevDepthRef = useRef<DepthGatewayTransform | null>(null);

  useEffect(() => {
    prevDepthRef.current = useDepthGatewayStore.getState().transform;
    useDepthGatewayStore.getState().setTransform({
      ...INITIAL_TRANSFORM,
      active: true,
      paintProgress: FROZEN_PAINT_PROGRESS,
      progress: FROZEN_PAINT_PROGRESS,
      gateProgress: 1,
    });
    // Snap follower immediately so the first frame already paints
    // a fully revealed sphere (no flash of unrevealed cassette).
    snapMotionFollower({
      panOffsetX: 0,
      substrate: 1,
      orbits: 0,
      stack: 0,
      epilogue: 0,
      dissipate: 0,
      // ADR-081's channel. The lab never travels, so it stays parked at 0.
      voidTravel: 0,
    });
    // Ensure the gyro path is enabled; preserve the user's tuning
    // knobs — we only force `enabled`. Other params stay at whatever
    // the page panel has set them to.
    if (!useGyroLabStore.getState().enabled) {
      useGyroLabStore.getState().set({ enabled: true });
    }
    return () => {
      // Restore whatever the depth store was before we mounted, or
      // the canonical initial transform if there was no prior value.
      useDepthGatewayStore.getState().setTransform(prevDepthRef.current ?? INITIAL_TRANSFORM);
      // Restore the gyro store's defaults rather than the snapshot
      // we may have written through the panel. Mirrors
      // `NavigateGyroscopePage`'s `reset()` on unmount so leaving
      // the route never leaves the production page in a tuned state.
      useGyroLabStore.getState().reset();
    };
  }, []);

  // Reset call above will undo any panel-driven changes made BEFORE
  // unmount, but during the lifetime of the page we want the
  // panel-bound store values to flow through to the gyro. The lab
  // keeps the defaults baked in below as a safety net for unrelated
  // routes that may be reading the same store.
  void GYRO_LAB_DEFAULTS;

  return <SphereGroup showSphere={showSphere} reducedMotion={reducedMotion} />;
}

interface SphereGroupProps {
  showSphere: boolean;
  reducedMotion: boolean;
}

function SphereGroup({ showSphere, reducedMotion }: SphereGroupProps) {
  return (
    <>
      {/* Drives the motion follower BEFORE the sphere's useFrame
          reads it (priority -10). Always mounted so the freeze
          stays in effect even when the sphere is hidden. */}
      <MotionFollowerSnapDriver />
      {showSphere ? (
        // The wrapper scale matches the production
        // `BrandmarkAccretionShell` group scale so the in-canvas
        // camera framing of the gimbal sphere matches the production
        // Navigate park.
        <group scale={LAB_GYRO_ASSEMBLY_SCALE}>
          <ShellSubstrateGyro layerKey="substrate" reducedMotion={reducedMotion} />
        </group>
      ) : null}
    </>
  );
}
