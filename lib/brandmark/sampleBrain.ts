/**
 * sampleBrain — procedural brain-like point cloud + synapse links.
 *
 * Phase 5 of the 2026-06-06 wrap-around revision (ADR-018): the gold
 * geodesic substrate cage was replaced with an abstract brain
 * artifact so the substrate layer of the "navigate the intelligence"
 * choreography reads as the THING being navigated (a brain) instead
 * of a generic geodesic shell.
 *
 * The brain is composed of:
 *
 *   - Two ellipsoidal HEMISPHERES separated along the X-axis by a
 *     small longitudinal-fissure gap. Each hemisphere is sampled on
 *     a Fibonacci-spiral lattice + jitter so the cloud reads as
 *     stratified noise rather than a regular grid.
 *   - SULCI DISPLACEMENT — each surface point is offset along the
 *     ellipsoid normal by multi-frequency 3D pseudo-noise so the
 *     cloud has a roughened, brain-like surface (not a clean
 *     ellipsoid).
 *   - SYNAPSE LINKS — sparse hairline segments joining nearest-
 *     neighbour pairs of points, painted additively. Reads as the
 *     "neural" texture of the artifact without descending into a
 *     literal medical illustration.
 *
 * The sampler is PURE — given the same seed it returns the same
 * point set + link list. Used by `ShellSubstrate` (Navigate
 * substrate layer).
 */

/** Mulberry32 PRNG. Same construction as `artifactPrimitives.ts`'s
 *  scatter helpers so the brain artifact's randomness is consistent
 *  with the rest of the intelligence-artifact family. */
function makePrng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BrainPointSample {
  /** Flat [x,y,z, x,y,z, ...] in LOCAL space (centred on origin). */
  positions: Float32Array;
  /** Per-point seed in [0, 1] for shader twinkle. */
  seeds: Float32Array;
  /** Number of points actually written (== input `count`). */
  count: number;
}

export interface SampleBrainOptions {
  /** Total point budget across both hemispheres. */
  count: number;
  /** PRNG seed (deterministic). Defaults to `1`. */
  seed?: number;
  /** Ellipsoid X half-axis (per hemisphere, before fissure shift). */
  radiusX?: number;
  /** Ellipsoid Y half-axis. */
  radiusY?: number;
  /** Ellipsoid Z half-axis. */
  radiusZ?: number;
  /** Longitudinal-fissure half-gap. Each hemisphere is shifted by
   *  ±this along X. */
  fissure?: number;
  /** Sulci displacement amplitude (along ellipsoid normal). */
  sulciAmplitude?: number;
}

/** Build a stratified surface sample over two ellipsoidal hemispheres
 *  with sulci-like noise displacement. Returns positions + per-point
 *  seeds. */
export function sampleBrainPoints({
  count,
  seed = 1,
  radiusX = 0.38,
  radiusY = 0.32,
  radiusZ = 0.5,
  fissure = 0.05,
  sulciAmplitude = 0.055,
}: SampleBrainOptions): BrainPointSample {
  const prng = makePrng(seed);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  // Even split between left + right hemispheres.
  const leftCount = Math.floor(count / 2);
  const rightCount = count - leftCount;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const isLeft = i < leftCount;
    const localIdx = isLeft ? i : i - leftCount;
    const localCount = isLeft ? leftCount : rightCount;

    // Fibonacci-sphere stratified sample on the unit sphere.
    const idx = localIdx + 0.5;
    const yUnit = 1 - (2 * idx) / localCount;
    const ringR = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
    const theta = goldenAngle * localIdx;
    let x = Math.cos(theta) * ringR;
    let y = yUnit;
    let z = Math.sin(theta) * ringR;

    // Small jitter so the lattice doesn't read as too regular.
    const jitter = 0.03;
    x += (prng() - 0.5) * jitter;
    y += (prng() - 0.5) * jitter;
    z += (prng() - 0.5) * jitter;

    // Project to ellipsoid.
    let px = x * radiusX;
    let py = y * radiusY;
    let pz = z * radiusZ;

    // Sulci displacement: 3-octave pseudo-noise from layered sins.
    // Cheap and deterministic — good enough for a roughened surface.
    const n1 = Math.sin(px * 14 + py * 9) * Math.cos(pz * 11);
    const n2 = Math.sin(py * 19 + pz * 7) * Math.cos(px * 13);
    const n3 = Math.sin(pz * 22 + px * 5) * Math.cos(py * 17);
    const noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

    // Ellipsoid normal = gradient of (x/RX)^2 + (y/RY)^2 + (z/RZ)^2.
    const gx = px / (radiusX * radiusX);
    const gy = py / (radiusY * radiusY);
    const gz = pz / (radiusZ * radiusZ);
    const gLen = Math.max(1e-6, Math.hypot(gx, gy, gz));
    const nx = gx / gLen;
    const ny = gy / gLen;
    const nz = gz / gLen;

    px += nx * noise * sulciAmplitude;
    py += ny * noise * sulciAmplitude;
    pz += nz * noise * sulciAmplitude;

    // Apply longitudinal-fissure offset.
    px += isLeft ? -fissure : fissure;

    positions[i * 3] = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;
    seeds[i] = prng();
  }

  return { positions, seeds, count };
}

export interface SynapseLinkOptions {
  /** Brain points (flat XYZ buffer) to source links from. */
  positions: Float32Array;
  /** Number of source points. */
  count: number;
  /** Desired link count. */
  linkCount: number;
  /** PRNG seed (independent of the points seed so links can shuffle
   *  without resampling the brain). Defaults to `7`. */
  seed?: number;
  /** Per-source candidate fan: number of random candidate targets to
   *  score for each link. Higher = tighter neighbours (slower). 6 is
   *  the sweet spot for ~1800-point brains. */
  candidates?: number;
}

/** Build a flat `LineSegments` position buffer of synapse links by
 *  pairing each source point with its nearest of a small candidate
 *  fan. Doesn't run a full kNN — cheap nearest-among-random reads as
 *  organic neural connectivity at this density. */
export function buildSynapseLinks({
  positions,
  count,
  linkCount,
  seed = 7,
  candidates = 6,
}: SynapseLinkOptions): Float32Array {
  const prng = makePrng(seed);
  const out = new Float32Array(linkCount * 2 * 3);

  for (let i = 0; i < linkCount; i++) {
    const srcIdx = Math.floor(prng() * count);
    const sx = positions[srcIdx * 3];
    const sy = positions[srcIdx * 3 + 1];
    const sz = positions[srcIdx * 3 + 2];

    let bestIdx = -1;
    let bestDist = Infinity;
    for (let k = 0; k < candidates; k++) {
      const candIdx = Math.floor(prng() * count);
      if (candIdx === srcIdx) continue;
      const dx = sx - positions[candIdx * 3];
      const dy = sy - positions[candIdx * 3 + 1];
      const dz = sz - positions[candIdx * 3 + 2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = candIdx;
      }
    }
    if (bestIdx < 0) bestIdx = (srcIdx + 1) % count;

    out[i * 6] = sx;
    out[i * 6 + 1] = sy;
    out[i * 6 + 2] = sz;
    out[i * 6 + 3] = positions[bestIdx * 3];
    out[i * 6 + 4] = positions[bestIdx * 3 + 1];
    out[i * 6 + 5] = positions[bestIdx * 3 + 2];
  }

  return out;
}
