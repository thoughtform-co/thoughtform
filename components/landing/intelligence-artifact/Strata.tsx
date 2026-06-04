"use client";

/**
 * Strata — variant D of the intelligence-layer artifact.
 *
 * Cross-section / layer-cake view. Three vertically stacked slabs
 * joined by hairline corner pillars:
 *
 *   - Surfaces  (top, dawn)  : a paneled slab with a grid of port
 *                              pip diamonds. The headless surfaces
 *                              live here.
 *   - Substrate (middle, gold): the shared SubstrateBrandmark sphere
 *                              sits on / through this slab. Internal
 *                              gold grid lines give the substrate
 *                              "floor" a milled register.
 *   - Sources   (bottom, green): a slab with a grid of provenance
 *                              source pips. Reads as the bedrock
 *                              that the substrate is built on.
 *
 * The camera tilts ~22 deg so all three layers stack visibly. The
 * artifact spins slowly on Y so the depth + slab orientation read
 * across the rotation. AnchorProjector hooks into the parent group
 * so the leader lines follow each slab as it rotates.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AnchorProjector } from "./AnchorProjector";
import {
  type ArtifactAnchors,
  COLOR_DAWN,
  COLOR_GOLD,
  COLOR_SOURCES,
  COLOR_SURFACES,
  GATEWAY_RADIUS,
  GATEWAY_Z_END,
  GATEWAY_Z_START,
  PHASES,
  PYLON_CAP_SIZE,
  clamp01,
  lerp,
  phasePresence,
  smoothstep,
} from "./artifactGeom";
import {
  buildDiamondGeometry,
  buildFilledDiamondGeometry,
  buildPolygonGeometry,
  buildSlabEdgeGeometry,
  buildSlabPillarsGeometry,
  gridPositions,
  makeLineMaterial,
  makeMeshMaterial,
} from "./artifactPrimitives";
import { SubstrateBrandmark } from "./SubstrateBrandmark";

interface StrataProps {
  progress: number;
  reducedMotion?: boolean;
}

const SLAB_HALF_W = 1.95;
const SLAB_HALF_D = 1.55;
const SLAB_Y_SURFACES = 1.05;
const SLAB_Y_SUBSTRATE = 0;
const SLAB_Y_SOURCES = -1.05;

const SOURCES_GRID_COLS = 4;
const SOURCES_GRID_ROWS = 3;
const SOURCES_GRID_HALF_W = SLAB_HALF_W * 0.78;
const SOURCES_GRID_HALF_D = SLAB_HALF_D * 0.72;

const SURFACES_GRID_COLS = 3;
const SURFACES_GRID_ROWS = 2;
const SURFACES_GRID_HALF_W = SLAB_HALF_W * 0.72;
const SURFACES_GRID_HALF_D = SLAB_HALF_D * 0.6;

const CAMERA_POSITION: readonly [number, number, number] = [3.4, 2.3, 5.8];
const CAMERA_LOOK_AT: readonly [number, number, number] = [0, 0, 0];

/** Anchor points exposed to the leader-line label system, in local
 *  space (parent group frame). The projector applies the group's
 *  world matrix so rotation is included. */
const STRATA_ANCHORS: ArtifactAnchors = {
  // Front edge of the bottom slab, slightly outside the brandmark.
  sources: [SLAB_HALF_W * 0.6, SLAB_Y_SOURCES + 0.02, SLAB_HALF_D],
  // Substrate sphere centre.
  substrate: [0, SLAB_Y_SUBSTRATE + 0.05, 0],
  // Front edge of the top slab.
  surfaces: [-SLAB_HALF_W * 0.6, SLAB_Y_SURFACES + 0.02, SLAB_HALF_D],
};

