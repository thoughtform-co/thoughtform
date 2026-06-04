"use client";

/**
 * OrbitalSystem — variant C of the intelligence-layer artifact.
 *
 * Three distinct orbital planes around the shared substrate core,
 * each tilted on a different axis so the three layers occupy clearly
 * separate space:
 *
 *   - Substrate (centre, gold) : the shared SubstrateBrandmark.
 *   - Sources   (plane 1, green): a tilted ring with provenance pip
 *                                  diamonds drifting around the core.
 *                                  Reads as input feeds orbiting in.
 *   - Surfaces  (plane 2, dawn) : a counter-tilted ring with port
 *                                  diamonds + short outward tags.
 *                                  Reads as output endpoints.
 *
 * Both planes carry their own group transform so their orientation
 * differences are immediately visible. They spin independently with
 * subtle counter-rotation so the artifact reads as a celestial system
 * rather than a static diagram.
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

interface OrbitalSystemProps {
  progress: number;
  reducedMotion?: boolean;
}

const SOURCES_ORBIT_RADIUS = SUBSTRATE_RADIUS * 1.75;
const SURFACES_ORBIT_RADIUS = SUBSTRATE_RADIUS * 2.5;

/** Sources orbit tilt: tipped up so we read the ellipse face-on. */
const SOURCES_TILT_X = (62 * Math.PI) / 180;
const SOURCES_TILT_Z = (-14 * Math.PI) / 180;

/** Surfaces orbit: counter-tilted so the two planes cross visibly. */
const SURFACES_TILT_X = (38 * Math.PI) / 180;
const SURFACES_TILT_Z = (22 * Math.PI) / 180;

const SOURCES_PIP_COUNT = 6;
const SURFACES_PORT_COUNT = 6;

/** Short outward tags from each surface port — gives the "endpoint
 *  hanging off the orbit" read. */
const SURFACES_TAG_LENGTH = 0.22;

