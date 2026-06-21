/**
 * Runtime-generated noise textures for the voxel media blocks.
 *
 * rogierdeboeve.com drives its cube displacement by sampling a tiling
 * Perlin-noise image (`tPerlin`) scrolled over time. Rather than ship a
 * binary PNG asset, we synthesise an equivalent **tiling value-noise**
 * `DataTexture` once on the client — same scrolling-relief technique,
 * zero asset to source or cache-bust.
 *
 * `makeValueNoiseTexture` builds seamless FBM value noise (wraps on both
 * axes so the scroll never seams). `makeBlueNoiseTexture` is a cheap
 * white-noise field used only for fragment dithering to kill banding.
 *
 * Both are deterministic (seeded) so the look is stable across mounts —
 * mirrors the deterministic-PRNG discipline in `lib/brandmark/sampleShape`.
 */

import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RedFormat,
  RepeatWrapping,
  RGBAFormat,
  UnsignedByteType,
} from "three";

/** Mulberry32 — small, fast, deterministic PRNG (same family as sampleShape). */
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

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Seamless 2D value noise sampled at (x, y) in [0,1) against a `lattice`
 * grid of `g × g` random values. Indices wrap modulo `g`, so the field
 * tiles perfectly — the time scroll in the shader never reveals a seam.
 */
function tileableValueNoise(lattice: Float32Array, g: number, x: number, y: number): number {
  const fx = x * g;
  const fy = y * g;
  const x0 = Math.floor(fx) % g;
  const y0 = Math.floor(fy) % g;
  const x1 = (x0 + 1) % g;
  const y1 = (y0 + 1) % g;
  const sx = smoothstep(fx - Math.floor(fx));
  const sy = smoothstep(fy - Math.floor(fy));

  const v00 = lattice[y0 * g + x0];
  const v10 = lattice[y0 * g + x1];
  const v01 = lattice[y1 * g + x0];
  const v11 = lattice[y1 * g + x1];

  const a = v00 + (v10 - v00) * sx;
  const b = v01 + (v11 - v01) * sx;
  return a + (b - a) * sy;
}

export interface NoiseTextureOptions {
  /** Texture resolution (square). 256 is plenty for smooth relief. */
  size?: number;
  /** FBM octaves — more = finer detail. */
  octaves?: number;
  /** Base lattice cells along each axis for octave 0. */
  baseFrequency?: number;
  /** Deterministic seed. */
  seed?: number;
}

/**
 * Build a single-channel (RED) tiling FBM value-noise texture, normalised
 * to [0,1]. Use the `.r` channel in the vertex shader for displacement.
 */
export function makeValueNoiseTexture(options: NoiseTextureOptions = {}): DataTexture {
  const { size = 256, octaves = 4, baseFrequency = 4, seed = 0x9e37 } = options;
  const rand = mulberry32(seed);

  // Pre-build one random lattice per octave (frequency doubles, gain halves).
  const lattices: { grid: number; values: Float32Array }[] = [];
  for (let o = 0; o < octaves; o++) {
    const grid = baseFrequency * 2 ** o;
    const values = new Float32Array(grid * grid);
    for (let i = 0; i < values.length; i++) values[i] = rand();
    lattices.push({ grid, values });
  }

  const data = new Uint8Array(size * size);
  let min = Infinity;
  let max = -Infinity;
  const raw = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      let amp = 1;
      let sum = 0;
      let norm = 0;
      for (const { grid, values } of lattices) {
        sum += amp * tileableValueNoise(values, grid, u, v);
        norm += amp;
        amp *= 0.5;
      }
      const val = sum / norm;
      raw[y * size + x] = val;
      if (val < min) min = val;
      if (val > max) max = val;
    }
  }

  const range = max - min || 1;
  for (let i = 0; i < raw.length; i++) {
    data[i] = Math.round(((raw[i] - min) / range) * 255);
  }

  const tex = new DataTexture(data, size, size, RedFormat, UnsignedByteType);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Cheap RGBA white-noise field for fragment dithering. Small (64²) and
 * `RepeatWrapping` so it tiles across the screen; the shader offsets it
 * by `gl_FragCoord` to break up colour banding in the fog gradient.
 */
export function makeBlueNoiseTexture(size = 64, seed = 0x1234): DataTexture {
  const rand = mulberry32(seed);
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const n = Math.round(rand() * 255);
    data[i * 4] = n;
    data[i * 4 + 1] = n;
    data[i * 4 + 2] = n;
    data[i * 4 + 3] = 255;
  }
  const tex = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