export function Strata({ progress, reducedMotion = false }: StrataProps) {
  const rootRef = useRef<THREE.Group>(null);

  const geoms = useMemo(() => {
    const sourcesSlab = buildSlabEdgeGeometry(SLAB_HALF_W, SLAB_HALF_D, SLAB_Y_SOURCES, 4);
    const substrateSlab = buildSlabEdgeGeometry(SLAB_HALF_W, SLAB_HALF_D, SLAB_Y_SUBSTRATE, 6);
    const surfacesSlab = buildSlabEdgeGeometry(SLAB_HALF_W, SLAB_HALF_D, SLAB_Y_SURFACES, 4);

    const pillarsLower = buildSlabPillarsGeometry(
      SLAB_HALF_W,
      SLAB_HALF_D,
      SLAB_Y_SOURCES,
      SLAB_Y_SUBSTRATE
    );
    const pillarsUpper = buildSlabPillarsGeometry(
      SLAB_HALF_W,
      SLAB_HALF_D,
      SLAB_Y_SUBSTRATE,
      SLAB_Y_SURFACES
    );

    const pipOutline = buildDiamondGeometry(PYLON_CAP_SIZE);
    const pipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);
    const sourcePipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);

    const gateway = buildPolygonGeometry(GATEWAY_RADIUS, 24, 0);

    return {
      sourcesSlab,
      substrateSlab,
      surfacesSlab,
      pillarsLower,
      pillarsUpper,
      pipOutline,
      pipFilled,
      sourcePipFilled,
      gateway,
    };
  }, []);

  const mats = useMemo(
    () => ({
      sourcesSlab: makeLineMaterial(COLOR_SOURCES, 0),
      substrateSlab: makeLineMaterial(COLOR_GOLD, 0, true),
      surfacesSlab: makeLineMaterial(COLOR_SURFACES, 0),
      pillarsLower: makeLineMaterial(COLOR_DAWN, 0),
      pillarsUpper: makeLineMaterial(COLOR_DAWN, 0),
      sourcePip: makeMeshMaterial(COLOR_SOURCES, 0),
      surfacePipOutline: makeLineMaterial(COLOR_SURFACES, 0, true),
      surfacePipFilled: makeMeshMaterial(COLOR_SURFACES, 0),
      gateway: makeLineMaterial(COLOR_GOLD, 0, true),
    }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(geoms).forEach((g) => {
        if (g instanceof THREE.BufferGeometry) g.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  const sourcePipPositions = useMemo(
    () =>
      gridPositions(
        SOURCES_GRID_COLS,
        SOURCES_GRID_ROWS,
        SOURCES_GRID_HALF_W,
        SOURCES_GRID_HALF_D,
        SLAB_Y_SOURCES + 0.04
      ),
    []
  );
  const surfacePipPositions = useMemo(
    () =>
      gridPositions(
        SURFACES_GRID_COLS,
        SURFACES_GRID_ROWS,
        SURFACES_GRID_HALF_W,
        SURFACES_GRID_HALF_D,
        SLAB_Y_SURFACES + 0.04
      ),
    []
  );

  useFrame((state) => {
    const p = clamp01(progress);
    const gatewayP = phasePresence(p, PHASES.gateway, 0.04);
    const sourcesP = phasePresence(p, PHASES.sources);
    const substrateP = phasePresence(p, PHASES.substrate);
    const surfacesP = phasePresence(p, PHASES.surfaces);
    const resolvedP = phasePresence(p, PHASES.resolved);

    mats.sourcesSlab.opacity = sourcesP * 0.75;
    mats.substrateSlab.opacity = substrateP * 0.65;
    mats.surfacesSlab.opacity = surfacesP * 0.65;
    mats.pillarsLower.opacity = sourcesP * 0.4 + substrateP * 0.25;
    mats.pillarsUpper.opacity = substrateP * 0.3 + surfacesP * 0.4;
    mats.sourcePip.opacity = sourcesP * 0.95;
    mats.surfacePipOutline.opacity = surfacesP * 0.9;
    mats.surfacePipFilled.opacity = surfacesP * 0.85;
    mats.gateway.opacity = gatewayP * 0.95;
    void substrateP;

    if (rootRef.current && !reducedMotion) {
      const spin = 0.018 + resolvedP * 0.04;
      rootRef.current.rotation.y += spin * (1 / 60);
    }

    // Camera reset to the Strata frame each frame so switching from
    // another variant lands in the correct view immediately.
    state.camera.position.set(...CAMERA_POSITION);
    state.camera.lookAt(...CAMERA_LOOK_AT);
  });

  const substrateP = phasePresence(clamp01(progress), PHASES.substrate);
  const resolvedP = phasePresence(clamp01(progress), PHASES.resolved);

  const gatewayZ = lerp(GATEWAY_Z_START, GATEWAY_Z_END, smoothstep(0, 0.16, progress));

  return (
    <group ref={rootRef}>
      <ambientLight intensity={0.32} />

      <lineLoop
        geometry={geoms.gateway}
        material={mats.gateway}
        position={[0, 1.0, gatewayZ]}
        frustumCulled={false}
      />

      {/* Sources slab (bottom, green) */}
      <lineSegments
        geometry={geoms.sourcesSlab}
        material={mats.sourcesSlab}
        frustumCulled={false}
      />
      {sourcePipPositions.map((pos, i) => (
        <mesh
          key={`src-${i}`}
          geometry={geoms.sourcePipFilled}
          material={mats.sourcePip}
          position={pos}
          rotation={[-Math.PI / 2, 0, 0]}
          frustumCulled={false}
        />
      ))}

      {/* Substrate slab + brandmark sphere (centre, gold) */}
      <lineSegments
        geometry={geoms.substrateSlab}
        material={mats.substrateSlab}
        frustumCulled={false}
      />
      <group position={[0, SLAB_Y_SUBSTRATE + 0.55, 0]}>
        <SubstrateBrandmark
          presence={substrateP}
          resolved={resolvedP}
          reducedMotion={reducedMotion}
          radius={0.72}
        />
      </group>

      {/* Surfaces slab (top, dawn) */}
      <lineSegments
        geometry={geoms.surfacesSlab}
        material={mats.surfacesSlab}
        frustumCulled={false}
      />
      {surfacePipPositions.map((pos, i) => (
        <group key={`srf-${i}`} position={pos}>
          <lineLoop
            geometry={geoms.pipOutline}
            material={mats.surfacePipOutline}
            frustumCulled={false}
          />
          <mesh geometry={geoms.pipFilled} material={mats.surfacePipFilled} frustumCulled={false} />
        </group>
      ))}

      {/* Corner pillars (dawn) connecting the three slabs */}
      <lineSegments
        geometry={geoms.pillarsLower}
        material={mats.pillarsLower}
        frustumCulled={false}
      />
      <lineSegments
        geometry={geoms.pillarsUpper}
        material={mats.pillarsUpper}
        frustumCulled={false}
      />

      <AnchorProjector anchors={STRATA_ANCHORS} trackGroupRef={rootRef} />
    </group>
  );
}
