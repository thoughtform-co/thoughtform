/**
 * lib/latent-flight/noiseTexture — one seeded, tileable noise field.
 *
 * Every textured surface in the vista (the dust band, the disc's heat, the
 * jets' turbulence, the beam, the isoline haze) samples ONE RGBA texture:
 *   R  value-noise FBM, 4 octaves
 *   G  a second FBM at another seed, 3 octaves
 *   B  white hash — the dither the .00–.06 alpha ramps need so they never band
 *   A  255
 *
 * Tileable by construction (the lattice wraps), seeded so every capture
 * matches, and THREE-FREE: it returns bytes; the scene wraps them in a
 * `DataTexture`. Built once on the main thread (~30 ms at 256²) and cached.
 */

export const NOISE_SIZE = 256;

/** Integer hash → [0, 1). Deterministic across engines. */
function hash(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Tileable value noise on an `n × n` lattice sampled at (u, v) ∈ [0, 1). */
function valueNoise(u: number, v: number, n: number, seed: number): number {
  const x = u * n;
  const y = v * n;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const x1 = (x0 + 1) % n;
  const y1 = (y0 + 1) % n;
  const a = hash(x0, y0, seed);
  const b = hash(x1, y0, seed);
  const c = hash(x0, y1, seed);
  const d = hash(x1, y1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(u: number, v: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let n = 4;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(u, v, n, seed + o * 101) * amp;
    norm += amp;
    amp *= 0.5;
    n *= 2;
  }
  return sum / norm;
}

let cached: { size: number; seed: number; data: Uint8Array<ArrayBuffer> } | null = null;

export function buildNoise(seed = 7, size = NOISE_SIZE): Uint8Array<ArrayBuffer> {
  if (cached && cached.size === size && cached.seed === seed) return cached.data;
  // Backed by a plain ArrayBuffer (never a SharedArrayBuffer) so the bytes
  // satisfy `BufferSource` for the DataTexture.
  const data = new Uint8Array(new ArrayBuffer(size * size * 4));
  let i = 0;
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      data[i++] = Math.round(fbm(u, v, 4, seed) * 255);
      data[i++] = Math.round(fbm(u, v, 3, seed + 977) * 255);
      data[i++] = Math.round(hash(x, y, seed + 31) * 255);
      data[i++] = 255;
    }
  }
  cached = { size, seed, data };
  return data;
}