export function OrbitalSystem({ progress, reducedMotion = false }: OrbitalSystemProps) {
  const sourcesOrbitRef = useRef<THREE.Group>(null);
  const surfacesOrbitRef = useRef<THREE.Group>(null);
  const sourcesSpinRef = useRef<THREE.Group>(null);
  const surfacesSpinRef = useRef<THREE.Group>(null);
  const cameraOrbitT = useRef(0);

  // ── Geometries ─────────────────────────────────────────────────
  const geoms = useMemo(() => {
    const sourcesOrbit = buildXYPolygonGeometry(SOURCES_ORBIT_RADIUS, 96, 0);
    const surfacesOrbit = buildXYPolygonGeometry(SURFACES_ORBIT_RADIUS, 96, 0);

    const sourcesPip = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);
    const surfacesPipOutline = buildDiamondGeometry(PYLON_CAP_SIZE);
    const surfacesPipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);

    // Outward tags: short hairlines from each port radially outward
    // in the orbit's local XY plane.
    const tagPositions = new Float32Array(SURFACES_PORT_COUNT * 2 * 3);
    for (let i = 0; i < SURFACES_PORT_COUNT; i++) {
      const a = (i / SURFACES_PORT_COUNT) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      tagPositions[i * 6] = c * SURFACES_ORBIT_RADIUS;
      tagPositions[i * 6 + 1] = s * SURFACES_ORBIT_RADIUS;
      tagPositions[i * 6 + 2] = 0;
      tagPositions[i * 6 + 3] = c * (SURFACES_ORBIT_RADIUS + SURFACES_TAG_LENGTH);
      tagPositions[i * 6 + 4] = s * (SURFACES_ORBIT_RADIUS + SURFACES_TAG_LENGTH);
      tagPositions[i * 6 + 5] = 0;
    }
    const surfacesTags = new THREE.BufferGeometry();
    surfacesTags.setAttribute("position", new THREE.BufferAttribute(tagPositions, 3));

    const gateway = buildPolygonGeometry(GATEWAY_RADIUS, 24, 0);

    return {
      sourcesOrbit,
      surfacesOrbit,
      sourcesPip,
      surfacesPipOutline,
      surfacesPipFilled,
      surfacesTags,
      gateway,
    };
  }, []);

  // ── Materials ──────────────────────────────────────────────────
  const mats = useMemo(() => {
    return {
      sourcesOrbit: makeLineMaterial(COLOR_SOURCES, 0, true),
      sourcesPip: makeMeshMaterial(COLOR_SOURCES, 0),
      surfacesOrbit: makeLineMaterial(COLOR_SURFACES, 0),
      surfacesPipOutline: makeLineMaterial(COLOR_SURFACES, 0, true),
      surfacesPipFilled: makeMeshMaterial(COLOR_SURFACES, 0),
      surfacesTags: makeLineMaterial(COLOR_SURFACES, 0),
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

  // ── Pip placements ─────────────────────────────────────────────
  const sourcesPipPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < SOURCES_PIP_COUNT; i++) {
      const a = (i / SOURCES_PIP_COUNT) * Math.PI * 2 + Math.PI / SOURCES_PIP_COUNT;
      out.push([Math.cos(a) * SOURCES_ORBIT_RADIUS, Math.sin(a) * SOURCES_ORBIT_RADIUS, 0]);
    }
    return out;
  }, []);

  const surfacesPortPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < SURFACES_PORT_COUNT; i++) {
      const a = (i / SURFACES_PORT_COUNT) * Math.PI * 2;
      out.push([Math.cos(a) * SURFACES_ORBIT_RADIUS, Math.sin(a) * SURFACES_ORBIT_RADIUS, 0]);
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

    // Sources plane (green).
    mats.sourcesOrbit.opacity = sourcesP * 0.8;
    mats.sourcesPip.opacity = sourcesP * 0.95;

    // Surfaces plane (dawn).
    mats.surfacesOrbit.opacity = surfacesP * 0.55;
    mats.surfacesPipOutline.opacity = surfacesP * 0.95;
    mats.surfacesPipFilled.opacity = surfacesP * 0.85;
    mats.surfacesTags.opacity = surfacesP * 0.6;

    mats.gateway.opacity = gatewayP * 0.95;
    void substrateP;

    // Spin: sources clockwise, surfaces counter-clockwise. Spins
    // happen on the orbit's local Z axis (the ring's normal in its
    // tilted frame). Subtle; the variant should read as the artifact
    // not a clock.
    if (sourcesSpinRef.current && !reducedMotion) {
      sourcesSpinRef.current.rotation.z += (0.08 + resolvedP * 0.04) * (1 / 60);
    }
    if (surfacesSpinRef.current && !reducedMotion) {
      surfacesSpinRef.current.rotation.z -= (0.05 + resolvedP * 0.03) * (1 / 60);
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

  const substrateP = phasePresence(clamp01(progress), PHASES.substrate);
  const resolvedP = phasePresence(clamp01(progress), PHASES.resolved);

  const gatewayZ = lerp(GATEWAY_Z_START, GATEWAY_Z_END, smoothstep(0, 0.16, progress));

  return (
    <group>
      <ambientLight intensity={0.32} />

      {/* Gateway descent */}
      <lineLoop
        geometry={geoms.gateway}
        material={mats.gateway}
        position={[0, 1.0, gatewayZ]}
        frustumCulled={false}
      />

      {/* Substrate core */}
      <SubstrateBrandmark
        presence={substrateP}
        resolved={resolvedP}
        reducedMotion={reducedMotion}
      />

      {/* Sources orbital plane (green) — outer rotation group sets
          the orbit's tilted normal; the inner group spins around that
          normal so pips drift inside the tilted plane. */}
      <group ref={sourcesOrbitRef} rotation={[SOURCES_TILT_X, 0, SOURCES_TILT_Z]}>
        <group ref={sourcesSpinRef}>
          <lineLoop
            geometry={geoms.sourcesOrbit}
            material={mats.sourcesOrbit}
            frustumCulled={false}
          />
          {sourcesPipPositions.map((pos, i) => (
            <mesh
              key={`src-${i}`}
              geometry={geoms.sourcesPip}
              material={mats.sourcesPip}
              position={pos}
              frustumCulled={false}
            />
          ))}
        </group>
      </group>

      {/* Surfaces orbital plane (dawn). */}
      <group ref={surfacesOrbitRef} rotation={[SURFACES_TILT_X, 0, SURFACES_TILT_Z]}>
        <group ref={surfacesSpinRef}>
          <lineLoop
            geometry={geoms.surfacesOrbit}
            material={mats.surfacesOrbit}
            frustumCulled={false}
          />
          <lineSegments
            geometry={geoms.surfacesTags}
            material={mats.surfacesTags}
            frustumCulled={false}
          />
          {surfacesPortPositions.map((pos, i) => (
            <group key={`surf-${i}`} position={pos}>
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
      </group>
    </group>
  );
}
