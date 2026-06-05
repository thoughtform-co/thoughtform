"use client";

/**
 * ShellSubstrate — the inside-out layer 1 of the accreted intelligence
 * shell. Wraps the guiding-star brandmark with a golden dodecahedron
 * cage + a fainter dawn geodesic inner shell.
 *
 * Emerges geometrically (group `scale` 0 -> 1 via `splitEmerge`) during
 * the Navigate phase and PERSISTS through Encode + Build so the layer
 * accumulates around the traveling mark. At the Build landing it
 * visually wraps the substrate sphere `SubstrateMorphCloud` (both
 * centred on the same anchor — `STATION_INTELLIGENCE.position +
 * [0,0,0.1]`).
 *
 * Brandmark Principle 4 (`brandmark-choreography` skill): decorations
 * EMERGE geometrically via scale, NEVER via opacity. The material's
 * opacity stays constant once the layer is revealed.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLOR_DAWN, COLOR_GOLD } from "@/components/landing/intelligence-artifact/artifactGeom";
import {
  buildGeodesicEdges,
  makeLineMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import {
  EMERGE_EPSILON,
  SUBSTRATE_DODEC_DETAIL,
  SUBSTRATE_DODEC_RADIUS,
  SUBSTRATE_INNER_RADIUS,
  splitEmerge,
} from "./shellGeom";

interface ShellSubstrateProps {
  /** Which accretion layer this component represents. Hard-coded to
   *  `"substrate"` for `ShellSubstrate` but kept explicit so callers
   *  can see the wiring at the shell composition site. */
  layerKey: "substrate";
  /** When true, autonomous spin is disabled. */
  reducedMotion?: boolean;
}

/** Slow spin rate for the dodecahedron cage (radians per second at 60 fps).
 *  Mirrors the standalone `SubstrateBrandmark`'s 0.18 spinRate so the
 *  cage reads as the same living instrument. */
const SUBSTRATE_SPIN_RATE = 0.18;

/** Base material opacities at full reveal. Tuned slightly higher than
 *  the standalone artifact (which composites on a black void) because
 *  the corridor's wormhole walls add background noise we have to
 *  read through. */
const DODEC_OPACITY = 0.82;
const INNER_OPACITY = 0.34;

export function ShellSubstrate({ layerKey, reducedMotion = false }: ShellSubstrateProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const dodecGroupRef = useRef<THREE.Group>(null);

  // Outer cage — true dodecahedron (12 pentagonal faces, 30 edges).
  // Visually distinct from the inner icosahedron-edge shell so the
  // two layers read as "cage around inner sphere" rather than two
  // overlapping geodesics.
  const dodecEdges = useMemo(() => {
    const dodec = new THREE.DodecahedronGeometry(SUBSTRATE_DODEC_RADIUS, SUBSTRATE_DODEC_DETAIL);
    const edges = new THREE.EdgesGeometry(dodec);
    dodec.dispose();
    return edges;
  }, []);

  const innerEdges = useMemo(() => buildGeodesicEdges(SUBSTRATE_INNER_RADIUS, 1), []);

  const dodecMat = useMemo(() => makeLineMaterial(COLOR_GOLD, DODEC_OPACITY, true), []);
  const innerMat = useMemo(() => makeLineMaterial(COLOR_DAWN, INNER_OPACITY, false), []);

  useEffect(() => {
    return () => {
      dodecEdges.dispose();
      innerEdges.dispose();
      dodecMat.dispose();
      innerMat.dispose();
    };
  }, [dodecEdges, innerEdges, dodecMat, innerMat]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).substrate;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;
    group.scale.setScalar(splitEmerge(reveal));

    // Slow spin on the dodecahedron cage — the inner shell stays
    // axis-aligned so the two layers don't co-rotate (reads as
    // depth, not as a single rigid body).
    if (dodecGroupRef.current && !reducedMotion) {
      dodecGroupRef.current.rotation.y += SUBSTRATE_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={dodecGroupRef}>
        <lineSegments geometry={dodecEdges} material={dodecMat} frustumCulled={false} />
      </group>
      <lineSegments geometry={innerEdges} material={innerMat} frustumCulled={false} />
    </group>
  );
}
