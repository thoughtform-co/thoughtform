/**
 * The layer's tendrils (ADR-159 U7, owner 2026-10-17: "when we talk about
 * showing the Thoughtform context layer, I want to have some sort of nodes
 * or tendrils coming from a machine and plugging into the two parts of the
 * brain on both sides ... using our particle system").
 *
 * The slab stands upright between the parted hemispheres on the swarm's own
 * lattice, its face along the lattice's `i`, its thickness along `j`, which
 * is the brain's L axis at the isometric. A tendril is a FILE of that
 * lattice's dots (the swarm page's traces): it leaves a face of the slab
 * along `j`, steps up or down the face's height once (a riser, as a trace
 * jogs on a board), and runs on along `j` until it meets a hemisphere's
 * medial wall, where it plugs in. Files to the far half leave the slab's
 * hidden far face (the slab covers their roots); files to the near half
 * leave the engraved face and run under the near half, which covers their
 * tips.
 *
 * PURE: lattice arithmetic only. Every point is in device px from the
 * lattice's origin, the same frame `layerDots` builds the slab in.
 */

import type { Lattice } from "@/app/(internal)/test/stack-forms/swarm/dots";

/** A point of the slab's lattice: `I` along the face, `J` through it (0 the
    far face, `th` the near one), `T` up it. */
export const slabAt = (L: Lattice, I: number, J: number, T: number): [number, number] => [(I - J) * L.a * L.g, (I + J - 2 * T) * L.b * L.g];

export interface TendrilFile {
  /** Which hemisphere it plugs into. */
  side: "far" | "near";
  /** Its sites, slab to wall: x, y pairs in device px from the lattice origin. */
  pts: Int32Array;
}

/** Where on a face the files leave from, as shares of its side, and how far
    each steps up (+) or down (-) on its way, in shares of the side. */
const FAR: readonly [number, number, number][] = [
  [0.18, 0.34, 0.1],
  [0.3, 0.7, -0.12],
  [0.44, 0.46, 0.18],
  [0.56, 0.24, 0.14],
  [0.68, 0.62, -0.08],
  [0.82, 0.42, -0.16],
];
const NEAR: readonly [number, number, number][] = [
  [0.16, 0.56, -0.14],
  [0.28, 0.3, 0.12],
  [0.4, 0.78, -0.2],
  [0.6, 0.52, 0.1],
  [0.72, 0.2, 0.16],
  [0.86, 0.66, -0.1],
];

/**
 * The files for a slab `m` sites a side and `th` sites thick. `reach(side,
 * T)` is how many sites along `j` lie between that side's face and the
 * hemisphere's wall at the slab height `T`; `[tLo, tHi]` is the band of `T`
 * the walls stand in, so a file never plugs in above a crown or under a foot.
 */
export function tendrilFiles(
  L: Lattice,
  th: number,
  reach: (side: "far" | "near", T: number) => number,
  band: [number, number]
): TendrilFile[] {
  const m = L.m;
  const out: TendrilFile[] = [];
  const clampT = (T: number) => Math.max(band[0], Math.min(band[1], T));
  for (const [side, seeds] of [
    ["far", FAR],
    ["near", NEAR],
  ] as const) {
    const dir = side === "far" ? -1 : 1;
    for (const [fi, ft, step] of seeds) {
      const I = Math.round(fi * m);
      const T0 = clampT(Math.round(ft * m));
      const T1 = clampT(Math.round((ft + step) * m));
      const length = Math.max(4, Math.round(reach(side, T1)));
      const lead = Math.min(3, length - 1);
      const sites: [number, number][] = [];
      let J = side === "far" ? 0 : th;
      let T = T0;
      for (let k = 0; k < lead; k++) {
        J += dir;
        sites.push(slabAt(L, I, J, T));
      }
      // the riser: up or down the height once, a site at a time
      while (T !== T1) {
        T += T1 > T ? 1 : -1;
        sites.push(slabAt(L, I, J, T));
      }
      for (let k = lead; k < length; k++) {
        J += dir;
        sites.push(slabAt(L, I, J, T));
      }
      const pts = new Int32Array(sites.length * 2);
      sites.forEach(([x, y], i) => {
        pts[2 * i] = Math.round(x);
        pts[2 * i + 1] = Math.round(y);
      });
      out.push({ side, pts });
    }
  }
  return out;
}
