"use client";

/**
 * OuterPlatform — Build/interfaces layer as an Armillary-style platform.
 *
 * This is intentionally NOT an outer enclosing shell. The brain stays
 * stable at the center, the encoded-knowledge orbits move around it,
 * and Build appears as a grounded deck below it with interface
 * landmarks (pylons + endpoint diamonds) around the platform rim.
 *
 * Narrative read:
 *   - Intelligence: stable brain / brandmark.
 *   - Encode: orbiting knowledge layer.
 *   - Build: interfaces become callable surfaces on a platform.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  EMERGE_EPSILON,
  foldEmerge,
  petalStagger,
} from "@/components/landing/home-v2/DepthGatewayScene/shell/shellGeom";
import {
  COLOR_DAWN,
  COLOR_GOLD,
  COLOR_SURFACES,
  DECK_INNER_SIDES,
  DECK_MID_SIDES,
  DECK_OUTER_SIDES,
  OUTER_TICKS_PER_SIDE,
} from "../../artifactGeom";
import {
  buildDiamondGeometry,
  buildFilledDiamondGeometry,
  buildOuterTicks,
  buildPlatedSegments,
  buildPolygonGeometry,
  buildPylonMastGeometry,
  makeLineMaterial,
  makeMeshMaterial,
} from "../../artifactPrimitives";
import type { CorridorOuterShellProps } from "../CorridorArtifact";

const PLATFORM_Y = -0.6;
const PLATFORM_OUTER_RADIUS = 2.22;
const PLATFORM_MID_RADIUS = 1.86;
const PLATFORM_INNER_RADIUS = 1.36;
const PLATFORM_LIFT = 0.06;

const PYLON_COUNT = 6;
const PYLON_ROOT_RADIUS = PLATFORM_MID_RADIUS + 0.16;
const PYLON_HEIGHT = 0.42;
const PYLON_CAP_SIZE = 0.095;
const PYLON_OVERLAP = 0.58;

// Keep the interface platform stable. The encoded-knowledge orbits
// animate around the intelligence; the Build surfaces should read as
// fixed endpoints your team can call, not another spinning shell.
const PLATFORM_SPIN_RATE = 0;

export function OuterPlatform({ reveal, reducedMotion = false }: CorridorOuterShellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const deckRef = useRef<THREE.Group>(null);
  const pylonGroupRefs = useRef<(THREE.Group | null)[]>([]);

  const geoms = useMemo(() => {
    const outerPoly = buildPolygonGeometry(PLATFORM_OUTER_RADIUS, DECK_OUTER_SIDES, PLATFORM_Y);
    const midPoly = buildPolygonGeometry(
      PLATFORM_MID_RADIUS,
      DECK_MID_SIDES,
      PLATFORM_Y + PLATFORM_LIFT
    );
    const innerPoly = buildPolygonGeometry(
      PLATFORM_INNER_RADIUS,
      DECK_INNER_SIDES,
      PLATFORM_Y + PLATFORM_LIFT * 1.55
    );
    const outerTicks = buildOuterTicks(
      PLATFORM_OUTER_RADIUS,
      DECK_OUTER_SIDES * OUTER_TICKS_PER_SIDE,
      0.1,
      PLATFORM_Y
    );
    const midPlates = buildPlatedSegments(
      PLATFORM_MID_RADIUS,
      DECK_MID_SIDES,
      0.58,
      PLATFORM_Y + PLATFORM_LIFT
    );
    const innerHalo = buildPolygonGeometry(
      PLATFORM_INNER_RADIUS - 0.18,
      DECK_INNER_SIDES * 2,
      PLATFORM_Y + PLATFORM_LIFT * 1.55
    );
    const pylonMasts = buildPylonMastGeometry(
      PYLON_HEIGHT,
      PYLON_ROOT_RADIUS,
      PYLON_COUNT,
      PLATFORM_Y + PLATFORM_LIFT
    );
    const pylonRing = buildPolygonGeometry(PYLON_ROOT_RADIUS, PYLON_COUNT * 4, PLATFORM_Y);
    const capOutline = buildDiamondGeometry(PYLON_CAP_SIZE);
    const capFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.56);
    return {
      outerPoly,
      midPoly,
      innerPoly,
      outerTicks,
      midPlates,
      innerHalo,
      pylonMasts,
      pylonRing,
      capOutline,
      capFilled,
    };
  }, []);

  const mats = useMemo(
    () => ({
      outerPoly: makeLineMaterial(COLOR_GOLD, 0.58, true),
      midPoly: makeLineMaterial(COLOR_DAWN, 0.28, false),
      innerPoly: makeLineMaterial(COLOR_GOLD, 0.42, true),
      outerTicks: makeLineMaterial(COLOR_DAWN, 0.34, false),
      midPlates: makeLineMaterial(COLOR_GOLD, 0.55, true),
      innerHalo: makeLineMaterial(COLOR_DAWN, 0.22, false),
      pylonMasts: makeLineMaterial(COLOR_SURFACES, 0.62, false),
      pylonRing: makeLineMaterial(COLOR_GOLD, 0.36, true),
      capOutline: makeLineMaterial(COLOR_SURFACES, 0.9, true),
      capFilled: makeMeshMaterial(COLOR_SURFACES, 0.8),
    }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(geoms).forEach((g) => g.dispose());
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  const pylonPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < PYLON_COUNT; i++) {
      const a = (i / PYLON_COUNT) * Math.PI * 2 + Math.PI / PYLON_COUNT;
      out.push([
        Math.cos(a) * PYLON_ROOT_RADIUS,
        PLATFORM_Y + PLATFORM_LIFT + PYLON_HEIGHT,
        Math.sin(a) * PYLON_ROOT_RADIUS,
      ]);
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
    const { scale } = foldEmerge(reveal);
    group.scale.setScalar(scale);

    for (let i = 0; i < PYLON_COUNT; i++) {
      const pylonGroup = pylonGroupRefs.current[i];
      if (!pylonGroup) continue;
      const stagger = petalStagger(reveal, i, PYLON_COUNT, PYLON_OVERLAP);
      const { scale: pylonScale, positionFactor } = foldEmerge(stagger);
      if (pylonScale <= EMERGE_EPSILON) {
        pylonGroup.visible = false;
        continue;
      }
      pylonGroup.visible = true;
      const p = pylonPositions[i];
      pylonGroup.position.set(p[0] * positionFactor, p[1], p[2] * positionFactor);
      pylonGroup.scale.setScalar(pylonScale);
    }

    if (deckRef.current && !reducedMotion) {
      deckRef.current.rotation.y += PLATFORM_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={deckRef}>
        <lineLoop geometry={geoms.outerPoly} material={mats.outerPoly} frustumCulled={false} />
        <lineLoop geometry={geoms.midPoly} material={mats.midPoly} frustumCulled={false} />
        <lineLoop geometry={geoms.innerPoly} material={mats.innerPoly} frustumCulled={false} />
        <lineSegments
          geometry={geoms.outerTicks}
          material={mats.outerTicks}
          frustumCulled={false}
        />
        <lineSegments geometry={geoms.midPlates} material={mats.midPlates} frustumCulled={false} />
        <lineLoop geometry={geoms.innerHalo} material={mats.innerHalo} frustumCulled={false} />
        <lineSegments
          geometry={geoms.pylonMasts}
          material={mats.pylonMasts}
          frustumCulled={false}
        />
        <lineLoop geometry={geoms.pylonRing} material={mats.pylonRing} frustumCulled={false} />

        {pylonPositions.map((_, i) => (
          <group
            key={`platform-pylon-${i}`}
            ref={(node) => {
              pylonGroupRefs.current[i] = node;
            }}
            visible={false}
          >
            <lineLoop
              geometry={geoms.capOutline}
              material={mats.capOutline}
              frustumCulled={false}
            />
            <mesh geometry={geoms.capFilled} material={mats.capFilled} frustumCulled={false} />
          </group>
        ))}
      </group>
    </group>
  );
}
