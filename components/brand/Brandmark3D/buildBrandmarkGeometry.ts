/**
 * buildBrandmarkGeometry — turn the flat Thoughtform brandmark SVG
 * into a real beveled 3D solid.
 *
 * Pipeline (matches the lab plan):
 *
 *   fetch(svgUrl) → SVGLoader.parse → for each path:
 *     SVGLoader.createShapes → THREE.ExtrudeGeometry(shape, opts)
 *   → mergeGeometries → center on origin → flip Y (SVG is Y-down)
 *   → uniform-scale to `targetSize` (max dim) → recompute normals
 *
 * The two heavy paths (the outer C-arc ring and the cross + bar +
 * diagonal-vectors compound) carry the recognisable mass. The four
 * hairline-tick paths extrude into fragile thin blades, so they are
 * skipped unless `includeSlivers` is true.
 *
 * No new dependencies — `three@^0.170` ships `SVGLoader.js` and
 * `BufferGeometryUtils.js` under `three/examples/jsm/...`.
 *
 * Lab tuning lives at `/test/brandmark-3d`. Production integration
 * (replacing the DOM SVG centre mark of the intelligence-layer
 * corridor with this geometry) is a follow-up plan; this builder is
 * shaped so a future `<Brandmark3D>` mesh can drop straight in.
 */

import * as THREE from "three";
import { SVGLoader, type SVGResult } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Path indices in `public/logos/Thoughtform_Brandmark.svg` that are
 * hairline radial ticks (extrude into fragile thin blades and tend
 * to z-fight with the bevel of the heavy paths). Skipped by default.
 *
 *   0: top-right outer C-arc fragment   (heavy)
 *   1: big outer C-arc ring             (heavy)
 *   2: short horizontal tick (left)     (sliver)
 *   3: tiny tick                        (sliver)
 *   4: thin diagonal vector (lower)     (sliver)
 *   5: cross + horizontal bar + verts   (heavy compound)
 *   6: thin diagonal vector (upper)     (sliver)
 */
const SLIVER_PATH_INDICES: ReadonlySet<number> = new Set([2, 3, 4, 6]);

export interface BuildBrandmarkGeometryOptions {
  /** Extrusion depth in SVG units (viewBox ≈ 436). Default 20. */
  depth?: number;
  /** Bevel rim depth, SVG units. Default 2. */
  bevelThickness?: number;
  /** Bevel rim width, SVG units. Default 2. */
  bevelSize?: number;
  /** Bevel rounding segments — higher = rounder rim. Default 4. */
  bevelSegments?: number;
  /** Curve tessellation per arc segment. Default 18. */
  curveSegments?: number;
  /** Include the hairline tick paths. Default false. */
  includeSlivers?: boolean;
  /** Final fit-to size; the geometry's largest dim equals this. Default 1. */
  targetSize?: number;
}

export interface BuildBrandmarkGeometryResult {
  geometry: THREE.BufferGeometry;
  /** Bounding-box size AFTER normalization (centred, scaled to `targetSize`). */
  size: THREE.Vector3;
}

/**
 * Builder is pure and idempotent — callers should memoise the
 * returned geometry and dispose it on unmount.
 *
 * Throws if the SVG fetch fails or the parse produces no paths.
 */
export async function buildBrandmarkGeometry(
  svgUrl: string,
  options: BuildBrandmarkGeometryOptions = {}
): Promise<BuildBrandmarkGeometryResult> {
  const {
    depth = 20,
    bevelThickness = 2,
    bevelSize = 2,
    bevelSegments = 4,
    curveSegments = 18,
    includeSlivers = false,
    targetSize = 1,
  } = options;

  const response = await fetch(svgUrl);
  if (!response.ok) {
    throw new Error(`buildBrandmarkGeometry: failed to fetch ${svgUrl} (${response.status})`);
  }
  const svgText = await response.text();

  const loader = new SVGLoader();
  const data: SVGResult = loader.parse(svgText);
  if (!data.paths.length) {
    throw new Error(`buildBrandmarkGeometry: parsed ${svgUrl} but found no paths`);
  }

  const bevelEnabled = bevelSize > 0 && bevelThickness > 0;
  const extrudeOpts: THREE.ExtrudeGeometryOptions = {
    depth,
    bevelEnabled,
    bevelThickness,
    bevelSize,
    bevelSegments,
    bevelOffset: 0,
    curveSegments,
    steps: 1,
  };

  const partials: THREE.BufferGeometry[] = [];
  data.paths.forEach((path, pathIdx) => {
    if (!includeSlivers && SLIVER_PATH_INDICES.has(pathIdx)) return;
    const shapes = SVGLoader.createShapes(path);
    for (const shape of shapes) {
      partials.push(new THREE.ExtrudeGeometry(shape, extrudeOpts));
    }
  });

  if (!partials.length) {
    throw new Error("buildBrandmarkGeometry: no shapes extruded (all paths filtered or empty)");
  }

  // mergeGeometries requires every input to share the same attribute
  // layout. ExtrudeGeometry with identical options satisfies this; we
  // pass `useGroups = false` because we want one material slot.
  let merged = mergeGeometries(partials, false);
  if (!merged) {
    merged = partials[0];
    partials.shift();
  }
  for (const g of partials) g.dispose();

  merged.computeBoundingBox();
  const box = merged.boundingBox;
  if (!box) {
    throw new Error("buildBrandmarkGeometry: merged geometry has no bounding box");
  }
  const sizeRaw = new THREE.Vector3();
  box.getSize(sizeRaw);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const maxDim = Math.max(sizeRaw.x, sizeRaw.y, sizeRaw.z);
  const scale = maxDim > 0 ? targetSize / maxDim : 1;

  // Three transforms collapsed into one matrix application so the
  // vertex buffer is walked exactly once:
  //   1. translate: centre on origin
  //   2. rotateX(π): flip Y up (SVG is Y-down) AND Z direction.
  //      We use a rotation, NOT a negative Y scale — `ExtrudeGeometry`
  //      in three@0.170 produces non-indexed geometry, and a negative
  //      scale on a single axis inverts triangle winding (CCW → CW).
  //      With no index buffer there is no clean way to swap two
  //      indices per triangle, so `computeVertexNormals` would
  //      derive every face normal pointing INWARD — back-face
  //      culling would then reject the outward faces and the matcap
  //      would be sampled at mirrored UVs. A rotation is a proper
  //      rigid transform: orientation is preserved, normals stay
  //      outward, the matcap reads correctly on every face.
  //   3. uniform scale to the fit size.
  //
  // rotateX(π) also flips Z, so the extrusion now points -Z. The
  // front cap (the 2D shape) ends up at +depth/2 facing the camera
  // at +Z — exactly what we want.
  const transform = new THREE.Matrix4()
    .makeScale(scale, scale, scale)
    .multiply(new THREE.Matrix4().makeRotationX(Math.PI))
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
  merged.applyMatrix4(transform);

  // Normals must be re-derived after the rigid transform anyway —
  // the rotation propagates correctly through `computeVertexNormals`.
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  merged.computeBoundingSphere();

  const finalSize = new THREE.Vector3();
  merged.boundingBox?.getSize(finalSize);

  return { geometry: merged, size: finalSize };
}

/** Default URL for the canonical brandmark — served statically from
 *  `public/logos/`. `middleware.ts` already excludes `/logos` from
 *  the internal-route rewrite, so this URL works in dev and prod. */
export const DEFAULT_BRANDMARK_SVG_URL = "/logos/Thoughtform_Brandmark.svg";
