"use client";

/**
 * CorridorArtifact — the home page's accreted-shell composition
 * mounted as a lab variant.
 *
 * The home Build climax wraps the brandmark with three layers:
 *
 *   1. Low-poly brain (substrate)  — `buildLowPolyBrain` mesh +
 *      wireframe + vertex nodes, faded in via `shellWrapEmerge`.
 *   2. Source orbits (sources)     — six inclined elliptical orbits
 *      from `SHELL_ORBITS`, fold-in via `foldEmerge` + `petalStagger`.
 *   3. Outer shell (surfaces)      — pluggable: geodesic / rings /
 *      panels / contour / gem (`outerShells/`).
 *
 * In the lab the same composition is driven by the `progress` scrub
 * via the lab's `PHASES` envelopes instead of the corridor's
 * scroll-driven accretion store. Geometry constants are reused from
 * the production corridor (`shellGeom.ts`, `sampleBrain.ts`) so the
 * lab and the home page render the same shapes — only the driver
 * differs.
 *
 * `LAB_SCALE` lifts the corridor's tight 0.7-radius brain up to the
 * lab camera's preferred ~0.9 substrate read, so the composition
 * fills the lab frame at the same apparent size as the existing
 * variants without retuning every radius.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildLowPolyBrain } from "@/lib/brandmark/sampleBrain";
import { buildTiltedRingLineLoop } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import {
  EMERGE_EPSILON,
  FOLD_OVERSHOOT,
  SHELL_ORBITS,
  type ShellOrbit,
  foldEmerge,
  petalStagger,
  shellWrapEmerge,
} from "@/components/landing/home-v2/DepthGatewayScene/shell/shellGeom";
import { AnchorProjector } from "../AnchorProjector";
import { SubstrateBrandmark } from "../SubstrateBrandmark";
import {
  type ArtifactAnchors,
  COLOR_GOLD,
  COLOR_GOLD_RIM,
  PHASES,
  clamp01,
  phasePresence,
} from "../artifactGeom";
import {
  buildFilledDiamondGeometry,
  makeLineMaterial,
  makeMeshMaterial,
} from "../artifactPrimitives";

export interface CorridorOuterShellProps {
  /** Surfaces-phase reveal [0,1]. Drives `foldEmerge` so the shell
   *  closes around the assembled inner composition. */
  reveal: number;
  /** When true, autonomous spin / animation is disabled. */
  reducedMotion?: boolean;
}

interface CorridorArtifactProps {
  /** Global lab progress in [0, 1]. */
  progress: number;
  /** When true, autonomous motion is damped. */
  reducedMotion?: boolean;
  /** The outer-shell component. Receives `reveal` (surfaces-phase
   *  presence) + `reducedMotion` and is responsible for its own
   *  emerge / spin / disposal. */
  OuterShell: React.ComponentType<CorridorOuterShellProps>;
}

/** Uniform scale applied to the entire corridor composition so the
 *  home page's tight world units (brain max ~0.85, surfaces 1.85)
 *  fill the lab camera at the same apparent size as the canonical
 *  artifact (substrate ~0.92, outer ~2.0). Tuned by eye for the lab
 *  camera at (0, 2.4, 6.2) with FOV 36. */
const LAB_SCALE = 1.2;

/** Anchor points for the leader-line label system (parent-local,
 *  pre-LAB_SCALE). AnchorProjector applies the parent matrix, so
 *  these get the scale automatically. */
const CORRIDOR_ANCHORS: ArtifactAnchors = {
  // A point on the middle source orbit (~10 o'clock face-on).
  sources: [-1.1, 0.55, 0.1],
  // Brain centre.
  substrate: [0, 0, 0],
  // A surface port at ~2 o'clock on the outer shell.
  surfaces: [1.6, 0.18, 0.4],
};

// ── Low-poly brain (substrate layer) ────────────────────────────

interface CorridorBrainProps {
  reveal: number;
  reducedMotion?: boolean;
}

/** Keep the intelligence object calm. The source orbits animate, but
 *  the brain itself should not rotate; otherwise the center feels
 *  dizzying and competes with the moving knowledge layer. */
