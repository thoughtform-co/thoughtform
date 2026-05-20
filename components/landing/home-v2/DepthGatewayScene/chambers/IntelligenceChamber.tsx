"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  buildSphereCloudGeometry,
  buildTiltedRingLineLoop,
} from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { createSphereCloudMaterial } from "@/components/landing/v7/intelligence-layer/celestialMaterials";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  LEFT_BODY_POSITION,
  RIGHT_BODY_POSITION,
  SIDE_BODY_SCALE,
  getSideBodyOpacity,
} from "../sceneGeom";

/**
 * IntelligenceChamber — left + right celestial bodies that fade in
 * during Chamber C of the depth gateway, flanking the substrate-
 * morphed brandmark.
 *
 * Each side body is a Fibonacci-sphere point cloud (same primitive
 * as the production intelligence-layer triad's `CelestialBody`) with
 * a single tilted orbital ring. The visual register matches the
 * production triad so the v2 page reads as a related composition.
 *
 * Side body labels (Trusted Sources / Headless Surfaces) come
 * from the v7 .ilayer__chamber DOM elements in the sliced markup —
 * they position themselves via the static .ilayer__chamber--left /
 * --right CSS rules (no R3F-driven projection needed).
 */
const DEG = Math.PI / 180;
const RING_TILT_LEFT: [number, number, number] = [16 * DEG, 0, 8 * DEG];
const RING_TILT_RIGHT: [number, number, number] = [16 * DEG, 0, -8 * DEG];
const RING_RADIUS = 0.62;
const SPHERE_RADIUS = 0.46;
const SPHERE_POINT_COUNT = 1100;

interface SideBodyProps {
  id: "left" | "right";
  position: readonly [number, number, number];
  ringTilt: readonly [number, number, number];
}

function SideBody({ id, position, ringTilt }: SideBodyProps) {
  const groupRef = useRef<THREE.Group>(null);

  const cloudGeom = useMemo(() => buildSphereCloudGeometry(SPHERE_RADIUS, SPHERE_POINT_COUNT), []);
  const cloudMat = useMemo(
    () =>
      createSphereCloudMaterial(new THREE.Color("#ebe3d6"), new THREE.Color("#f3ecdb"), 0.78, 3.6),
    []
  );
  const ringGeom = useMemo(() => buildTiltedRingLineLoop(RING_RADIUS, ringTilt), [ringTilt]);
  const ringMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#caa554"),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      cloudGeom.dispose();
      cloudMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
    };
  }, [cloudGeom, cloudMat, ringGeom, ringMat]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const { chamberC, active } = useDepthGatewayStore.getState().transform;

    if (!active) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const t = state.clock.elapsedTime;
    // Slow auto-rotation gives the bodies a "living" feel during
    // Chamber C. Same rate as the production triad's substrate body
    // (0.03 rad/sec) so the registers match.
    group.rotation.y = t * 0.03 * (id === "left" ? -1 : 1);

    const opacity = getSideBodyOpacity(chamberC);
    cloudMat.uniforms.uPresence.value = opacity;
    cloudMat.uniforms.uTime.value = t;
    cloudMat.uniforms.uPixelRatio.value = state.viewport.dpr;
    ringMat.opacity = opacity * 0.5;
  });

  return (
    <group ref={groupRef} position={position} scale={SIDE_BODY_SCALE}>
      <points geometry={cloudGeom} material={cloudMat} />
      <lineLoop geometry={ringGeom} material={ringMat} />
    </group>
  );
}

export function IntelligenceChamber() {
  return (
    <>
      <SideBody id="left" position={LEFT_BODY_POSITION} ringTilt={RING_TILT_LEFT} />
      <SideBody id="right" position={RIGHT_BODY_POSITION} ringTilt={RING_TILT_RIGHT} />
    </>
  );
}
