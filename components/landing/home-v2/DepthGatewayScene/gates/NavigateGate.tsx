"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { STATION_NAVIGATE, depthOpacityForWorldPosition } from "../sceneGeom";

/**
 * NavigateGate — the world-space "navigate the intelligence" landmark
 * parked at `STATION_NAVIGATE`, a fly-through gate inside passthrough-01
 * (ADR-018, Navigate/Encode/Build remap).
 *
 * Gives the Navigate phase a named PLACE between the setup compass and
 * the Encode orbits. The camera flies through it; optical presence is
 * camera-depth driven (no progress-only fade clip), so it emerges from
 * the distance and recedes as the camera passes — exactly like the
 * interstitial gate.
 *
 * Composition (2026-06-05 petal-unfold revision — the outer rotated
 * square armature + corner bearing ticks were dropped because they
 * read as a competing frame around the brand mark + accreted shell
 * dodecahedron, which together already give the eye plenty of
 * structure to anchor on):
 *   - MID ring: a tilted ellipse so it reads as a passage angled into
 *     the corridor (depth cue).
 *   - COMPASS cross: four cardinal spokes from the centre (Navigate
 *     signature).
 *   - CENTRE diamond: the Thoughtform through-line shape.
 */

const MID_RING_R = 0.66;
const MID_RING_TILT_RAD = 0.3;
const COMPASS_R = 0.48;
const CENTRE_DIAMOND_R = 0.23;
// Wide, gentle depth window so the landmark lingers as the camera
// flies in and fades softly as it passes — but still fully dark at
// the parked setup beat, where the camera sits ~6.8 units back (Z≈10)
// from this Z≈3.2 gate. Keep far+farFade < ~6.6 so it stays hidden
// there; the near side stays full almost until the camera reaches it.
const NAVIGATE_DEPTH_WINDOW = {
  near: 0.4,
  nearFade: 1.8,
  far: 4.8,
  farFade: 1.6,
} as const;

export function NavigateGate() {
  const groupRef = useRef<THREE.Group>(null);

  // ── Mid ring: tilted ellipse so it reads as a passage ──────
  const midRingGeom = useMemo(() => {
    const segments = 96;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const x = Math.cos(a) * MID_RING_R;
      const y = Math.sin(a) * MID_RING_R;
      const z = -y * Math.sin(MID_RING_TILT_RAD);
      const yT = y * Math.cos(MID_RING_TILT_RAD);
      points.push(new THREE.Vector3(x, yT, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  // ── Compass cross: four cardinal spokes (Navigate signature) ──
  const compassGeom = useMemo(() => {
    const r = COMPASS_R;
    const inner = 0.12;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, inner, 0.04),
      new THREE.Vector3(0, r, 0.04),
      new THREE.Vector3(0, -inner, 0.04),
      new THREE.Vector3(0, -r, 0.04),
      new THREE.Vector3(inner, 0, 0.04),
      new THREE.Vector3(r, 0, 0.04),
      new THREE.Vector3(-inner, 0, 0.04),
      new THREE.Vector3(-r, 0, 0.04),
    ]);
  }, []);

  // ── Centre diamond ─────────────────────────────────────────
  const diamondGeom = useMemo(() => {
    const r = CENTRE_DIAMOND_R;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, r, 0.05),
      new THREE.Vector3(r, 0, 0.05),
      new THREE.Vector3(0, -r, 0.05),
      new THREE.Vector3(-r, 0, 0.05),
      new THREE.Vector3(0, r, 0.05),
    ]);
  }, []);

  // ── Materials ───────────────────────────────────────────────
  const midRingMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(0.93, 0.89, 0.84),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );
  const compassMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(0.93, 0.89, 0.84),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );
  const diamondMat = useMemo(
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
      midRingGeom.dispose();
      compassGeom.dispose();
      diamondGeom.dispose();
      midRingMat.dispose();
      compassMat.dispose();
      diamondMat.dispose();
    };
  }, [midRingGeom, compassGeom, diamondGeom, midRingMat, compassMat, diamondMat]);

  // ── Per-frame visibility envelope ───────────────────────────
  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const { progress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const opacity = depthOpacityForWorldPosition(
      progress,
      STATION_NAVIGATE.position,
      NAVIGATE_DEPTH_WINDOW
    );

    midRingMat.opacity = opacity * 0.45;
    compassMat.opacity = opacity * 0.5;
    diamondMat.opacity = opacity * 0.7;

    // Slow spin so the gate reads as instrument-alive at a fixed Z.
    group.rotation.z = progress * 0.6;
  });

  return (
    <group ref={groupRef} position={STATION_NAVIGATE.position} visible={false}>
      <lineLoop geometry={midRingGeom} material={midRingMat} />
      <lineSegments geometry={compassGeom} material={compassMat} />
      <lineLoop geometry={diamondGeom} material={diamondMat} />
    </group>
  );
}
