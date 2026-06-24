/**
 * sampleBrandmark3D — sample the REAL 3D Blender brandmark mesh
 * (`public/models/brandmark/brandmark.glb`) into a holographic point cloud.
 *
 * Why this exists (vs. the old flat-SVG sampler): the previous Services
 * hologram sampled the FLAT SVG contours and staggered whole paths into Z. That reads as 2D
 * cardboard layers, never as a volume — and because the artifact also
 * billboards to the camera, the (already shallow) depth was never visible.
 *
 * This sampler instead reads the extruded 3D mesh that matches the Blender
 * render, and builds the cloud EDGE-FIRST:
 *
 *   - WIRE points (dominant, part 0/1) — distributed along the mesh's hard
 *     edges via `THREE.EdgesGeometry`. Edges are 1D, so the population can't
 *     saturate into a blob the way an area-weighted surface sample does
 *     (the documented ADR-023 failure mode). This IS the wireframe read.
 *   - SURFACE points (sparse, part 3) — a thin `MeshSurfaceSampler` fill that
 *     carries the true face normal so the renderer can Fresnel-DIM the
 *     front-facing caps (where the area sampler dumps most points) and keep
 *     only the rims — giving translucent volume instead of a solid glow.
 *   - SHELL dust (part 2) — the faint surrounding sphere, for the
 *     "artifact suspended in space" feel.
 *
 * Returns flat + volumetric home buffers, per-particle seed / part / edge /
 * angle, a model-space `normals` buffer (for the Fresnel facing term), and the
 * generated count — the full attribute set the hologram artifact plumbs into
 * GPU buffers.
 */

import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

const TAU = Math.PI * 2;

/** XY footprint multiplier so the volumetric mark occupies the same scene
 *  footprint the orbits are tuned around. The GLB already carries proportional
 *  Z, so we apply this UNIFORMLY (no separate Z blow-up) and the aspect stays
 *  faithful. */
const MARK_SCALE = 1.74;

export interface VolumetricBrandmarkSample {
  /** Flat silhouette home positions (Z collapsed to 0). count * 3. */
  flatHomes: Float32Array;
  /** Volumetric 3D home positions (the assembled wireframe). count * 3. */
  armHomes: Float32Array;
  /** Dome home positions — a dense 3D blob the particles START from before
   *  migrating onto the wireframe, sized to read like the corridor sphere at
   *  the scroll hand-off. count * 3. */
  domeHomes: Float32Array;
  /** Per-particle deterministic seed in [0, 1). count. */
  seeds: Float32Array;
  /** Part id: 0 = wire, 1 = scan accent, 2 = shell, 3 = surface. count. */
  parts: Float32Array;
  /** Brightness / edge hint in [0, 1]. count. */
  edge: Float32Array;
  /** Tangent angle for oriented scan/dash sprites. count. */
  angles: Float32Array;
  /** Per-particle model-space unit normal (count * 3). Wire/shell use an
   *  outward radial proxy; surface points carry the true face normal. */
  normals: Float32Array;
  /** Number of particles generated. */
  count: number;
}

export interface SampleBrandmark3DOptions {
  /** Points distributed along the mesh's hard edges (the wireframe). Default 2600. */
  wireCount?: number;
  /** Points on front/back extrusion connectors. Default 0. */
  depthStrutCount?: number;
  /** Sparse Fresnel-dimmed surface fill. Default 850. */
  surfaceCount?: number;
  /** Faint volumetric dust particles. Default 700. */
  shellCount?: number;
  /** Dihedral angle (deg) above which an edge is kept by `EdgesGeometry`.
   *  Lower = richer wireframe (more facet seams). Default 18. */
  edgeThresholdDeg?: number;
  /** World radius / half-extent of the surrounding shell. Default 1. */
  radius?: number;
  /** PRNG seed for deterministic shell + jitter. Default 1. */
  seed?: number;
}

export type Brandmark3DGeometryInput = THREE.BufferGeometry | readonly THREE.BufferGeometry[];

/** Mulberry32 — small, fast, deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeShellPoint(rand: () => number, radius: number): [number, number, number] {
  const u = rand() * 2 - 1;
  const a = rand() * TAU;
  const ring = Math.sqrt(Math.max(0, 1 - u * u));
  const r = radius * (0.78 + rand() * 0.22);
  return [Math.cos(a) * ring * r, Math.sin(a) * ring * r, u * r];
}

/** Radius of the assembled-dome start state, in shell units (`radius`). A
 *  touch larger than the wireframe footprint so particles condense INWARD
 *  onto the structure as they organise. Tune against the corridor sphere. */
