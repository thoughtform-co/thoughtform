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

  const capPartials: THREE.BufferGeometry[] = [];
  const sidePartials: THREE.BufferGeometry[] = [];
  data.paths.forEach((path, pathIdx) => {
    if (!includeSlivers && SLIVER_PATH_INDICES.has(pathIdx)) return;
    const shapes = SVGLoader.createShapes(path);
    for (const shape of shapes) {
      const extruded = new THREE.ExtrudeGeometry(shape, extrudeOpts);
      splitExtrudeGeometryByMaterialGroup(extruded, capPartials, sidePartials);
      extruded.dispose();
    }
  });

  if (!capPartials.length || !sidePartials.length) {
    throw new Error("buildBrandmarkGeometry: no shapes extruded (all paths filtered or empty)");
  }

  const capMerged = mergeGeometryList(capPartials, "caps");
  const sideMerged = mergeGeometryList(sidePartials, "sides");
  for (const g of capPartials) g.dispose();
  for (const g of sidePartials) g.dispose();

  const merged = mergeGeometries([capMerged, sideMerged], true);
  capMerged.dispose();
  sideMerged.dispose();
  if (!merged) {
    throw new Error("buildBrandmarkGeometry: failed to merge cap and side geometry");
  }

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
  applyObjectSpaceUvs(merged);
  merged.computeBoundingSphere();

  const finalSize = new THREE.Vector3();
  merged.boundingBox?.getSize(finalSize);

  return { geometry: merged, size: finalSize };
}

// Preserve ExtrudeGeometry's original cap/side split so the renderer
// can assign different materials to faces and extrusion walls.
function splitExtrudeGeometryByMaterialGroup(
  geometry: THREE.BufferGeometry,
  capPartials: THREE.BufferGeometry[],
  sidePartials: THREE.BufferGeometry[]
) {
  const groups = geometry.groups.length
    ? geometry.groups
    : [{ start: 0, count: geometry.getAttribute("position").count, materialIndex: 0 }];

  for (const group of groups) {
    const slice = sliceGeometryGroup(geometry, group);
    if (group.materialIndex === 1) {
      sidePartials.push(slice);
    } else {
      capPartials.push(slice);
    }
  }
}

function sliceGeometryGroup(
  geometry: THREE.BufferGeometry,
  group: { start: number; count: number; materialIndex?: number }
): THREE.BufferGeometry {
  if (geometry.index) {
    throw new Error("buildBrandmarkGeometry: expected non-indexed extrude geometry");
  }

  const slice = new THREE.BufferGeometry();
  const start = group.start;
  const end = group.start + group.count;

  for (const name of Object.keys(geometry.attributes)) {
    const attribute = geometry.getAttribute(name) as THREE.BufferAttribute;
    const from = start * attribute.itemSize;
    const to = end * attribute.itemSize;
    const array = attribute.array.slice(from, to) as THREE.TypedArray;
    slice.setAttribute(
      name,
      new THREE.BufferAttribute(array, attribute.itemSize, attribute.normalized)
    );
  }

  return slice;
}

function mergeGeometryList(partials: THREE.BufferGeometry[], label: string): THREE.BufferGeometry {
  if (partials.length === 1) return partials[0].clone();
  const merged = mergeGeometries(partials, false);
  if (!merged) throw new Error(`buildBrandmarkGeometry: failed to merge ${label}`);
  return merged;
}

function applyObjectSpaceUvs(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
  const normal = geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
  if (!position || !normal) return;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;

  const size = new THREE.Vector3();
  box.getSize(size);
  const sx = Math.max(size.x, 0.0001);
  const sy = Math.max(size.y, 0.0001);
  const sz = Math.max(size.z, 0.0001);
  const uv = new Float32Array(position.count * 2);

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);

    const capFace = Math.abs(nz) > 0.58;
    const sideRunsMostlyVertical = Math.abs(nx) > Math.abs(ny);
    const u = capFace
      ? (x - box.min.x) / sx
      : sideRunsMostlyVertical
        ? (y - box.min.y) / sy
        : (x - box.min.x) / sx;
    const v = capFace ? (y - box.min.y) / sy : (z - box.min.z) / sz;

    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/** Default URL for the canonical brandmark, served statically from `public/logos/`. */
export const DEFAULT_BRANDMARK_SVG_URL = "/logos/Thoughtform_Brandmark.svg";
