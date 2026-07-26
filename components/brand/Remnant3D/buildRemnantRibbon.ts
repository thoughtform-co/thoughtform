/**
 * buildRemnantRibbon — the tapered, multi-ply swept band.
 *
 * WHY THIS EXISTS, rather than using the img2threejs output directly:
 * the generator builds every `curve-sweep` component with
 * `THREE.ExtrudeGeometry({ extrudePath })`, which sweeps a CONSTANT cross-section.
 * The remnant's band tapers from full width at the coil to a sliver at the spar
 * tip, and it is a stack of discrete plies rather than one solid. Neither is
 * expressible as a constant extrude, so the sweep is built here by hand off the
 * solved spine in `remnantSpine.ts`.
 *
 * The lamination is the object's identity. Reading the plate, the bright face is
 * the outer surface of a rolled sheet and the dark concentric striations are that
 * sheet's cut edge — so the band's WIDTH runs along the coil axis and its
 * THICKNESS is radial, exactly like a roll of tape.
 *
 * Plies terminate progressively toward the spar tip, so the fray emerges from the
 * lamination system instead of being modelled as separate shards.
 */

import * as THREE from "three";
import {
  DEFAULT_SPINE_PARAMS,
  HALF_THICKNESS,
  HALF_WIDTH,
  fullSpine,
  halfWidthAt,
  type SpineParams,
} from "./remnantSpine";

export interface RibbonOptions {
  /** Number of laminae in the stack. Read off the striation spacing: ~28. */
  plies?: number;
  /** Stations sampled along the sweep. Higher = smoother coil. */
  stations?: number;
  /** Gap between plies, as a multiple of a single ply's thickness. */
  plyGap?: number;
  /** 0 = plies all end together, 1 = maximum ragged terminus. */
  fray?: number;
  /** Deterministic seed for the fray jitter. */
  seed?: number;
  spine?: SpineParams;
}

export interface RibbonResult {
  geometry: THREE.BufferGeometry;
  /** Per-vertex 0..1 along the sweep — 0 at the spar tip. */
  sweepT: Float32Array;
  /** Per-vertex ply index normalized 0..1, for tonal alternation. */
  plyT: Float32Array;
  plyCount: number;
}

/** Mulberry32 — same deterministic PRNG the brandmark samplers use. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Resample a polyline to evenly spaced stations, so the coil's tight inner turns
 * are not starved of geometry relative to the long spar.
 */
function resample(points: THREE.Vector3[], count: number): THREE.Vector3[] {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
  return curve.getSpacedPoints(count - 1);
}

