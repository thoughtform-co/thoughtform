"use client";

/**
 * OuterGeodesic — baseline outer shell. The CURRENT home page
 * surfaces layer: detail-1 icosahedron edges + faint equator + 6
 * port pips on a tilted ring. Kept for direct A/B comparison
 * against the other variants.
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

const GEODESIC_OPACITY = 0.42;
const EQUATOR_OPACITY = 0.3;
const PORT_OUTLINE_OPACITY = 0.85;
const PORT_FILL_OPACITY = 0.78;
const GEODESIC_DETAIL = 1;

export function OuterGeodesic({ reveal, reducedMotion = false }: CorridorOuterShellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);
  const geodesicShellRef = useRef<THREE.Group>(null);
  const portGroupRefs = useRef<(THREE.Group | null)[]>([]);

  const geoms = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(OUTER_SHELL_RADIUS, GEODESIC_DETAIL);
    const edges = new THREE.EdgesGeometry(ico);
    ico.dispose();
    const equator = buildPolygonGeometry(OUTER_SHELL_RADIUS, 48, 0);
    const portOutline = buildDiamondGeometry(OUTER_PORT_SIZE);
    const portFilled = buildFilledDiamondGeometry(OUTER_PORT_SIZE * 0.55);
    return { edges, equator, portOutline, portFilled };
  }, []);

  const mats = useMemo(
    () => ({
      edges: makeLineMaterial(COLOR_SURFACES, GEODESIC_OPACITY, false),
      equator: makeLineMaterial(COLOR_SURFACES, EQUATOR_OPACITY, false),
      portOutline: makeLineMaterial(COLOR_SURFACES, PORT_OUTLINE_OPACITY, true),
      portFilled: makeMeshMaterial(COLOR_SURFACES, PORT_FILL_OPACITY),
    }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(geoms).forEach((g) => g.dispose());
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

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
    if (geodesicShellRef.current) {
      geodesicShellRef.current.scale.setScalar(foldEmerge(reveal).scale);
    }
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
        <group ref={geodesicShellRef}>
          <lineSegments geometry={geoms.edges} material={mats.edges} frustumCulled={false} />
          <lineLoop geometry={geoms.equator} material={mats.equator} frustumCulled={false} />
        </group>
        {portFinalPositions.map((_, i) => (
          <group
            key={`port-${i}`}
            ref={(node) => {
              portGroupRefs.current[i] = node;
            }}
            visible={false}
          >
            <lineLoop
              geometry={geoms.portOutline}
              material={mats.portOutline}
              frustumCulled={false}
            />
            <mesh geometry={geoms.portFilled} material={mats.portFilled} frustumCulled={false} />
          </group>
        ))}
      </group>
    </group>
  );
}
