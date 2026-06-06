"use client";

/**
 * OuterContour — outer shell as a stack of horizontal latitude
 * rings only. No longitude, no triangulation — a "scanned globe"
 * silhouette that rhymes with the corridor's latent-topography
 * contours. Six port pips ride the equator so the layer still
 * carries the "headless surfaces" semantic.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  EMERGE_EPSILON,
  foldEmerge,
  petalStagger,
} from "@/components/landing/home-v2/DepthGatewayScene/shell/shellGeom";
import { COLOR_SURFACES } from "../../artifactGeom";
import {
  buildDiamondGeometry,
  buildFilledDiamondGeometry,
  buildPolygonGeometry,
  makeLineMaterial,
  makeMeshMaterial,
} from "../../artifactPrimitives";
import type { CorridorOuterShellProps } from "../CorridorArtifact";
import {
  OUTER_PORT_COUNT,
  OUTER_PORT_OVERLAP,
  OUTER_PORT_SIZE,
  OUTER_SHELL_RADIUS,
  OUTER_SHELL_SPIN_RATE,
  OUTER_SHELL_TILT_Y,
} from "./shared";

/** Number of latitude rings (including equator). Odd so we have a
 *  centred equator + symmetric pairs above/below. 11 reads as a
 *  legible scanned sphere without crowding. */
const LATITUDE_COUNT = 11;
const RING_OPACITY = 0.55;
const EQUATOR_OPACITY = 0.85;
const PORT_OUTLINE_OPACITY = 0.85;
const PORT_FILL_OPACITY = 0.78;

interface LatitudeRing {
  geom: THREE.BufferGeometry;
  y: number;
  isEquator: boolean;
}

function buildLatitudeRings(radius: number, count: number): LatitudeRing[] {
  const out: LatitudeRing[] = [];
  // Latitudes are evenly spaced in angle so the spacing at the
  // equator is wider than near the poles — gives the "contour map"
  // density falloff at the top/bottom.
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); // 0..1 from south pole to north pole
    const lat = (t - 0.5) * Math.PI; // -π/2..π/2
    const ringR = Math.cos(lat) * radius;
    const y = Math.sin(lat) * radius;
    // Skip degenerate poles (cos(lat) ≈ 0).
    if (ringR < 0.01) continue;
    const isEquator = Math.abs(lat) < 1e-3;
    const geom = buildPolygonGeometry(ringR, 80, y);
    out.push({ geom, y, isEquator });
  }
  return out;
}

export function OuterContour({ reveal, reducedMotion = false }: CorridorOuterShellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);
  const portGroupRefs = useRef<(THREE.Group | null)[]>([]);

  const rings = useMemo(() => buildLatitudeRings(OUTER_SHELL_RADIUS, LATITUDE_COUNT), []);
  const portOutline = useMemo(() => buildDiamondGeometry(OUTER_PORT_SIZE), []);
  const portFilled = useMemo(() => buildFilledDiamondGeometry(OUTER_PORT_SIZE * 0.55), []);

  const ringMat = useMemo(() => makeLineMaterial(COLOR_SURFACES, RING_OPACITY, false), []);
  const equatorMat = useMemo(() => makeLineMaterial(COLOR_SURFACES, EQUATOR_OPACITY, true), []);
  const portOutlineMat = useMemo(
    () => makeLineMaterial(COLOR_SURFACES, PORT_OUTLINE_OPACITY, true),
    []
  );
  const portFilledMat = useMemo(() => makeMeshMaterial(COLOR_SURFACES, PORT_FILL_OPACITY), []);

  useEffect(() => {
    return () => {
      rings.forEach((r) => r.geom.dispose());
      portOutline.dispose();
      portFilled.dispose();
      ringMat.dispose();
      equatorMat.dispose();
      portOutlineMat.dispose();
      portFilledMat.dispose();
    };
  }, [rings, portOutline, portFilled, ringMat, equatorMat, portOutlineMat, portFilledMat]);

  const portFinalPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < OUTER_PORT_COUNT; i++) {
      const a = (i / OUTER_PORT_COUNT) * Math.PI * 2;
      out.push([Math.cos(a) * OUTER_SHELL_RADIUS, 0, Math.sin(a) * OUTER_SHELL_RADIUS]);
    }
    return out;
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;
    group.scale.setScalar(foldEmerge(reveal).scale);

    for (let i = 0; i < OUTER_PORT_COUNT; i++) {
      const portGroup = portGroupRefs.current[i];
      if (!portGroup) continue;
      const stagger = petalStagger(reveal, i, OUTER_PORT_COUNT, OUTER_PORT_OVERLAP);
      const { scale, positionFactor } = foldEmerge(stagger);
      if (scale <= EMERGE_EPSILON) {
        portGroup.visible = false;
        continue;
      }
      portGroup.visible = true;
      const p = portFinalPositions[i];
      portGroup.position.set(p[0] * positionFactor, p[1] * positionFactor, p[2] * positionFactor);
      portGroup.scale.setScalar(scale);
    }

    if (spinGroupRef.current && !reducedMotion) {
      spinGroupRef.current.rotation.y += OUTER_SHELL_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={spinGroupRef} rotation={[0, OUTER_SHELL_TILT_Y, 0]}>
        {rings.map((r, i) => (
          <lineLoop
            key={`lat-${i}`}
            geometry={r.geom}
            material={r.isEquator ? equatorMat : ringMat}
            frustumCulled={false}
          />
        ))}
        {portFinalPositions.map((_, i) => (
          <group
            key={`port-${i}`}
            ref={(node) => {
              portGroupRefs.current[i] = node;
            }}
            visible={false}
          >
            <lineLoop geometry={portOutline} material={portOutlineMat} frustumCulled={false} />
            <mesh geometry={portFilled} material={portFilledMat} frustumCulled={false} />
          </group>
        ))}
      </group>
    </group>
  );
}
