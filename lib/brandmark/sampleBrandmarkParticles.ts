/**
 * sampleBrandmarkParticles — stratified silhouette sample of the
 * Thoughtform brandmark with faked depth, for the GPGPU physics core.
 *
 * Approach (mirrors `intelligence-artifact/SubstrateBrandmark`'s
 * `buildBrandmarkCloud` and v7 `BrandmarkSilhouettePoints`):
 *
 *   1. Sample N points from the 2D silhouette of `BRANDMARK_FULL_PATHS`
 *      via `sampleShape`. This guarantees the silhouette READS as the
 *      brandmark — same recipe the v7 silhouette point cloud uses.
 *   2. Add a forward-domed Z so the cloud has actual thickness without
 *      breaking the silhouette: particles near the centre bulge toward
 *      the camera, particles at the edges sit flat.
 *   3. Add a tiny per-particle Z jitter so the cloud has a "fog of
 *      points" feel rather than reading as a single flat shell.
 *
 * An earlier iteration walked the beveled `ExtrudeGeometry` mesh with
 * `MeshSurfaceSampler`. That gave true 3D depth but distributed
 * particles across the front cap / back cap / side walls by face area,
 * which clustered most points on the caps. Combined with additive
 * blending and high count, the resulting cloud saturated into a
 * featureless blob and the brandmark silhouette was lost. Silhouette
 * sampling + dome + jitter gives the same depth read with a clean
 * brandmark silhouette guaranteed.
 *
 * Output coordinate range:
 *
 *   - X / Y in `[-0.5, 0.5]` (normalised to the SVG viewBox).
 *   - Z in `[-thickness/2, bulge + thickness/2]` — small relative to
 *     XY, by design. Consumers scale the wrapping `<group>` by
 *     `2 * worldHalfExtent` to land at world scale; depth is
 *     proportional to that without any extra math.
 */

import { sampleShape } from "./sampleShape";
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

export interface BrandmarkParticleSample {
  /** 3D home positions, length = `count * 3`. XY in `[-0.5, 0.5]`,
   *  Z derived from dome + jitter (small relative to XY). */
  homes: Float32Array;
  /** Per-particle phase in `[0, 1)`. Drives shader pulse / per-particle
   *  variation. Length = `count`. */
  seeds: Float32Array;
  /** Per-particle "edge proximity" hint in `[0, 1]`. 0 at the cloud
   *  centre, ~1 at the silhouette extremes. Length = `count`. */
  edgeWeights: Float32Array;
  /** Number of particles actually sampled (≤ requested count — the
   *  stratified sampler may exhaust its grid before reaching count
   *  on very thin shapes). */
  count: number;
  /** Approximate cloud bounding box — `x`/`y` are 1.0 (full
   *  normalised range), `z` reflects the dome+jitter envelope. */
  size: { x: number; y: number; z: number };
}

export interface SampleBrandmarkParticlesOptions {
  /** Target particle count. */
  count: number;
  /** Forward dome amplitude in normalised units. Default 0.18. */
  bulge?: number;
  /** Per-particle Z jitter amplitude in normalised units. Default 0.06. */
  thickness?: number;
}

/**
 * Sample the brandmark silhouette into a 3D point cloud with depth.
 *
 * Synchronous — `sampleShape` rasterises through a hidden 2D canvas,
 * so this only runs in the client. Returns an empty (`count = 0`)
 * sample during SSR; the caller should treat that as a render skip.
 */
export function sampleBrandmarkParticles(
  opts: SampleBrandmarkParticlesOptions
): BrandmarkParticleSample {
  const bulge = opts.bulge ?? DEFAULT_BULGE;
  const thickness = opts.thickness ?? DEFAULT_THICKNESS;

  const sample = sampleShape({
    shapeKey: BRANDMARK_SHAPE_KEYS.full,
    paths: BRANDMARK_FULL_PATHS,
    viewBox: BRANDMARK_VIEWBOX,
    count: Math.max(1, Math.floor(opts.count)),
  });

  const cnt = sample.count;
  const homes = new Float32Array(cnt * 3);
  const seeds = new Float32Array(cnt);
  const edgeWeights = new Float32Array(cnt);

  for (let i = 0; i < cnt; i++) {
    const nx = sample.home[i * 2];
    // sampleShape returns Y in screen-down convention (origin top
    // of viewBox). Flip so the brandmark reads upright in 3D space.
    const ny = -sample.home[i * 2 + 1];

    // Forward dome: r²-falloff from centre, scaled by `bulge`. At
    // r ≈ 0 the particle sits at +bulge; at r ≈ 0.5 it's flat (z = 0).
    // Clamp `r2 * 4` to [0, 1] so values past 0.5 just hold flat.
    const r2 = nx * nx + ny * ny;
    const rNorm = Math.min(1, r2 * 4);
    const dome = bulge * (1 - rNorm);

    // Per-particle thickness jitter. `sample.seed.x` is in [0, 1000];
    // wrap to [-0.5, 0.5] for a centred jitter.
    const seedJitter = (sample.seed[i * 2] % 1) - 0.5;
    const z = dome + seedJitter * thickness;

    homes[i * 3] = nx;
    homes[i * 3 + 1] = ny;
    homes[i * 3 + 2] = z;

    // Phase in [0, 1) — distinct from the jitter draw above so a
    // particle's pulse phase isn't 1:1 with its Z offset.
    seeds[i] = (sample.seed[i * 2 + 1] % 1000) / 1000;

    // edgeWeight ramps with normalised radius — particles near the
    // silhouette extremes get higher weight (used for subtle tint
    // variation in the fragment shader).
    edgeWeights[i] = rNorm;
  }

  return {
    homes,
    seeds,
    edgeWeights,
    count: cnt,
    size: { x: 1, y: 1, z: bulge + thickness * 0.5 },
  };
}
