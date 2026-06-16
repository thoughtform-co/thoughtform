/**
 * seamPixelize — pure dispersal math for the corridor → Services
 * seam pixel field.
 *
 * Given a sampled brandmark point cloud (`sampleShape({ paths:
 * BRANDMARK_FULL_PATHS, ... })` produces `home` / `seed` / `rank`
 * arrays, see `lib/brandmark/sampleShape.ts`) and the current
 * `seamMorph` 0..1 clock written by `useCorridorExitScroll`, this
 * module returns each particle's final viewport-pixel position,
 * grid-snapped to the gateway grid, plus its per-particle alpha and
 * gold↔dawn colour mix.
 *
 * Kept pure + render-agnostic so the `CorridorSeamPixelField` 2D
 * canvas can drive its `fillRect`s straight from the result, and the
 * unit tests can pin the contract (assemble at 0, fully dispersed /
 * faded at 1, deterministic, grid-snapped) without booting a
 * canvas.
 *
 * Design intent:
 *   - **At `seamMorph = 0`** every particle sits exactly on its home
 *     silhouette position (snapped to the grid) at full alpha — the
 *     pixel field paints the brandmark as a solid mark.
 *   - **As `seamMorph` ramps** each particle drifts outward (radial
 *     scatter from the glyph centre) AND lifts upward (the gateway
 *     "exhale"), with a rank-based stagger so the dispersal reads
 *     as a wave rather than a uniform burst.
 *   - **At `seamMorph = 1`** alpha is 0 for every particle; the
 *     field is functionally invisible and the layer can be unmounted
 *     by the caller.
 *
 * The square-pixel grid snap (`GRID = 3`) is a deliberate
 * stylistic borrow from the `/test/gateway` `ImageParticleGateway`
 * hero. ADR-015 retired the square aesthetic for the brandmark
 * painters proper; this module is a SEAM artifact (not one of the
 * capped brandmark painters) so the square look is allowed and
 * documented in `sentinel/decisions/021-...`.
 */

/** Default pixel grid for the seam field, mirroring
 *  `ImageParticleGateway`'s `GRID = 3` so the visual cadence
 *  matches the gateway hero we riff off. */
export const SEAM_PIXEL_GRID = 3;

/** Default fraction of the seamMorph band consumed by rank-stagger.
 *  Each particle starts dispersing at `(rank / count) * stagger`
 *  and finishes at `1`, so a STAGGER of 0.4 means the lowest-rank
 *  particles get the full clock and the highest-rank particles
 *  only act over the last 60%. Tuned for a wave that reads as a
 *  cascade rather than a uniform burst. */
export const SEAM_RANK_STAGGER = 0.4;

/** Default vertical lift magnitude as a multiple of the brandmark's
 *  half-width. ~1.6 reads as "the mark exhales upward by roughly its
 *  own size" by full dispersal. */
export const SEAM_LIFT_FACTOR = 1.6;

/** Default radial scatter magnitude as a multiple of the brandmark's
 *  half-width. Smaller than the vertical lift so the dispersal feels
 *  like an upward exhale rather than an isotropic explosion. */
export const SEAM_SCATTER_FACTOR = 0.5;

/** Aspect ratio (height / width) of the canonical Thoughtform
 *  brandmark, derived from `lib/brandmark/shapes.ts` viewBox `0 0
 *  430.99 436`. Re-exported here so the seam pixel field and the
 *  actor share one constant for the Services-centred geometry. */
export const SEAM_BRANDMARK_ASPECT = 436 / 430.99;

/**
 * getServicesTargetHalfPx — half-width (in viewport pixels) of the
 * brandmark when it is held centred in `#services` after the
 * corridor has finished dissipating.
 *
 * Mirrors the CSS clamp written by the
 * `data-services-brandmark="hold|fade"` rule in `home-v2.css`
 * (`width: clamp(220px, 21vw, 360px)`) divided by 2:
 *
 *   - lower-bound (`110px`): keeps the mark readable on narrow
 *     viewports.
 *   - preferred (`vw * 0.105`): the 21vw clamp midpoint.
 *   - upper-bound (`180px`): caps it on wide screens so the mark
 *     never blows out as a hero asset.
 *
 * Used by both `ProjectedBrandmarkActor` (welded → centred lerp
 * target) and `CorridorSeamPixelField` (pixel cloud size + centre).
 * Keeping ONE function ensures the SVG glyph and the pixel cloud
 * read at the same size at the moment of handoff.
 */
