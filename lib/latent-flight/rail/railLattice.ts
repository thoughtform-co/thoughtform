/**
 * lib/latent-flight/rail/railLattice — the rails in three dimensions.
 *
 * The 2D rail is the near cross-section of a lattice welded to the course:
 * each of the 13 ticks becomes a longitudinal STRING running the whole route
 * at that tick's height, on both sides, and the track becomes a RUNG that
 * repeats every `RUNG_SPACING` units. The cross-section's half extents are
 * whatever the live chrome measures at the glass depth, so with the ship
 * centred on the course the near strings land on the two tracks and the
 * rungs' ends on the ticks — and any lateral drift slides the lattice
 * against the chrome, which is the "am I on the rails" signal for free.
 *
 * Three-free: it emits typed arrays a `LineSegments` consumes.
 */

import { halfExtentsAt } from "../camera/fov";
import type { Course } from "../flight/course";
import { add, scale, type Vec3 } from "../pulsar";

export const TICKS = 13;
export const MAJORS: readonly number[] = [4, 8];
/** Depth of the glass: where the lattice's cross-section must meet the chrome. */
export const GLASS_DEPTH = 2.0;
export const RUNG_SPACING = 2;
/** How far the lattice is drawn ahead before it fogs out. */
export const LATTICE_SPAN = 40;

export interface RailRects {
  /** Track centre x, CSS px, left and right. */
  leftX: number;
  rightX: number;
  /** Rail box top and bottom, CSS px. */
  top: number;
  bottom: number;
}

export interface Lens {
  fovDeg: number;
  w: number;
  h: number;
}

/** The cross-section's half extents at the glass depth, from the chrome. */
export function latticeExtents(rects: RailRects, lens: Lens): { x: number; y: number; yTop: number } {
  const { hw, hh } = halfExtentsAt(GLASS_DEPTH, lens.fovDeg, lens.w / lens.h);
  const xL = ((rects.leftX / lens.w) * 2 - 1) * hw;
  const xR = ((rects.rightX / lens.w) * 2 - 1) * hw;
  const yT = (1 - (rects.top / lens.h) * 2) * hh;
  const yB = (1 - (rects.bottom / lens.h) * 2) * hh;
  return { x: (xR - xL) / 2, y: (yT - yB) / 2, yTop: yT };
}

/** A tick's height inside the cross-section (0 = top, 12 = bottom). */
export function tickY(k: number, halfY: number): number {
  return halfY - (2 * halfY * k) / (TICKS - 1);
}

export interface LatticeGeometry {
  /** Longitudinal strings: pairs of vertices per segment. */
  strings: Float32Array;
  stringRank: Float32Array;
  stringArc: Float32Array;
  /** Rungs: one vertical segment per side per spacing. */
  rungs: Float32Array;
  rungArc: Float32Array;
}

export function buildLattice(course: Course, halfX: number, halfY: number): LatticeGeometry {
  const strings: number[] = [];
  const stringRank: number[] = [];
  const stringArc: number[] = [];
  const { samples } = course;
  const at = (i: number, side: number, y: number): Vec3 =>
    add(add(samples[i].p, scale(samples[i].n, side * halfX)), scale(samples[i].b, y));
  for (const side of [-1, 1]) {
    for (let k = 0; k < TICKS; k++) {
      const y = tickY(k, halfY);
      const rank = MAJORS.includes(k) ? 1 : 0.55;
      for (let i = 1; i < samples.length; i++) {
        const a = at(i - 1, side, y);
        const c = at(i, side, y);
        strings.push(a[0], a[1], a[2], c[0], c[1], c[2]);
        stringRank.push(rank, rank);
        stringArc.push(samples[i - 1].arc, samples[i].arc);
      }
    }
  }
  const rungs: number[] = [];
  const rungArc: number[] = [];
  let nextArc = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].arc < nextArc) continue;
    nextArc = samples[i].arc + RUNG_SPACING;
    for (const side of [-1, 1]) {
      const top = at(i, side, tickY(0, halfY));
      const bottom = at(i, side, tickY(TICKS - 1, halfY));
      rungs.push(top[0], top[1], top[2], bottom[0], bottom[1], bottom[2]);
      rungArc.push(samples[i].arc, samples[i].arc);
    }
  }
  return {
    strings: Float32Array.from(strings),
    stringRank: Float32Array.from(stringRank),
    stringArc: Float32Array.from(stringArc),
    rungs: Float32Array.from(rungs),
    rungArc: Float32Array.from(rungArc),
  };
}
