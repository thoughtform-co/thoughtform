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
 * FOLD-IN UNFOLD (2026-06-06 wrap-around revision):
 *   - The outer geodesic + equator hairline scale via `foldEmerge`
 *     so the skin appears OVERSIZED (FOLD_OVERSHOOT ~ 1.45x its final
 *     radius, sitting clearly outside the assembled cage + orbits)
 *     and closes in to scale 1.0. Reads as the outer skin folding
 *     around the now-fully-assembled inner shell from outside.
 *   - The 6 port pips each render inside their OWN sub-group that
 *     fold-unfolds: per-port scale ramps 0 -> 1 (so the diamond
 *     visibly grows) while the port's position OVERSHOOTS beyond the
 *     ring radius (positionFactor FOLD_OVERSHOOT) and settles inward
 *     to the ring (positionFactor 1.0). Reads as 6 port lights
 *     arriving from beyond the surfaces ring and seating onto their
 *     final ring positions.
 *
 * Persists at the Build landing so the assembled shell stays present
 * as the brandmark hands off to the substrate sphere morph at the
 * centre. The geodesic at radius 1.85 sits well outside the 0.55
 * morph sphere, so the two coexist without competing.
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
  foldEmerge,
  petalStagger,
  SURFACES_GEODESIC_DETAIL,
  SURFACES_OUTER_RADIUS,
  SURFACES_PORT_COUNT,
  SURFACES_PORT_SIZE,
  SURFACES_PORT_TILT_Y,
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

/** Per-port stagger overlap inside the parent surfaces reveal window.
 *  0.55 reads as a tight cascade through all 6 ports — they fly out
 *  from the mark to their ring positions one after the other but
 *  fast enough that the assembled shell snaps together as a unit. */
const SURFACES_PORT_OVERLAP = 0.55;

const GEODESIC_OPACITY = 0.42;
const EQUATOR_OPACITY = 0.3;
const PORT_OUTLINE_OPACITY = 0.85;
const PORT_FILL_OPACITY = 0.78;

export function ShellSurfaces({ layerKey, reducedMotion = false }: ShellSurfacesProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);
  const geodesicShellRef = useRef<THREE.Group>(null);
  const portGroupRefs = useRef<(THREE.Group | null)[]>([]);

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

  // ── Port final positions (on the XZ plane). At reveal 0 each port
  //    sits at origin; at reveal 1 it lands at this final position. ──
  const portFinalPositions = useMemo(() => {
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

    // Outer geodesic + equator: fold-in emerge. The skin appears
    // OVERSIZED (FOLD_OVERSHOOT ~ 1.45x its final radius) and closes
    // in to scale 1.0 — reads as the outer skin folding around the
    // assembled inner shell from outside rather than expanding
    // through it from the centre.
    if (geodesicShellRef.current) {
      geodesicShellRef.current.scale.setScalar(foldEmerge(reveal).scale);
    }

    // Per-port fold-in unfold: each port group's POSITION overshoots
    // beyond the ring radius (positionFactor ~ FOLD_OVERSHOOT) and
    // settles inward to the ring (positionFactor 1.0), while its
    // SCALE ramps 0 -> 1 in lock-step so the diamond grows in as
    // it arrives. Staggered with petalStagger so the six ports don't
    // all close simultaneously.
    for (let i = 0; i < SURFACES_PORT_COUNT; i++) {
      const portGroup = portGroupRefs.current[i];
      if (!portGroup) continue;
      const stagger = petalStagger(reveal, i, SURFACES_PORT_COUNT, SURFACES_PORT_OVERLAP);
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
      spinGroupRef.current.rotation.y += SURFACES_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={spinGroupRef} rotation={[0, SURFACES_PORT_TILT_Y, 0]}>
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
