/* Small things every drawing needs. PURE. */

import type { Pt, Tone } from "./stack";

/** A seeded generator: the same seed, the same numbers, on every machine. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number in 0..1 from two integers and a seed, with no state. */
export function hash2(ix: number, iy: number, seed = 0): number {
  let h =
    Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** The 4 x 4 ordered-dither matrix, 0..15. */
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const;
export const bayer = (ix: number, iy: number) => (BAYER4[((iy & 3) << 2) | (ix & 3)] + 0.5) / 16;

/** The lab's four colours: the ground and the three plates' tones. */
export const HEX = {
  void: "#0a0908",
  bone: "#ebe3d6",
  gold: "#caa554",
  green: "#7a9e6a",
} as const;
export const toneHex = (t: Tone) => HEX[t];
/** The matching custom property, for CSS and SVG paint. */
export const toneVar = (t: Tone) => `var(--sf-${t})`;
/** A tone at `a` of itself over the ground, as one opaque colour. */
export const over = (t: Tone, a: number) =>
  `color-mix(in srgb, var(--sf-${t}) ${(a * 100).toFixed(1)}%, var(--sf-void))`;

const r2 = (n: number) => Math.round(n * 100) / 100;
export const ptsOf = (pts: readonly Pt[]) => pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join(" ");
export const pathOf = (pts: readonly Pt[], close = false) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${r2(x)} ${r2(y)}`).join("") + (close ? "Z" : "");
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** Where `t` sits between `a` and `b`, clamped to 0..1. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
