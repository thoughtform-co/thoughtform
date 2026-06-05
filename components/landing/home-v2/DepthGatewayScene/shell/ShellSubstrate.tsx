"use client";

/**
 * ShellSubstrate — the inside-out layer 1 of the accreted intelligence
 * shell. Wraps the guiding-star brandmark with a golden dodecahedron
 * cage + a fainter dawn geodesic inner shell.
 *
 * PETAL UNFOLD (2026-06-05 revision): the dodecahedron is decomposed
 * into 12 pentagonal face sub-groups. Each face starts COLLAPSED AT
 * THE BRAND MARK CENTER (position 0, scale 0) and unfolds OUTWARD to
 * its final centroid + size with staggered timing — reads as origami
 * petals opening around the mark, not a uniform scale-up of a single
 * cage that grew from a distant point. Faces persist at full deploy
 * through Encode + Build so the layer accumulates around the
 * traveling mark and visually wraps the substrate sphere
 * `SubstrateMorphCloud` at the Build landing.
 *
 * The inner geodesic shell stays as a single uniform-scale group —
 * it's a faint backdrop and doesn't need per-face unfold.
 *
 * Brandmark Principle 4 (`brandmark-choreography` skill): decorations
 * EMERGE geometrically via scale + position lerp, NEVER via opacity.
 * The material's opacity stays constant once the layer is revealed.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLOR_DAWN, COLOR_GOLD } from "@/components/landing/intelligence-artifact/artifactGeom";
import {
  buildGeodesicEdges,
  makeLineMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import {
  buildDodecahedronFaces,
  EMERGE_EPSILON,
  petalEmerge,
  petalStagger,
  SUBSTRATE_DODEC_RADIUS,
  SUBSTRATE_INNER_RADIUS,
  splitEmerge,
} from "./shellGeom";

interface ShellSubstrateProps {
  /** Which accretion layer this component represents. Hard-coded to
   *  `"substrate"` for `ShellSubstrate` but kept explicit so callers
   *  can see the wiring at the shell composition site. */
  layerKey: "substrate";
  /** When true, autonomous spin is disabled. */
  reducedMotion?: boolean;
}

/** Slow spin rate for the dodecahedron cage (radians per second).
 *  Mirrors the standalone `SubstrateBrandmark`'s 0.18 spinRate so the
 *  cage reads as the same living instrument. The spin is applied to
 *  the parent `dodecGroupRef`, NOT to individual face sub-groups, so
 *  the whole assembled cage co-rotates as one body once unfolded. */
const SUBSTRATE_SPIN_RATE = 0.18;

/** Base material opacities at full reveal. Tuned slightly higher than
 *  the standalone artifact (which composites on a black void) because
 *  the corridor's wormhole walls add background noise we have to
 *  read through. */
const DODEC_OPACITY = 0.82;
const INNER_OPACITY = 0.34;

/** Per-face stagger overlap inside the parent substrate reveal window
 *  (see `petalStagger` in shellGeom.ts). 0.55 reads as a cascade
 *  through all 12 faces — neighbouring faces unfold simultaneously
 *  enough that the whole cage emerges as one coherent flower, but
 *  with visible per-face character. */
const SUBSTRATE_FACE_OVERLAP = 0.55;

export function ShellSubstrate({ layerKey, reducedMotion = false }: ShellSubstrateProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const dodecGroupRef = useRef<THREE.Group>(null);
  const innerShellRef = useRef<THREE.Group>(null);
  const faceGroupRefs = useRef<(THREE.Group | null)[]>([]);

  // ── Per-face descriptors + pentagon line-loop geometries ────────

  const faces = useMemo(() => buildDodecahedronFaces(SUBSTRATE_DODEC_RADIUS), []);

  const faceGeoms = useMemo(() => {
    return faces.map((face) => {
      // Pentagon outline in face-local space. The 5 vertices already
      // sit in the face plane (their offsets from the centroid encode
      // the face's orientation), so no rotation is needed — placing
      // the parent sub-group at `position = centroid` paints the
      // pentagon in its correct world position + orientation.
      const positions = new Float32Array(face.localVertices.length * 3);
      face.localVertices.forEach((v, i) => {
        positions[i * 3] = v[0];
        positions[i * 3 + 1] = v[1];
        positions[i * 3 + 2] = v[2];
      });
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      return geom;
    });
  }, [faces]);

  const innerEdges = useMemo(() => buildGeodesicEdges(SUBSTRATE_INNER_RADIUS, 1), []);

  // ── Materials (shared across all 12 faces; only one draw setup) ──

  const dodecMat = useMemo(() => makeLineMaterial(COLOR_GOLD, DODEC_OPACITY, true), []);
  const innerMat = useMemo(() => makeLineMaterial(COLOR_DAWN, INNER_OPACITY, false), []);

  useEffect(() => {
    return () => {
      faceGeoms.forEach((g) => g.dispose());
      innerEdges.dispose();
      dodecMat.dispose();
      innerMat.dispose();
    };
  }, [faceGeoms, innerEdges, dodecMat, innerMat]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).substrate;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // ── Per-face petal unfold ───────────────────────────────────
    // Each face's sub-group starts at world origin (collapsed to the
    // brand mark center) and travels to its final centroid as its
    // staggered reveal ramps. Scale ramps in lock-step so the face
    // never appears at full size at the wrong position.
    for (let i = 0; i < faces.length; i++) {
      const faceGroup = faceGroupRefs.current[i];
      if (!faceGroup) continue;
      const stagger = petalStagger(reveal, i, faces.length, SUBSTRATE_FACE_OVERLAP);
      const { scale, positionT } = petalEmerge(stagger);
      if (scale <= EMERGE_EPSILON) {
        faceGroup.visible = false;
        continue;
      }
      faceGroup.visible = true;
      const c = faces[i].centroid;
      faceGroup.position.set(c[0] * positionT, c[1] * positionT, c[2] * positionT);
      faceGroup.scale.setScalar(scale);
    }

    // Slow spin on the assembled dodec — once enough faces have
    // unfolded the cage reads as a single rotating body. Applied to
    // the parent `dodecGroupRef` so all faces rotate together.
    if (dodecGroupRef.current && !reducedMotion) {
      dodecGroupRef.current.rotation.y += SUBSTRATE_SPIN_RATE * delta;
    }

    // Inner geodesic uses the legacy uniform-scale emerge — it's a
    // faint backdrop and doesn't benefit from per-face petal motion,
    // but it still needs to grow with the parent reveal so it doesn't
    // pop in at full size while the petals are still mid-unfold.
    if (innerShellRef.current) {
      innerShellRef.current.scale.setScalar(splitEmerge(reveal));
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={dodecGroupRef}>
        {faces.map((_, i) => (
          <group
            key={`face-${i}`}
            ref={(node) => {
              faceGroupRefs.current[i] = node;
            }}
            visible={false}
          >
            <lineLoop geometry={faceGeoms[i]} material={dodecMat} frustumCulled={false} />
          </group>
        ))}
      </group>
      <group ref={innerShellRef}>
        <lineSegments geometry={innerEdges} material={innerMat} frustumCulled={false} />
      </group>
    </group>
  );
}
