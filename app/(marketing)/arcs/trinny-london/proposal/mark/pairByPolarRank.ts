/**
 * pairByPolarRank — which particle goes where (ADR-095).
 *
 * The corridor's parked mark has one particle per slot on the Thoughtform
 * wireframe (`aTarget3D`, group-local, ±0.5 half-extent). A morph needs a
 * SECOND home per slot, and which target point a slot is handed decides
 * whether the flight reads as a shape transforming or as a scramble — every
 * pairing in this repo before this one was `i % n`, which works only when
 * the two shapes nest (full mark ↔ its own ring).
 *
 * These two do not nest, but they share a topology: both are a RING around
 * a set of BARS. Thoughtform's ink sits 54 % at r ≥ 0.8·R (a broken ring
 * plus the bar ends), Trinny's ring at r ≥ 0.89·R with its monogram under
 * 0.71·R. So one radius split classifies both (`split` 0.42 in the
 * 0.5-half-extent space: the base's inner ring edge ≈ 0.447, the target's
 * 0.444, the monogram's furthest corner ≈ 0.36), and within a class the
 * slots and the target points are sorted by polar angle and paired by RANK.
 * Ring flows to ring with the least rotation; the bars flow radially into
 * the monogram at the same angular rank. A sort, not a search — O(n log n),
 * deterministic, no library.
 *
 * When a class has more target points than slots the rank map takes a
 * uniform SUBSET (`floor(k·|T|/|B|)`); the builder oversamples the target so
 * this is always the case and no two slots share a point. An empty target
 * class falls back to the whole target so every slot is always assigned.
 *
 * THREE-FREE (unit-tested in vitest).
 */

/** Ring / interior split, in the mark's 0.5-half-extent space. */
export const PAIR_SPLIT_RADIUS = 0.42;

/** 0 = the ring, 1 = the interior. Plain numbers, not a `const enum` — SWC
 *  transpiles per file and cannot inline one across modules. */
export type MarkClass = 0 | 1;
export const MARK_CLASS_RING: MarkClass = 0;
export const MARK_CLASS_INNER: MarkClass = 1;

export function classifyRadius(x: number, y: number, split = PAIR_SPLIT_RADIUS): MarkClass {
  return Math.hypot(x, y) >= split ? MARK_CLASS_RING : MARK_CLASS_INNER;
}

interface Keyed {
  i: number;
  angle: number;
  r: number;
  z: number;
}

function keyed(buf: Float32Array, i: number): Keyed {
  const x = buf[i * 3];
  const y = buf[i * 3 + 1];
  return { i, angle: Math.atan2(y, x), r: Math.hypot(x, y), z: buf[i * 3 + 2] };
}

/** Total order: angle, then radius, then depth, then index (a tiebreak so
 *  equal points still sort identically across runs and engines). */
function byPolar(a: Keyed, b: Keyed): number {
  return a.angle - b.angle || a.r - b.r || a.z - b.z || a.i - b.i;
}

/**
 * Re-order `target` into `base`'s slot order. `base` holds `count` slots
 * (length ≥ `count * 3`); `target` holds any number of points. Returns a
 * `count * 3` buffer where slot `i`'s point is the target point of the same
 * class and polar rank.
 */
export function assignByPolarRank(
  base: Float32Array,
  target: Float32Array,
  count: number,
  split = PAIR_SPLIT_RADIUS
): Float32Array {
  const out = new Float32Array(count * 3);
  const targetCount = Math.floor(target.length / 3);
  if (count === 0 || targetCount === 0) return out;

  const baseByClass: Keyed[][] = [[], []];
  for (let i = 0; i < count; i++) {
    const k = keyed(base, i);
    baseByClass[classifyRadius(base[i * 3], base[i * 3 + 1], split)].push(k);
  }
  const targetByClass: Keyed[][] = [[], []];
  const allTargets: Keyed[] = [];
  for (let i = 0; i < targetCount; i++) {
    const k = keyed(target, i);
    allTargets.push(k);
    targetByClass[classifyRadius(target[i * 3], target[i * 3 + 1], split)].push(k);
  }
  allTargets.sort(byPolar);

  for (let c = 0; c < 2; c++) {
    const slots = baseByClass[c];
    if (slots.length === 0) continue;
    const pool = targetByClass[c].length > 0 ? targetByClass[c] : allTargets;
    slots.sort(byPolar);
    if (pool !== allTargets) pool.sort(byPolar);
    const n = slots.length;
    const m = pool.length;
    for (let k = 0; k < n; k++) {
      const t = pool[Math.min(m - 1, Math.floor((k * m) / n))].i;
      const o = slots[k].i * 3;
      out[o] = target[t * 3];
      out[o + 1] = target[t * 3 + 1];
      out[o + 2] = target[t * 3 + 2];
    }
  }
  return out;
}
