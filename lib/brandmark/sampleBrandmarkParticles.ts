/**
 * sampleBrandmarkParticles — sample the Thoughtform brandmark into a
 * 3D point cloud with depth, plus optional oriented basis variants.
 *
 * Four bases live behind one entry point so the corridor physics core
 * can switch the FEEL of the mark without rewiring everything else:
 *
 *   - `dome-fill` (default, legacy) — stratified silhouette samples via
 *     `sampleShape`, with a forward dome + per-particle Z jitter. This
 *     is the historical recipe (matches `intelligence-artifact/
 *     SubstrateBrandmark`'s `buildBrandmarkCloud` and v7
 *     `BrandmarkSilhouettePoints`). The cloud reads as a luminous filled
 *     mark with shallow Z.
 *   - `svg-outline` — particles distributed UNIFORMLY along each path's
 *     contour using `SVGPathElement.getPointAtLength`. Each particle
 *     stores a tangent angle so the renderer can rotate oriented
 *     primitives (dashes, brackets, scan slits) into the contour. This
 *     basis trades the "liquid filled cloud" feeling for the "drafting
 *     vector trace" feeling shown in the Shift5 / Good Fella / Benjamin
 *     references.
 *   - `edge-lattice` — dome-fill samples quantised to a regular grid.
 *     Each particle snaps to its containing cell centre, so the mark
 *     reads as a disciplined raster / dithered field (HORSE 2026 -style
 *     halftone). Angles are 0 — primitives are unoriented cells.
 *   - `model-wire` — `svg-outline` with extra per-path Z displacement
 *     (slivers included), so the contours fan out into the depth plane
 *     and read as a wire-frame 3D artifact.
 *
 * Output coordinate range:
 *
 *   - X / Y in `[-0.5, 0.5]` (normalised to the SVG viewBox).
 *   - Z in `[~-thickness/2, ~bulge + thickness/2]` for `dome-fill`
 *     (small relative to XY by design). Outline / lattice / wire bases
 *     scale Z proportionally with the same `bulge` / `thickness` so a
 *     consumer can keep `worldHalfExtent` constant when switching basis.
 */

import { sampleShape, type ShapeSample } from "./sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "./shapes";

/** Brandmark viewBox — copied from the canonical SVG. Kept inline so
 *  this module has no UI dependency. */
const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;

/** Default forward bulge applied to the cloud at the centre. Drops
 *  to 0 at the cloud's edge so the mark reads as a shallow dome
 *  rather than a hemisphere. */
export const DEFAULT_BULGE = 0.18;

/** Default per-particle Z jitter (front-to-back). Adds volumetric
 *  spread so the cloud has thickness rather than reading as a single
 *  shell. Seeded by `sample.seed.x` for determinism. */
export const DEFAULT_THICKNESS = 0.06;

/** Default lattice cell size in normalised units. ~32 cells across
 *  the brandmark is enough resolution to read the silhouette while
 *  still showing the disciplined grid texture. */
export const DEFAULT_GRID_SNAP = 1 / 32;

/** Per-particle basis types — see file header for the visual brief. */
export type BrandmarkBasis = "dome-fill" | "svg-outline" | "edge-lattice" | "model-wire";

export interface BrandmarkParticleSample {
  /** 3D home positions, length = `count * 3`. XY in `[-0.5, 0.5]`,
   *  Z derived from basis-specific depth recipe. */
  homes: Float32Array;
  /** Per-particle phase in `[0, 1)`. Drives shader pulse / per-particle
   *  variation. Length = `count`. */
  seeds: Float32Array;
  /** Per-particle "edge proximity" hint in `[0, 1]`. 0 at the cloud
   *  centre, ~1 at the silhouette extremes. Length = `count`. Outline
   *  / wire bases always return 1 (every particle IS the edge). */
  edgeWeights: Float32Array;
  /** Per-particle orientation in radians. Drives oriented primitives
   *  (dashes, brackets, scan slits). 0 for unoriented bases. Length =
   *  `count`. */
  angles: Float32Array;
  /** Number of particles actually sampled (≤ requested count — the
   *  stratified sampler may exhaust its grid before reaching count on
   *  very thin shapes, and the outline sampler distributes proportional
   *  to total contour length). */
  count: number;
  /** Which basis was sampled. Echoed back so consumers can adjust
   *  point size / blending defaults from one source of truth. */
  basis: BrandmarkBasis;
  /** Approximate cloud bounding box — `x`/`y` are 1.0 (full
   *  normalised range), `z` reflects the dome+jitter envelope. */
  size: { x: number; y: number; z: number };
}

