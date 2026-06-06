/**
 * sampleBrain — procedural LOW-POLY brain geometry.
 *
 * Phase 5 of the 2026-06-06 wrap-around revision (ADR-018), revised
 * 2026-06-06 to a low-poly faceted mesh on user feedback (the prior
 * dense point cloud + synapse web read as busy; the request was for
 * something more minimalistic — "low poly, like reducing the polygon
 * count in Cinema 4D").
 *
 * `buildLowPolyBrain` takes a low-detail icosahedron and deforms it
 * into a brain-like form:
 *
 *   - ELLIPSOID — scaled longer front-to-back (Z) than tall (Y) or
 *     wide (X), the rough proportion of a brain.
 *   - LONGITUDINAL FISSURE — vertices near the top centreline
 *     (x ≈ 0, y > 0, running along Z) are pulled down + splayed
 *     outward, carving the groove that separates the two
 *     hemispheres. This is the single strongest "brain" cue.
 *   - LOBING NOISE — a low-frequency deterministic displacement
 *     along each vertex normal so the surface gently bulges rather
 *     than reading as a clean ellipsoid.
 *
 * Returns three buffer geometries so the painter can composite the
 * classic low-poly look:
 *   - `faces`  — the deformed mesh (with normals) for faint facet fills
 *   - `edges`  — `EdgesGeometry` wireframe (the primary read)
 *   - `nodes`  — deduplicated vertex positions for small accent dots
 *
 * The builders are PURE (deterministic for a given option set).
 */

import * as THREE from "three";

export interface LowPolyBrainOptions {
  /** Icosahedron subdivision. 0 = 20 faces (very crude), 1 = 80
   *  faces (the low-poly sweet spot), 2 = 320 (getting dense). */
  detail?: number;
  /** Ellipsoid half-axes (world units). */
  radiusX?: number;
  radiusY?: number;
  radiusZ?: number;
  /** How deep the central fissure groove pulls the top centreline
   *  vertices down (world units). */
  fissureDepth?: number;
  /** Low-frequency lobing amplitude along the vertex normal. */
  noiseAmp?: number;
}

export interface LowPolyBrainGeometry {
  faces: THREE.BufferGeometry;
  edges: THREE.BufferGeometry;
  nodes: THREE.BufferGeometry;
  /** Max vertex radius after deformation — used to size bounding
   *  spheres + verify source-orbit clearance. */
  maxRadius: number;
}

/** Deform a unit-sphere direction into the brain ellipsoid + fissure
 *  + lobing. Pure function of the normalized direction, so shared
 *  (duplicated) vertices in the non-indexed icosahedron all move
 *  together and the mesh stays watertight. */
function deformToBrain(
  dir: THREE.Vector3,
  radiusX: number,
  radiusY: number,
  radiusZ: number,
  fissureDepth: number,
  noiseAmp: number
): THREE.Vector3 {
  let x = dir.x * radiusX;
  let y = dir.y * radiusY;
  let z = dir.z * radiusZ;

  // Longitudinal fissure: strongest where x ≈ 0 (centreline) and the
  // vertex is on the upper half (y > 0). Carves a groove along Z.
  const ax = (x / radiusX) * (x / radiusX); // (normalized x)^2
  const topness = Math.max(0, dir.y);
  const crease = Math.exp(-ax / 0.05) * topness;
  y -= crease * fissureDepth;
  // Splay the two lobes slightly apart around the groove.
  x += (x >= 0 ? 1 : -1) * crease * fissureDepth * 0.45;

  // Low-frequency lobing noise (deterministic from direction).
  const n =
    Math.sin(dir.x * 4.0 + 1.3) * 0.5 +
    Math.cos(dir.y * 3.0 + 0.7) * 0.3 +
    Math.sin(dir.z * 3.5 + 2.1) * 0.2;
  x += dir.x * n * noiseAmp;
  y += dir.y * n * noiseAmp;
  z += dir.z * n * noiseAmp;

  return new THREE.Vector3(x, y, z);
}

export function buildLowPolyBrain({
  detail = 1,
  radiusX = 0.62,
  radiusY = 0.52,
  radiusZ = 0.8,
  fissureDepth = 0.18,
  noiseAmp = 0.06,
}: LowPolyBrainOptions = {}): LowPolyBrainGeometry {
  const faces = new THREE.IcosahedronGeometry(1, detail);
  const pos = faces.getAttribute("position") as THREE.BufferAttribute;

  const dir = new THREE.Vector3();
  let maxRadius = 0;
  for (let i = 0; i < pos.count; i++) {
    dir.fromBufferAttribute(pos, i).normalize();
    const p = deformToBrain(dir, radiusX, radiusY, radiusZ, fissureDepth, noiseAmp);
    pos.setXYZ(i, p.x, p.y, p.z);
    maxRadius = Math.max(maxRadius, p.length());
  }
  pos.needsUpdate = true;
  faces.computeVertexNormals();

  // Wireframe — thresholdAngle 1° keeps every facet edge so the
  // deformed mesh reads as the classic low-poly triangulated shell.
  const edges = new THREE.EdgesGeometry(faces, 1);

  // Vertex nodes — dedupe the non-indexed positions so each shared
  // vertex contributes a single accent dot.
  const nodes = buildUniqueNodes(pos);

  return { faces, edges, nodes, maxRadius };
}

/** Build a points geometry from the unique positions of a (possibly
 *  duplicated) position attribute. */
function buildUniqueNodes(pos: THREE.BufferAttribute): THREE.BufferGeometry {
  const seen = new Set<string>();
  const unique: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // Round to 4 decimals to collapse floating-point-identical verts.
    const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(x, y, z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(unique, 3));
  return g;
}
