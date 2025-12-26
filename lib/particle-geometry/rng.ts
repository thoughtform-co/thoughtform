// ═══════════════════════════════════════════════════════════════════
// DETERMINISTIC PSEUDO-RANDOM NUMBER GENERATOR
// Seeded PRNG for reproducible particle shapes
// ═══════════════════════════════════════════════════════════════════

/**
 * Mulberry32 PRNG - fast, high-quality 32-bit PRNG
 * Returns a function that generates numbers in [0, 1)
 */
export function createRNG(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a seeded random instance with convenience methods
 */
export interface SeededRandom {
  /** Next random number in [0, 1) */
  next(): number;
  /** Random number in [min, max) */
  range(min: number, max: number): number;
  /** Random integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** Random boolean with given probability (default 0.5) */
  bool(probability?: number): boolean;
  /** Pick random element from array */
  pick<T>(arr: T[]): T;
  /** Shuffle array in place */
  shuffle<T>(arr: T[]): T[];
  /** Gaussian distribution with given mean and stddev */
  gaussian(mean?: number, stddev?: number): number;
  /** Random angle in radians [0, 2π) */
  angle(): number;
  /** Random point on unit sphere (returns [x, y, z]) */
  unitSphere(): [number, number, number];
  /** Random point in unit disk (returns [x, y]) */
  unitDisk(): [number, number];
}

export function createSeededRandom(seed: number): SeededRandom {
  const rng = createRNG(seed);
  let hasSpare = false;
  let spare = 0;

  return {
    next: rng,

    range(min: number, max: number): number {
      return min + rng() * (max - min);
    },

    int(min: number, max: number): number {
      return Math.floor(min + rng() * (max - min + 1));
    },

    bool(probability = 0.5): boolean {
      return rng() < probability;
    },

    pick<T>(arr: T[]): T {
      return arr[Math.floor(rng() * arr.length)];
    },

    shuffle<T>(arr: T[]): T[] {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    gaussian(mean = 0, stddev = 1): number {
      // Box-Muller transform
      if (hasSpare) {
        hasSpare = false;
        return spare * stddev + mean;
      }
      let u: number, v: number, s: number;
      do {
        u = rng() * 2 - 1;
        v = rng() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const mul = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * mul;
      hasSpare = true;
      return mean + stddev * u * mul;
    },

    angle(): number {
      return rng() * Math.PI * 2;
    },

    unitSphere(): [number, number, number] {
      // Uniform distribution on unit sphere
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const sinPhi = Math.sin(phi);
      return [sinPhi * Math.cos(theta), sinPhi * Math.sin(theta), Math.cos(phi)];
    },

    unitDisk(): [number, number] {
      // Rejection sampling for uniform distribution in unit disk
      let x: number, y: number;
      do {
        x = rng() * 2 - 1;
        y = rng() * 2 - 1;
      } while (x * x + y * y > 1);
      return [x, y];
    },
  };
}

/**
 * Hash a string to a numeric seed
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Combine multiple seeds into one
 */
export function combineSeed(...seeds: number[]): number {
  let combined = 0;
  for (const seed of seeds) {
    combined = ((combined << 5) - combined + seed) | 0;
  }
  return Math.abs(combined);
}
