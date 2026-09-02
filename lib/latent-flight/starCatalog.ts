/**
 * lib/latent-flight/starCatalog — seeded star and dust layouts, three-free.
 *
 * Mulberry32 (the holo program's own PRNG) so a capture reproduces exactly.
 * Directions are uniform on the sphere (z = 2u − 1, θ = 2πv); magnitudes
 * follow `pow(u, 2.2)` so most stars are faint and a bright few carry the
 * field. Every array is a flat typed array ready for a `BufferAttribute`.
 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface StarLayout {
  positions: Float32Array;
  mag: Float32Array;
  phase: Float32Array;
  count: number;
}

/** Stars on a spherical shell between `rMin` and `rMax`. */
export function buildStars(count: number, seed: number, rMin: number, rMax: number): StarLayout {
  const rnd = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const mag = new Float32Array(count);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const z = 2 * rnd() - 1;
    const theta = 2 * Math.PI * rnd();
    const s = Math.sqrt(Math.max(0, 1 - z * z));
    const r = rMin + (rMax - rMin) * rnd();
    positions[i * 3] = s * Math.cos(theta) * r;
    positions[i * 3 + 1] = s * Math.sin(theta) * r;
    positions[i * 3 + 2] = z * r;
    mag[i] = Math.pow(rnd(), 2.2);
    phase[i] = rnd();
  }
  return { positions, mag, phase, count };
}

export interface DustLayout {
  positions: Float32Array;
  seed: Float32Array;
  count: number;
}

/**
 * Foreground dust in a box ahead of the camera: x ±`hx`, y ±`hy`, z in
 * [−span, 0]. The shader wraps z camera-relative, so the box is a phase
 * window, not a place. Nothing within a unit of the axis inside the near
 * six units — a mote crossing the boresight is the one thing this layer
 * may not do.
 */
export function buildDust(count: number, seed: number, hx: number, hy: number, span: number): DustLayout {
  const rnd = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  let i = 0;
  while (i < count) {
    const x = (rnd() * 2 - 1) * hx;
    const y = (rnd() * 2 - 1) * hy;
    const z = -rnd() * span;
    if (-z < 6 && Math.abs(x) < 1 && Math.abs(y) < 1) continue;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    seeds[i] = rnd();
    i++;
  }
  return { positions, seed: seeds, count };
}
