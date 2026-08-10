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

import { primitiveD, primitiveLength, primitivePoint } from "./primitives";
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

/** `home` is normalized to [-0.5, 0.5] over the PLATE canvas so
 *  particle and plate renderings register pixel-for-pixel in overlay.
 *  `tone` is per-particle ink strength — stroke weight expressed as
 *  intensity, never as scatter (owner, 2026-08-10: the gaussian spray
 *  read as sloppy/low-res; a bind in particles is a STIPPLE — points
 *  exactly on the stroke, evenly spaced, nothing else). */
export interface BindSample {
  home: Float32Array;
  tone: Float32Array;
  rank: Float32Array;
  count: number;
}

/** One point every N authoring units — the stipple pitch. Points read
 *  as deliberate marks, not dust; the count DERIVES from total stroke
 *  length at this pitch (budget is a ceiling, not a target). */
export const SAMPLE_SPACING = 2.2;

/** Ink strength per stroke weight — hierarchy through tone. */
export function toneFor(weight: MarkPrimitive["weight"]): number {
  if (weight >= 1) return 0.95;
  if (weight >= 0.7) return 0.75;
  if (weight >= 0.5) return 0.58;
  return 0.42;
}

export function sampleBind(c: BindComposition, budget: number): BindSample {
  let marks = [...c.marks].sort((a, b) => a.order - b.order);
  let lens = marks.map(primitiveLength);
  let total = lens.reduce((s, l) => s + l, 0);

  // If the pitch wants more points than the budget allows, furniture
  // drops out of the sampling first (it stays on the SVG plate).
  if (total > 0 && Math.round(total / SAMPLE_SPACING) > budget) {
    const kept = marks.map((m, i) => ({ m, l: lens[i] })).filter(({ m }) => m.role !== "furniture");
    marks = kept.map(({ m }) => m);
    lens = kept.map(({ l }) => l);
    total = lens.reduce((s, l) => s + l, 0);
  }
  const count = Math.min(budget, Math.max(1, Math.round(total / SAMPLE_SPACING)));
  if (total === 0 || budget <= 0) {
    return {
      home: new Float32Array(0),
      tone: new Float32Array(0),
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
  const tone = new Float32Array(count);
  const rank = new Float32Array(count);
  const norm = PLATE_CANVAS.width;

  let k = 0;
  marks.forEach((m, i) => {
    const n = alloc[i];
    const t0 = toneFor(m.weight);
    for (let j = 0; j < n; j++, k++) {
      const t = (j + 0.5) / n;
      const [x, y] = primitivePoint(m, t);
      home[k * 2] = x / norm;
      home[k * 2 + 1] = y / norm;
      tone[k] = t0;
      rank[k] = k;
    }
  });

  return { home, tone, rank, count: k };
}
