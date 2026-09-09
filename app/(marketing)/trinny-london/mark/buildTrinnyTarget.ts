/**
 * buildTrinnyTarget — the client's mark as a 3D WIREFRAME point set, paired
 * slot-for-slot with the parked Thoughtform mark (ADR-095).
 *
 * The corridor's parked mark is the Thoughtform GLB edge-sampled into
 * points (`sampleBrandmark3D`, wire only). This builds the same kind of
 * object for Trinny London's mark without a GLB: the measured outlines in
 * `trinnyMark.ts` become `THREE.Shape`s, extruded to the Thoughtform mark's
 * OWN depth (derived from the base homes, so the two wireframes are one
 * material), and edge-sampled by the SAME sampler — cap outlines, the
 * polygons' corner edges, and an explicit budget of front↔back struts on
 * the ring so it reads as a drum rather than two circles.
 *
 * ⚠ Sample ONCE with all five geometries: the sampler re-centres and re-fits
 * every call (`lib/brandmark/sampleBrandmark3D.ts`, the uniform fit), so
 * sampling the ring and the monogram separately would blow the monogram up
 * to the ring's extent. Then classify by radius and pair by polar rank
 * (`pairByPolarRank.ts`) — the class counts need not match, the rank map
 * takes a uniform subset because the target is OVERSAMPLED.
 *
 * Imports `three`. Reached ONLY through `import()` — the route's portal
 * registers `load: () => import("./buildTrinnyTarget")` so the landing's
 * import doctrine (no `three` in the route page's static graph) holds, and
 * the corridor never imports route code: it calls the function it was
 * handed. Runs under vitest too (pure geometry, no GL).
 */

import * as THREE from "three";
import { sampleBrandmark3D } from "@/lib/brandmark/sampleBrandmark3D";
import { assignByPolarRank, PAIR_SPLIT_RADIUS } from "./pairByPolarRank";
import {
  TRINNY_MARK_CENTER,
  TRINNY_MARK_GLYPHS,
  TRINNY_MARK_RING,
  TRINNY_MARK_VIEWBOX,
} from "./trinnyMark";

export interface TrinnyTargetOptions {
  /** Subdivisions per full circle of the ring. 48 ⇒ 7.5° facets, under the
   *  edge threshold, so the rims sample as smooth circles. */
  curveSegments?: number;
  /** `EdgesGeometry` threshold. 10° drops the 48-gon's wall seams; the caps'
   *  90° outlines and the polygons' corners stay. */
  edgeThresholdDeg?: number;
  /** Share of the sample budget spent on front↔back struts (the ring's drum
   *  read; the polygons' corner struts come free as edges). */
  strutFrac?: number;
  /** Multiplier on the derived extrusion depth (1 = the Thoughtform mark's). */
  depthScale?: number;
  /** Target points sampled per particle slot (> 1 so every class has more
   *  target points than slots and the rank map takes a subset). */
  oversample?: number;
  /** Sampler seed — deterministic across mounts. */
  seed?: number;
}

const DEFAULTS: Required<TrinnyTargetOptions> = {
  curveSegments: 48,
  edgeThresholdDeg: 10,
  strutFrac: 0.12,
  depthScale: 1,
  oversample: 1.6,
  seed: 7,
};

/** A flat fallback depth (0.5-half-extent units) if the base has no Z at all. */
const FLAT_BASE_DEPTH = 0.06;

/** Build the extruded solids, in viewBox units, y flipped to y-up. The
 *  sampler re-centres, so the origin does not matter. */
export function buildTrinnyGeometries(
  depthVb: number,
  curveSegments: number
): THREE.BufferGeometry[] {
  const c = TRINNY_MARK_CENTER;
  const ring = new THREE.Shape();
  ring.absarc(c, -c, TRINNY_MARK_RING.outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(c, -c, TRINNY_MARK_RING.inner, 0, Math.PI * 2, true);
  ring.holes.push(hole);

  const glyphs = TRINNY_MARK_GLYPHS.map(
    (poly) => new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, -y)))
  );

  return [ring, ...glyphs].map(
    (shape) =>
      new THREE.ExtrudeGeometry(shape, {
        depth: depthVb,
        bevelEnabled: false,
        curveSegments,
      })
  );
}

/** The mark's edge samples, normalised to a 0.5 half-extent on XY (the
 *  actor's own recipe for the Thoughtform homes), before pairing. */
export function sampleTrinnyMark(
  total: number,
  depthNorm: number,
  opts: Required<TrinnyTargetOptions>
): Float32Array {
  const depthVb = Math.max(1e-3, depthNorm) * TRINNY_MARK_VIEWBOX * opts.depthScale;
  const geos = buildTrinnyGeometries(depthVb, opts.curveSegments);
  const struts = Math.round(total * Math.max(0, Math.min(0.5, opts.strutFrac)));
  const sample = sampleBrandmark3D(geos, {
    wireCount: Math.max(0, total - struts),
    depthStrutCount: struts,
    surfaceCount: 0,
    shellCount: 0,
    edgeThresholdDeg: opts.edgeThresholdDeg,
    seed: opts.seed,
  });
  geos.forEach((g) => g.dispose());

  const arm = sample.armHomes;
  let maxAbs = 1e-6;
  for (let i = 0; i < sample.count; i++) {
    const ax = Math.abs(arm[i * 3]);
    const ay = Math.abs(arm[i * 3 + 1]);
    if (ax > maxAbs) maxAbs = ax;
    if (ay > maxAbs) maxAbs = ay;
  }
  const k = 0.5 / maxAbs;
  const out = new Float32Array(sample.count * 3);
  for (let i = 0; i < sample.count * 3; i++) out[i] = arm[i] * k;
  return out;
}

/**
 * The registry contract (`BrandmarkMorphTarget.buildTarget`): given the
 * parked mark's normalised homes and the slot count, return one target per
 * slot in the same space.
 */
export function buildTarget(
  base: Float32Array,
  count: number,
  options: TrinnyTargetOptions = {}
): Float32Array {
  const opts = { ...DEFAULTS, ...options };
  // The Thoughtform mark's own depth, so the two wireframes match in Z.
  let zMax = 0;
  for (let i = 0; i < count; i++) {
    const z = Math.abs(base[i * 3 + 2]);
    if (z > zMax) zMax = z;
  }
  const depthNorm = zMax > 1e-4 ? 2 * zMax : FLAT_BASE_DEPTH;
  const total = Math.ceil(count * Math.max(1, opts.oversample));
  const target = sampleTrinnyMark(total, depthNorm, opts);
  return assignByPolarRank(base, target, count, PAIR_SPLIT_RADIUS);
}
