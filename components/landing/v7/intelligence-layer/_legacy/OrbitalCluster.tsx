"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CLUSTER_DIAMOND_OPACITY,
  CLUSTER_DUST_COLOR,
  CLUSTER_DUST_COUNT,
  CLUSTER_DUST_OPACITY,
  CLUSTER_DUST_SIZE_PX,
  CLUSTER_RING_OPACITIES,
  CLUSTER_RING_RADII,
  DIAMOND_SIZE,
  RING_SEGMENTS,
  clamp01,
  clusterRingResolve,
  orbitEmerge,
  splitEnvelope,
} from "../intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

/**
 * OrbitalCluster — one pillar of the orbital triad (ADR-014 v5).
 *
 * Renders a clean futuristic celestial-diagram cluster at a fixed
 * scene position:
 *
 *   - 5 concentric hairline rings (gold, opacity-tapered from outer
 *     to inner — see `CLUSTER_RING_OPACITIES`)
 *   - 4 cardinal diamond markers on the outermost ring
 *   - `CLUSTER_DUST_COUNT` luminous dust dots scattered on the
 *     mid-stack rings (deterministic positions; no per-cluster
 *     randomness, so all three clusters read the same)
 *
 * No fill, no glow filter, no atmospheric halo — the "clean and
 * futuristic" register the user picked over the previous brandmark
 * atmosphere field. Pure linework + diamond markers + sparse dust.
 *
 * Two scalar inputs drive the cluster's per-frame state:
 *
 *   - `presence` (0-1): overall multiplier — drives the cluster's
 *     arrival via the section-scroll `orbitEmerge()` envelope. 0 =
 *     completely invisible (mesh visible flag flips off); 1 = full
 *     ring stack at the per-ring base opacities.
 *
 *   - `resolveProgress` (0-1): drives the per-ring stagger — the
 *     outermost ring (which the SplitRing handed off into) is
 *     present at resolveProgress 0; each subsequent inner ring fades
 *     in with a small stagger via `clusterRingResolve`. Diamonds and
 *     dust resolve alongside the outermost ring + 1.
 *
 * The mid cluster's `stagger` is 0 (leads); side clusters get a
 * small positive stagger so the eye reads "centre first, then sides
 * flowering" — same Principle 4 grammar as ADR-013 (geometric
 * emergence, never opacity fades for primary instruments) but the
 * resolve ramp is sub-element opacity, not artefact-level fade. The
 * artefact-level fade is owned by `presence` (a single shared scroll
 * envelope), so all three clusters arrive + retract together.
 */

export interface OrbitalClusterProps {
  /** Scene-space centre. */
  centre: readonly [number, number, number];
  /** Outer-ring radius in scene units. The other rings are sized as
   *  fractions of this via `CLUSTER_RING_RADII`. */
  radius: number;
  /** Per-cluster stagger offset (added to the resolve scalar). Mid
   *  cluster leads with stagger 0; side clusters get a small positive
   *  delay so the eye reads "centre first, then sides flowering". */
  stagger: number;
}

/** Build a hairline ring as `THREE.LineLoop` of `RING_SEGMENTS`
 *  vertices around a circle of `radius` in the XY plane. Local to
 *  this module so cluster geometry stays self-contained. */
