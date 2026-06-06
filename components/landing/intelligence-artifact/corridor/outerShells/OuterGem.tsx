"use client";

/**
 * OuterGem — outer shell as a single elongated hexagonal bipyramid:
 * 6 equator vertices + 2 vertical apex points. Renders as 12
 * lateral edges + 6 equator edges with a faint facet fill. The
 * six equator vertices ARE the port pips — they sit on the corners
 * of the crystal, reinforcing the gem read.
 *
 * Distinct from the brain's many small organic facets: this shape
 * has a few large crisp angular facets instead, so the two layers
 * contrast structurally.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  EMERGE_EPSILON,
  foldEmerge,
} from "@/components/landing/home-v2/DepthGatewayScene/shell/shellGeom";
import { COLOR_SURFACES } from "../../artifactGeom";
import { makeLineMaterial, makeMeshMaterial } from "../../artifactPrimitives";
import type { CorridorOuterShellProps } from "../CorridorArtifact";
import { OUTER_SHELL_RADIUS, OUTER_SHELL_SPIN_RATE, OUTER_SHELL_TILT_Y } from "./shared";

const EQUATOR_VERTICES = 6;
/** Vertical elongation — apex Y as a multiple of the equator radius.
 *  >1 reads as a crystal pointed top/bottom; ~1 reads as an
 *  octahedron. 1.45 is a sweet spot for "gem". */
const APEX_ELONGATION = 1.45;

const EDGE_OPACITY = 0.82;
const FACE_OPACITY = 0.06;

/** Build the bipyramid as a wireframe (edges) + filled facets (12
 *  triangles) sharing the same vertices. */
function buildBipyramid(equatorRadius: number, apexY: number) {
  const equatorPts: THREE.Vector3[] = [];
  for (let i = 0; i < EQUATOR_VERTICES; i++) {
    const a = (i / EQUATOR_VERTICES) * Math.PI * 2;
    equatorPts.push(new THREE.Vector3(Math.cos(a) * equatorRadius, 0, Math.sin(a) * equatorRadius));
  }
  const apexTop = new THREE.Vector3(0, apexY, 0);
  const apexBot = new THREE.Vector3(0, -apexY, 0);

  // Edges: lateral (each equator vertex to both apices) + equator
  // perimeter.
  const edgePositions: number[] = [];
  for (const p of equatorPts) {
    edgePositions.push(p.x, p.y, p.z, apexTop.x, apexTop.y, apexTop.z);
    edgePositions.push(p.x, p.y, p.z, apexBot.x, apexBot.y, apexBot.z);
  }
  for (let i = 0; i < EQUATOR_VERTICES; i++) {
    const a = equatorPts[i];
    const b = equatorPts[(i + 1) % EQUATOR_VERTICES];
    edgePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  const edges = new THREE.BufferGeometry();
  edges.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));

  // Facet fills: 12 triangles (each equator pair + each apex).
  const facePositions: number[] = [];
  for (let i = 0; i < EQUATOR_VERTICES; i++) {
    const a = equatorPts[i];
    const b = equatorPts[(i + 1) % EQUATOR_VERTICES];
    facePositions.push(a.x, a.y, a.z, b.x, b.y, b.z, apexTop.x, apexTop.y, apexTop.z);
    facePositions.push(a.x, a.y, a.z, apexBot.x, apexBot.y, apexBot.z, b.x, b.y, b.z);
  }
  const faces = new THREE.BufferGeometry();
  faces.setAttribute("position", new THREE.Float32BufferAttribute(facePositions, 3));
  faces.computeVertexNormals();

  return { edges, faces, equatorPts };
}

export function OuterGem({ reveal, reducedMotion = false }: CorridorOuterShellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);

  const { edges, faces } = useMemo(
    () => buildBipyramid(OUTER_SHELL_RADIUS, OUTER_SHELL_RADIUS * APEX_ELONGATION),
    []
  );

  const edgeMat = useMemo(() => makeLineMaterial(COLOR_SURFACES, EDGE_OPACITY, false), []);
  const faceMat = useMemo(() => makeMeshMaterial(COLOR_SURFACES, FACE_OPACITY), []);

  useEffect(() => {
    return () => {
      edges.dispose();
      faces.dispose();
      edgeMat.dispose();
      faceMat.dispose();
    };
  }, [edges, faces, edgeMat, faceMat]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;
    group.scale.setScalar(foldEmerge(reveal).scale);

    if (spinGroupRef.current && !reducedMotion) {
      spinGroupRef.current.rotation.y += OUTER_SHELL_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={spinGroupRef} rotation={[0, OUTER_SHELL_TILT_Y, 0]}>
        <mesh geometry={faces} material={faceMat} frustumCulled={false} />
        <lineSegments geometry={edges} material={edgeMat} frustumCulled={false} />
      </group>
    </group>
  );
}