export function getServicesTargetHalfPx(vw: number): number {
  return Math.max(110, Math.min(180, vw * 0.105));
}

export interface SeamParticleInput {
  /** Normalised home X in `[-0.5, 0.5]` from `sampleShape`. (0,0)
   *  is the brandmark viewBox centre. */
  homeX: number;
  /** Normalised home Y in `[-0.5, 0.5]` from `sampleShape`. */
  homeY: number;
  /** Stable per-particle seed pair from `sampleShape.seed`. The
   *  raw values can sit anywhere on the real line; the math here
   *  reads them through `fract()` so no external normalisation is
   *  required. Used for per-particle direction jitter and lift
   *  variance — DO NOT use for stagger (use `rank` for that, so
   *  the stagger reads as an ordered wave instead of a noisy
   *  flicker). */
  seedX: number;
  seedY: number;
  /** Particle rank in `[0, count)` from `sampleShape.rank`.
   *  Drives the ordered dispersal stagger. */
  rank: number;
  /** Total particle count — denominator for the rank stagger.
   *  Must be ≥ 1; values ≤ 0 are treated as 1 to avoid divide-by-
   *  zero. */
  count: number;
}

export interface SeamLayout {
  /** Viewport pixel centre of the brandmark — typically `(vw/2,
   *  vh/2)` because `data-services-brandmark="hold"` CSS centres
   *  the SVG glyph there. */
  centerX: number;
  centerY: number;
  /** Half-width of the brandmark in viewport pixels. Pair with
   *  `getServicesTargetHalfPx(vw)` from `ProjectedBrandmarkActor`
   *  so the pixel field reads at the same size as the SVG glyph
   *  it covers. */
  halfPx: number;
  /** Glyph aspect ratio (height / width). For the canonical
   *  brandmark this is `436 / 430.99 ≈ 1.0117`. */
  aspect: number;
  /** Grid snap size in viewport pixels. Defaults to
   *  `SEAM_PIXEL_GRID` (3). */
  gridSize?: number;
  /** 0..1 dispersal clock from
   *  `depthGatewayStore.transform.seamMorph`. Clamped internally
   *  so callers don't need to clamp. */
  seamMorph: number;
  /** Optional override for the rank-stagger fraction. Defaults to
   *  `SEAM_RANK_STAGGER` (0.4). */
  rankStagger?: number;
  /** Optional override for the vertical lift factor. Defaults to
   *  `SEAM_LIFT_FACTOR` (1.6). */
  liftFactor?: number;
  /** Optional override for the radial scatter factor. Defaults to
   *  `SEAM_SCATTER_FACTOR` (0.5). */
  scatterFactor?: number;
}

export interface SeamParticleOutput {
  /** Snapped X in viewport pixels. Always a multiple of
   *  `layout.gridSize`. */
  x: number;
  /** Snapped Y in viewport pixels. Always a multiple of
   *  `layout.gridSize`. */
  y: number;
  /** Per-particle alpha in `[0, 1]`. Fades to 0 by full
   *  dispersal. */
  alpha: number;
  /** Per-particle gold↔dawn mix in `[0, 1]`. 0 = pure gold,
   *  1 = pure dawn. Stable per particle (depends only on
   *  `seedX`). */
  colorMix: number;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Floor-snap a value to the nearest grid multiple. Matches
 *  `ImageParticleGateway`'s `snap` helper so the pixel grids
 *  align if they ever co-render. */
export function snapToGrid(value: number, grid: number): number {
  if (grid <= 0) return value;
  return Math.floor(value / grid) * grid;
}

/** Read a stable scalar in `[0, 1]` from the raw seed value
 *  `sampleShape` produces. The sampler emits `nextRandom() *
 *  1000`, so we just take the fractional part of `value / 1000`
 *  to recover the original `[0, 1]` PRNG output. */
function fract01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const t = (value / 1000) % 1;
  return t < 0 ? t + 1 : t;
}

