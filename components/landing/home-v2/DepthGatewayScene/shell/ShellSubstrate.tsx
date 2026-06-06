"use client";

/**
 * ShellSubstrate — the inside-out layer 1 of the accreted intelligence
 * shell. Wraps the guiding-star brandmark with an abstract BRAIN
 * artifact: a procedural two-hemisphere point cloud with sulci
 * displacement + faint synapse links.
 *
 * EVOLUTION:
 *   - 2026-06-05 lab-match revision: 12-face dodecahedron cage →
 *     80-face gold geodesic icosphere + dawn inner geodesic.
 *   - 2026-06-06 wrap-around revision (Phase 2): dropped the dawn
 *     inner geodesic so only the gold cage carried the substrate.
 *   - 2026-06-06 wrap-around revision (Phase 5, this file): swapped
 *     the geodesic cage for the BRAIN ARTIFACT. The substrate layer
 *     of the "Navigate the intelligence" choreography now reads as
 *     the THING the user is navigating (an intelligence) rather than
 *     a generic geodesic shell. Renders as `THREE.Points` plus a
 *     sparse `LineSegments` synapse network, both with additive gold
 *     dots / hairlines.
 *
 * EMERGE: `foldEmerge(reveal).scale` on the whole brain group — the
 * artifact appears OVERSIZED (FOLD_OVERSHOOT ~ 1.45x) and closes in
 * to scale 1.0, wrapping the mark from outside (brandmark
 * Principle 4 — geometric, not opacity).
 *
 * PERSISTS through Encode + Build so the brain accumulates around the
 * traveling mark and visually wraps the substrate sphere at the
 * Build climax (`TravelingBrandmarkCloud`'s morph endpoint).
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildSynapseLinks, sampleBrainPoints } from "@/lib/brandmark/sampleBrain";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import { brainCloudFragment, brainCloudVertex } from "../shaders/brainCloud";
import { EMERGE_EPSILON, foldEmerge } from "./shellGeom";

interface ShellSubstrateProps {
  /** Which accretion layer this component represents. Hard-coded to
   *  `"substrate"` for `ShellSubstrate` but kept explicit so callers
   *  can see the wiring at the shell composition site. */
  layerKey: "substrate";
  /** When true, autonomous spin is disabled. */
  reducedMotion?: boolean;
}

/** Slow spin rate for the brain (radians per second). Same value the
 *  retired geodesic cage used so the artifact reads as a living
 *  instrument at the same cadence as the rest of the corridor. */
const BRAIN_SPIN_RATE = 0.18;

/** Brain point budget. Picked so the cloud reads as a solid brain
 *  shape at parked viewing distance without saturating the GPU on
 *  mobile (where this layer paints alongside the source orbits +
 *  surfaces skin + wormhole walls). */
const BRAIN_POINT_COUNT = 1800;
const BRAIN_POINT_COUNT_MOBILE = 900;

/** Synapse link count. Sparse — ~25-30% of point count gives the
 *  "neural network" texture without crowding the silhouette. */
const SYNAPSE_LINK_COUNT = 480;
const SYNAPSE_LINK_COUNT_MOBILE = 220;

/** Brain bounding-box hints (must agree with `sampleBrainPoints`'s
 *  defaults). Used to set `boundingSphere` so frustum culling +
 *  picking work even though we disable culling for safety on the
 *  emerge frames. */
const BRAIN_BOUND_RADIUS = 0.55;

/** Material colors / opacities. Tuned so the brain reads brightly at
 *  the corridor's typical viewing distance (camera ~6.2 units back
 *  during the Navigate park) without blowing out the wormhole walls
 *  behind it. */
const COLOR_BODY = new THREE.Color("#caa554");
const COLOR_RIM = new THREE.Color("#e9c97a");
const POINT_OPACITY = 0.95;
const SYNAPSE_OPACITY = 0.28;

export function ShellSubstrate({ layerKey, reducedMotion = false }: ShellSubstrateProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);

  // ── Geometry: brain points + synapse links ─────────────────────

  const { pointGeom, lineGeom } = useMemo(() => {
    const pointCount = reducedMotion ? BRAIN_POINT_COUNT_MOBILE : BRAIN_POINT_COUNT;
    const linkCount = reducedMotion ? SYNAPSE_LINK_COUNT_MOBILE : SYNAPSE_LINK_COUNT;

    const brain = sampleBrainPoints({ count: pointCount, seed: 1 });

    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(brain.positions, 3));
    pg.setAttribute("aSeed", new THREE.BufferAttribute(brain.seeds, 1));
    pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), BRAIN_BOUND_RADIUS);

    const synapses = buildSynapseLinks({
      positions: brain.positions,
      count: brain.count,
      linkCount,
    });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(synapses, 3));
    lg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), BRAIN_BOUND_RADIUS);

    return { pointGeom: pg, lineGeom: lg };
  }, [reducedMotion]);

  // ── Materials ──────────────────────────────────────────────────

  const pointMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: brainCloudVertex,
      fragmentShader: brainCloudFragment,
      uniforms: {
        uTime: { value: 0 },
        uPointSize: { value: 5.0 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uPresence: { value: 0 },
        uColor: { value: COLOR_BODY.clone() },
        uRimColor: { value: COLOR_RIM.clone() },
        uOpacity: { value: POINT_OPACITY },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: COLOR_BODY.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    return () => {
      pointGeom.dispose();
      lineGeom.dispose();
      pointMat.dispose();
      lineMat.dispose();
    };
  }, [pointGeom, lineGeom, pointMat, lineMat]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      pointMat.uniforms.uPresence.value = 0;
      lineMat.opacity = 0;
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).substrate;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      pointMat.uniforms.uPresence.value = 0;
      lineMat.opacity = 0;
      return;
    }
    group.visible = true;

    // Wrap-around emerge: the brain appears OVERSIZED (FOLD_OVERSHOOT
    // ~ 1.45x its final radius, clearly outside the mark) and closes
    // in to scale 1.0. Reads as the artifact folding around the mark
    // from outside rather than expanding through it from the centre.
    const { scale } = foldEmerge(reveal);
    group.scale.setScalar(scale);

    // Per-frame uniforms. Twinkle is driven by clock time so the
    // brain feels alive even when the user parks the corridor.
    pointMat.uniforms.uTime.value = state.clock.elapsedTime;
    pointMat.uniforms.uPixelRatio.value = state.viewport.dpr;
    pointMat.uniforms.uPresence.value = 1;

    // Synapse links opacity comes up with the reveal — the brain's
    // BODY (the points) does NOT fade (Principle 4); the synapse
    // hairlines are decoration outside the silhouette and ride a
    // gentle ramp so they don't pop in at scale 1.45. Capped at
    // SYNAPSE_OPACITY so they stay faint enough to read as texture
    // rather than competing with the source orbits at Encode.
    const linkReveal = reveal < 0.4 ? reveal / 0.4 : 1;
    lineMat.opacity = SYNAPSE_OPACITY * linkReveal;

    if (spinGroupRef.current && !reducedMotion) {
      spinGroupRef.current.rotation.y += BRAIN_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={spinGroupRef}>
        <points geometry={pointGeom} material={pointMat} frustumCulled={false} />
        <lineSegments geometry={lineGeom} material={lineMat} frustumCulled={false} />
      </group>
    </group>
  );
}
