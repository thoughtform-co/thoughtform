// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC — paths + the analytic particle sampler.
//
// Unlike `sampleShape` (fill-based, Path2D, canvas-dependent), a bind
// is LINE-WORK: every primitive knows its own length, so particles are
// distributed by arc length with pure math — SSR-safe, deterministic,
// testable in Node with no canvas mock.
//
// RANK = INSCRIPTION ORDER. Marks sample in `order` sequence, ascending
// t within each stroke, so a painter drawing `rank < progress·count`
// performs the ritual: contain → structure → bind → name → orient.
// ═══════════════════════════════════════════════════════════════════

import { createSeededRandom, hashString } from "@/lib/particle-geometry/rng";

import { primitiveD, primitiveLength, primitivePoint, primitiveTangent } from "./primitives";
import { PLATE_CANVAS, type BindComposition, type MarkPrimitive } from "./types";

export interface BindPath {
  d: string;
  weight: MarkPrimitive["weight"];
  role: MarkPrimitive["role"];
  order: number;
}

/** The composition as ordered SVG paths (the plate renderer's input). */
export function compositionPaths(c: BindComposition): BindPath[] {
  return [...c.marks]
    .sort((a, b) => a.order - b.order)
    .map((m) => ({ d: primitiveD(m), weight: m.weight, role: m.role, order: m.order }));
}

/** `ShapeSample`-shaped so a painter is a near line-for-line adaptation
 *  of `ServicesBrandmarkField`. `home` is normalized to [-0.5, 0.5]
 *  over the PLATE canvas so particle and plate renderings register
 *  pixel-for-pixel in overlay. */
export interface BindSample {
  home: Float32Array;
  seed: Float32Array;
  rank: Float32Array;
  count: number;
}

/** Below this many particles per unit of stroke, the drawing reads as
 *  dust — furniture drops out of the sampling first (it stays on the
 *  SVG plate). */
const MIN_DENSITY = 0.55;

export function sampleBind(c: BindComposition, count: number, seedKey: string): BindSample {
  let marks = [...c.marks].sort((a, b) => a.order - b.order);
  let lens = marks.map(primitiveLength);
  let total = lens.reduce((s, l) => s + l, 0);

  if (total > 0 && count / total < MIN_DENSITY) {
    const kept = marks.map((m, i) => ({ m, l: lens[i] })).filter(({ m }) => m.role !== "furniture");
    marks = kept.map(({ m }) => m);
    lens = kept.map(({ l }) => l);
    total = lens.reduce((s, l) => s + l, 0);
  }
  if (total === 0 || count <= 0) {
    return {
      home: new Float32Array(0),
      seed: new Float32Array(0),
      rank: new Float32Array(0),
      count: 0,
    };
  }

  // Largest-remainder allocation so Σnᵢ = count exactly.
  const exact = lens.map((l) => (count * l) / total);
  const alloc = exact.map(Math.floor);
  let remaining = count - alloc.reduce((s, n) => s + n, 0);
  const byFrac = exact
    .map((e, i) => ({ frac: e - Math.floor(e), i }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; k < byFrac.length && remaining > 0; k++, remaining--) {
    alloc[byFrac[k].i]++;
  }

  const home = new Float32Array(count * 2);
  const seed = new Float32Array(count * 2);
  const rank = new Float32Array(count);
  const rng = createSeededRandom(hashString(seedKey));
  const norm = PLATE_CANVAS.width;

  let k = 0;
  marks.forEach((m, i) => {
    const n = alloc[i];
    // Heavier strokes scatter wider — weight expressed with no second pass.
    const sigma = 0.15 + 0.2 * m.weight;
    for (let j = 0; j < n; j++, k++) {
      const t = (j + 0.5) / n;
      const [x, y] = primitivePoint(m, t);
      const [tx, ty] = primitiveTangent(m, t);
      const off = rng.gaussian(0, sigma);
      home[k * 2] = (x - ty * off) / norm;
      home[k * 2 + 1] = (y + tx * off) / norm;
      seed[k * 2] = rng.next() * Math.PI * 2;
      seed[k * 2 + 1] = rng.next() * Math.PI * 2;
      rank[k] = k;
    }
  });

  return { home, seed, rank, count: k };
}