export interface SampleBrandmarkParticlesOptions {
  /** Target particle count. */
  count: number;
  /** Which particle basis to sample. Default `dome-fill` (legacy). */
  basis?: BrandmarkBasis;
  /** Forward dome amplitude in normalised units. Default 0.18. Applied
   *  to `dome-fill` (radial) and `model-wire` (per-path Z). */
  bulge?: number;
  /** Per-particle Z jitter amplitude in normalised units. Default 0.06.
   *  Applied to every basis so consumers can dial volumetric spread
   *  uniformly. */
  thickness?: number;
  /** Lattice cell size for the `edge-lattice` basis (normalised
   *  units). Default `DEFAULT_GRID_SNAP` (~1/32 — ~32 cells across). */
  gridSnap?: number;
}

/**
 * Sample the brandmark into a 3D point cloud, with optional oriented
 * basis variants.
 *
 * Synchronous — `sampleShape` rasterises through a hidden 2D canvas
 * and `SVGPathElement.getTotalLength` requires a DOM, so this only
 * runs on the client. Returns an empty (`count = 0`) sample during
 * SSR; the caller should treat that as a render skip.
 */
export function sampleBrandmarkParticles(
  opts: SampleBrandmarkParticlesOptions
): BrandmarkParticleSample {
  const basis: BrandmarkBasis = opts.basis ?? "dome-fill";
  const count = Math.max(1, Math.floor(opts.count));
  const bulge = opts.bulge ?? DEFAULT_BULGE;
  const thickness = opts.thickness ?? DEFAULT_THICKNESS;
  const gridSnap = opts.gridSnap ?? DEFAULT_GRID_SNAP;

  if (typeof document === "undefined") {
    return makeEmptySample(basis);
  }

  switch (basis) {
    case "svg-outline":
      return sampleSvgOutline(count, bulge, thickness, basis, /* zPerPath */ false);
    case "model-wire":
      return sampleSvgOutline(count, bulge, thickness, basis, /* zPerPath */ true);
    case "edge-lattice":
      return sampleEdgeLattice(count, bulge, thickness, gridSnap, basis);
    case "dome-fill":
    default:
      return sampleDomeFill(count, bulge, thickness, basis);
  }
}

function makeEmptySample(basis: BrandmarkBasis): BrandmarkParticleSample {
  return {
    homes: new Float32Array(0),
    seeds: new Float32Array(0),
    edgeWeights: new Float32Array(0),
    angles: new Float32Array(0),
    count: 0,
    basis,
    size: { x: 1, y: 1, z: 0 },
  };
}

// ── dome-fill (legacy) ──────────────────────────────────────────
// Filled-silhouette stratified samples + forward dome + Z jitter.
// This is the historical recipe; angles are 0 (the dot mode never
// rotates anything).
function sampleDomeFill(
  count: number,
  bulge: number,
  thickness: number,
  basis: BrandmarkBasis
): BrandmarkParticleSample {
  const sample = sampleShape({
    shapeKey: BRANDMARK_SHAPE_KEYS.full,
    paths: BRANDMARK_FULL_PATHS,
    viewBox: BRANDMARK_VIEWBOX,
    count,
  });

  const cnt = sample.count;
  const homes = new Float32Array(cnt * 3);
  const seeds = new Float32Array(cnt);
  const edgeWeights = new Float32Array(cnt);
  const angles = new Float32Array(cnt);

  for (let i = 0; i < cnt; i++) {
    const nx = sample.home[i * 2];
    // sampleShape returns Y in screen-down convention (origin top
    // of viewBox). Flip so the brandmark reads upright in 3D space.
    const ny = -sample.home[i * 2 + 1];

    // Forward dome: r²-falloff from centre, scaled by `bulge`. At
    // r ≈ 0 the particle sits at +bulge; at r ≈ 0.5 it's flat (z = 0).
    const r2 = nx * nx + ny * ny;
    const rNorm = Math.min(1, r2 * 4);
    const dome = bulge * (1 - rNorm);

    const seedJitter = (sample.seed[i * 2] % 1) - 0.5;
    const z = dome + seedJitter * thickness;

    homes[i * 3] = nx;
    homes[i * 3 + 1] = ny;
    homes[i * 3 + 2] = z;

    seeds[i] = (sample.seed[i * 2 + 1] % 1000) / 1000;
    edgeWeights[i] = rNorm;
    angles[i] = 0;
  }

  return {
    homes,
    seeds,
    edgeWeights,
    angles,
    count: cnt,
    basis,
    size: { x: 1, y: 1, z: bulge + thickness * 0.5 },
  };
}

