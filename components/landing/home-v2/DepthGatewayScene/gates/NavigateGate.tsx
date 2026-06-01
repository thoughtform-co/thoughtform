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
 * the Encode orbits. Same family + shape law as the interstitial gate
 * (diamonds + concentric armature, no rounded corners), with a compass
 * cross at the centre as the Navigate signature. The camera flies
 * through it; optical presence is camera-depth driven (no progress-only
 * fade clip), so it emerges from the distance and recedes as the camera
 * passes — exactly like the interstitial gate.
 *
 * Composition:
 *   - OUTER armature: a large rotated square frame ("gateway").
 *   - MID ring: a tilted ellipse so it reads as a passage angled into
 *     the corridor (depth cue).
 *   - COMPASS cross: four cardinal spokes from the centre (Navigate).
 *   - CENTRE diamond: the Thoughtform through-line shape.
 *   - Bearing ticks on the armature (instrument-grade).
 */

const ARMATURE_HALF = 1.3;
const MID_RING_R = 0.85;
const MID_RING_TILT_RAD = 0.3;
const COMPASS_R = 0.62;
const CENTRE_DIAMOND_R = 0.3;
const TICK_COUNT = 16;
const NAVIGATE_DEPTH_WINDOW = {
  near: 0.95,
  nearFade: 3,
  far: 7,
  farFade: 3.2,
} as const;

export function NavigateGate() {
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

  // ── Bearing ticks on armature ──────────────────────────────
  const tickPositions = useMemo(() => {
    const out: THREE.Vector3[] = [];
    const h = ARMATURE_HALF;
    const tickLen = 0.12;
    for (let i = 0; i < TICK_COUNT; i++) {
      const a = (i / TICK_COUNT) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const ax = Math.abs(cos);
      const ay = Math.abs(sin);
      const k = h / Math.max(ax, ay, 1e-6);
      const px = cos * k;
      const py = sin * k;
      const inward = new THREE.Vector3(-cos, -sin, 0).normalize();
      out.push(new THREE.Vector3(px, py, 0));
      out.push(new THREE.Vector3(px + inward.x * tickLen, py + inward.y * tickLen, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(out);
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
      compassGeom.dispose();
      diamondGeom.dispose();
      tickPositions.dispose();
      armatureMat.dispose();
      midRingMat.dispose();
      compassMat.dispose();
      diamondMat.dispose();
      tickMat.dispose();
    };
  }, [
    armatureGeom,
    midRingGeom,
    compassGeom,
    diamondGeom,
    tickPositions,
    armatureMat,
    midRingMat,
    compassMat,
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

    const opacity = depthOpacityForWorldPosition(
      progress,
      STATION_NAVIGATE.position,
      NAVIGATE_DEPTH_WINDOW
    );

    armatureMat.opacity = opacity * 0.5;
    midRingMat.opacity = opacity * 0.45;
    compassMat.opacity = opacity * 0.5;
    diamondMat.opacity = opacity * 0.7;
    tickMat.opacity = opacity * 0.55;

    // Slow spin so the gate reads as instrument-alive at a fixed Z.
    group.rotation.z = progress * 0.6;
  });

  return (
    <group ref={groupRef} position={STATION_NAVIGATE.position} visible={false}>
      <lineLoop geometry={armatureGeom} material={armatureMat} />
      <lineLoop geometry={midRingGeom} material={midRingMat} />
      <lineSegments geometry={compassGeom} material={compassMat} />
      <lineLoop geometry={diamondGeom} material={diamondMat} />
      <lineSegments geometry={tickPositions} material={tickMat} />
    </group>
  );
}