/**
 * dispersePixel — map a single brandmark sample through the seam
 * morph clock to its final snapped screen position, alpha, and
 * colour mix.
 *
 * Pure: same input always produces the same output. Allocation
 * free in the hot path (returns a fresh object literal — callers
 * that need true zero-alloc should inline this against a
 * pre-allocated row).
 */
export function dispersePixel(particle: SeamParticleInput, layout: SeamLayout): SeamParticleOutput {
  const grid = layout.gridSize ?? SEAM_PIXEL_GRID;
  const stagger = layout.rankStagger ?? SEAM_RANK_STAGGER;
  const liftFactor = layout.liftFactor ?? SEAM_LIFT_FACTOR;
  const scatterFactor = layout.scatterFactor ?? SEAM_SCATTER_FACTOR;
  const morph = clamp01(layout.seamMorph);

  const safeCount = particle.count > 0 ? particle.count : 1;
  const rankFrac = clamp01(particle.rank / Math.max(1, safeCount - 1));

  // Per-particle local clock: each particle's own dispersal phase
  // begins at `rankFrac * stagger` and fills to 1 by `seamMorph =
  // 1`. Lower-rank particles get the full clock; the highest rank
  // only acts over the last `(1 - stagger)` of the band — a
  // cascade rather than a uniform burst.
  const offset = rankFrac * stagger;
  const localT = clamp01((morph - offset) / Math.max(0.0001, 1 - stagger));

  // Home pixel position. Pre-snap so at `seamMorph = 0` every
  // particle sits exactly at the SVG silhouette (no sub-pixel
  // jitter when the field replaces the glyph).
  const halfWidth = layout.halfPx;
  const halfHeight = layout.halfPx * layout.aspect;
  const homePxX = layout.centerX + particle.homeX * halfWidth * 2;
  const homePxY = layout.centerY + particle.homeY * halfHeight * 2;

  let x: number;
  let y: number;
  let alpha: number;

  if (localT <= 0) {
    // Pre-stagger: pinned at home, fully visible. Skipping the
    // dispersal arithmetic also keeps the assembled phase free of
    // any floating-point drift.
    x = homePxX;
    y = homePxY;
    alpha = 1;
  } else if (localT >= 1) {
    // Post-stagger: snap to fully faded so the layer can be
    // unmounted at `seamMorph = 1` without a ghost particle.
    x = homePxX;
    y = homePxY;
    alpha = 0;
  } else {
    // Mid-stagger: drift radially + lift upward.
    //
    // Direction: a base angle from the glyph centre to the home
    // position (so particles on the outer arc fly further from
    // centre, particles near the centre cross gently outward),
    // jittered by a per-particle seed so neighbouring grid cells
    // don't fly along the same line.
    const baseAngle = Math.atan2(particle.homeY, particle.homeX);
    const angleJitter = (fract01(particle.seedX) - 0.5) * Math.PI * 0.5;
    const angle = baseAngle + angleJitter;

    // Scatter magnitude: a fraction of the brandmark's half-width
    // scaled by `localT^1.5` so the early frames stay tight and
    // the back of the band carries the tail of the wave.
    const scatterMag = halfWidth * scatterFactor * Math.pow(localT, 1.5);
    const liftVariance = 0.6 + fract01(particle.seedY) * 0.8; // 0.6..1.4
    const lift = halfWidth * liftFactor * localT * liftVariance;

    x = homePxX + Math.cos(angle) * scatterMag;
    y = homePxY + Math.sin(angle) * scatterMag - lift;

    // Alpha: ease-out fade so particles read for most of the band
    // and finish quickly at the end. `1 - localT^2` keeps the
    // mark visible across the front half while still hitting 0
    // at full dispersal.
    alpha = 1 - localT * localT;
  }

  return {
    x: snapToGrid(x, grid),
    y: snapToGrid(y, grid),
    alpha,
    colorMix: fract01(particle.seedX),
  };
}
