"use client";

/**
 * ShellStack — Build accretion layer. Docks the assembled intelligence
 * layer (substrate sphere + Encode judgment orbits) into the full
 * stack: trusted sources feed in from the left (green lanes), headless
 * surfaces fan out to the right (dawn diamonds).
 *
 * Ported from the FUNNEL variant in the intelligence-artifact lab.
 * No group spin — the directional flow is the read. Geometry emerges
 * via `foldEmerge` + `petalStagger`, not opacity ramps.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  COLOR_SOURCES,
  COLOR_SURFACES,
  PYLON_CAP_SIZE,
  lerp,
} from "@/components/landing/intelligence-artifact/artifactGeom";
import {
  advanceLinearMotes,
  buildDiamondGeometry,
  buildFanLinesGeometry,
  buildFilledDiamondGeometry,
  buildLaneLinesGeometry,
  buildLinearMotes,
  makeLineMaterial,
  makeMeshMaterial,
  makePointsMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import {
  EMERGE_EPSILON,
  foldEmerge,
  petalStagger,
  STACK_FAN_COUNT,
  STACK_FAN_HALF_HEIGHT,
  STACK_LANE_COUNT,
  STACK_LANE_Y_RANGE,
  STACK_MOTES_PER_LANE,
  STACK_MOTES_PER_RAY,
  STACK_PIP_SCALE,
  STACK_SOURCES_X,
  STACK_SUBSTRATE_X,
  STACK_SURFACES_X,
} from "./shellGeom";

interface ShellStackProps {
  layerKey: "stack";
  reducedMotion?: boolean;
}

const SOURCE_LANE_OPACITY = 0.65;
const SOURCE_PIP_OPACITY = 0.95;
const SURFACE_FAN_OPACITY = 0.6;
const SURFACE_PIP_OPACITY = 0.9;

export function ShellStack({ layerKey, reducedMotion = false }: ShellStackProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const sourcesGroupRef = useRef<THREE.Group>(null);
  const surfacesGroupRef = useRef<THREE.Group>(null);
  const sourceMotesRef = useRef<THREE.Points>(null);
  const surfaceMotesRef = useRef<THREE.Points>(null);

  const sourceLaneEnds = useMemo(() => {
    const starts: Array<[number, number, number]> = [];
    const ends: Array<[number, number, number]> = [];
    for (let i = 0; i < STACK_LANE_COUNT; i++) {
      const t = i / (STACK_LANE_COUNT - 1);
      const y = lerp(-STACK_LANE_Y_RANGE, STACK_LANE_Y_RANGE, t);
      starts.push([STACK_SOURCES_X, y, 0]);
      ends.push([STACK_SUBSTRATE_X - 0.85, y * 0.25, 0]);
    }
    return { starts, ends };
  }, []);

  const surfaceFanEnds = useMemo(() => {
    const dests: Array<[number, number, number]> = [];
    for (let i = 0; i < STACK_FAN_COUNT; i++) {
      const t = i / (STACK_FAN_COUNT - 1);
      const y = lerp(-STACK_FAN_HALF_HEIGHT, STACK_FAN_HALF_HEIGHT, t);
      dests.push([STACK_SURFACES_X, y, 0]);
    }
    return dests;
  }, []);

  const sourcePipPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < STACK_LANE_COUNT; i++) {
      const t = i / (STACK_LANE_COUNT - 1);
      const y = lerp(-STACK_LANE_Y_RANGE, STACK_LANE_Y_RANGE, t);
      out.push([STACK_SOURCES_X, y, 0]);
    }
    return out;
  }, []);

  const geoms = useMemo(() => {
    const sourceLanes = buildLaneLinesGeometry(
      STACK_LANE_COUNT,
      STACK_SOURCES_X,
      STACK_SUBSTRATE_X - 0.85,
      STACK_LANE_Y_RANGE,
      0
    );
    const surfaceFan = buildFanLinesGeometry([STACK_SUBSTRATE_X + 0.85, 0, 0], surfaceFanEnds);
    const sourceMotes = buildLinearMotes(
      sourceLaneEnds.starts,
      sourceLaneEnds.ends,
      STACK_MOTES_PER_LANE
    );
    const surfaceStarts: Array<[number, number, number]> = surfaceFanEnds.map(() => [
      STACK_SUBSTRATE_X + 0.85,
      0,
      0,
    ]);
    const surfaceMotes = buildLinearMotes(surfaceStarts, surfaceFanEnds, STACK_MOTES_PER_RAY);
    const sourcePipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * STACK_PIP_SCALE);
    const surfacePipOutline = buildDiamondGeometry(PYLON_CAP_SIZE);
    const surfacePipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * STACK_PIP_SCALE);

    return {
      sourceLanes,
      surfaceFan,
      sourceMotes,
      surfaceMotes,
      sourcePipFilled,
      surfacePipOutline,
      surfacePipFilled,
    };
  }, [sourceLaneEnds, surfaceFanEnds]);

  const mats = useMemo(
    () => ({
      sourceLanes: makeLineMaterial(COLOR_SOURCES, SOURCE_LANE_OPACITY, false),
      surfaceFan: makeLineMaterial(COLOR_SURFACES, SURFACE_FAN_OPACITY, false),
      sourceMotes: makePointsMaterial(COLOR_SOURCES, SOURCE_PIP_OPACITY, 0.05, false),
      surfaceMotes: makePointsMaterial(COLOR_SURFACES, SOURCE_PIP_OPACITY, 0.05, false),
      sourcePip: makeMeshMaterial(COLOR_SOURCES, SOURCE_PIP_OPACITY),
      surfacePipOutline: makeLineMaterial(COLOR_SURFACES, SURFACE_PIP_OPACITY, true),
      surfacePipFilled: makeMeshMaterial(COLOR_SURFACES, SURFACE_PIP_OPACITY * 0.94),
    }),
    []
  );

  useEffect(() => {
    return () => {
      geoms.sourceLanes.dispose();
      geoms.surfaceFan.dispose();
      geoms.sourceMotes.geometry.dispose();
      geoms.surfaceMotes.geometry.dispose();
      geoms.sourcePipFilled.dispose();
      geoms.surfacePipOutline.dispose();
      geoms.surfacePipFilled.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).stack;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const sourcesStagger = petalStagger(reveal, 0, 2, 0.35);
    const surfacesStagger = petalStagger(reveal, 1, 2, 0.35);
    const sourcesScale = foldEmerge(sourcesStagger).scale;
    const surfacesScale = foldEmerge(surfacesStagger).scale;

    if (sourcesGroupRef.current) {
      sourcesGroupRef.current.visible = sourcesScale > EMERGE_EPSILON;
      sourcesGroupRef.current.scale.setScalar(sourcesScale);
    }
    if (surfacesGroupRef.current) {
      surfacesGroupRef.current.visible = surfacesScale > EMERGE_EPSILON;
      surfacesGroupRef.current.scale.setScalar(surfacesScale);
    }

    if (!reducedMotion) {
      const t = clock.elapsedTime;
      if (sourceMotesRef.current && sourcesScale > EMERGE_EPSILON) {
        advanceLinearMotes(geoms.sourceMotes, (t / 3.4) % 1);
      }
      if (surfaceMotesRef.current && surfacesScale > EMERGE_EPSILON) {
        advanceLinearMotes(geoms.surfaceMotes, (t / 4.2) % 1);
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={sourcesGroupRef} visible={false}>
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
            key={`stack-src-${i}`}
            geometry={geoms.sourcePipFilled}
            material={mats.sourcePip}
            position={pos}
            frustumCulled={false}
          />
        ))}
      </group>

      <group ref={surfacesGroupRef} visible={false}>
        <lineSegments
          geometry={geoms.surfaceFan}
          material={mats.surfaceFan}
          frustumCulled={false}
        />
        <points
          ref={surfaceMotesRef}
          geometry={geoms.surfaceMotes.geometry}
          material={mats.surfaceMotes}
          frustumCulled={false}
        />
        {surfaceFanEnds.map((pos, i) => (
          <group key={`stack-srf-${i}`} position={pos}>
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
      </group>
    </group>
  );
}
