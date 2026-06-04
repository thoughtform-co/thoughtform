"use client";

/**
 * ArmillaryDeck — variant A of the intelligence-layer artifact.
 *
 * The original "armillary deck" composition, refactored against the
 * shared primitives + the shared SubstrateBrandmark. Maps the three
 * intelligence-layer roles onto distinct, color-coded zones:
 *
 *   - Sources  : outer polygonal deck rim + Atreides-green provenance
 *                pips + inbound dotted channels.
 *   - Substrate: central geodesic sphere + canonical-gold brandmark
 *                cloud (with 3D depth via SubstrateBrandmark).
 *   - Surfaces : raised pylons + dawn endpoint diamonds around the
 *                rim.
 *
 * The deck plates and the gateway descent ring stay gold (they are
 * structural "you-are-here" chrome, not a fourth role).
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  CAMERA_LOOK_AT,
  CAMERA_ORBIT_LIFT,
  CAMERA_ORBIT_PERIOD_SEC,
  CAMERA_ORBIT_RADIUS,
  CAMERA_POSITION,
  COLOR_DAWN,
  COLOR_GOLD,
  COLOR_SOURCES,
  COLOR_SURFACES,
  DECK_INNER_RADIUS,
  DECK_INNER_SIDES,
  DECK_LIFT,
  DECK_MID_RADIUS,
  DECK_MID_SIDES,
  DECK_OUTER_RADIUS,
  DECK_OUTER_SIDES,
  GATEWAY_RADIUS,
  GATEWAY_Z_END,
  GATEWAY_Z_START,
  GRAPH_STRUT_COUNT,
  GRAPH_STRUT_ROOT_RADIUS,
  OUTER_TICKS_PER_SIDE,
  PHASES,
  PYLON_CAP_SIZE,
  PYLON_COUNT,
  PYLON_HEIGHT,
  PYLON_ROOT_RADIUS,
  SOURCE_CHANNEL_INNER_RADIUS,
  SOURCE_CHANNEL_MOTE_COUNT,
  SOURCE_PIP_COUNT,
  SUBSTRATE_LIFT,
  SUBSTRATE_RADIUS,
  clamp01,
  lerp,
  phasePresence,
  smoothstep,
} from "./artifactGeom";
import {
  advanceSourceMotes,
  buildDiamondGeometry,
  buildFilledDiamondGeometry,
  buildGraphStrutsGeometry,
  buildOuterTicks,
  buildPlatedSegments,
  buildPolygonGeometry,
  buildPylonMastGeometry,
  buildSourceChannelsGeometry,
  buildSourceMotes,
  makeLineMaterial,
  makeMeshMaterial,
  makePointsMaterial,
  ringPositions,
} from "./artifactPrimitives";
import { SubstrateBrandmark } from "./SubstrateBrandmark";

interface ArmillaryDeckProps {
  progress: number;
  reducedMotion?: boolean;
}

export function ArmillaryDeck({ progress, reducedMotion = false }: ArmillaryDeckProps) {
  const rootRef = useRef<THREE.Group>(null);
  const sourceMotesRef = useRef<THREE.Points>(null);
  const cameraOrbitT = useRef(0);

  // ── Geometries ─────────────────────────────────────────────────
  const geoms = useMemo(() => {
    const outerPoly = buildPolygonGeometry(DECK_OUTER_RADIUS, DECK_OUTER_SIDES, 0);
    const midPoly = buildPolygonGeometry(DECK_MID_RADIUS, DECK_MID_SIDES, DECK_LIFT);
    const innerPoly = buildPolygonGeometry(DECK_INNER_RADIUS, DECK_INNER_SIDES, DECK_LIFT * 1.7);
    const outerTicks = buildOuterTicks(
      DECK_OUTER_RADIUS,
      DECK_OUTER_SIDES * OUTER_TICKS_PER_SIDE,
      0.12,
      0
    );
    const midPlates = buildPlatedSegments(DECK_MID_RADIUS, DECK_MID_SIDES, 0.62, DECK_LIFT);
    const innerHalo = buildPolygonGeometry(
      DECK_INNER_RADIUS - 0.18,
      DECK_INNER_SIDES * 2,
      DECK_LIFT * 1.7
    );

    const sourceChannels = buildSourceChannelsGeometry(
      SOURCE_PIP_COUNT,
      DECK_OUTER_RADIUS,
      SOURCE_CHANNEL_INNER_RADIUS,
      DECK_LIFT * 0.5,
      Math.PI / SOURCE_PIP_COUNT
    );
    const sourceMotes = buildSourceMotes(
      SOURCE_PIP_COUNT,
      SOURCE_CHANNEL_MOTE_COUNT,
      DECK_OUTER_RADIUS,
      SOURCE_CHANNEL_INNER_RADIUS,
      DECK_LIFT * 0.5,
      Math.PI / SOURCE_PIP_COUNT
    );
    const graphStruts = buildGraphStrutsGeometry(
      GRAPH_STRUT_COUNT,
      GRAPH_STRUT_ROOT_RADIUS,
      DECK_LIFT * 1.5,
      SUBSTRATE_RADIUS * 0.85,
      SUBSTRATE_LIFT - SUBSTRATE_RADIUS * 0.6,
      Math.PI / GRAPH_STRUT_COUNT
    );
    const pylonMasts = buildPylonMastGeometry(
      PYLON_HEIGHT,
      PYLON_ROOT_RADIUS,
      PYLON_COUNT,
      DECK_LIFT
    );
    const pylonRing = buildPolygonGeometry(PYLON_ROOT_RADIUS, PYLON_COUNT * 4, DECK_LIFT * 1.2);
    const diamondOutline = buildDiamondGeometry(PYLON_CAP_SIZE);
    const diamondFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);
    const sourceDiamond = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);
    const gateway = buildPolygonGeometry(GATEWAY_RADIUS, 24, 0);

    return {
      outerPoly,
      midPoly,
      innerPoly,
      outerTicks,
      midPlates,
      innerHalo,
      sourceChannels,
      sourceMotes,
      graphStruts,
      pylonMasts,
      pylonRing,
      diamondOutline,
      diamondFilled,
      sourceDiamond,
      gateway,
    };
  }, []);

  // ── Materials ──────────────────────────────────────────────────
  const mats = useMemo(() => {
    return {
      // Deck chrome (gold structural)
      outerPoly: makeLineMaterial(COLOR_GOLD, 0, true),
      midPoly: makeLineMaterial(COLOR_DAWN, 0),
      innerPoly: makeLineMaterial(COLOR_GOLD, 0, true),
      outerTicks: makeLineMaterial(COLOR_DAWN, 0),
      midPlates: makeLineMaterial(COLOR_GOLD, 0, true),
      innerHalo: makeLineMaterial(COLOR_DAWN, 0),
      // Trusted sources (Atreides green)
      sourceChannels: makeLineMaterial(COLOR_SOURCES, 0, true),
      sourceMotes: makePointsMaterial(COLOR_SOURCES, 0, 0.045, false),
      sourcePip: makeMeshMaterial(COLOR_SOURCES, 0),
      // Knowledge graph (dawn) — semantic ties from substrate to deck.
      graphStruts: makeLineMaterial(COLOR_DAWN, 0),
      // Headless surfaces (dawn)
      pylonMasts: makeLineMaterial(COLOR_SURFACES, 0),
      pylonRing: makeLineMaterial(COLOR_GOLD, 0, true),
      pylonCapOutline: makeLineMaterial(COLOR_SURFACES, 0, true),
      pylonCapFilled: makeMeshMaterial(COLOR_SURFACES, 0),
      // Gateway descent
      gateway: makeLineMaterial(COLOR_GOLD, 0, true),
    };
  }, []);

  // ── Dispose ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      Object.values(geoms).forEach((g) => {
        if (g instanceof THREE.BufferGeometry) g.dispose();
        else if (g && "geometry" in g) g.geometry.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  // ── Per-frame reveals + motion ─────────────────────────────────
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = clamp01(progress);

    const gatewayP = phasePresence(p, PHASES.gateway, 0.04);
    const sourcesP = phasePresence(p, PHASES.sources);
    const substrateP = phasePresence(p, PHASES.substrate);
    const graphP = phasePresence(p, PHASES.graph);
    const surfacesP = phasePresence(p, PHASES.surfaces);
    const resolvedP = phasePresence(p, PHASES.resolved);

    const deckP = smoothstep(0.02, 0.22, p);

    // Deck
    mats.outerPoly.opacity = deckP * 0.85;
    mats.midPoly.opacity = deckP * 0.45;
    mats.innerPoly.opacity = deckP * 0.7;
    mats.outerTicks.opacity = deckP * 0.55;
    mats.midPlates.opacity = sourcesP * 0.7 + deckP * 0.1;
    mats.innerHalo.opacity = graphP * 0.35;

    // Knowledge graph
    mats.graphStruts.opacity = graphP * 0.55;

    // Sources
    mats.sourceChannels.opacity = sourcesP * 0.85;
    mats.sourceMotes.opacity = sourcesP * 0.95;
    mats.sourcePip.opacity = sourcesP * 0.95;

    // Surfaces
    mats.pylonMasts.opacity = surfacesP * 0.7;
    mats.pylonRing.opacity = surfacesP * 0.6;
    mats.pylonCapOutline.opacity = surfacesP * 0.95;
    mats.pylonCapFilled.opacity = surfacesP * 0.85;

    // Gateway
    mats.gateway.opacity = gatewayP * 0.95;
    void substrateP; // consumed by <SubstrateBrandmark presence={substrateP}/>

    // Source motes drift
    if (sourceMotesRef.current && !reducedMotion) {
      const driftCycle = 4.5;
      advanceSourceMotes(geoms.sourceMotes, (t / driftCycle) % 1);
    }

    // Auto-spin (deck + everything below substrate group).
    if (rootRef.current) {
      const spin = reducedMotion ? 0 : 0.025 + resolvedP * 0.06;
      rootRef.current.rotation.y += spin * (1 / 60);
    }

    // Camera orbit at resolved.
    if (!reducedMotion) {
      cameraOrbitT.current += 1 / 60 / CAMERA_ORBIT_PERIOD_SEC;
      const orbitT = cameraOrbitT.current * Math.PI * 2;
      const mix = resolvedP;
      state.camera.position.x = CAMERA_POSITION[0] + Math.sin(orbitT) * CAMERA_ORBIT_RADIUS * mix;
      state.camera.position.y =
        CAMERA_POSITION[1] + Math.cos(orbitT * 0.6) * CAMERA_ORBIT_LIFT * mix;
      state.camera.position.z = CAMERA_POSITION[2];
      state.camera.lookAt(CAMERA_LOOK_AT[0], CAMERA_LOOK_AT[1], CAMERA_LOOK_AT[2]);
    }
  });

  // ── Static lookups ─────────────────────────────────────────────
  const sourcePipPositions = useMemo(
    () =>
      ringPositions(
        SOURCE_PIP_COUNT,
        DECK_OUTER_RADIUS,
        DECK_LIFT * 0.5,
        Math.PI / SOURCE_PIP_COUNT
      ),
    []
  );
  const pylonCapPositions = useMemo(
    () => ringPositions(PYLON_COUNT, PYLON_ROOT_RADIUS, DECK_LIFT + PYLON_HEIGHT),
    []
  );

  // Substrate phase signal for SubstrateBrandmark presence.
  const substrateP = phasePresence(clamp01(progress), PHASES.substrate);
  const resolvedP = phasePresence(clamp01(progress), PHASES.resolved);

  // Gateway descent translation.
  const gatewayZ = lerp(GATEWAY_Z_START, GATEWAY_Z_END, smoothstep(0, 0.16, progress));

  return (
    <group ref={rootRef}>
      <ambientLight intensity={0.32} />

      {/* Gateway descent */}
      <lineLoop
        geometry={geoms.gateway}
        material={mats.gateway}
        position={[0, 1.0, gatewayZ]}
        frustumCulled={false}
      />

      {/* Deck */}
      <lineLoop geometry={geoms.outerPoly} material={mats.outerPoly} frustumCulled={false} />
      <lineLoop geometry={geoms.midPoly} material={mats.midPoly} frustumCulled={false} />
      <lineLoop geometry={geoms.innerPoly} material={mats.innerPoly} frustumCulled={false} />
      <lineLoop geometry={geoms.innerHalo} material={mats.innerHalo} frustumCulled={false} />
      <lineSegments geometry={geoms.outerTicks} material={mats.outerTicks} frustumCulled={false} />
      <lineSegments geometry={geoms.midPlates} material={mats.midPlates} frustumCulled={false} />

      {/* Substrate (shared depth brandmark) */}
      <group position={[0, SUBSTRATE_LIFT, 0]}>
        <SubstrateBrandmark
          presence={substrateP}
          resolved={resolvedP}
          reducedMotion={reducedMotion}
        />
      </group>

      {/* Knowledge graph */}
      <lineSegments
        geometry={geoms.graphStruts}
        material={mats.graphStruts}
        frustumCulled={false}
      />

      {/* Sources */}
      <lineSegments
        geometry={geoms.sourceChannels}
        material={mats.sourceChannels}
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
          key={`pip-${i}`}
          geometry={geoms.sourceDiamond}
          material={mats.sourcePip}
          position={pos}
          rotation={[-Math.PI / 2, 0, 0]}
          frustumCulled={false}
        />
      ))}

      {/* Surfaces */}
      <lineSegments geometry={geoms.pylonMasts} material={mats.pylonMasts} frustumCulled={false} />
      <lineLoop geometry={geoms.pylonRing} material={mats.pylonRing} frustumCulled={false} />
      {pylonCapPositions.map((pos, i) => (
        <group key={`pylon-cap-${i}`} position={pos}>
          <lineLoop
            geometry={geoms.diamondOutline}
            material={mats.pylonCapOutline}
            frustumCulled={false}
          />
          <mesh
            geometry={geoms.diamondFilled}
            material={mats.pylonCapFilled}
            frustumCulled={false}
          />
        </group>
      ))}
    </group>
  );
}
