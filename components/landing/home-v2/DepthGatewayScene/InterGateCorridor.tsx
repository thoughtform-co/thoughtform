"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  STATION_DIAGNOSTIC,
  STATION_INTELLIGENCE,
  STATION_INTERSTITIAL,
  STATION_THOUGHTFORM,
} from "./sceneGeom";

/**
 * InterGateCorridor — depth-stacked ring debris + dust between gates
 * (ADR-018, world-owned rebuild).
 *
 * The "spaceship-flying-through-rings" filler that turns the gaps
 * between gate stations into traversable space rather than void.
 * Mirrors the role of `TunnelDepthRings` + `DepthSpiral` in the
 * legacy `components/gateway/ThreeGateway.tsx` — heavy Z-stacked
 * geometry the camera passes physically.
 *
 * Each "band" is a layer of slow-rotating ring pips at varied radii
 * sitting at a Z station midway between two gates. Visibility is
 * gated to the relevant passthrough beat so the bands fade in as
 * the camera approaches and out as it has passed.
 *
 * Total cost: ~4 bands × 60 pips = ~240 small line loops. All
 * static geometry; only opacity + group rotation per frame.
 */

interface RingBandProps {
  /** Centre Z of this band in world space. */
  centreZ: number;
  /** World X offset (so bands don't all sit on the optical axis). */
  offsetX?: number;
  /** Number of debris rings in the band. */
  ringCount?: number;
  /** Min/max ring radius (world units). */
  minRadius?: number;
  maxRadius?: number;
  /** Visibility envelope: progress range over which this band fades
   *  in (0->1) at the start and out (1->0) at the end. The full band
   *  is visible across `[fadeIn[1], fadeOut[0]]`. */
  fadeIn: [number, number];
  fadeOut: [number, number];
  /** Rotation rate around Z (radians/sec). Sign alternates per band
   *  so adjacent bands counter-spin. */
  spinRate?: number;
  /** Ring colour. Defaults to a soft dawn so bands read as
   *  atmospheric debris, not gold accents. */
  color?: string;
  /** Opacity ceiling. Bands are intentionally faint; opacity * this
   *  ceiling is the painted alpha. */
  alphaCeiling?: number;
}

function RingBand({
  centreZ,
  offsetX = 0,
  ringCount = 14,
  minRadius = 0.25,
  maxRadius = 1.6,
  fadeIn,
  fadeOut,
  spinRate = 0.04,
  color = "#ebe3d6",
  alphaCeiling = 0.35,
}: RingBandProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.LineBasicMaterial | null>(null);

  const { geometries, ringPositions } = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const positions: { x: number; y: number; z: number; scale: number; rotZ: number }[] = [];
    for (let i = 0; i < ringCount; i++) {
      const r = minRadius + Math.random() * (maxRadius - minRadius);
      const segments = 48;
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      geos.push(new THREE.BufferGeometry().setFromPoints(pts));
      // Spread within a small Z window so the band has thickness.
      const dz = (Math.random() - 0.5) * 1.2;
      // Cone-shaped XY spread so bands close to the optical axis are
      // tighter and farther bands are wider.
      const dx = (Math.random() - 0.5) * 1.4;
      const dy = (Math.random() - 0.5) * 0.9;
      positions.push({
        x: dx,
        y: dy,
        z: dz,
        scale: 0.6 + Math.random() * 0.6,
        rotZ: Math.random() * Math.PI * 2,
      });
    }
    return { geometries: geos, ringPositions: positions };
  }, [ringCount, minRadius, maxRadius]);

  const material = useMemo(() => {
    const m = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    matRef.current = m;
    return m;
  }, [color]);

  useEffect(() => {
    return () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    };
  }, [geometries, material]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const { progress, active } = useDepthGatewayStore.getState().transform;

    if (!active) {
      group.visible = false;
      return;
    }

    let opacity = 0;
    if (progress > fadeIn[0] && progress < fadeIn[1]) {
      opacity = (progress - fadeIn[0]) / (fadeIn[1] - fadeIn[0]);
    } else if (progress >= fadeIn[1] && progress <= fadeOut[0]) {
      opacity = 1;
    } else if (progress > fadeOut[0] && progress < fadeOut[1]) {
      opacity = 1 - (progress - fadeOut[0]) / (fadeOut[1] - fadeOut[0]);
    }

    if (opacity <= 0.001) {
      group.visible = false;
      return;
    }
    group.visible = true;
    material.opacity = opacity * alphaCeiling;

    // Slow Z-spin gives the band a "current" feel without the
    // particles having to translate. The whole group rotates so all
    // rings counter-rotate as one; flipping the spin rate per band
    // (in callers) creates parallax between adjacent bands.
    group.rotation.z += spinRate * Math.min(0.05, delta);
  });

  return (
    <group ref={groupRef} position={[offsetX, 0, centreZ]} visible={false}>
      {ringPositions.map((p, i) => (
        <lineLoop
          key={i}
          geometry={geometries[i]}
          material={material}
          position={[p.x, p.y, p.z]}
          scale={p.scale}
          rotation={[0, 0, p.rotZ]}
        />
      ))}
    </group>
  );
}

/**
 * InterGateCorridor — composes 4 ring bands at intermediate Z
 * stations between the four gates.
 *
 * Bands:
 *   1. Thoughtform <-> Diagnostic (active during passthrough-01)
 *   2. Diagnostic <-> Interstitial (active during early passthrough-02)
 *   3. Interstitial <-> Intelligence (active during late passthrough-02)
 *   4. Beyond intelligence (active during late intelligence — debris
 *      receding behind the camera as the corridor ends)
 */
export function InterGateCorridor() {
  const tfZ = STATION_THOUGHTFORM.position[2];
  const dgZ = STATION_DIAGNOSTIC.position[2];
  const interZ = STATION_INTERSTITIAL.position[2];
  const ilZ = STATION_INTELLIGENCE.position[2];

  return (
    <>
      <RingBand
        centreZ={(tfZ + dgZ) / 2}
        ringCount={16}
        minRadius={0.2}
        maxRadius={1.4}
        fadeIn={[0.16, 0.22]}
        fadeOut={[0.28, 0.34]}
        spinRate={0.06}
      />
      <RingBand
        centreZ={(dgZ + interZ) / 2}
        offsetX={-0.3}
        ringCount={14}
        minRadius={0.3}
        maxRadius={1.5}
        fadeIn={[0.48, 0.54]}
        fadeOut={[0.58, 0.64]}
        spinRate={-0.05}
        color="#f0e6cf"
      />
      <RingBand
        centreZ={(interZ + ilZ) / 2}
        offsetX={0.25}
        ringCount={14}
        minRadius={0.25}
        maxRadius={1.4}
        fadeIn={[0.62, 0.68]}
        fadeOut={[0.72, 0.78]}
        spinRate={0.04}
        color="#ebe3d6"
      />
    </>
  );
}
