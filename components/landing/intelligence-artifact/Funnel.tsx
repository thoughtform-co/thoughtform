"use client";

/**
 * Funnel — variant E of the intelligence-layer artifact.
 *
 * Horizontal directional flow / pipeline:
 *
 *   - Sources (left, green)  : a tight cluster of source pip
 *                              diamonds at x ~ -2.4. Inbound lane
 *                              lines feed RIGHTWARD into the central
 *                              substrate.
 *   - Substrate (centre, gold): the shared SubstrateBrandmark sphere
 *                              at x = 0. Reads as the encode point
 *                              the inbound work converges into.
 *   - Surfaces (right, dawn) : a fan of output channels diverging
 *                              RIGHTWARD from the substrate, each
 *                              ending in a port diamond.
 *
 * Motes drift left -> right through the lanes (Sources -> Substrate)
 * and then divergently along the fan (Substrate -> Surfaces) so the
 * artifact reads as the work flowing through the layer rather than a
 * static topology.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AnchorProjector } from "./AnchorProjector";
import {
  type ArtifactAnchors,
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
  advanceLinearMotes,
  buildDiamondGeometry,
  buildFanLinesGeometry,
  buildFilledDiamondGeometry,
  buildLaneLinesGeometry,
  buildLinearMotes,
  buildPolygonGeometry,
  makeLineMaterial,
  makeMeshMaterial,
  makePointsMaterial,
} from "./artifactPrimitives";
import { SubstrateBrandmark } from "./SubstrateBrandmark";

interface FunnelProps {
  progress: number;
  reducedMotion?: boolean;
}

const SOURCES_X = -2.4;
const SUBSTRATE_X = 0;
const SURFACES_X = 2.4;

const SOURCES_LANE_COUNT: number = 5;
const SOURCES_LANE_Y_RANGE = 0.85;

const SURFACES_FAN_COUNT: number = 6;
/** Vertical spread of the surfaces fan endpoints. */
const SURFACES_FAN_HALF_HEIGHT = 1.05;

const SOURCES_MOTES_PER_LANE = 12;
const SURFACES_MOTES_PER_RAY = 8;

const CAMERA_POSITION: readonly [number, number, number] = [0, 0.9, 6.6];
const CAMERA_LOOK_AT: readonly [number, number, number] = [0, 0.05, 0];

const FUNNEL_ANCHORS: ArtifactAnchors = {
  sources: [SOURCES_X, 0.1, 0],
  substrate: [SUBSTRATE_X, 0.0, 0],
  surfaces: [SURFACES_X * 0.92, 0.0, 0],
};

