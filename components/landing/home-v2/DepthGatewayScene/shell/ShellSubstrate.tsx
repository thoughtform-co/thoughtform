"use client";

/**
 * ShellSubstrate — the inside-out layer 1 of the accreted intelligence
 * shell. Wraps the guiding-star brandmark with a single GOLD geodesic
 * icosphere cage — the Shell-variant substrate read, without the
 * fainter dawn / white inner geodesic.
 *
 * EVOLUTION:
 *   - 2026-06-05 lab-match revision: 12-face dodecahedron cage →
 *     80-face gold geodesic icosphere + dawn inner geodesic.
 *   - 2026-06-06 wrap-around revision (Phase 2): dropped the dawn
 *     inner geodesic.
 *   - 2026-06-06: brain-artifact experiments moved to the lab
 *     (`/test/intelligence-artifact`) and the homepage returned to
 *     the Shell variant's cleaner gold outer shell only. This avoids
 *     the homepage having two competing "brain / interface" reads
 *     while preserving the exploratory variants in the lab.
 *
 * EMERGE: `shellWrapEmerge(reveal)` on the whole geodesic group — the
 * shell starts large, already surrounding the mark, and contracts
 * inward to its final radius. It never scales up from a point at the
 * centre / grows through the brandmark.
 *
 * PERSISTS through Encode + Build so the substrate shell accumulates
 * around the traveling mark and, at the Build climax, remains part
 * of the assembled artifact around the persistent DOM brandmark
 * (`ProjectedBrandmarkActor`).
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLOR_GOLD } from "@/components/landing/intelligence-artifact/artifactGeom";
import {
  buildGeodesicEdges,
  makeLineMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import { EMERGE_EPSILON, SUBSTRATE_CAGE_RADIUS, shellWrapEmerge } from "./shellGeom";

interface ShellSubstrateProps {
  /** Which accretion layer this component represents. Hard-coded to
   *  `"substrate"` for `ShellSubstrate` but kept explicit so callers
   *  can see the wiring at the shell composition site. */
  layerKey: "substrate";
  /** When true, autonomous spin is disabled. */
  reducedMotion?: boolean;
}

/** Slow spin rate for the shell (radians per second). Same cadence as
 *  the earlier Shell variant so the cage reads as a living instrument
 *  without becoming visually dizzying. */
const SUBSTRATE_SPIN_RATE = 0.18;

/** Shell material opacity at full presence. Kept warm and legible
 *  against the corridor walls, but sparse enough that the brandmark
 *  remains the clear centre. */
const SHELL_OPACITY = 0.82;

/** Outer geodesic detail level. `1` matches the Shell variant's
 *  classic 80-face geodesic: engineered, but not dense. */
const SUBSTRATE_OUTER_DETAIL = 1;

export function ShellSubstrate({ layerKey, reducedMotion = false }: ShellSubstrateProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const shellGroupRef = useRef<THREE.Group>(null);

  // ── Geometry: Shell-variant outer gold geodesic only ────────────

  const shellEdges = useMemo(
    () => buildGeodesicEdges(SUBSTRATE_CAGE_RADIUS, SUBSTRATE_OUTER_DETAIL),
    []
  );

  // ── Materials ──────────────────────────────────────────────────

  const shellMat = useMemo(() => makeLineMaterial(COLOR_GOLD, 0, true), []);

  useEffect(() => {
    return () => {
      shellEdges.dispose();
      shellMat.dispose();
    };
  }, [shellEdges, shellMat]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      shellMat.opacity = 0;
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).substrate;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      shellMat.opacity = 0;
      return;
    }
    group.visible = true;

    // Shell-wrap emerge: the geodesic starts large, already
    // surrounding the mark, and contracts onto its final radius.
    // This preserves the "wrap from outside" read without introducing
    // another brain-like object on the homepage.
    const { scale, presence } = shellWrapEmerge(reveal);
    group.scale.setScalar(scale);

    shellMat.opacity = SHELL_OPACITY * presence;

    if (shellGroupRef.current && !reducedMotion) {
      shellGroupRef.current.rotation.y += SUBSTRATE_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={shellGroupRef}>
        <lineSegments geometry={shellEdges} material={shellMat} frustumCulled={false} />
      </group>
    </group>
  );
}
