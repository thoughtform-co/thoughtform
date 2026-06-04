"use client";

/**
 * NestedShellSphere — variant B of the intelligence-layer artifact.
 *
 * One object. Three concentric shells, each distinct in colour AND
 * form so the three layers are immediately readable as the same body
 * built up from the inside out:
 *
 *   - Substrate (inner core, gold) : geodesic sphere + brandmark
 *     particle cloud at the centre. Same SubstrateBrandmark used by
 *     every variant, so the nucleus is consistent.
 *   - Sources (middle band, green) : a tilted Saturn-style ring at
 *     the equator with provenance pip diamonds. Mirrors how trusted
 *     sources orbit / feed inward toward the substrate.
 *   - Surfaces (outer skin, dawn)  : an outer geodesic + endpoint
 *     port diamonds distributed on its rim. Reads as the headless
 *     surfaces wrapping the layer.
 *
 * The reveal sequence builds inside-out:
 *
 *   1. Substrate core forms first (sphere edges + brandmark cloud).
 *   2. Sources band rotates in around it (the ring fades / tilts up).
 *   3. Surfaces skin envelops everything (outer geodesic + port pips).
 *
 * Each shell carries an "anchor" world point that the scene
 * projection layer uses to position the always-on layer label.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AnchorProjector } from "./AnchorProjector";
import {
  type ArtifactAnchors,
  CAMERA_LOOK_AT,
  CAMERA_ORBIT_LIFT,
  CAMERA_ORBIT_PERIOD_SEC,
  CAMERA_ORBIT_RADIUS,
  CAMERA_POSITION,
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
  buildDiamondGeometry,
  buildFilledDiamondGeometry,
  buildPolygonGeometry,
  buildXYPolygonGeometry,
  makeLineMaterial,
  makeMeshMaterial,
} from "./artifactPrimitives";
import { SubstrateBrandmark } from "./SubstrateBrandmark";

interface NestedShellSphereProps {
  progress: number;
  reducedMotion?: boolean;
}

/** Anchor points (parent-local) for the leader-line label system.
 *  Sources sits on the tilted ring band, Substrate at the sphere
 *  centre, Surfaces on a port pip of the outer shell. */
const SHELL_ANCHORS: ArtifactAnchors = {
  // A point on the tilted source ring (~10 o'clock looking face-on).
  sources: [-SUBSTRATE_RADIUS * 1.5, SUBSTRATE_RADIUS * 0.55, 0],
  substrate: [0, 0, 0],
  // A surface port at ~2 o'clock on the outer geodesic.
  surfaces: [SUBSTRATE_RADIUS * 2.0, SUBSTRATE_RADIUS * 0.4, 0],
};

/** Substrate shell radius (inner). Matches the canonical substrate
 *  size so the brandmark + geodesic edge look identical to the other
 *  variants. */
const CORE_RADIUS = SUBSTRATE_RADIUS;

/** Sources ring band radius. A bit larger than the core so the ring
 *  reads as orbiting the substrate rather than touching it. */
const SOURCES_RING_RADIUS = CORE_RADIUS * 1.55;

/** Sources ring tilt around the X axis. Gives the band a perspective
 *  read instead of sitting perfectly horizontal. */
const SOURCES_RING_TILT_X = (24 * Math.PI) / 180;

/** Sources ring tilt around the Z axis. A second small tilt so the
 *  ring doesn't sit on a primary axis. */
const SOURCES_RING_TILT_Z = (10 * Math.PI) / 180;

/** A secondary inner sources ring for the dotted-band look. */
const SOURCES_RING_INNER_RADIUS = CORE_RADIUS * 1.42;

/** Number of provenance pips around the sources ring. */
const SOURCES_PIP_COUNT = 8;

/** Outer surfaces shell radius. Sized so the inner substrate reads as
 *  the "core" the layer wraps around. */
const SURFACES_RADIUS = CORE_RADIUS * 2.25;

/** Number of port pips arranged around the surfaces shell. */
const SURFACES_PORT_COUNT = 6;

/** Tilt of the surfaces port ring (Y rotation of its mounting group). */
const SURFACES_PORT_TILT_Y = (12 * Math.PI) / 180;

/** Camera shift: the shell variant looks better head-on with a small
 *  elevation so the inner sphere is fully visible. */
const SHELL_CAMERA_POSITION: readonly [number, number, number] = [0, 1.4, 6.5];
const SHELL_CAMERA_LOOK_AT: readonly [number, number, number] = [0, 0.2, 0];