export function Funnel({ progress, reducedMotion = false }: FunnelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const sourceMotesRef = useRef<THREE.Points>(null);
  const surfaceMotesRef = useRef<THREE.Points>(null);

  // ── Source lane endpoints (left → substrate) ───────────────────
  const sourceLaneEnds = useMemo(() => {
    const starts: Array<[number, number, number]> = [];
    const ends: Array<[number, number, number]> = [];
    for (let i = 0; i < SOURCES_LANE_COUNT; i++) {
      const t = SOURCES_LANE_COUNT === 1 ? 0.5 : i / (SOURCES_LANE_COUNT - 1);
      const y = lerp(-SOURCES_LANE_Y_RANGE, SOURCES_LANE_Y_RANGE, t);
      starts.push([SOURCES_X, y, 0]);
      ends.push([SUBSTRATE_X - 0.85, y * 0.25, 0]);
    }
    return { starts, ends };
  }, []);

  // ── Surface fan endpoints (substrate → fan tips) ───────────────
  const surfaceFanEnds = useMemo(() => {
    const dests: Array<[number, number, number]> = [];
    for (let i = 0; i < SURFACES_FAN_COUNT; i++) {
      const t = SURFACES_FAN_COUNT === 1 ? 0.5 : i / (SURFACES_FAN_COUNT - 1);
      const y = lerp(-SURFACES_FAN_HALF_HEIGHT, SURFACES_FAN_HALF_HEIGHT, t);
      dests.push([SURFACES_X, y, 0]);
    }
    return dests;
  }, []);

  // ── Source pip positions (cluster on the left) ─────────────────
  const sourcePipPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < SOURCES_LANE_COUNT; i++) {
      const t = SOURCES_LANE_COUNT === 1 ? 0.5 : i / (SOURCES_LANE_COUNT - 1);
      const y = lerp(-SOURCES_LANE_Y_RANGE, SOURCES_LANE_Y_RANGE, t);
      out.push([SOURCES_X, y, 0]);
    }
    return out;
  }, []);

  // ── Geometries ─────────────────────────────────────────────────
  const geoms = useMemo(() => {
    const sourceLanes = buildLaneLinesGeometry(
      SOURCES_LANE_COUNT,
      SOURCES_X,
      SUBSTRATE_X - 0.85,
      SOURCES_LANE_Y_RANGE,
      0
    );
    const surfaceFan = buildFanLinesGeometry([SUBSTRATE_X + 0.85, 0, 0], surfaceFanEnds);

    const sourceMotes = buildLinearMotes(
      sourceLaneEnds.starts,
      sourceLaneEnds.ends,
      SOURCES_MOTES_PER_LANE
    );

    // Surface motes: each motes lane starts at substrate exit, ends
    // at the fan endpoint.
    const surfaceStarts: Array<[number, number, number]> = surfaceFanEnds.map(() => [
      SUBSTRATE_X + 0.85,
      0,
      0,
    ]);
    const surfaceMotes = buildLinearMotes(surfaceStarts, surfaceFanEnds, SURFACES_MOTES_PER_RAY);

    const sourcePipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);
    const surfacePipOutline = buildDiamondGeometry(PYLON_CAP_SIZE);
    const surfacePipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);

    const gateway = buildPolygonGeometry(GATEWAY_RADIUS, 24, 0);

    return {
      sourceLanes,
      surfaceFan,
      sourceMotes,
      surfaceMotes,
      sourcePipFilled,
      surfacePipOutline,
      surfacePipFilled,
      gateway,
    };
  }, [sourceLaneEnds, surfaceFanEnds]);

  // ── Materials ──────────────────────────────────────────────────
  const mats = useMemo(
    () => ({
      sourceLanes: makeLineMaterial(COLOR_SOURCES, 0),
      surfaceFan: makeLineMaterial(COLOR_SURFACES, 0),
      sourceMotes: makePointsMaterial(COLOR_SOURCES, 0, 0.05, false),
      surfaceMotes: makePointsMaterial(COLOR_SURFACES, 0, 0.05, false),
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
        else if (g && "geometry" in g) g.geometry.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = clamp01(progress);

    const gatewayP = phasePresence(p, PHASES.gateway, 0.04);
    const sourcesP = phasePresence(p, PHASES.sources);
    const substrateP = phasePresence(p, PHASES.substrate);
    const surfacesP = phasePresence(p, PHASES.surfaces);
    void substrateP;

    mats.sourceLanes.opacity = sourcesP * 0.65;
    mats.sourceMotes.opacity = sourcesP * 0.95;
    mats.sourcePip.opacity = sourcesP * 0.95;
    mats.surfaceFan.opacity = surfacesP * 0.6;
    mats.surfaceMotes.opacity = surfacesP * 0.95;
    mats.surfacePipOutline.opacity = surfacesP * 0.9;
    mats.surfacePipFilled.opacity = surfacesP * 0.85;
    mats.gateway.opacity = gatewayP * 0.95;

    // Drift motes left->right through the lanes + fan. Each set runs
    // a slightly different cycle so the artifact reads as continuous
    // flow rather than synchronised stamps.
    if (!reducedMotion) {
      if (sourceMotesRef.current) {
        advanceLinearMotes(geoms.sourceMotes, (t / 3.4) % 1);
      }
      if (surfaceMotesRef.current) {
        advanceLinearMotes(geoms.surfaceMotes, (t / 4.2) % 1);
      }
    }

    // No artifact spin — the flow direction itself is the read; spin
    // would smear it. Camera holds the flow plane head-on.
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

      {/* Source lanes + cluster pips (left, green) */}
      <lineSegments
        geometry={geoms.sourceLanes}
        material={mats.sourceLanes}
        frustumCulled={false}
      />
      <points
        ref={sourceMotesRef}
        geometry={geoms.sourceMotes.geometry}
        material={mats.sourceMotes}
        frustumCulled={false}
      />
      {sourcePipPositions.map((pos, i) => (
        <mesh
          key={`src-${i}`}
          geometry={geoms.sourcePipFilled}
          material={mats.sourcePip}
          position={pos}
          frustumCulled={false}
        />
      ))}

      {/* Substrate sphere (centre, gold). Do not spin — flow direction
          should read clean. The brandmark cloud has its own internal
          spin from `SubstrateBrandmark`, which we leave intact. */}
      <SubstrateBrandmark
        presence={substrateP}
        resolved={resolvedP}
        reducedMotion={reducedMotion}
        radius={0.78}
      />

      {/* Surface fan (right, dawn) */}
      <lineSegments geometry={geoms.surfaceFan} material={mats.surfaceFan} frustumCulled={false} />
      <points
        ref={surfaceMotesRef}
        geometry={geoms.surfaceMotes.geometry}
        material={mats.surfaceMotes}
        frustumCulled={false}
      />
      {surfaceFanEnds.map((pos, i) => (
        <group key={`srf-${i}`} position={pos}>
          <lineLoop
            geometry={geoms.surfacePipOutline}
            material={mats.surfacePipOutline}
            frustumCulled={false}
          />
          <mesh
            geometry={geoms.surfacePipFilled}
            material={mats.surfacePipFilled}
            frustumCulled={false}
          />
        </group>
      ))}

      <AnchorProjector anchors={FUNNEL_ANCHORS} trackGroupRef={rootRef} />
    </group>
  );
}
