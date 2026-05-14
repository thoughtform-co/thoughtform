/**
 * sampleShape — sample uniform points from inside an SVG path union.
 *
 * Uses the proven Path2D + `ctx.isPointInPath()` hit-test technique
 * (same primitive as `components/particles/ParticleWordmarkMorph.tsx`)
 * BUT with a **stratified sampler** instead of uniform-random rejection.
 *
 * Why stratified: uniform-random rejection sampling has Poisson
 * clumping — even at high counts, neighbouring points can land on top
 * of each other and leave visible gaps elsewhere. At density 1.0 the
 * brandmark needs to read as a *solid filled mark* indistinguishable
 * from the SVG; stratified sampling closes the visible gaps by placing
 * exactly one sample per grid cell (with intra-cell jitter for
 * naturalness). Coverage is essentially uniform across the filled area.
 *
 * Algorithm:
 *   1. Compute an `N × N` grid sized so `N² ≈ count / fillRatio` where
 *      `fillRatio` ≈ ratio of filled to total area. `N` is the upper
 *      bound on cells we'll visit; only those whose jittered sample
 *      lands inside the filled paths contribute a sample.
 *   2. For each cell in shuffled order (so density clipping by rank
 *      stays spatially uniform), jitter inside the cell up to `K`
 *      tries; first hit becomes the sample.
 *   3. Stop once `count` samples are collected.
 *
 * Output coordinates are normalised to `[-0.5, 0.5]` relative to the
 * viewBox so the shader can scale the cloud into any target rect by
 * multiplying by the rect's half-size. (0, 0) = viewBox centre.
 *
 * Deterministic Mulberry32-style PRNG keyed off `shapeKey` keeps the
 * cloud stable across mounts / Fast Refresh / screenshot tests.
 *
 * Results are memoised by `(shapeKey, count)` so the rasterise + sample
 * loop runs once per shape per density.
 *
 * See ADR-011 § Density tiers and `brandmark-particle` skill.
 */

export interface ShapeSample {
  /** XY pairs in `[-0.5, 0.5]`. Length = `count * 2`. (0,0) = viewBox centre. */
  home: Float32Array;
  /** Stable per-particle seed XY pairs for shader noise. Length = `count * 2`. */
  seed: Float32Array;
  /** Stable per-particle rank in `[0, count)`, shuffled. Length = `count`. */
  rank: Float32Array;
  /** Number of particles actually sampled (≤ requested count). */
  count: number;
  /** Approximate ratio of filled area to viewBox area, in [0, 1].
   *  Used by the shader (and tooling) to size individual points so
   *  the cloud reads as a solid mark at full density. Measured at
   *  sample time by hit-testing a uniform grid over the viewBox. */
  fillRatio: number;
}

export interface SampleOpts {
  /** Stable identifier for this shape (used as part of the cache key). */
  shapeKey: string;
  /** SVG path `d` strings. The union of all paths is the shape. */
  paths: readonly string[];
  /** SVG viewBox of the source geometry. */
  viewBox: { x: number; y: number; width: number; height: number };
  /** Target number of particles. */
  count: number;
}

const cache = new Map<string, ShapeSample>();

/** Empty sample, returned during SSR or when no canvas context is
 *  available. The shape will be re-sampled on the client at mount. */
const EMPTY_SAMPLE: ShapeSample = {
  home: new Float32Array(0),
  seed: new Float32Array(0),
  rank: new Float32Array(0),
  count: 0,
  fillRatio: 0,
};

