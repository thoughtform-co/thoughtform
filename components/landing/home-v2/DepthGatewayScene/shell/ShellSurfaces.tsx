"use client";

/**
 * ShellSurfaces — the inside-out layer 3 of the accreted intelligence
 * shell. Outer geodesic skin in dawn + a ring of port-pip diamonds —
 * the headless surfaces wrapping the layer.
 *
 * Mirrors the standalone `NestedShellSphere` surfaces composition
 * (outer icosahedron edges + a faint equator + port pips on a tilted
 * ring) but sized to the corridor: `SURFACES_OUTER_RADIUS` 1.85 sits
 * comfortably inside the Intelligence gate `halfExtent` 2.0.
 *
 * Emerges geometrically (group `scale` 0 -> 1 via `splitEmerge`) during
 * the Build phase and persists at the landing so the assembled shell
 * stays present as the brandmark hands off to the substrate sphere
 * morph at the centre.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLOR_SURFACES } from "@/components/landing/intelligence-artifact/artifactGeom";
import {
  buildDiamondGeometry,
  buildFilledDiamondGeometry,
  buildPolygonGeometry,
  makeLineMaterial,
  makeMeshMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import {
  EMERGE_EPSILON,
  SURFACES_GEODESIC_DETAIL,
  SURFACES_OUTER_RADIUS,
  SURFACES_PORT_COUNT,
  SURFACES_PORT_SIZE,
  SURFACES_PORT_TILT_Y,
  splitEmerge,
} from "./shellGeom";

interface ShellSurfacesProps {
  /** Which accretion layer this component represents. Hard-coded to
   *  `"surfaces"` for `ShellSurfaces` but kept explicit so callers
   *  can see the wiring at the shell composition site. */
  layerKey: "surfaces";
  /** When true, autonomous spin is disabled. */
  reducedMotion?: boolean;
}

/** Slow counter-rotation rate for the surfaces shell (radians per
 *  second). Counter-rotates relative to `ShellSubstrate` so the
 *  fully-assembled shell reads as a layered instrument (two cages
 *  moving independently) rather than one rigid object. */
const SURFACES_SPIN_RATE = -0.09;

const GEODESIC_OPACITY = 0.42;
const EQUATOR_OPACITY = 0.3;
const PORT_OUTLINE_OPACITY = 0.85;
const PORT_FILL_OPACITY = 0.78;

export function ShellSurfaces({ layerKey, reducedMotion = false }: ShellSurfacesProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);

  // ── Geometries ─────────────────────────────────────────────────
  const geoms = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(SURFACES_OUTER_RADIUS, SURFACES_GEODESIC_DETAIL);
    const edges = new THREE.EdgesGeometry(ico);
    ico.dispose();
    // Faint hairline equator on the XZ plane for structural read.
    const equator = buildPolygonGeometry(SURFACES_OUTER_RADIUS, 48, 0);
    const portOutline = buildDiamondGeometry(SURFACES_PORT_SIZE);
    const portFilled = buildFilledDiamondGeometry(SURFACES_PORT_SIZE * 0.55);
    return { edges, equator, portOutline, portFilled };
  }, []);

  // ── Materials ──────────────────────────────────────────────────
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
      geoms.edges.dispose();
      geoms.equator.dispose();
      geoms.portOutline.dispose();
      geoms.portFilled.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  // ── Port positions (computed once, on the XZ plane) ────────────
  const portPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < SURFACES_PORT_COUNT; i++) {
      const a = (i / SURFACES_PORT_COUNT) * Math.PI * 2;
      out.push([Math.cos(a) * SURFACES_OUTER_RADIUS, 0, Math.sin(a) * SURFACES_OUTER_RADIUS]);
    }
    return out;
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).surfaces;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;
    group.scale.setScalar(splitEmerge(reveal));

    if (spinGroupRef.current && !reducedMotion) {
      spinGroupRef.current.rotation.y += SURFACES_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={spinGroupRef} rotation={[0, SURFACES_PORT_TILT_Y, 0]}>
        <lineSegments geometry={geoms.edges} material={mats.edges} frustumCulled={false} />
        <lineLoop geometry={geoms.equator} material={mats.equator} frustumCulled={false} />
        {portPositions.map((pos, i) => (
          <group key={`port-${i}`} position={pos}>
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