const BRAIN_SPIN_RATE = 0;
const EDGE_OPACITY = 0.72;
const FACE_OPACITY = 0.07;
const NODE_OPACITY = 0.85;

/** Lab brain: the SAME `buildLowPolyBrain` mesh the home page uses,
 *  rendered with the same three-layer composition (faint facets,
 *  gold edge wireframe, vertex nodes). Driven by the lab's
 *  substrate-phase reveal via `shellWrapEmerge` so the contract-
 *  inward motion mirrors the home page exactly. */
function CorridorBrain({ reveal, reducedMotion = false }: CorridorBrainProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);

  const { faceGeom, edgeGeom, nodeGeom } = useMemo(() => {
    const detail = reducedMotion ? 0 : 1;
    const brain = buildLowPolyBrain({ detail });
    return { faceGeom: brain.faces, edgeGeom: brain.edges, nodeGeom: brain.nodes };
  }, [reducedMotion]);

  const edgeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: COLOR_GOLD,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const faceMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: COLOR_GOLD,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  const nodeMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: COLOR_GOLD_RIM,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        size: 0.03,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    return () => {
      faceGeom.dispose();
      edgeGeom.dispose();
      nodeGeom.dispose();
      edgeMat.dispose();
      faceMat.dispose();
      nodeMat.dispose();
    };
  }, [faceGeom, edgeGeom, nodeGeom, edgeMat, faceMat, nodeMat]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      edgeMat.opacity = 0;
      faceMat.opacity = 0;
      nodeMat.opacity = 0;
      return;
    }
    group.visible = true;
    const { scale, presence } = shellWrapEmerge(reveal);
    group.scale.setScalar(scale);
    edgeMat.opacity = EDGE_OPACITY * presence;
    faceMat.opacity = FACE_OPACITY * presence;
    nodeMat.opacity = NODE_OPACITY * presence;
    if (spinGroupRef.current && !reducedMotion) {
      spinGroupRef.current.rotation.y += BRAIN_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={spinGroupRef}>
        <mesh geometry={faceGeom} material={faceMat} frustumCulled={false} />
        <lineSegments geometry={edgeGeom} material={edgeMat} frustumCulled={false} />
        <points geometry={nodeGeom} material={nodeMat} frustumCulled={false} />
      </group>
    </group>
  );
}

// ── Source orbits (sources layer) ────────────────────────────────

interface CorridorOrbitsProps {
  reveal: number;
  reducedMotion?: boolean;
}

const SOURCES_ORBIT_OVERLAP = 0.6;

/** Mirror of home `pipPositionOnOrbit` — keeps the pip ON the
 *  tilted ellipse path so the orbit reads as a real revolution. */
function pipPositionOnOrbit(orbit: ShellOrbit, parametricRad: number): THREE.Vector3 {
  const lx = orbit.rx * Math.cos(parametricRad);
  const ly = orbit.rx * orbit.eccentricity * Math.sin(parametricRad);
  const euler = new THREE.Euler(orbit.tilt[0], orbit.tilt[1], orbit.tilt[2]);
  return new THREE.Vector3(lx, ly, 0).applyEuler(euler);
}

/** Lab source orbits: the SAME `SHELL_ORBITS` table the home page
 *  uses, with the same `foldEmerge` per-orbit unfold. Each orbit
 *  appears at FOLD_OVERSHOOT (1.45x its final radius) and closes
 *  inward to scale 1.0. */