export function sampleShape(opts: SampleOpts): ShapeSample {
  const cacheKey = `${opts.shapeKey}:${opts.count}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (typeof document === "undefined") return EMPTY_SAMPLE;

  const { paths, viewBox, count } = opts;
  if (count <= 0 || paths.length === 0) return EMPTY_SAMPLE;

  const canvas = document.createElement("canvas");
  // Rasterise at the viewBox's own size so isPointInPath returns true
  // for points genuinely inside the fill. We don't actually paint the
  // path — we just need the path's hit-test geometry resolved.
  canvas.width = Math.max(1, Math.ceil(viewBox.width));
  canvas.height = Math.max(1, Math.ceil(viewBox.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) return EMPTY_SAMPLE;

  // Translate so the canvas origin matches the viewBox origin. Without
  // this, a viewBox with non-zero (x, y) would shift the path off-canvas
  // and every isPointInPath would miss.
  ctx.translate(-viewBox.x, -viewBox.y);

  const path2Ds = paths.map((d) => new Path2D(d));
  const isInside = (x: number, y: number): boolean => {
    for (const p of path2Ds) {
      if (ctx.isPointInPath(p, x, y)) return true;
    }
    return false;
  };

  // Deterministic Mulberry32-style PRNG seeded from the shape key.
  // This keeps the sampled cloud stable across mounts.
  let prng = hashStringToUint32(opts.shapeKey) || 0x9e3779b9;
  const nextRandom = () => {
    prng = (prng + 0x6d2b79f5) | 0;
    let t = prng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // === Step 1: estimate fillRatio from a coarse uniform grid ===
  // A 64x64 grid (~4k samples) is plenty for a fill ratio estimate
  // accurate to ~1%. We hit-test cell centres; the result tells us
  // how oversized the stratified grid below needs to be.
  const FILL_PROBE_DIM = 64;
  let filledCells = 0;
  for (let gy = 0; gy < FILL_PROBE_DIM; gy++) {
    const py = viewBox.y + ((gy + 0.5) / FILL_PROBE_DIM) * viewBox.height;
    for (let gx = 0; gx < FILL_PROBE_DIM; gx++) {
      const px = viewBox.x + ((gx + 0.5) / FILL_PROBE_DIM) * viewBox.width;
      if (isInside(px, py)) filledCells++;
    }
  }
  const fillRatio = Math.max(0.01, filledCells / (FILL_PROBE_DIM * FILL_PROBE_DIM));

  // === Step 2: choose stratified grid size ===
  // We want `count` filled-cell hits from an `N × N` grid where the
  // expected number of filled cells is `N² * fillRatio`. Add 30%
  // headroom so an unlucky run still yields enough samples.
  const targetGridCells = Math.ceil((count * 1.3) / fillRatio);
  const N = Math.ceil(Math.sqrt(targetGridCells));
  const cellW = viewBox.width / N;
  const cellH = viewBox.height / N;
  // Per-cell rejection cap. With cellArea×fillRatio expected probability
  // of hit on average, 8 tries beats >99% of edge cells that are
  // partially inside the shape.
  const PER_CELL_TRIES = 8;

  // === Step 3: visit cells in shuffled order ===
  // Visiting in raster order would mean the first N samples are all
  // from one row — density clipping by rank would then carve weird
  // horizontal bands out of the cloud. A pre-shuffled traversal
  // ensures the first M ranks form a spatially uniform subset for
  // every M ≤ count.
  const cellOrder = new Uint32Array(N * N);
  for (let k = 0; k < cellOrder.length; k++) cellOrder[k] = k;
  for (let k = cellOrder.length - 1; k > 0; k--) {
    const j = Math.floor(nextRandom() * (k + 1));
    const tmp = cellOrder[k];
    cellOrder[k] = cellOrder[j];
    cellOrder[j] = tmp;
  }

  const home = new Float32Array(count * 2);
  const seed = new Float32Array(count * 2);
  const rank = new Float32Array(count);
  let i = 0;

  for (let c = 0; c < cellOrder.length && i < count; c++) {
    const cell = cellOrder[c];
    const cy = Math.floor(cell / N);
    const cx = cell - cy * N;
    const x0 = viewBox.x + cx * cellW;
    const y0 = viewBox.y + cy * cellH;
    let placed = false;
    for (let t = 0; t < PER_CELL_TRIES; t++) {
      const x = x0 + nextRandom() * cellW;
      const y = y0 + nextRandom() * cellH;
      if (isInside(x, y)) {
        home[i * 2] = (x - viewBox.x) / viewBox.width - 0.5;
        home[i * 2 + 1] = (y - viewBox.y) / viewBox.height - 0.5;
        seed[i * 2] = nextRandom() * 1000;
        seed[i * 2 + 1] = nextRandom() * 1000;
        rank[i] = i;
        i++;
        placed = true;
        break;
      }
    }
    void placed;
  }

  // Trim trailing zeros if we hit grid exhaustion before count
  // (rare — the 30% headroom + per-cell retries should keep this
  // path off the hot path on the brandmark / typical shapes).
  const result: ShapeSample =
    i === count
      ? { home, seed, rank, count: i, fillRatio }
      : {
          home: home.slice(0, i * 2),
          seed: seed.slice(0, i * 2),
          rank: rank.slice(0, i),
          count: i,
          fillRatio,
        };
  cache.set(cacheKey, result);
  return result;
}

/** Hash a string to a uint32 seed for the PRNG. FNV-1a. */
function hashStringToUint32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Clear the shape cache. Useful for HMR / tests. */
export function clearShapeCache(): void {
  cache.clear();
}
