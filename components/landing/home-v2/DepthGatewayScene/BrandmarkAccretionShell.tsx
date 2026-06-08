"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { gyroTilt, useGyroLabStore } from "@/lib/stores/gyroLabStore";
import { getBrandmarkAccretionLayers, getBrandmarkWorldPosition } from "./sceneGeom";
import { ShellEncode } from "./shell/ShellEncode";
import { ShellStack } from "./shell/ShellStack";
import { ShellSubstrate } from "./shell/ShellSubstrate";
import { ShellSubstrateGyro } from "./shell/ShellSubstrateGyro";
import {
  SUBSTRATE_GYRO_DRIFT_AMP,
  SUBSTRATE_GYRO_DRIFT_PITCH_FREQ,
  SUBSTRATE_GYRO_DRIFT_ROLL_FREQ,
  SUBSTRATE_GYRO_ENCODE_MOUSE_FLOOR,
  SUBSTRATE_GYRO_ENCODE_TILT_FLOOR,
  SUBSTRATE_GYRO_MOUSE_LERP,
  SUBSTRATE_GYRO_STATIC_TILT_X,
  SUBSTRATE_GYRO_STATIC_TILT_Y,
} from "./shell/shellGeom";

/**
 * BrandmarkAccretionShell — the inside-out intelligence layer that
 * accretes around the guiding-star brandmark as it travels the
 * depth corridor (ADR-018).
 *
 * Three layers, each owned by its own reveal envelope from
 * `CORRIDOR_TIMELINE.accretion`:
 *
 *   - {@link ShellSubstrate} (Navigate): migrated flat compass layer boundary.
 *   - {@link ShellEncode} (Encode): four cardinal primitives + compared notes.
 *   - {@link ShellStack} (Build): sources + surfaces dock the layer
 *     into the full stack (funnel composition from the lab FUNNEL
 *     variant — no outer geodesic cage).
 *
 * All three persist after they emerge so the layer is fully assembled
 * at the Build landing around the persistent DOM brandmark.
 */
export function BrandmarkAccretionShell() {
  const tier = useDeviceTier();
  const isMobile = tier === "mobile";

  // LAB-ONLY: swap the flat Navigate compass for the particle-suggested
  // gyroscope at `/test/navigate-gyroscope`. Defaults to `false` (see
  // `gyroLabStore`), so production home + `/test/home-v2` always render
  // the unchanged flat `ShellSubstrate`.
  const gyroEnabled = useGyroLabStore((s) => s.enabled);

  const shellGroupRef = useRef<THREE.Group>(null);
  const gyroAssemblyRef = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const pointerSmoothed = useRef({ pitch: 0, yaw: 0 });
  const motionFrozen = useMemo(() => {
    if (isMobile) return true;
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, [isMobile]);

  useEffect(() => {
    if (!gyroEnabled) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [gyroEnabled]);

  useFrame((state, delta) => {
    const shell = shellGroupRef.current;
    if (!shell) return;

    const transform = useDepthGatewayStore.getState().transform;
    const { paintProgress, active, armed } = transform;
    const painting = active || armed;

    if (!painting) {
      shell.visible = false;
      return;
    }

    shell.visible = true;
    const [bx, by, bz] = getBrandmarkWorldPosition(paintProgress);
    shell.position.set(bx, by, bz);

    const gyroAssembly = gyroAssemblyRef.current;
    if (!gyroEnabled || !gyroAssembly) {
      gyroTilt.x = 0;
      gyroTilt.y = 0;
      gyroTilt.z = 0;
      return;
    }

    const layers = getBrandmarkAccretionLayers(paintProgress);
    const tiltCalm = 1 - (1 - SUBSTRATE_GYRO_ENCODE_TILT_FLOOR) * layers.orbits;
    const mouseCalm = 1 - (1 - SUBSTRATE_GYRO_ENCODE_MOUSE_FLOOR) * layers.orbits;
    const { mouseAmpDeg, idleSpeed } = useGyroLabStore.getState();
    const ampRad = ((mouseAmpDeg * Math.PI) / 180) * mouseCalm;
    const dt = Math.min(0.1, delta);
    const t = state.clock.elapsedTime;

    let pitch: number;
    let yaw: number;
    let roll = 0;

    if (motionFrozen) {
      pitch = SUBSTRATE_GYRO_STATIC_TILT_X;
      yaw = SUBSTRATE_GYRO_STATIC_TILT_Y;
    } else {
      const targetPitch = -pointer.current.y * ampRad;
      const targetYaw = pointer.current.x * ampRad;
      const k = 1 - Math.exp(-SUBSTRATE_GYRO_MOUSE_LERP * dt);
      pointerSmoothed.current.pitch += (targetPitch - pointerSmoothed.current.pitch) * k;
      pointerSmoothed.current.yaw += (targetYaw - pointerSmoothed.current.yaw) * k;

      const driftPitch =
        Math.sin(t * SUBSTRATE_GYRO_DRIFT_PITCH_FREQ * idleSpeed) *
        SUBSTRATE_GYRO_DRIFT_AMP *
        tiltCalm;
      const driftRoll =
        Math.sin(t * SUBSTRATE_GYRO_DRIFT_ROLL_FREQ * idleSpeed + 1.2) *
        SUBSTRATE_GYRO_DRIFT_AMP *
        tiltCalm;

      pitch = (pointerSmoothed.current.pitch + driftPitch) * tiltCalm;
      yaw = pointerSmoothed.current.yaw * tiltCalm;
      roll = driftRoll;
    }

    gyroAssembly.rotation.set(pitch, yaw, roll);
    gyroTilt.x = pitch;
    gyroTilt.y = yaw;
    gyroTilt.z = roll;
  });

  return (
    <group ref={shellGroupRef} visible={false}>
      {gyroEnabled ? (
        <group ref={gyroAssemblyRef}>
          <ShellSubstrateGyro layerKey="substrate" reducedMotion={isMobile} />
          <ShellEncode layerKey="orbits" reducedMotion={isMobile} />
          <ShellStack layerKey="stack" reducedMotion={isMobile} />
        </group>
      ) : (
        <>
          <ShellSubstrate layerKey="substrate" reducedMotion={isMobile} />
          <ShellEncode layerKey="orbits" reducedMotion={isMobile} />
          <ShellStack layerKey="stack" reducedMotion={isMobile} />
        </>
      )}
    </group>
  );
}
