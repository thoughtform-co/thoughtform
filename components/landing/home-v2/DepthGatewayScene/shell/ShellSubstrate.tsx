"use client";

/**
 * ShellSubstrate — the inside-out layer 1 of the accreted intelligence
 * shell. Wraps the guiding-star brandmark with a gold geodesic
 * icosphere cage + a fainter dawn inner geodesic.
 *
 * 2026-06-05 LAB-MATCH REVISION: the previous 12-face dodecahedron
 * cage with per-face petal unfold was replaced with the standalone
 * shell artifact's composition — a single clean GOLD GEODESIC
 * ICOSPHERE (`buildGeodesicEdges(radius, 1)` = 80 fine triangular
 * faces) + a tighter DAWN inner geodesic. Visually identical to the
 * lab `NestedShellSphere`'s outer + inner shells (minus the brand
 * cloud, which the projected DOM brandmark + substrate morph already
 * supply at the centre).
 *
 * Emerges as ONE CLEAN BODY: `group.scale.setScalar(splitEmerge(reveal))`
 * on the whole cage. The 80-face decomposition would have read busy
 * at the corridor's parked viewing distance — single-body fold/scale-in
 * matches the lab's clean read and lets the source-orbit + surfaces-port
 * per-element petal unfolds (kept in `ShellSources` / `ShellSurfaces`)
 * still carry the accretion narrative.
 *
 * Persists through Encode + Build so the cage accumulates around the
 * traveling mark and visually wraps the substrate sphere
 * `SubstrateMorphCloud` at the Build landing (both centred on the same
 * anchor — `STATION_INTELLIGENCE.position + [0,0,0.1]`).
 *
 * Brandmark Principle 4 (`brandmark-choreography` skill): decoration
 * EMERGES geometrically via scale, NEVER via opacity. Material opacity
 * stays constant once the layer is revealed.
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
  SUBSTRATE_CAGE_RADIUS,
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

/** Slow spin rate for the cage (radians per second). Mirrors the
 *  standalone `SubstrateBrandmark`'s 0.18 spinRate so the cage reads
 *  as the same living instrument. The spin is applied to the parent
 *  `cageGroupRef` so the whole assembled cage co-rotates as one body. */
const SUBSTRATE_SPIN_RATE = 0.18;

/** Base material opacities at full reveal. Tuned slightly higher than
 *  the standalone artifact (which composites on a black void) because
 *  the corridor's wormhole walls add background noise we have to read
 *  through. */
const CAGE_OPACITY = 0.82;
const INNER_OPACITY = 0.34;

/** Outer geodesic detail level. `1` matches the lab's
 *  `SUBSTRATE_DETAIL` — classic 80-face geodesic that reads as
 *  engineered without looking low-poly. */
const SUBSTRATE_OUTER_DETAIL = 1;

/** Inner geodesic detail level. `2` matches the lab's
 *  `SUBSTRATE_INNER_DETAIL` — a tighter inner shell. */
const SUBSTRATE_INNER_DETAIL = 2;

export function ShellSubstrate({ layerKey, reducedMotion = false }: ShellSubstrateProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const cageGroupRef = useRef<THREE.Group>(null);

  // ── Geometries (lab composition exactly) ───────────────────────

  const outerEdges = useMemo(
    () => buildGeodesicEdges(SUBSTRATE_CAGE_RADIUS, SUBSTRATE_OUTER_DETAIL),
    []
  );
  const innerEdges = useMemo(
    () => buildGeodesicEdges(SUBSTRATE_INNER_RADIUS, SUBSTRATE_INNER_DETAIL),
    []
  );

  // ── Materials ──────────────────────────────────────────────────

  const cageMat = useMemo(() => makeLineMaterial(COLOR_GOLD, CAGE_OPACITY, true), []);
  const innerMat = useMemo(() => makeLineMaterial(COLOR_DAWN, INNER_OPACITY, false), []);

  useEffect(() => {
    return () => {
      outerEdges.dispose();
      innerEdges.dispose();
      cageMat.dispose();
      innerMat.dispose();
    };
  }, [outerEdges, innerEdges, cageMat, innerMat]);

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

    // Single-body fold/scale-in. The whole cage (outer + inner geodesic)
    // emerges as one clean unit — no per-face petals.
    group.scale.setScalar(splitEmerge(reveal));

    // Slow spin on the assembled cage so it reads as a living
    // instrument once unfolded. Applied to the parent so outer + inner
    // shells co-rotate as one body.
    if (cageGroupRef.current && !reducedMotion) {
      cageGroupRef.current.rotation.y += SUBSTRATE_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={cageGroupRef}>
        <lineSegments geometry={outerEdges} material={cageMat} frustumCulled={false} />
        <lineSegments geometry={innerEdges} material={innerMat} frustumCulled={false} />
      </group>
    </group>
  );
}
