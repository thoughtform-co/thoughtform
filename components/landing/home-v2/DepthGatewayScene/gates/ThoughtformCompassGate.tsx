"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { STATION_THOUGHTFORM } from "../sceneGeom";

/**
 * ThoughtformCompassGate — the world-space compass diagram parked
 * at `STATION_THOUGHTFORM` (ADR-018).
 *
 * Echoes the v7 sigil compass: a stack of four concentric guide
 * rings, plus a rotated diamond (Thoughtform shape law: zero
 * border-radius, diamonds not circles) at the centre. The whole
 * gate sits in world space at `STATION_THOUGHTFORM.position` so the
 * camera approaches, passes the centre, and the geometry physically
 * crosses the viewport edges before the next gate engages.
 *
 * Lines are rendered as `<lineLoop>` / `<line>` so they paint as
 * crisp hairlines at any camera distance.
 */

const RING_RADII = [1.6, 1.32, 1.05, 0.78];
const DIAMOND_RADIUS = 0.55;
const COMPASS_GOLD = "#caa554";
const COMPASS_GOLD_FAINT = new THREE.Color(0.79, 0.65, 0.33);
const COMPASS_DAWN_FAINT = new THREE.Color(0.93, 0.89, 0.84);

export function ThoughtformCompassGate() {
  const groupRef = useRef<THREE.Group>(null);

  // ── Geometry: 4 ring loops + a diamond + a centre cross ─────
  const ringGeoms = useMemo(() => {
    return RING_RADII.map((r) => {
      const segments = 96;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0));
      }
      return new THREE.BufferGeometry().setFromPoints(points);
    });
  }, []);

  const diamondGeom = useMemo(() => {
    const r = DIAMOND_RADIUS;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, r, 0),
      new THREE.Vector3(r, 0, 0),
      new THREE.Vector3(0, -r, 0),
      new THREE.Vector3(-r, 0, 0),
      new THREE.Vector3(0, r, 0),
    ]);
  }, []);

  const crossGeom = useMemo(() => {
    const r = 0.18;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-r, 0, 0.01),
      new THREE.Vector3(r, 0, 0.01),
      new THREE.Vector3(0, 0, 0.01),
      new THREE.Vector3(0, -r, 0.01),
      new THREE.Vector3(0, r, 0.01),
    ]);
  }, []);

  // ── Materials ───────────────────────────────────────────────
  const ringMats = useMemo(
    () =>
      RING_RADII.map((_, idx) => {
        const isAccent = idx === 0 || idx === 2;
        return new THREE.LineBasicMaterial({
          color: isAccent ? COMPASS_GOLD_FAINT : COMPASS_DAWN_FAINT,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
      }),
    []
  );
  const diamondMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(COMPASS_GOLD),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );
  const crossMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(COMPASS_GOLD),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      ringGeoms.forEach((g) => g.dispose());
      diamondGeom.dispose();
      crossGeom.dispose();
      ringMats.forEach((m) => m.dispose());
      diamondMat.dispose();
      crossMat.dispose();
    };
  }, [ringGeoms, diamondGeom, crossGeom, ringMats, diamondMat, crossMat]);

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

    // Visible only while the camera is APPROACHING / AT / JUST PAST
    // this gate. Maps stage progress to a 0..1 visibility envelope:
    //   - Fades in across [0.00, 0.05]
    //   - Holds at 1 across [0.05, 0.20]
    //   - Fades out across [0.20, 0.30] (gate has passed the camera)
    let opacity = 0;
    if (progress < 0.05) opacity = progress / 0.05;
    else if (progress < 0.2) opacity = 1;
    else if (progress < 0.3) opacity = 1 - (progress - 0.2) / 0.1;

    for (const m of ringMats) m.opacity = opacity * 0.55;
    ringMats[0].opacity = opacity * 0.65;
    ringMats[2].opacity = opacity * 0.6;
    diamondMat.opacity = opacity * 0.45;
    crossMat.opacity = opacity * 0.85;
  });

  return (
    <group
      ref={groupRef}
      position={STATION_THOUGHTFORM.position}
      // Stand the diagram up so it faces the camera (the camera
      // looks down -Z, so XY plane is already camera-facing).
      visible={false}
    >
      {ringGeoms.map((geom, i) => (
        <lineLoop key={i} geometry={geom} material={ringMats[i]} />
      ))}
      <lineLoop geometry={diamondGeom} material={diamondMat} />
      <line geometry={crossGeom} material={crossMat} />
    </group>
  );
}
