"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { STATION_INTERSTITIAL, depthOpacityForWorldPosition } from "../sceneGeom";

/**
 * InterstitialDiagramGate — the world-space "traveling through a
 * gateway" diagram parked at `STATION_INTERSTITIAL` (ADR-018).
 *
 * Sits in the middle of passthrough-02 so the user sees a third
 * piece of celestial linework approach as the diagnostic orbits
 * drift past the camera and before the intelligence sphere
 * resolves. Uses the Thoughtform shape law (diamonds + concentric
 * armature, no rounded corners).
 *
 * Composition:
 *   - An OUTER armature: a large rotated square frame ("gateway").
 *   - A MID ring: a tilted ellipse so it reads as a passage angled
 *     into the corridor (depth cue).
 *   - An INNER diamond at the geometric centre (Thoughtform shape
 *     law — the through-line).
 *   - Bearing ticks on the armature so the gate reads as
 *     instrument-grade.
 */

const ARMATURE_HALF = 1.4;
const MID_RING_R = 0.9;
const MID_RING_TILT_RAD = 0.28;
const CENTRE_DIAMOND_R = 0.35;
const TICK_COUNT = 16;
const INTERSTITIAL_DEPTH_WINDOW = {
  near: 0.95,
  nearFade: 3,
  far: 7,
  farFade: 3.2,
} as const;

export function InterstitialDiagramGate() {
  const groupRef = useRef<THREE.Group>(null);

  // ── Outer armature: rotated square ──────────────────────────
  const armatureGeom = useMemo(() => {
    const h = ARMATURE_HALF;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-h, h, 0),
      new THREE.Vector3(h, h, 0),
      new THREE.Vector3(h, -h, 0),
      new THREE.Vector3(-h, -h, 0),
      new THREE.Vector3(-h, h, 0),
    ]);
  }, []);

  // ── Mid ring: tilted ellipse so it reads as a passage ──────
  const midRingGeom = useMemo(() => {
    const segments = 96;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const x = Math.cos(a) * MID_RING_R;
      const y = Math.sin(a) * MID_RING_R;
      // Tilt around X axis so the ring leans into the corridor.
      const z = -y * Math.sin(MID_RING_TILT_RAD);
      const yT = y * Math.cos(MID_RING_TILT_RAD);
      points.push(new THREE.Vector3(x, yT, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
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

  // ── Bearing ticks on armature ──────────────────────────────
  const tickPositions = useMemo(() => {
    const out: THREE.Vector3[] = [];
    const h = ARMATURE_HALF;
    const tickLen = 0.12;
    for (let i = 0; i < TICK_COUNT; i++) {
      const a = (i / TICK_COUNT) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      // Find which armature edge this ray hits and place a tick
      // perpendicular to that edge.
      const ax = Math.abs(cos);
      const ay = Math.abs(sin);
      const k = h / Math.max(ax, ay, 1e-6);
      const px = cos * k;
      const py = sin * k;
      // Direction inward (toward centre).
      const inward = new THREE.Vector3(-cos, -sin, 0).normalize();
      out.push(new THREE.Vector3(px, py, 0));
      out.push(new THREE.Vector3(px + inward.x * tickLen, py + inward.y * tickLen, 0));
    }
    const g = new THREE.BufferGeometry().setFromPoints(out);
    return g;
  }, []);

  // ── Materials ───────────────────────────────────────────────
  const armatureMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(0.79, 0.65, 0.33),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );
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
  const tickMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(0.79, 0.65, 0.33),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      armatureGeom.dispose();
      midRingGeom.dispose();
      diamondGeom.dispose();
      tickPositions.dispose();
      armatureMat.dispose();
      midRingMat.dispose();
      diamondMat.dispose();
      tickMat.dispose();
    };
  }, [
    armatureGeom,
    midRingGeom,
    diamondGeom,
    tickPositions,
    armatureMat,
    midRingMat,
    diamondMat,
    tickMat,
  ]);

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

    // Persistent world object: optical presence comes from camera
    // depth, not from a progress-only fade clip.
    const opacity = depthOpacityForWorldPosition(
      progress,
      STATION_INTERSTITIAL.position,
      INTERSTITIAL_DEPTH_WINDOW
    );

    armatureMat.opacity = opacity * 0.5;
    midRingMat.opacity = opacity * 0.45;
    diamondMat.opacity = opacity * 0.7;
    tickMat.opacity = opacity * 0.55;

    // Slow spin so the gate reads as instrument-alive even at a
    // fixed Z.
    group.rotation.z = progress * 0.6;
  });

  return (
    <group ref={groupRef} position={STATION_INTERSTITIAL.position} visible={false}>
      <lineLoop geometry={armatureGeom} material={armatureMat} />
      <lineLoop geometry={midRingGeom} material={midRingMat} />
      <lineLoop geometry={diamondGeom} material={diamondMat} />
      <lineSegments geometry={tickPositions} material={tickMat} />
    </group>
  );
}