const DOME_RADIUS_MUL = 1.05;

/** A point inside a surface-biased ball — a particle's "dome" home: the dense
 *  glowing 3D blob the cloud starts as before it migrates onto the wireframe,
 *  matching the corridor planet at the scroll hand-off. */
function makeDomePoint(rand: () => number, radius: number): [number, number, number] {
  const u = rand() * 2 - 1;
  const a = rand() * TAU;
  const ring = Math.sqrt(Math.max(0, 1 - u * u));
  const r = radius * (0.5 + 0.5 * Math.cbrt(rand()));
  return [Math.cos(a) * ring * r, Math.sin(a) * ring * r, u * r];
}

interface Scratch {
  arm: number[];
  dome: number[];
  flat: number[];
  nrm: number[];
  seed: number[];
  part: number[];
  edge: number[];
  angle: number[];
}

type Vec3 = [number, number, number];

interface Segment {
  a: Vec3;
  b: Vec3;
  len: number;
}

function push(
  s: Scratch,
  arm: Vec3,
  dome: Vec3,
  flat: Vec3,
  nrm: Vec3,
  seed: number,
  part: number,
  edge: number,
  angle: number
): void {
  s.arm.push(arm[0], arm[1], arm[2]);
  s.dome.push(dome[0], dome[1], dome[2]);
  s.flat.push(flat[0], flat[1], flat[2]);
  s.nrm.push(nrm[0], nrm[1], nrm[2]);
  s.seed.push(seed);
  s.part.push(part);
  s.edge.push(edge);
  s.angle.push(angle);
}

function prepareGeometries(input: Brandmark3DGeometryInput): THREE.BufferGeometry[] {
  const sources = Array.isArray(input) ? input : [input];
  return sources.map((source) => {
    const geometry = source.index ? source.toNonIndexed() : source.clone();
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    return geometry;
  });
}

function triangleArea(
  a: [number, number, number],
  b: [number, number, number],
  c: [number, number, number]
): number {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const abz = b[2] - a[2];
  const acx = c[0] - a[0];
  const acy = c[1] - a[1];
  const acz = c[2] - a[2];
  const cx = aby * acz - abz * acy;
  const cy = abz * acx - abx * acz;
  const cz = abx * acy - aby * acx;
  return Math.hypot(cx, cy, cz) * 0.5;
}

function estimateSurfaceArea(geometry: THREE.BufferGeometry): number {
  const p = geometry.attributes.position as THREE.BufferAttribute | undefined;
  if (!p || p.count < 3) return 0;
  let area = 0;
  for (let i = 0; i + 2 < p.count; i += 3) {
    area += triangleArea(
      [p.getX(i), p.getY(i), p.getZ(i)],
      [p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)],
      [p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)]
    );
  }
  return area;
}

function distributeCount(total: number, weights: readonly number[]): number[] {
  if (total <= 0 || weights.length === 0) return weights.map(() => 0);
  const sum = weights.reduce((acc, v) => acc + Math.max(0, v), 0);
  const effective =
    sum > 0 ? weights.map((v) => Math.max(0, v) / sum) : weights.map(() => 1 / weights.length);
  const raw = effective.map((w) => w * total);
  const counts = raw.map(Math.floor);
  let remaining = total - counts.reduce((acc, v) => acc + v, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (remaining <= 0) break;
    counts[i] += 1;
    remaining -= 1;
  }
  return counts;
}

interface DepthBucket {
  x: number;
  y: number;
  minZ: number;
  maxZ: number;
  count: number;
}

