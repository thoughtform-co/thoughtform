"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { gyroTilt, useGyroLabStore } from "@/lib/stores/gyroLabStore";
import { getBrandmarkAccretionLayers, getBrandmarkWorldPosition } from "./sceneGeom";
import { ShellEncode } from "./shell/ShellEncode";
import { ShellNewsOrbit } from "./shell/ShellNewsOrbit";
import { ShellStack } from "./shell/ShellStack";
import { ShellSubstrate } from "./shell/ShellSubstrate";
import { ShellSubstrateGyro } from "./shell/ShellSubstrateGyro";
import {
  EPILOGUE_SHELL_X,
  GYRO_ASSEMBLY_SCALE,
  SUBSTRATE_GYRO_DRIFT_AMP,
  SUBSTRATE_GYRO_DRIFT_PITCH_FREQ,
  SUBSTRATE_GYRO_DRIFT_ROLL_FREQ,
  SUBSTRATE_GYRO_ENCODE_MOUSE_FLOOR,
  SUBSTRATE_GYRO_ENCODE_TILT_FLOOR,
  SUBSTRATE_GYRO_MOUSE_LERP,
  SUBSTRATE_GYRO_STATIC_TILT_X,
  SUBSTRATE_GYRO_STATIC_TILT_Y,
} from "./shell/shellGeom";

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

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

  // 3D gimbaled gyroscope is the production Navigate read (default true
  // in `gyroLabStore`). The lab route `/test/navigate-gyroscope` keeps
  // the `GyroLabPanel` overlay for live tuning; setting `enabled` to
  // false from anywhere restores the flat `ShellSubstrate` compass.
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
    const { paintProgress, epilogueProgress, active, armed } = transform;
    const painting = active || armed;

    if (!painting) {
      shell.visible = false;
      return;
    }

    shell.visible = true;
    const [bx, by, bz] = getBrandmarkWorldPosition(paintProgress);
    // Epilogue glide-right: once the corridor has parked the shell at
    // the Intelligence anchor (paintProgress === 1), `epilogueProgress`
    // ramps 0..1 across the extra scroll and slides the whole accretion
    // shell laterally by `EPILOGUE_SHELL_X`. The orbiting news cards
    // mounted as a sibling of `gyroAssemblyRef` inherit this slide so
    // they stay framed around the sphere as it migrates right.
    const epiSlide = smoothstep(0, 1, epilogueProgress) * EPILOGUE_SHELL_X;
    shell.position.set(bx + epiSlide, by, bz);

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

      // Mouse amplitude is already calmed via `mouseCalm`; don't apply
      // `tiltCalm` a second time or the Build phase becomes visually
      // unresponsive while the gimbal shell still rotates.
      pitch = pointerSmoothed.current.pitch + driftPitch;
      yaw = pointerSmoothed.current.yaw;
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
        // Uniform assembly scale enlarges the whole instrument (gimbal +
        // cardinals + orbits + funnel) about the brandmark centre. The
        // matching DOM-label scale lives in
        // `sceneGeom.gyroAssemblyWorldPosition`. Rotation is still set
        // imperatively per-frame in useFrame (scale + rotation compose).
        <group ref={gyroAssemblyRef} scale={GYRO_ASSEMBLY_SCALE}>
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
      {/* News-card orbit lives as a sibling of the gyro assembly so it
          inherits the shell's epilogue X-slide but is NOT subject to the
          gyro's pointer-driven tilt — the cards stay billboarded toward
          the camera regardless of mouse-look on the sphere. */}
      <ShellNewsOrbit reducedMotion={isMobile} />
    </group>
  );
}