function buildRingGeometry(radius: number): THREE.BufferGeometry {
  const positions = new Float32Array(RING_SEGMENTS * 3);
  for (let i = 0; i < RING_SEGMENTS; i++) {
    const t = (i / RING_SEGMENTS) * Math.PI * 2;
    positions[i * 3] = Math.cos(t) * radius;
    positions[i * 3 + 1] = Math.sin(t) * radius;
    positions[i * 3 + 2] = 0;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geom;
}

/** Build a 4-vertex `LineLoop` diamond (rotated square). */
function buildDiamondGeometry(size: number): THREE.BufferGeometry {
  const positions = new Float32Array([0, size, 0, size, 0, 0, 0, -size, 0, -size, 0, 0]);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geom;
}

/** Deterministic dust positions around the cluster. The dust sits on
 *  the inner three rings (indices 1, 2, 3 of `CLUSTER_RING_RADII`),
 *  evenly distributed around each ring with a small angular offset
 *  per ring so the dots don't line up radially. Returns a flat
 *  Float32Array (x, y, z per dot). */
function buildDustPositions(radius: number): Float32Array {
  const positions = new Float32Array(CLUSTER_DUST_COUNT * 3);
  for (let i = 0; i < CLUSTER_DUST_COUNT; i++) {
    // Distribute dust across rings 1, 2, 3 (skip outermost + innermost)
    const ringIdx = 1 + (i % 3);
    const ringRadius = radius * CLUSTER_RING_RADII[ringIdx];
    // Angular position — even distribution within each ring's
    // dust subset, plus a per-ring offset so the dots don't form
    // radial spokes.
    const perRingCount = CLUSTER_DUST_COUNT / 3;
    const indexInRing = Math.floor(i / 3);
    const angle =
      (indexInRing / perRingCount) * Math.PI * 2 + (ringIdx * Math.PI) / CLUSTER_DUST_COUNT;
    positions[i * 3] = Math.cos(angle) * ringRadius;
    positions[i * 3 + 1] = Math.sin(angle) * ringRadius;
    positions[i * 3 + 2] = 0;
  }
  return positions;
}

interface ClusterHandles {
  rings: THREE.LineLoop[];
  ringMaterials: THREE.LineBasicMaterial[];
  diamondGroup: THREE.Group;
  diamondMaterial: THREE.LineBasicMaterial;
  dustPoints: THREE.Points;
  dustMaterial: THREE.PointsMaterial;
}

export function OrbitalCluster({ centre, radius, stagger }: OrbitalClusterProps) {
  const groupRef = useRef<THREE.Group>(null);

  const handles = useMemo<ClusterHandles>(() => {
    // Five concentric rings — outer to inner, per CLUSTER_RING_RADII.
    const rings: THREE.LineLoop[] = [];
    const ringMaterials: THREE.LineBasicMaterial[] = [];
    for (let i = 0; i < CLUSTER_RING_RADII.length; i++) {
      const ringRadius = radius * CLUSTER_RING_RADII[i];
      const mat = new THREE.LineBasicMaterial({
        color: "#caa554",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const ring = new THREE.LineLoop(buildRingGeometry(ringRadius), mat);
      rings.push(ring);
      ringMaterials.push(mat);
    }

    // Four cardinal diamonds on the outermost ring.
    const diamondGroup = new THREE.Group();
    const diamondGeom = buildDiamondGeometry(DIAMOND_SIZE);
    const diamondMat = new THREE.LineBasicMaterial({
      color: "#caa554",
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const outerRadius = radius * CLUSTER_RING_RADII[0];
    for (const angleDeg of [0, 90, 180, 270]) {
      const t = Math.PI / 2 - (angleDeg * Math.PI) / 180;
      const diamond = new THREE.LineLoop(diamondGeom, diamondMat);
      diamond.position.set(Math.cos(t) * outerRadius, Math.sin(t) * outerRadius, 0);
      diamondGroup.add(diamond);
    }

    // Dust dots scattered across the inner rings.
    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute("position", new THREE.BufferAttribute(buildDustPositions(radius), 3));
    const dustMat = new THREE.PointsMaterial({
      color: CLUSTER_DUST_COLOR,
      size: CLUSTER_DUST_SIZE_PX,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeom, dustMat);

    return {
      rings,
      ringMaterials,
      diamondGroup,
      diamondMaterial: diamondMat,
      dustPoints,
      dustMaterial: dustMat,
    };
  }, [radius]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    // Read the journey transform once per frame. ringsActive +
    // ringProgress are the substrate scroll window's channels;
    // `orbitEmerge()` gives the section-scroll envelope and
    // `splitEnvelope()` decomposes the substrate progress into the
    // HANDOFF / SPLIT / RESOLVE phase scalars.
    const transform = useBrandmarkJourneyStore.getState().transform;
    if (!transform.ringsActive) {
      if (group.visible) group.visible = false;
      return;
    }

    const presence = clamp01(orbitEmerge(transform.ringProgress));
    if (presence <= 0.001) {
      if (group.visible) group.visible = false;
      return;
    }
    if (!group.visible) group.visible = true;

    const phases = splitEnvelope(transform.ringProgress);

    // Outer ring (index 0): driven by SPLIT phase — the SplitRing's
    // arc-to-ring morph has landed at the cluster's outermost ring
    // radius by the time SPLIT ends, so this scalar crossfades the
    // cluster's outer ring in as the SplitRing fades out.
    //
    // Inner rings (index 1-4): driven by RESOLVE phase × per-ring
    // stagger — cascade in once the SPLIT crossfade is finished so
    // the cluster "blooms inward" rather than appearing all at once.
    const outerClamped = clamp01(phases.split);
    const resolveClamped = clamp01(phases.resolve);
    for (let i = 0; i < handles.rings.length; i++) {
      const baseOpacity = CLUSTER_RING_OPACITIES[i];
      const ringScalar = i === 0 ? outerClamped : clusterRingResolve(resolveClamped, i, stagger);
      handles.ringMaterials[i].opacity = baseOpacity * ringScalar * presence;
    }

    // Cardinal diamonds — resolve alongside the outermost ring (read
    // as part of the outer rim's signal). Driven by SPLIT phase so
    // they arrive synchronously with the crossfade.
    handles.diamondMaterial.opacity = CLUSTER_DIAMOND_OPACITY * outerClamped * presence;

    // Dust dots — resolve mid-cascade so they read as the cluster's
    // "atmosphere arriving" after the geometric scaffold is in place.
    const dustScalar = clusterRingResolve(resolveClamped, 2, stagger);
    handles.dustMaterial.opacity = CLUSTER_DUST_OPACITY * dustScalar * presence;
  });

  // Cleanup geometries + materials on unmount.
  useEffect(() => {
    return () => {
      handles.rings.forEach((ring) => {
        ring.geometry.dispose();
      });
      handles.ringMaterials.forEach((mat) => mat.dispose());
      const firstDiamond = handles.diamondGroup.children[0] as THREE.LineLoop | undefined;
      if (firstDiamond) firstDiamond.geometry.dispose();
      handles.diamondMaterial.dispose();
      handles.dustPoints.geometry.dispose();
      handles.dustMaterial.dispose();
    };
  }, [handles]);

  return (
    <group ref={groupRef} position={[centre[0], centre[1], centre[2]]}>
      {handles.rings.map((ring, i) => (
        <primitive key={`ring-${i}`} object={ring} />
      ))}
      <primitive object={handles.diamondGroup} />
      <primitive object={handles.dustPoints} />
    </group>
  );
}
