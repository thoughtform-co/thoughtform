"use client";

/**
 * Constellation — variant F of the intelligence-layer artifact.
 *
 * Celestial navigation chart. Substrate at the centre + two faint
 * bearing rings (tilted) + a tick grid. Source stars scatter in the
 * upper hemisphere, surface stars in the lower hemisphere; each star
 * is connected to the substrate by a faint curved trajectory.
 *
 *   - Sources stars (green) : scattered in y > 0, inbound bezier
 *                              hairlines dipping toward the substrate.
 *   - Substrate (gold)       : the shared SubstrateBrandmark at origin.
 *   - Surfaces stars (dawn)  : scattered in y < 0, outbound bezier
 *                              hairlines emerging from the substrate.
 *
 * The whole group spins slowly on Y so the depth reads as a 3D star
 * field rather than a flat diagram. The two bearing rings + tick
 * marks anchor the reading as "navigation chart".
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
  SUBSTRATE_RADIUS,
  clamp01,
  lerp,
  phasePresence,
  smoothstep,
} from "./artifactGeom";
import {
  buildBezierCurveGeometry,
  buildDiamondGeometry,
  buildFilledDiamondGeometry,
  buildOuterTicks,
  buildPolygonGeometry,
  buildXYPolygonGeometry,
  makeLineMaterial,
  makeMeshMaterial,
  scatterHemisphereStars,
} from "./artifactPrimitives";
import { SubstrateBrandmark } from "./SubstrateBrandmark";

interface ConstellationProps {
  progress: number;
  reducedMotion?: boolean;
}

const SOURCES_STAR_COUNT = 7;
const SURFACES_STAR_COUNT = 6;
/** Star scatter radius — well outside the substrate sphere. */
const STAR_RADIUS = SUBSTRATE_RADIUS * 2.6;
/** Bezier dip toward origin. Higher = curves bow more inward. */
const TRAJECTORY_DIP = STAR_RADIUS * 0.55;

/** Bearing ring radii + tilts. */
const BEARING_RING_RADIUS = STAR_RADIUS * 1.05;
const BEARING_RING_TILT_X_A = (24 * Math.PI) / 180;
const BEARING_RING_TILT_X_B = (-18 * Math.PI) / 180;
const BEARING_RING_TILT_Z_B = (12 * Math.PI) / 180;

/** Outer reference ring (XZ plane) + tick marks for the chart frame. */
const FRAME_RING_RADIUS = STAR_RADIUS * 1.18;
const FRAME_TICK_COUNT = 24;
const FRAME_TICK_LENGTH = 0.12;

const CAMERA_POSITION: readonly [number, number, number] = [0, 0.9, 6.4];
const CAMERA_LOOK_AT: readonly [number, number, number] = [0, 0, 0];

/** Deterministic seeds so the star scatter is stable across HMR. */
const SOURCES_SEED = 0xa11ce;
const SURFACES_SEED = 0xb0b;

const CONSTELLATION_ANCHORS_PLACEHOLDER: ArtifactAnchors = {
  sources: [0, 1, 0],
  substrate: [0, 0, 0],
  surfaces: [0, -1, 0],
};

