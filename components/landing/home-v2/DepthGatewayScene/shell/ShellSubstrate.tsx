"use client";

/**
 * ShellSubstrate — the inside-out layer 1 of the accreted intelligence
 * shell. Wraps the guiding-star brandmark with an abstract LOW-POLY
 * BRAIN artifact: a deformed icosahedron rendered as a gold wireframe
 * with faint facet fills and small vertex nodes.
 *
 * EVOLUTION:
 *   - 2026-06-05 lab-match revision: 12-face dodecahedron cage →
 *     80-face gold geodesic icosphere + dawn inner geodesic.
 *   - 2026-06-06 wrap-around revision (Phase 2): dropped the dawn
 *     inner geodesic.
 *   - 2026-06-06 wrap-around revision (Phase 5): swapped the geodesic
 *     cage for a BRAIN ARTIFACT — first as a dense point cloud +
 *     synapse web.
 *   - 2026-06-06 low-poly revision (this file): the dense point
 *     cloud read as busy. Replaced with a LOW-POLY MESH — an
 *     icosahedron (detail 1, 80 faces) deformed into a brain
 *     (ellipsoid + central fissure + lobing noise, see
 *     `buildLowPolyBrain`) and rendered as a wireframe + faint
 *     facets + vertex nodes. Minimalistic "reduce the polygon count
 *     in Cinema 4D" read, sized a touch larger.
 *
 * EMERGE: `shellWrapEmerge(reveal)` on the whole brain group — the
 * shell ONLY EVER CONTRACTS INWARD. It starts LARGE (scale 1.85x,
 * already surrounding the mark) and closes down onto its final
 * radius (scale 1.0), so it wraps the mark from outside in 3D like
 * a shell closing around it — it NEVER scales up from a point at
 * the centre / grows through the mark. The large starting shell is
 * brought in via a brief presence (opacity) ramp so it doesn't pop;
 * the brain is a substrate-layer decoration, not the brandmark
 * silhouette (which is the DOM glyph and never fades here).
 *
 * PERSISTS through Encode + Build so the brain accumulates around the
 * traveling mark and, at the Build climax, wraps the persistent DOM
 * brandmark (`ProjectedBrandmarkActor`) at the centre — the previous
 * particle substrate sphere was removed (2026-06-06), the 2D SVG
 * mark stays consistent across all three phases.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildLowPolyBrain } from "@/lib/brandmark/sampleBrain";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import { EMERGE_EPSILON, shellWrapEmerge } from "./shellGeom";

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

/** Icosahedron subdivision for the low-poly brain. 1 = 80 faces —
 *  the low-poly sweet spot (faceted + readable, not a dense sphere).
 *  Mobile drops to 0 (20 faces) for an even cleaner / cheaper read. */
const BRAIN_DETAIL = 1;
const BRAIN_DETAIL_MOBILE = 0;

/** Brain bounding-box hint. Must contain the brain (max radius ~0.85)
 *  at the SHELL_WRAP_START_SCALE (1.85x) so frustum culling never
 *  clips the contract-in frames. Geometry is mounted with
 *  `frustumCulled={false}` anyway, but the sphere keeps any future
 *  culling honest. */
const BRAIN_BOUND_RADIUS = 1.7;

const COLOR_BODY = new THREE.Color("#caa554");
const COLOR_RIM = new THREE.Color("#e9c97a");

/** Edge wireframe opacity at full presence — the primary read. */
const EDGE_OPACITY = 0.72;
/** Facet fill opacity — very faint, just enough to give the wireframe
 *  a sense of solid body without filling in the minimalist look. */
const FACE_OPACITY = 0.07;
/** Vertex node opacity — small accent dots at the polygon corners. */
const NODE_OPACITY = 0.85;

export function ShellSubstrate({ layerKey, reducedMotion = false }: ShellSubstrateProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);

  // ── Geometry: low-poly brain (faces + edges + vertex nodes) ─────

  const { faceGeom, edgeGeom, nodeGeom } = useMemo(() => {
    const detail = reducedMotion ? BRAIN_DETAIL_MOBILE : BRAIN_DETAIL;
    const brain = buildLowPolyBrain({ detail });
    const bound = new THREE.Sphere(new THREE.Vector3(0, 0, 0), BRAIN_BOUND_RADIUS);
    brain.faces.boundingSphere = bound.clone();
    brain.edges.boundingSphere = bound.clone();
    brain.nodes.boundingSphere = bound.clone();
    return { faceGeom: brain.faces, edgeGeom: brain.edges, nodeGeom: brain.nodes };
  }, [reducedMotion]);

  // ── Materials ──────────────────────────────────────────────────

  const edgeMat = useMemo(
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

  const faceMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: COLOR_BODY.clone(),
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
        color: COLOR_RIM.clone(),
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

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      edgeMat.opacity = 0;
      faceMat.opacity = 0;
      nodeMat.opacity = 0;
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).substrate;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      edgeMat.opacity = 0;
      faceMat.opacity = 0;
      nodeMat.opacity = 0;
      return;
    }
    group.visible = true;

    // Shell-wrap emerge: the brain ONLY EVER CONTRACTS INWARD. It
    // starts LARGE (scale 1.85x, already surrounding the mark) and
    // closes onto its final radius (scale 1.0), so it wraps the mark
    // from outside like a shell closing around it — it never scales
    // up from a point at the centre / grows through the mark. The
    // large starting shell is faded in via `presence` so it doesn't
    // pop.
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
