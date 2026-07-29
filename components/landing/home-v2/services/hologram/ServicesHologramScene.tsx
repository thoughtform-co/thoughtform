"use client";

/**
 * ServicesHologramScene — composes the volumetric brandmark artifact and the
 * 3D orbit armillary into ONE shared perspective scene, wrapped in a single
 * RIG GROUP.
 *
 * The rig is the integration mechanism: the mark and its orbits are children of
 * one group that holds the rest pose + a damped pointer-look (the whole rig
 * tilts toward the cursor). So they read as ONE anchored 3D instrument you can
 * peek around — not two layers over each other. The orbit PLANES are fixed in
 * this rig's frame (they never gyrate); only the bodies travel along them.
 *
 * The centerpiece is `VolumetricBrandmarkArtifact` — particles sampled from the
 * real 3D Blender brandmark mesh. It loads a GLB, so it's wrapped in <Suspense>.
 *
 * This component renders scene CONTENTS only (no <Canvas>). The host — the lab
 * page now, the production Services stage — owns the Canvas, camera, and post.
 */

import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";

import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { getServicePose } from "@/lib/home-v2/servicePose";
import { readCorridorDissipate } from "@/lib/home-v2/corridorDissipateRef";
import { SERVICES, type ServiceId } from "../serviceData";
import { HologramOrbits, type OrbitConfig } from "./HologramOrbits";
import {
  VolumetricBrandmarkArtifact,
  type VolumetricBrandmarkArtifactProps,
} from "./VolumetricBrandmarkArtifact";

/** Rig rest pose — a slight lean + a hint of 3/4 so the armillary's diverse
 *  planes read in depth without the mark turning away. Bounded (never edge-on). */
const REST_TILT_X = -0.13;
const REST_TILT_Y = 0.24;

export interface ServicesHologramSceneProps extends Omit<
  VolumetricBrandmarkArtifactProps,
  "scale"
> {
  /** World scale shared by the artifact and the orbits. */
  scale?: number;
  /** Show the 3D orbit armillary. */
  showOrbits?: boolean;
  orbits?: readonly OrbitConfig[];
  activeServiceId?: ServiceId;
  showShell?: boolean;
  /** Publish projected orbit-node anchors to the HUD connector store. */
  publishAnchors?: boolean;
  /** Rig rest pose about X (radians). Default -0.13. */
  restTiltX?: number;
  /** Rig rest pose about Y (radians). Default 0.24. */
  restTiltY?: number;
  /** Pointer-look amplitude (radians) — the whole rig (mark + orbits) tilts
   *  toward the cursor. Default 0.12. 0 = fixed. */
  pointerParallax?: number;
  /** Node travel-speed multiplier (bodies move across their orbits). Default 1. */
  bodySpeed?: number;
  /** Scale on the per-service pose channel. 1 = full pose turns (plate
   *  layout); 0 = pose retired — the ADR-029 card-ring mode, where the
   *  RING's rotation is the per-service turn and a rig yaw on top would
   *  double-rotate it (mirrors the production flag in
   *  BrandmarkPhysicsCoreActor). Default 1. */
  servicePoseAmp?: number;
  /** Extra rig passengers (e.g. `ServicesCardRing` in the orbit lab) —
   *  rendered INSIDE the rig group so they inherit rest pose + pointer-look
   *  exactly like the mark and orbits. */
  children?: ReactNode;
}

export function ServicesHologramScene({
  scale = 1,
  showOrbits = true,
  activeServiceId,
  orbits,
  publishAnchors = false,
  showShell = true,
  restTiltX = REST_TILT_X,
  restTiltY = REST_TILT_Y,
  pointerParallax = 0.12,
  bodySpeed = 1,
  servicePoseAmp = 1,
  children,
  ...artifact
}: ServicesHologramSceneProps) {
  const setAnchors = useHologramConnectors((s) => s.setAnchors);
  const { shellCount, ...artifactRest } = artifact;

  const rigRef = useRef<THREE.Group>(null);
  // Pointer-look: the whole rig nudges toward the mouse so the mark + orbits read
  // as ONE anchored 3D object. Window-level — the canvas is pointer-events:none,
  // so R3F's own pointer never fires here. Damped → settles to still on rest.
  const targetRef = useRef({ pitch: 0, yaw: 0 });
  const dampRef = useRef({ pitch: 0, yaw: 0 });
  // Per-service settle (parity with the production rig in BrandmarkPhysicsCoreActor):
  // the rig damps to a distinct bounded pose per active service so each reveal
  // reads as a turn. Shared amplitude/source via getServicePose.
  const servicePoseDampRef = useRef({ pitch: 0, yaw: 0 });
  const servicePose = getServicePose(
    Math.max(
      0,
      SERVICES.findIndex((s) => s.id === activeServiceId)
    ),
    SERVICES.length
  );
  // Gate pointer-look until the scroll entrance has fully settled (so the fly-in
  // plays cleanly). Damped read of the corridor-exit dissipate clock; 1 when
  // parked (lab / demo) so pointer-look is immediately live there.
  const scrollEntrance = artifactRest.entrance === "scroll";
  const settleRef = useRef(scrollEntrance ? -1 : 1);

  useEffect(() => {
    if (!publishAnchors) return;
    return () => setAnchors([]);
  }, [publishAnchors, setAnchors]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1..1
      const ny = (e.clientY / window.innerHeight) * 2 - 1; // -1..1
      targetRef.current.pitch = -ny * pointerParallax * 0.6; // mouse Y → gentle pitch
      targetRef.current.yaw = nx * pointerParallax; // mouse X → yaw
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [pointerParallax]);

  useFrame((_, delta) => {
    const rig = rigRef.current;
    if (!rig) return;

    // Engage pointer-look only once the entrance has settled (parked → always on).
    let settled = true;
    if (scrollEntrance) {
      const target = readCorridorDissipate(1);
      if (settleRef.current < 0) settleRef.current = target;
      else settleRef.current += (target - settleRef.current) * Math.min(1, delta * 8);
      settled = settleRef.current >= 0.985;
    }

    const k = Math.min(1, delta * 4);

    // Pointer-look channel.
    const damp = dampRef.current;
    const tgt = targetRef.current;
    const tgtPitch = settled ? tgt.pitch : 0;
    const tgtYaw = settled ? tgt.yaw : 0;
    damp.pitch += (tgtPitch - damp.pitch) * k;
    damp.yaw += (tgtYaw - damp.yaw) * k;

    // Per-service settle channel — bounded pose for the active service.
    const pose = servicePoseDampRef.current;
    const poseTgtPitch = settled ? servicePose.pitch * servicePoseAmp : 0;
    const poseTgtYaw = settled ? servicePose.yaw * servicePoseAmp : 0;
    pose.pitch += (poseTgtPitch - pose.pitch) * k;
    pose.yaw += (poseTgtYaw - pose.yaw) * k;

    rig.rotation.set(restTiltX + damp.pitch + pose.pitch, restTiltY + damp.yaw + pose.yaw, 0);
  });

  return (
    <group ref={rigRef}>
      <Suspense fallback={null}>
        <VolumetricBrandmarkArtifact
          {...artifactRest}
          shellCount={showShell ? shellCount : 0}
          scale={scale}
        />
      </Suspense>
      {showOrbits && (
        <HologramOrbits
          activeServiceId={activeServiceId}
          orbits={orbits}
          scale={scale}
          bodySpeed={bodySpeed}
          publishAnchors={publishAnchors ? setAnchors : undefined}
          entrance={artifactRest.entrance}
        />
      )}
      {children}
    </group>
  );
}