function collectDepthStrutSegments(
  geometries: readonly THREE.BufferGeometry[],
  normPoint: (x: number, y: number, z: number) => Vec3,
  bucketSize = 0.018,
  minDepth = 0.045
): Segment[] {
  const buckets = new Map<string, DepthBucket>();

  for (const geometry of geometries) {
    const p = geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!p) continue;

    for (let i = 0; i < p.count; i++) {
      const [x, y, z] = normPoint(p.getX(i), p.getY(i), p.getZ(i));
      const qx = Math.round(x / bucketSize);
      const qy = Math.round(y / bucketSize);
      const key = `${qx}:${qy}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.x += x;
        bucket.y += y;
        bucket.minZ = Math.min(bucket.minZ, z);
        bucket.maxZ = Math.max(bucket.maxZ, z);
        bucket.count += 1;
      } else {
        buckets.set(key, { x, y, minZ: z, maxZ: z, count: 1 });
      }
    }
  }

  const segments: Segment[] = [];
  for (const bucket of buckets.values()) {
    const len = bucket.maxZ - bucket.minZ;
    if (len < minDepth) continue;
    const x = bucket.x / bucket.count;
    const y = bucket.y / bucket.count;
    segments.push({
      a: [x, y, bucket.minZ],
      b: [x, y, bucket.maxZ],
      len,
    });
  }

  return segments.sort((a, b) => {
    const aa = Math.atan2(a.a[1], a.a[0]);
    const ba = Math.atan2(b.a[1], b.a[0]);
    return aa - ba || a.a[0] - b.a[0] || a.a[1] - b.a[1];
  });
}

/**
 * Sample the brandmark mesh into a holographic point cloud.
 *
 * `geometry` is the raw mesh geometry pulled from the loaded GLB (model
 * units; this sampler centres + uniformly fits it to the brandmark footprint
 * itself, so the caller doesn't pre-transform). Client-only — `EdgesGeometry`
 * and `MeshSurfaceSampler` need real geometry buffers.
 */
export function sampleBrandmark3D(
  geometry: Brandmark3DGeometryInput,
  opts: SampleBrandmark3DOptions = {}
): VolumetricBrandmarkSample {
  const wireCount = Math.max(0, Math.floor(opts.wireCount ?? 2600));
  const depthStrutCount = Math.max(0, Math.floor(opts.depthStrutCount ?? 0));
  const surfaceCount = Math.max(0, Math.floor(opts.surfaceCount ?? 850));
  const shellCount = Math.max(0, Math.floor(opts.shellCount ?? 700));
  const edgeThresholdDeg = opts.edgeThresholdDeg ?? 18;
  const radius = opts.radius ?? 1;
  const seed = opts.seed ?? 1;

  // Work on non-indexed clones so EdgesGeometry/sampler are stable, and so we
  // never mutate cached GLTF geometries.
  const geometries = prepareGeometries(geometry);
  const bb = new THREE.Box3();
  for (const g of geometries) {
    if (g.boundingBox) bb.union(g.boundingBox);
  }
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  if (bb.isEmpty()) {
    center.set(0, 0, 0);
    size.set(1, 1, 1);
  } else {
    bb.getCenter(center);
    bb.getSize(size);
  }

  // Uniform fit: the larger of X/Y extent maps to ~1 (half-extent 0.5), Z
  // keeps its true proportion. Then bake MARK_SCALE so the footprint matches
  // the old ring.
  const fit = Math.max(size.x, size.y) || 1;
  const s = (MARK_SCALE / fit) * 1; // world units per model unit

  const normPoint = (x: number, y: number, z: number): [number, number, number] => [
    (x - center.x) * s,
    (y - center.y) * s,
    (z - center.z) * s,
  ];

  const rand = mulberry32(seed * 0x85ebca6b);
  const domeR = radius * DOME_RADIUS_MUL;
  const out: Scratch = {
    arm: [],
    dome: [],
    flat: [],
    nrm: [],
    seed: [],
    part: [],
    edge: [],
    angle: [],
  };

  // ── WIRE: distribute points along hard edges, weighted by edge length ──
  const segs: Segment[] = [];
  let totalLen = 0;
  for (const g of geometries) {
    const edges = new THREE.EdgesGeometry(g, edgeThresholdDeg);
    const ep = edges.attributes.position as THREE.BufferAttribute;
    const segN = Math.floor(ep.count / 2);

    for (let i = 0; i < segN; i++) {
      const a = normPoint(ep.getX(2 * i), ep.getY(2 * i), ep.getZ(2 * i));
      const b = normPoint(ep.getX(2 * i + 1), ep.getY(2 * i + 1), ep.getZ(2 * i + 1));
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const dz = b[2] - a[2];
      const len = Math.hypot(dx, dy, dz);
      if (len <= 0) continue;
      segs.push({ a, b, len });
      totalLen += len;
    }
    edges.dispose();
  }

  if (totalLen > 0 && wireCount > 0) {
    let placed = 0;
    const segCounts = distributeCount(
      wireCount,
      segs.map((seg) => seg.len)
    );
    for (let si = 0; si < segs.length; si++) {
      const seg = segs[si];
      const n = segCounts[si];
      if (n <= 0) continue;
      const dx = seg.b[0] - seg.a[0];
      const dy = seg.b[1] - seg.a[1];
      const dz = seg.b[2] - seg.a[2];
      const angle = Math.atan2(dy, dx); // screen-plane tangent for oriented dashes
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        // tiny lateral jitter keeps the wire from looking laser-perfect
        const j = (rand() - 0.5) * 0.012;
        const x = seg.a[0] + dx * t + dy * j;
        const y = seg.a[1] + dy * t - dx * j;
        const z = seg.a[2] + dz * t;
        const inv = 1 / (Math.hypot(x, y, z) || 1);
        push(
          out,
          [x, y, z],
          makeDomePoint(rand, domeR),
          [x, y, 0],
          [x * inv, y * inv, z * inv], // outward radial normal (in-plane → always reads as structure)
          rand(),
          placed % 4 === 0 ? 1 : 0, // every 4th wire point is a brighter scan accent
          1,
          angle
        );
        placed++;
      }
    }
  }

  // ── DEPTH STRUTS: connect matching front/back extrusion vertices ──
  const depthSegs = collectDepthStrutSegments(geometries, normPoint);
  if (depthSegs.length > 0 && depthStrutCount > 0) {
    let placed = 0;
    const depthCounts = distributeCount(
      depthStrutCount,
      depthSegs.map((seg) => seg.len)
    );
    for (let si = 0; si < depthSegs.length; si++) {
      const seg = depthSegs[si];
      const n = depthCounts[si];
      if (n <= 0) continue;
      const dx = seg.b[0] - seg.a[0];
      const dy = seg.b[1] - seg.a[1];
      const dz = seg.b[2] - seg.a[2];
      const angle = Math.hypot(dx, dy) > 0.001 ? Math.atan2(dy, dx) : Math.PI * 0.5;
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const j = (rand() - 0.5) * 0.006;
        const x = seg.a[0] + dx * t + dy * j;
        const y = seg.a[1] + dy * t - dx * j;
        const z = seg.a[2] + dz * t;
        const inv = 1 / (Math.hypot(x, y, z) || 1);
        push(
          out,
          [x, y, z],
          makeDomePoint(rand, domeR),
          [x, y, 0],
          [x * inv, y * inv, z * inv],
          rand(),
          placed % 7 === 0 ? 1 : 0,
          0.86,
          angle
        );
        placed++;
      }
    }
  }

  // ── SURFACE: sparse fill carrying the true normal (Fresnel-dimmed) ──
  if (surfaceCount > 0) {
    const surfaceCounts = distributeCount(surfaceCount, geometries.map(estimateSurfaceArea));
    const p = new THREE.Vector3();
    const nv = new THREE.Vector3();
    for (let gi = 0; gi < geometries.length; gi++) {
      const n = surfaceCounts[gi];
      if (n <= 0) continue;
      const mesh = new THREE.Mesh(geometries[gi]);
      const sampler = new MeshSurfaceSampler(mesh);
      // Seed the sampler's RNG with our deterministic PRNG so the fill is stable
      // across remounts/HMR (it defaults to Math.random). @types/three lags the
      // runtime, so cast to reach setRandomGenerator.
      (
        sampler as unknown as { setRandomGenerator(fn: () => number): MeshSurfaceSampler }
      ).setRandomGenerator(rand);
      sampler.build();
      for (let i = 0; i < n; i++) {
        sampler.sample(p, nv);
        const np = normPoint(p.x, p.y, p.z);
        push(
          out,
          np,
          makeDomePoint(rand, domeR),
          [np[0], np[1], 0],
          [nv.x, nv.y, nv.z],
          rand(),
          3,
          0.3,
          0
        );
      }
    }
  }

  // ── SHELL: faint surrounding dust (unchanged recipe) ──
  for (let i = 0; i < shellCount; i++) {
    const shell = makeShellPoint(rand, radius);
    const rr = radius * 0.68 * Math.sqrt(rand());
    const a = rand() * TAU;
    const inv = 1 / (Math.hypot(shell[0], shell[1], shell[2]) || 1);
    push(
      out,
      shell,
      makeDomePoint(rand, domeR),
      [Math.cos(a) * rr, Math.sin(a) * rr, 0],
      [shell[0] * inv, shell[1] * inv, shell[2] * inv],
      rand(),
      2,
      0.2,
      a
    );
  }

  geometries.forEach((g) => g.dispose());

  const count = out.seed.length;
  return {
    flatHomes: new Float32Array(out.flat),
    armHomes: new Float32Array(out.arm),
    domeHomes: new Float32Array(out.dome),
    normals: new Float32Array(out.nrm),
    seeds: new Float32Array(out.seed),
    parts: new Float32Array(out.part),
    edge: new Float32Array(out.edge),
    angles: new Float32Array(out.angle),
    count,
  };
}
