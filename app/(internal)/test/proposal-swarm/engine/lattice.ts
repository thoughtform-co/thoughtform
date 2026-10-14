/* The act's one lattice, and the stack's pose from a gap. PURE.

   S4·E picks its lattice for a canvas of its own. Here the stack has a seat
   on a page, so the lattice is picked for the seat: the widest plate, of
   `dots.ts`'s own three steps, that is no wider than the stack the proposal
   draws there. One lattice serves the whole act, so a dot is the same dot,
   on the same sites, from the opening to the steps. */

import { type Pose, PROPOSAL_UNIT, SIDE } from "../../stack-forms/model";
import type { Lattice } from "../../stack-forms/swarm/dots";

/** A site step along a plate's x, in grains: `dots.ts`'s three. */
export const STEPS = [
  [9, 5],
  [7, 4],
  [5, 3],
] as const;
/** Sites a unit a plate may be given here. */
export const GRAINS = [3, 4, 5] as const;

export interface Pick {
  a: number;
  b: number;
  /** Sites a unit. */
  n: number;
}

/** A grain in device px: the device pixel ratio, rounded (`fitLattice`'s). */
const grainOf = (dpr: number) => Math.max(1, Math.round(dpr));

/** A plate's width on screen, CSS px. */
export const plateWidth = (p: Pick, dpr: number) => (2 * SIDE * p.n * p.a * grainOf(dpr)) / dpr;

/** A plate may stand a little past the proposal's own stack, or well short
    of it, and still be seated. */
const FIT = { over: 1.06, under: 0.78 };
/** Which grain is tried first. Four sites a unit is the grain S4·E was
    picked at (2 838 dots): the layer keeps two rows a stratum and the team's
    rail its ticks. Three is the next best; five only on a very large seat. */
const PREFER = [4, 3, 5] as const;

/**
 * The lattice for a stack `target` CSS px wide: of the preferred grain, the
 * widest plate that is seated. `n` holds the sites a unit to one value (the
 * page's `?n=`), so two grains can be set side by side at one size.
 */
export function pickLattice(target: number, dpr: number, n?: number): Pick {
  let least: Pick = { a: 5, b: 3, n: n ?? GRAINS[0] };
  let leastW = Infinity;
  for (const sites of n ? [n] : PREFER) {
    let best: Pick | null = null;
    let bestW = -1;
    for (const [a, b] of STEPS) {
      const p = { a, b, n: sites };
      const w = plateWidth(p, dpr);
      if (w < leastW) {
        least = p;
        leastW = w;
      }
      if (w <= target * FIT.over && w >= target * FIT.under && w > bestW) {
        best = p;
        bestW = w;
      }
    }
    if (best) return best;
  }
  return least;
}

/** The lattice itself, its origin at 0, 0: a seat moves it, not the scene. */
export function latticeAt(p: Pick, dpr: number): Lattice {
  return { a: p.a, b: p.b, g: grainOf(dpr), n: p.n, m: SIDE * p.n, ox: 0, oy: 0, w: 0, h: 0 };
}

/** The stack's pose for a gap between plates stated in the proposal's own
    drawing units (26 to a unit): closed is 72, the steps open it further. */
export function poseOfGap(gap: number): Pose {
  const pitch = gap / PROPOSAL_UNIT;
  return { open: 0, pitch, lift: [pitch, 0, -pitch] };
}