export function Constellation({ progress, reducedMotion = false }: ConstellationProps) {
  const rootRef = useRef<THREE.Group>(null);

  // ── Star scatter (deterministic) ───────────────────────────────
  const sourcesStars = useMemo(
    () => scatterHemisphereStars(SOURCES_STAR_COUNT, STAR_RADIUS, true, SOURCES_SEED),
    []
  );
  const surfacesStars = useMemo(
    () => scatterHemisphereStars(SURFACES_STAR_COUNT, STAR_RADIUS, false, SURFACES_SEED),
    []
  );

  // Anchor points use the brightest (= first) star of each hemisphere
  // so the leader line attaches to a visible star, not empty space.
  const anchors: ArtifactAnchors = useMemo(
    () => ({
      sources: sourcesStars[0] ?? CONSTELLATION_ANCHORS_PLACEHOLDER.sources,
      substrate: [0, 0, 0],
      surfaces: surfacesStars[0] ?? CONSTELLATION_ANCHORS_PLACEHOLDER.surfaces,
    }),
    [sourcesStars, surfacesStars]
  );

  // ── Geometries ─────────────────────────────────────────────────
  const geoms = useMemo(() => {
    // Inbound + outbound trajectory curves, one per star.
    const sourcesCurves = sourcesStars.map((pos) =>
      buildBezierCurveGeometry(pos, [0, 0, 0], TRAJECTORY_DIP)
    );
    const surfacesCurves = surfacesStars.map((pos) =>
      buildBezierCurveGeometry([0, 0, 0], pos, TRAJECTORY_DIP)
    );

    const bearingRingA = buildXYPolygonGeometry(BEARING_RING_RADIUS, 96, 0);
    const bearingRingB = buildXYPolygonGeometry(BEARING_RING_RADIUS * 0.85, 96, 0);

    const frameRing = buildPolygonGeometry(FRAME_RING_RADIUS, 64, 0);
    const frameTicks = buildOuterTicks(FRAME_RING_RADIUS, FRAME_TICK_COUNT, FRAME_TICK_LENGTH, 0);

    const starOutline = buildDiamondGeometry(PYLON_CAP_SIZE * 0.85);
    const starFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.45);

    const gateway = buildPolygonGeometry(GATEWAY_RADIUS, 24, 0);

    return {
      sourcesCurves,
      surfacesCurves,
      bearingRingA,
      bearingRingB,
      frameRing,
      frameTicks,
      starOutline,
      starFilled,
      gateway,
    };
  }, [sourcesStars, surfacesStars]);

  // ── Materials ──────────────────────────────────────────────────
  const mats = useMemo(
    () => ({
      sourcesTrajectory: makeLineMaterial(COLOR_SOURCES, 0),
      surfacesTrajectory: makeLineMaterial(COLOR_SURFACES, 0),
      bearingA: makeLineMaterial(COLOR_DAWN, 0),
      bearingB: makeLineMaterial(COLOR_DAWN, 0),
      frameRing: makeLineMaterial(COLOR_GOLD, 0, true),
      frameTicks: makeLineMaterial(COLOR_DAWN, 0),
      sourcesStarOutline: makeLineMaterial(COLOR_SOURCES, 0, true),
      sourcesStarFilled: makeMeshMaterial(COLOR_SOURCES, 0),
      surfacesStarOutline: makeLineMaterial(COLOR_SURFACES, 0, true),
      surfacesStarFilled: makeMeshMaterial(COLOR_SURFACES, 0),
      gateway: makeLineMaterial(COLOR_GOLD, 0, true),
    }),
    []
  );

  // ── THREE.Line instances for curve trajectories ───────────────
  // R3F v9 / React 19 / @types/react 19: the lowercase `<line>` JSX
  // intrinsic clashes with SVG's `<line>` element type, so TS picks
  // the SVG variant — which doesn't accept `geometry` / `material`
  // props. Pre-build THREE.Line instances and mount them via
  // `<primitive object={...}>`. `<lineLoop>` / `<lineSegments>` are
  // unaffected because there is no SVG element by those names.
  const sourcesCurveLines = useMemo(
    () => geoms.sourcesCurves.map((g) => new THREE.Line(g, mats.sourcesTrajectory)),
    [geoms.sourcesCurves, mats.sourcesTrajectory]
  );
  const surfacesCurveLines = useMemo(
    () => geoms.surfacesCurves.map((g) => new THREE.Line(g, mats.surfacesTrajectory)),
    [geoms.surfacesCurves, mats.surfacesTrajectory]
  );

  // ── Dispose ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      geoms.sourcesCurves.forEach((g) => g.dispose());
      geoms.surfacesCurves.forEach((g) => g.dispose());
      geoms.bearingRingA.dispose();
      geoms.bearingRingB.dispose();
      geoms.frameRing.dispose();
      geoms.frameTicks.dispose();
      geoms.starOutline.dispose();
      geoms.starFilled.dispose();
      geoms.gateway.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  useFrame((state) => {
    const p = clamp01(progress);

    const gatewayP = phasePresence(p, PHASES.gateway, 0.04);
    const sourcesP = phasePresence(p, PHASES.sources);
    const substrateP = phasePresence(p, PHASES.substrate);
    const surfacesP = phasePresence(p, PHASES.surfaces);
    const resolvedP = phasePresence(p, PHASES.resolved);
    const deckP = smoothstep(0.02, 0.22, p);

    mats.frameRing.opacity = deckP * 0.55;
    mats.frameTicks.opacity = deckP * 0.4;
    mats.bearingA.opacity = deckP * 0.25 + sourcesP * 0.15;
    mats.bearingB.opacity = deckP * 0.2 + surfacesP * 0.15;
    mats.sourcesTrajectory.opacity = sourcesP * 0.55;
    mats.surfacesTrajectory.opacity = surfacesP * 0.55;
    mats.sourcesStarOutline.opacity = sourcesP * 0.85;
    mats.sourcesStarFilled.opacity = sourcesP * 0.95;
    mats.surfacesStarOutline.opacity = surfacesP * 0.85;
    mats.surfacesStarFilled.opacity = surfacesP * 0.9;
    mats.gateway.opacity = gatewayP * 0.95;
    void substrateP;

    if (rootRef.current && !reducedMotion) {
      const spin = 0.022 + resolvedP * 0.05;
      rootRef.current.rotation.y += spin * (1 / 60);
    }

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

      {/* Chart frame (outer ring + bearing ticks) */}
      <lineLoop geometry={geoms.frameRing} material={mats.frameRing} frustumCulled={false} />
      <lineSegments geometry={geoms.frameTicks} material={mats.frameTicks} frustumCulled={false} />

      {/* Two tilted bearing rings (dawn). */}
      <group rotation={[BEARING_RING_TILT_X_A, 0, 0]}>
        <lineLoop geometry={geoms.bearingRingA} material={mats.bearingA} frustumCulled={false} />
      </group>
      <group rotation={[BEARING_RING_TILT_X_B, 0, BEARING_RING_TILT_Z_B]}>
        <lineLoop geometry={geoms.bearingRingB} material={mats.bearingB} frustumCulled={false} />
      </group>

      {/* Substrate at centre */}
      <SubstrateBrandmark
        presence={substrateP}
        resolved={resolvedP}
        reducedMotion={reducedMotion}
        radius={SUBSTRATE_RADIUS}
      />

      {/* Source stars + inbound trajectories (green) */}
      {sourcesCurveLines.map((line, i) => (
        <primitive key={`src-curve-${i}`} object={line} />
      ))}
      {sourcesStars.map((pos, i) => (
        <group key={`src-${i}`} position={pos}>
          <lineLoop
            geometry={geoms.starOutline}
            material={mats.sourcesStarOutline}
            frustumCulled={false}
          />
          <mesh
            geometry={geoms.starFilled}
            material={mats.sourcesStarFilled}
            frustumCulled={false}
          />
        </group>
      ))}

      {/* Surface stars + outbound trajectories (dawn) */}
      {surfacesCurveLines.map((line, i) => (
        <primitive key={`srf-curve-${i}`} object={line} />
      ))}
      {surfacesStars.map((pos, i) => (
        <group key={`srf-${i}`} position={pos}>
          <lineLoop
            geometry={geoms.starOutline}
            material={mats.surfacesStarOutline}
            frustumCulled={false}
          />
          <mesh
            geometry={geoms.starFilled}
            material={mats.surfacesStarFilled}
            frustumCulled={false}
          />
        </group>
      ))}

      <AnchorProjector anchors={anchors} trackGroupRef={rootRef} />
    </group>
  );
}
