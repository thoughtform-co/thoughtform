"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { DOLLY_HOLD_END, smoothstep } from "@/lib/home-v2/corridorMap";
import { epilogueBand, getEpiloguePlanetScale } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { gyroTilt, useGyroLabStore } from "@/lib/stores/gyroLabStore";
import { getSmoothedAccretionLayers } from "./motionFollower";
import { getBrandmarkWorldPosition } from "./sceneGeom";
import { ShellEncode } from "./shell/ShellEncode";
import { ShellStack } from "./shell/ShellStack";
import { ShellSubstrate } from "./shell/ShellSubstrate";
import { ShellSubstrateGyro } from "./shell/ShellSubstrateGyro";
import {
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
    shell.position.set(bx, by, bz);

    const gyroAssembly = gyroAssemblyRef.current;
    if (!gyroEnabled || !gyroAssembly) {
      gyroTilt.x = 0;
      gyroTilt.y = 0;
      gyroTilt.z = 0;
      return;
    }

    // Epilogue v3 planet-grow: the substrate gimbal scales up across
    // the APPROACH band so the small instrument becomes a planet
    // the camera lands on. Composes with the parked GYRO_ASSEMBLY_SCALE
    // and saturates at 1 (no change) inside the calibrated corridor.
    const planetScale = getEpiloguePlanetScale(epilogueProgress);
    gyroAssembly.scale.setScalar(GYRO_ASSEMBLY_SCALE * planetScale);

    const layers = getSmoothedAccretionLayers();
    const tiltCalm = 1 - (1 - SUBSTRATE_GYRO_ENCODE_TILT_FLOOR) * layers.orbits;
    // Calm the pointer bank to zero across APPROACH — planets don't
    // wobble with the mouse. APPROACH ramps 0..1 so we lerp the
    // existing mouseCalm down to 0 as it ramps.
    const approachT = epilogueBand(epilogueProgress, "APPROACH");
    const planetCalm = 1 - approachT;
    // Corridor-entry gate: pointer + drift + static tilt all ramp from
    // 0 to 1 as the camera dolly releases at DOLLY_HOLD_END. While the
    // user is parked at the section-2 Thoughtform read the brandmark
    // sits axis-aligned and does NOT bank with the mouse; banking
    // resolves only once we begin flying through the 3D corridor. The
    // 0.06 ramp width sits inside pass-01a so the bank is fully active
    // before the camera reaches Navigate.
    const enterFly = smoothstep(DOLLY_HOLD_END, DOLLY_HOLD_END + 0.06, paintProgress);
    const mouseCalm =
      (1 - (1 - SUBSTRATE_GYRO_ENCODE_MOUSE_FLOOR) * layers.orbits) * planetCalm * enterFly;
    const { mouseAmpDeg, idleSpeed } = useGyroLabStore.getState();
    const ampRad = ((mouseAmpDeg * Math.PI) / 180) * mouseCalm;
    const dt = Math.min(0.1, delta);
    const t = state.clock.elapsedTime;

    let pitch: number;
    let yaw: number;
    let roll = 0;

    if (motionFrozen) {
      pitch = SUBSTRATE_GYRO_STATIC_TILT_X * enterFly;
      yaw = SUBSTRATE_GYRO_STATIC_TILT_Y * enterFly;
    } else {
      const targetPitch = -pointer.current.y * ampRad;
      const targetYaw = pointer.current.x * ampRad;
      const k = 1 - Math.exp(-SUBSTRATE_GYRO_MOUSE_LERP * dt);
      pointerSmoothed.current.pitch += (targetPitch - pointerSmoothed.current.pitch) * k;
      pointerSmoothed.current.yaw += (targetYaw - pointerSmoothed.current.yaw) * k;

      const driftPitch =
        Math.sin(t * SUBSTRATE_GYRO_DRIFT_PITCH_FREQ * idleSpeed) *
        SUBSTRATE_GYRO_DRIFT_AMP *
        tiltCalm *
        planetCalm *
        enterFly;
      const driftRoll =
        Math.sin(t * SUBSTRATE_GYRO_DRIFT_ROLL_FREQ * idleSpeed + 1.2) *
        SUBSTRATE_GYRO_DRIFT_AMP *
        tiltCalm *
        planetCalm *
        enterFly;

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
        // `sceneGeom.gyroAssemblyWorldPosition`. Both scale AND rotation
        // are written imperatively per-frame in useFrame so the SPHERE
        // band's epilogue shrink can compose with the base scale.
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