function CorridorOrbits({ reveal, reducedMotion = false }: CorridorOrbitsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const pipRefs = useRef<(THREE.Mesh | null)[]>([]);

  const ringGeoms = useMemo(
    () => SHELL_ORBITS.map((o) => buildTiltedRingLineLoop(o.rx, o.tilt, 96, o.eccentricity)),
    []
  );

  const pipGeoms = useMemo(
    () => SHELL_ORBITS.map((o) => buildFilledDiamondGeometry(o.pipRadius)),
    []
  );

  const ringMats = useMemo(
    () => SHELL_ORBITS.map((o) => makeLineMaterial(o.color, o.baseAlpha, true)),
    []
  );

  const pipMats = useMemo(
    () => SHELL_ORBITS.map((o) => makeMeshMaterial(o.color, Math.min(1, o.baseAlpha + 0.18))),
    []
  );

  useEffect(() => {
    return () => {
      ringGeoms.forEach((g) => g.dispose());
      pipGeoms.forEach((g) => g.dispose());
      ringMats.forEach((m) => m.dispose());
      pipMats.forEach((m) => m.dispose());
    };
  }, [ringGeoms, pipGeoms, ringMats, pipMats]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;
    const t = reducedMotion ? 0 : clock.elapsedTime;

    for (let i = 0; i < SHELL_ORBITS.length; i++) {
      const orbit = SHELL_ORBITS[i];
      const orbitGroup = orbitGroupRefs.current[i];
      const pip = pipRefs.current[i];
      if (!orbitGroup) continue;

      const stagger = petalStagger(reveal, i, SHELL_ORBITS.length, SOURCES_ORBIT_OVERLAP);
      const { scale } = foldEmerge(stagger);
      if (scale <= EMERGE_EPSILON) {
        orbitGroup.visible = false;
        continue;
      }
      orbitGroup.visible = true;
      orbitGroup.scale.setScalar(scale);

      if (pip) {
        const parametricRad = orbit.phaseRad + orbit.dir * (t / orbit.periodSec) * Math.PI * 2;
        const pos = pipPositionOnOrbit(orbit, parametricRad);
        pip.position.set(pos.x, pos.y, pos.z);
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {SHELL_ORBITS.map((orbit, i) => (
        <group
          key={`orbit-${orbit.id}`}
          ref={(node) => {
            orbitGroupRefs.current[i] = node;
          }}
          visible={false}
        >
          <lineLoop geometry={ringGeoms[i]} material={ringMats[i]} frustumCulled={false} />
          <mesh
            ref={(node) => {
              pipRefs.current[i] = node;
            }}
            geometry={pipGeoms[i]}
            material={pipMats[i]}
            frustumCulled={false}
          />
        </group>
      ))}
    </group>
  );
}

// ── Base component ──────────────────────────────────────────────

export function CorridorArtifact({
  progress,
  reducedMotion = false,
  OuterShell,
}: CorridorArtifactProps) {
  const rootRef = useRef<THREE.Group>(null);
  const labScaleRef = useRef<THREE.Group>(null);

  const p = clamp01(progress);
  const sourcesP = phasePresence(p, PHASES.sources);
  const substrateP = phasePresence(p, PHASES.substrate);
  const surfacesP = phasePresence(p, PHASES.surfaces);
  const resolvedP = phasePresence(p, PHASES.resolved);

  // `FOLD_OVERSHOOT` is touched only so an over-zealous bundler
  // doesn't drop it as unused — the constant is documented as the
  // canonical entry scale and is part of the lab variant's contract
  // with the home composition (any tuning happens in `shellGeom.ts`,
  // not here). The orbits + outer shell consume it internally
  // through `foldEmerge`.
  void FOLD_OVERSHOOT;

  return (
    <group ref={rootRef}>
      <ambientLight intensity={0.32} />
      <group ref={labScaleRef} scale={LAB_SCALE}>
        {/* Substrate nucleus (lab brandmark cloud, no extra geodesic —
            the brain mesh IS the substrate skin here). */}
        <SubstrateBrandmark
          presence={substrateP}
          resolved={resolvedP}
          reducedMotion={reducedMotion}
          spinRate={0}
          showInnerShell={false}
          showOuterShell={false}
        />

        {/* Layer 1 — low-poly brain (substrate). */}
        <CorridorBrain reveal={substrateP} reducedMotion={reducedMotion} />

        {/* Layer 2 — source orbits (sources / Encode). */}
        <CorridorOrbits reveal={sourcesP} reducedMotion={reducedMotion} />

        {/* Layer 3 — pluggable outer shell (surfaces / Build). */}
        <OuterShell reveal={surfacesP} reducedMotion={reducedMotion} />
      </group>

      <AnchorProjector anchors={CORRIDOR_ANCHORS} trackGroupRef={labScaleRef} />
    </group>
  );
}