export function NestedShellSphere({ progress, reducedMotion = false }: NestedShellSphereProps) {
  const rootRef = useRef<THREE.Group>(null);
  const sourcesRingRef = useRef<THREE.Group>(null);
  const surfacesShellRef = useRef<THREE.Group>(null);
  const cameraOrbitT = useRef(0);

  // ── Geometries ─────────────────────────────────────────────────
  const geoms = useMemo(() => {
    // Sources ring on the XY plane — tilted via parent group.
    const sourcesRing = buildXYPolygonGeometry(SOURCES_RING_RADIUS, 96, 0);
    const sourcesRingInner = buildXYPolygonGeometry(SOURCES_RING_INNER_RADIUS, 96, 0);
    // Tilted equator hairlines AROUND the sources ring band (band edges).
    const sourcesEdgeOuter = buildXYPolygonGeometry(SOURCES_RING_RADIUS + 0.04, 96, 0);
    const sourcesEdgeInner = buildXYPolygonGeometry(SOURCES_RING_INNER_RADIUS - 0.04, 96, 0);
    // Surfaces outer geodesic.
    const surfacesIco = new THREE.IcosahedronGeometry(SURFACES_RADIUS, 1);
    const surfacesEdges = new THREE.EdgesGeometry(surfacesIco);
    surfacesIco.dispose();
    // A faint "equator" hairline on the surfaces shell (XZ plane) for
    // structural read.
    const surfacesEquator = buildPolygonGeometry(SURFACES_RADIUS, 48, 0);

    // Pip diamond geometries.
    const sourcesPipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);
    const surfacesPipOutline = buildDiamondGeometry(PYLON_CAP_SIZE);
    const surfacesPipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);

    const gateway = buildPolygonGeometry(GATEWAY_RADIUS, 24, 0);

    return {
      sourcesRing,
      sourcesRingInner,
      sourcesEdgeOuter,
      sourcesEdgeInner,
      surfacesEdges,
      surfacesEquator,
      sourcesPipFilled,
      surfacesPipOutline,
      surfacesPipFilled,
      gateway,
    };
  }, []);

  // ── Materials ──────────────────────────────────────────────────
  const mats = useMemo(() => {
    return {
      sourcesRing: makeLineMaterial(COLOR_SOURCES, 0, true),
      sourcesRingInner: makeLineMaterial(COLOR_SOURCES, 0, true),
      sourcesEdgeOuter: makeLineMaterial(COLOR_SOURCES, 0),
      sourcesEdgeInner: makeLineMaterial(COLOR_SOURCES, 0),
      sourcesPip: makeMeshMaterial(COLOR_SOURCES, 0),
      surfacesEdges: makeLineMaterial(COLOR_SURFACES, 0),
      surfacesEquator: makeLineMaterial(COLOR_SURFACES, 0),
      surfacesPipOutline: makeLineMaterial(COLOR_SURFACES, 0, true),
      surfacesPipFilled: makeMeshMaterial(COLOR_SURFACES, 0),
      gateway: makeLineMaterial(COLOR_GOLD, 0, true),
    };
  }, []);

  // ── Dispose ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      Object.values(geoms).forEach((g) => {
        if (g instanceof THREE.BufferGeometry) g.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  // ── Pip positions (computed once, in local space) ──────────────
  const sourcesPipPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < SOURCES_PIP_COUNT; i++) {
      const a = (i / SOURCES_PIP_COUNT) * Math.PI * 2 + Math.PI / SOURCES_PIP_COUNT;
      // Mid-radius of the ring band.
      const r = (SOURCES_RING_RADIUS + SOURCES_RING_INNER_RADIUS) / 2;
      out.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
    }
    return out;
  }, []);

  const surfacesPortPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < SURFACES_PORT_COUNT; i++) {
      const a = (i / SURFACES_PORT_COUNT) * Math.PI * 2;
      out.push([Math.cos(a) * SURFACES_RADIUS, 0, Math.sin(a) * SURFACES_RADIUS]);
    }
    return out;
  }, []);

  // ── Per-frame ──────────────────────────────────────────────────
  useFrame((state) => {
    const p = clamp01(progress);

    const gatewayP = phasePresence(p, PHASES.gateway, 0.04);
    const sourcesP = phasePresence(p, PHASES.sources);
    const substrateP = phasePresence(p, PHASES.substrate);
    const surfacesP = phasePresence(p, PHASES.surfaces);
    const resolvedP = phasePresence(p, PHASES.resolved);

    // Sources shell opacities (Atreides green).
    mats.sourcesRing.opacity = sourcesP * 0.7;
    mats.sourcesRingInner.opacity = sourcesP * 0.55;
    mats.sourcesEdgeOuter.opacity = sourcesP * 0.35;
    mats.sourcesEdgeInner.opacity = sourcesP * 0.35;
    mats.sourcesPip.opacity = sourcesP * 0.95;

    // Surfaces shell opacities (dawn).
    mats.surfacesEdges.opacity = surfacesP * 0.45;
    mats.surfacesEquator.opacity = surfacesP * 0.32;
    mats.surfacesPipOutline.opacity = surfacesP * 0.9;
    mats.surfacesPipFilled.opacity = surfacesP * 0.85;

    // Gateway descent.
    mats.gateway.opacity = gatewayP * 0.95;
    void substrateP;

    // Counter-rotating shells so the artifact reads as a living
    // instrument rather than a static globe. Sources spins on its
    // local Y (which is the band's normal after the tilt). Surfaces
    // spins slower on world Y.
    if (sourcesRingRef.current && !reducedMotion) {
      sourcesRingRef.current.rotation.z += (0.08 + resolvedP * 0.04) * (1 / 60);
    }
    if (surfacesShellRef.current && !reducedMotion) {
      surfacesShellRef.current.rotation.y += (0.04 + resolvedP * 0.03) * (1 / 60);
    }

    // Camera orbit at resolved (around the shell's preferred view).
    if (!reducedMotion) {
      cameraOrbitT.current += 1 / 60 / CAMERA_ORBIT_PERIOD_SEC;
      const orbitT = cameraOrbitT.current * Math.PI * 2;
      const mix = resolvedP;
      state.camera.position.x =
        SHELL_CAMERA_POSITION[0] + Math.sin(orbitT) * CAMERA_ORBIT_RADIUS * mix;
      state.camera.position.y =
        SHELL_CAMERA_POSITION[1] + Math.cos(orbitT * 0.6) * CAMERA_ORBIT_LIFT * mix;
      state.camera.position.z = SHELL_CAMERA_POSITION[2];
      state.camera.lookAt(
        SHELL_CAMERA_LOOK_AT[0],
        SHELL_CAMERA_LOOK_AT[1],
        SHELL_CAMERA_LOOK_AT[2]
      );
    }
    // Touch CAMERA constants for static-camera fallback ergonomics.
    void CAMERA_POSITION;
    void CAMERA_LOOK_AT;
  });

  const substrateP = phasePresence(clamp01(progress), PHASES.substrate);
  const resolvedP = phasePresence(clamp01(progress), PHASES.resolved);

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

      {/* Substrate core (inner shell, gold) — same SubstrateBrandmark
          used by every variant so the nucleus reads identically. */}
      <SubstrateBrandmark
        presence={substrateP}
        resolved={resolvedP}
        reducedMotion={reducedMotion}
      />

      {/* Sources ring band (middle shell, Atreides green).
          Tilted on X + Z so the ring reads as a Saturn-style band
          inclined relative to the substrate equator. */}
      <group ref={sourcesRingRef} rotation={[SOURCES_RING_TILT_X, 0, SOURCES_RING_TILT_Z]}>
        <lineLoop geometry={geoms.sourcesRing} material={mats.sourcesRing} frustumCulled={false} />
        <lineLoop
          geometry={geoms.sourcesRingInner}
          material={mats.sourcesRingInner}
          frustumCulled={false}
        />
        <lineLoop
          geometry={geoms.sourcesEdgeOuter}
          material={mats.sourcesEdgeOuter}
          frustumCulled={false}
        />
        <lineLoop
          geometry={geoms.sourcesEdgeInner}
          material={mats.sourcesEdgeInner}
          frustumCulled={false}
        />
        {sourcesPipPositions.map((pos, i) => (
          <mesh
            key={`src-pip-${i}`}
            geometry={geoms.sourcesPipFilled}
            material={mats.sourcesPip}
            position={pos}
            frustumCulled={false}
          />
        ))}
      </group>

      {/* Surfaces outer skin (outer shell, dawn). */}
      <group ref={surfacesShellRef} rotation={[0, SURFACES_PORT_TILT_Y, 0]}>
        <lineSegments
          geometry={geoms.surfacesEdges}
          material={mats.surfacesEdges}
          frustumCulled={false}
        />
        <lineLoop
          geometry={geoms.surfacesEquator}
          material={mats.surfacesEquator}
          frustumCulled={false}
        />
        {surfacesPortPositions.map((pos, i) => (
          <group key={`surf-port-${i}`} position={pos}>
            <lineLoop
              geometry={geoms.surfacesPipOutline}
              material={mats.surfacesPipOutline}
              frustumCulled={false}
            />
            <mesh
              geometry={geoms.surfacesPipFilled}
              material={mats.surfacesPipFilled}
              frustumCulled={false}
            />
          </group>
        ))}
      </group>

      <AnchorProjector anchors={SHELL_ANCHORS} trackGroupRef={rootRef} />
    </group>
  );
}