// ── svg-outline / model-wire ───────────────────────────────────
// Particles uniformly distributed along each path's contour. The
// tangent at each point is stored as `aAngle` so oriented primitives
// (dashes, brackets, scan slits) align with the contour. `model-wire`
// adds per-path Z displacement so the contours fan into the depth
// plane and the result reads as a wire-frame 3D object.
function sampleSvgOutline(
  count: number,
  bulge: number,
  thickness: number,
  basis: BrandmarkBasis,
  zPerPath: boolean
): BrandmarkParticleSample {
  const svgNS = "http://www.w3.org/2000/svg";
  const pathEls: SVGPathElement[] = [];
  const pathLengths: number[] = [];
  let totalLength = 0;

  for (const d of BRANDMARK_FULL_PATHS) {
    const el = document.createElementNS(svgNS, "path");
    el.setAttribute("d", d);
    let len = 0;
    try {
      len = el.getTotalLength();
    } catch {
      // Older WebKit can throw on detached path elements. Skip if so.
      len = 0;
    }
    pathEls.push(el);
    pathLengths.push(len);
    totalLength += len;
  }

  if (totalLength <= 0) {
    // Path-length API unavailable — degrade to dome-fill so the corridor
    // still has SOMETHING to render rather than nothing.
    return sampleDomeFill(count, bulge, thickness, basis);
  }

  // Per-path sample count proportional to path length (so longer
  // contours get more particles). The big outer C-arc (path index 1)
  // carries ~70% of total length; the thin slivers get a handful each.
  const homes = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const edgeWeights = new Float32Array(count);
  const angles = new Float32Array(count);

  // Deterministic Mulberry32-style PRNG for stable seeds.
  let rngState = 0x9e3779b9;
  const rand = () => {
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  let i = 0;
  for (let p = 0; p < pathEls.length; p++) {
    const len = pathLengths[p];
    if (len <= 0) continue;

    // Round so this path's allocation lands ≥ 1 if length > 0.
    const share = Math.max(1, Math.round((len / totalLength) * count));
    const samplesForPath = Math.min(share, count - i);
    if (samplesForPath <= 0) break;

    // Per-path Z offset for `model-wire`: alternate paths sit at
    // staggered depths so the contours fan into the depth plane.
    // `dome-fill`'s same `bulge` is reused as the amplitude so callers
    // don't need to retune Z for a different basis.
    const zSlot = zPerPath && pathEls.length > 1 ? bulge * 2 * (p / (pathEls.length - 1) - 0.5) : 0;

    const stride = len / samplesForPath;
    for (let k = 0; k < samplesForPath && i < count; k++, i++) {
      // Sample at the cell CENTRE so even at low counts the contour
      // reads as evenly stippled rather than clustered at one end.
      const s = (k + 0.5) * stride;
      const pt = pathEls[p].getPointAtLength(s);
      // Two samples flanking `s` give a centred-difference tangent
      // without depending on the path's parametric derivative.
      const eps = Math.min(stride * 0.5, 0.5);
      const ptAhead = pathEls[p].getPointAtLength(Math.min(len, s + eps));
      const ptBehind = pathEls[p].getPointAtLength(Math.max(0, s - eps));
      const dx = ptAhead.x - ptBehind.x;
      const dy = ptAhead.y - ptBehind.y;
      // Note: ptBehind/ahead are in SVG (Y-down) space. We flip Y at
      // render time below, but tangent direction must flip too — so
      // negate dy when computing the angle in normalised (Y-up) space.
      const angle = Math.atan2(-dy, dx);

      const nx = (pt.x - BRANDMARK_VIEWBOX.x) / BRANDMARK_VIEWBOX.width - 0.5;
      const ny = -((pt.y - BRANDMARK_VIEWBOX.y) / BRANDMARK_VIEWBOX.height - 0.5);

      // Per-particle Z jitter so the contour has thickness rather than
      // reading as a single shell. Same recipe as dome-fill.
      const jitter = (rand() - 0.5) * thickness;
      const z = zSlot + jitter;

      homes[i * 3] = nx;
      homes[i * 3 + 1] = ny;
      homes[i * 3 + 2] = z;

      seeds[i] = rand();
      // Outline particles are by definition the edge — keep edgeWeight
      // at 1 so the existing rim-accent / size-bump paths read.
      edgeWeights[i] = 1;
      angles[i] = angle;
    }

    if (i >= count) break;
  }

  // Outline sampling can fall short of `count` if integer rounding
  // over-allocated short paths. Slice to the true count so the GPU
  // doesn't paint garbage at the tail.
  if (i < count) {
    return {
      homes: homes.slice(0, i * 3),
      seeds: seeds.slice(0, i),
      edgeWeights: edgeWeights.slice(0, i),
      angles: angles.slice(0, i),
      count: i,
      basis,
      size: { x: 1, y: 1, z: bulge + thickness * 0.5 },
    };
  }

  return {
    homes,
    seeds,
    edgeWeights,
    angles,
    count: i,
    basis,
    size: { x: 1, y: 1, z: bulge + thickness * 0.5 },
  };
}

// ── edge-lattice ────────────────────────────────────────────────
// Dome-fill samples quantised to a regular grid. Each particle snaps
// to its containing cell centre so the mark reads as a disciplined
// raster field instead of a liquid stipple.
function sampleEdgeLattice(
  count: number,
  bulge: number,
  thickness: number,
  gridSnap: number,
  basis: BrandmarkBasis
): BrandmarkParticleSample {
  // Start from the dome-fill sample so we get the proper edge-weight
  // / seed plumbing, then quantise XY.
  const base = sampleDomeFill(count, bulge, thickness, basis);
  // De-duplicate snapped cells so a dense source doesn't paint 50
  // particles on top of each other (additive blending would burn out
  // those cells while leaving sparser regions undersampled).
  const cell = Math.max(0.005, gridSnap);
  const seen = new Set<number>();
  const keepIndex = new Int32Array(base.count);
  let keep = 0;
  for (let i = 0; i < base.count; i++) {
    const nx = base.homes[i * 3];
    const ny = base.homes[i * 3 + 1];
    const cx = Math.round(nx / cell);
    const cy = Math.round(ny / cell);
    // Compose into a single key — viewBox is [-0.5, 0.5], so the
    // span is ≤ ~1/gridSnap each axis; bit-pack with 14-bit slots.
    const key = (((cx + 8192) & 0x3fff) << 14) | ((cy + 8192) & 0x3fff);
    if (seen.has(key)) continue;
    seen.add(key);
    keepIndex[keep++] = i;
  }

  const cnt = keep;
  const homes = new Float32Array(cnt * 3);
  const seeds = new Float32Array(cnt);
  const edgeWeights = new Float32Array(cnt);
  const angles = new Float32Array(cnt);

  for (let k = 0; k < cnt; k++) {
    const i = keepIndex[k];
    const nx = Math.round(base.homes[i * 3] / cell) * cell;
    const ny = Math.round(base.homes[i * 3 + 1] / cell) * cell;
    // Re-derive dome on the SNAPPED position so the dome keeps a clean
    // shell instead of inheriting per-particle jitter that no longer
    // matches the quantised XY.
    const r2 = nx * nx + ny * ny;
    const rNorm = Math.min(1, r2 * 4);
    const dome = bulge * (1 - rNorm);
    const seedJitter = base.seeds[i] - 0.5;
    homes[k * 3] = nx;
    homes[k * 3 + 1] = ny;
    homes[k * 3 + 2] = dome + seedJitter * thickness;
    seeds[k] = base.seeds[i];
    edgeWeights[k] = base.edgeWeights[i];
    angles[k] = 0;
  }

  return {
    homes,
    seeds,
    edgeWeights,
    angles,
    count: cnt,
    basis,
    size: { x: 1, y: 1, z: bulge + thickness * 0.5 },
  };
}

// Type re-export for legacy callers that imported from this module.
export type { ShapeSample };