export function buildRemnantRibbon(options: RibbonOptions = {}): RibbonResult {
  const {
    plies = 28,
    stations = 420,
    plyGap = 1.15,
    fray = 1,
    seed = 70701,
    spine = DEFAULT_SPINE_PARAMS,
  } = options;

  const raw = fullSpine(spine);
  const pts = resample(raw, stations);

  // Fraction of the sweep that is spar, so halfWidthAt knows where the taper ends.
  // sparSpine contributes 41 of the raw points and coilSpine 96 more.
  const sparFraction = 41 / (41 + 96);

  const plyThickness = (HALF_THICKNESS * 2) / (plies * plyGap);
  const rng = mulberry32(seed);

  // Where each ply stops on its way toward the spar tip. Outer plies survive
  // furthest; inner ones peel away earlier. This is what makes the fray.
  const plyStart = Array.from({ length: plies }, (_, p) => {
    const base = (p / Math.max(1, plies - 1)) * 0.3 * fray;
    return Math.min(0.92, base + rng() * 0.1 * fray);
  });

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const sweepTArr: number[] = [];
  const plyTArr: number[] = [];

  const axis = new THREE.Vector3(0, 0, 1);
  const tangent = new THREE.Vector3();
  const widthDir = new THREE.Vector3();
  const thickDir = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  for (let p = 0; p < plies; p += 1) {
    // Radial offset of this ply within the stack.
    const off = (p - (plies - 1) / 2) * plyThickness * plyGap;
    const plyT = plies === 1 ? 0 : p / (plies - 1);
    const start = plyStart[p];

    // Stations this ply actually spans.
    const first = Math.floor(start * (stations - 1));
    const span = stations - first;
    if (span < 3) continue;

    const base = positions.length / 3;

    for (let i = first; i < stations; i += 1) {
      const t = i / (stations - 1);
      const cur = pts[i];

      // Tangent by central difference.
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(stations - 1, i + 1)];
      tangent.subVectors(next, prev).normalize();

      // Width runs along the coil axis, projected perpendicular to the tangent so
      // the frame stays orthonormal through the spar's out-of-plane rise.
      widthDir.copy(axis).addScaledVector(tangent, -axis.dot(tangent));
      if (widthDir.lengthSq() < 1e-8) widthDir.set(1, 0, 0);
      widthDir.normalize();
      thickDir.crossVectors(tangent, widthDir).normalize();

      // Taper, plus a per-ply fade so a ply thins as it approaches its own end.
      const hw = halfWidthAt(t, sparFraction);
      const age = Math.min(1, (t - start) / 0.12);
      const w = hw * (0.35 + 0.65 * age);

      tmp.copy(cur).addScaledVector(thickDir, off);
      for (const side of [-1, 1] as const) {
        positions.push(
          tmp.x + widthDir.x * w * side,
          tmp.y + widthDir.y * w * side,
          tmp.z + widthDir.z * w * side
        );
        normals.push(thickDir.x, thickDir.y, thickDir.z);
        uvs.push(t * 6, side > 0 ? 1 : 0);
        sweepTArr.push(t);
        plyTArr.push(plyT);
      }
    }

    for (let k = 0; k < span - 1; k += 1) {
      const a = base + k * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  // Recentre so the object orbits about itself rather than the coil's origin,
  // which sits off to one side once the long spar is included.
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box) {
    const c = box.getCenter(new THREE.Vector3());
    geometry.translate(-c.x, -c.y, -c.z);
  }
  const sweepT = new Float32Array(sweepTArr);
  const plyT = new Float32Array(plyTArr);
  geometry.setAttribute("aSweepT", new THREE.BufferAttribute(sweepT, 1));
  geometry.setAttribute("aPlyT", new THREE.BufferAttribute(plyT, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return { geometry, sweepT, plyT, plyCount: plies };
}

/**
 * Edge-first point cloud for the frayed terminus.
 *
 * Same technique as `lib/brandmark/sampleBrandmark3D.ts` — sample hard edges
 * rather than surfaces, which is what stops a point cloud collapsing into the
 * ADR-023 blob — but written against the ribbon's own attributes instead of
 * reusing the brandmark's arm/dome/flat morph schema, which does not apply here.
 *
 * Density is weighted toward the spar tip: that is where the object is coming
 * apart, and it is the one feature procedural primitives cannot reach.
 */
export function sampleRibbonFray(
  ribbon: RibbonResult,
  count = 9000,
  seed = 70703,
  scatter = 0.012
): THREE.BufferGeometry {
  // Sample the ribbon's OWN vertices, not an EdgesGeometry: EdgesGeometry drops
  // custom attributes, and sweepT is exactly the quantity the density needs.
  const pos = ribbon.geometry.getAttribute("position");
  const sweepT = ribbon.sweepT;
  const n = pos.count;
  const rng = mulberry32(seed);

  // Density rises sharply toward the spar tip (sweepT -> 0): that is where the
  // object is coming apart. A small floor keeps a dusting over the whole body.
  const weights = new Float32Array(n);
  let total = 0;
  for (let i = 0; i < n; i += 1) {
    const w = 0.02 + Math.pow(1 - sweepT[i], 4.5);
    weights[i] = w;
    total += w;
  }

  // Cumulative table + binary search, so a large `count` stays O(count log n)
  // rather than the O(count * n) a linear scan would cost.
  const cum = new Float32Array(n);
  let acc = 0;
  for (let i = 0; i < n; i += 1) {
    acc += weights[i];
    cum[i] = acc;
  }

  const out = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const pick = rng() * total;
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < pick) lo = mid + 1;
      else hi = mid;
    }
    // Scatter off the surface, more so where the ply stack has already failed.
    const spread = scatter * (0.25 + Math.pow(1 - sweepT[lo], 2.5));
    out[i * 3] = pos.getX(lo) + (rng() - 0.5) * spread;
    out[i * 3 + 1] = pos.getY(lo) + (rng() - 0.5) * spread;
    out[i * 3 + 2] = pos.getZ(lo) + (rng() - 0.5) * spread;
    seeds[i] = rng();
  }

  const cloud = new THREE.BufferGeometry();
  cloud.setAttribute("position", new THREE.BufferAttribute(out, 3));
  cloud.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  cloud.computeBoundingSphere();
  return cloud;
}

export const RIBBON_DEFAULTS = {
  plies: 28,
  stations: 420,
  plyGap: 1.15,
  fray: 1,
  halfWidth: HALF_WIDTH,
  halfThickness: HALF_THICKNESS,
} as const;
