/**
 * instrument — THE BED every round-four plate stands on (ADR-140, round four).
 *
 * The owner's read of round three: "too boring". Measured, the figures were
 * small objects in a large void with nothing around them, while every
 * reference he gave — the ZERO slab, the teleportation chamber, the CRT map,
 * the Evangelion plates — fills its frame and carries a stated datum: a
 * graticule across the whole glass, ruler ticks on the edges, a slab under
 * the floor, frames where readouts sit. THE FRAME IS THE INSTRUMENT.
 *
 * So a plate is the figure on a BED: a dotted graticule running past the
 * figure's own floor to the crop's edges, beaded rules every `major` units,
 * ticks along the bed's two front edges, the slab's stacked outlines below,
 * and the bed's front edges a step brighter. All of it the quietest thing on
 * the plate (`grid` and `structure` roles, never gold), so the figure stays
 * the loudest. Words and readouts are DOM, seated in the bed's margin.
 *
 * ⚠ NO CHAMFER ON A PROJECTED FACE (ADR-130 U4): the bed's outline is the
 * rhombus the stage basis makes of a rectangle; the corner law lives on the
 * DOM readout plates, which are screen rectangles.
 *
 * Three-free and pure, seeded.
 */

import type { StageLine } from "../stageGeom";
import {
  dotsAlong,
  lattice,
  population,
  slabLayers,
  ticksAlongA,
  ticksAlongB,
  W,
  V,
  type ParticlePopulation,
  type WorldPt,
} from "../stageParticles";
import { run } from "./shared";

export interface BedSpec {
  seed: number;
  /** The figure's own floor, in world. */
  floor: { a0: number; a1: number; b0: number; b1: number };
  /** How far the bed runs past the floor on each side, world units. */
  ext: { a0: number; a1: number; b0: number; b1: number };
  /** The graticule's cell pitch. */
  pitch: number;
  /** A beaded rule every `major` units. */
  major: number;
  slab: { layers: number; step: number };
  reveal: readonly [number, number];
}

export interface Bed {
  pops: ParticlePopulation[];
  lines: StageLine[];
  /** The bed's rectangle, for the crop and the readout seats. */
  rect: { a0: number; a1: number; b0: number; b1: number };
  corners: WorldPt[];
}

/** Ruler-tick length and the slab's bead pitch, world units. */
const TICK = 0.3;
const SLAB_PITCH = 0.12;

export function instrumentBed(s: BedSpec): Bed {
  const a0 = s.floor.a0 - s.ext.a0;
  const a1 = s.floor.a1 + s.ext.a1;
  const b0 = s.floor.b0 - s.ext.b0;
  const b1 = s.floor.b1 + s.ext.b1;
  const pops: ParticlePopulation[] = [];
  const lines: StageLine[] = [];
  const [r0, r1] = s.reveal;

  /* The graticule: cells you can count, across the whole glass. */
  pops.push(
    population("bed-cells", lattice(a0, a1, b0, b1, 0, s.pitch), {
      role: "grid",
      shape: "cell",
      size: 4.6,
      opacity: 0.4,
      reveal: [r0, r1],
      twinkle: 0.08,
    })
  );

  /* The major rules: beads, both ways, at a pitch finer than the cells. */
  const rules: WorldPt[] = [];
  const firstA = Math.ceil(a0 / s.major) * s.major;
  for (let a = firstA; a <= a1 + 1e-9; a += s.major)
    rules.push(...dotsAlong(s.seed + 11, [W(a, b0, 0), W(a, b1, 0)], 0.09));
  const firstB = Math.ceil(b0 / s.major) * s.major;
  for (let b = firstB; b <= b1 + 1e-9; b += s.major)
    rules.push(...dotsAlong(s.seed + 12, [W(a0, b, 0), W(a1, b, 0)], 0.09));
  pops.push(
    population("bed-rules", rules, {
      role: "grid",
      shape: "dot",
      size: 2.8,
      opacity: 0.32,
      reveal: [r0, r1 + 0.05],
    })
  );

  /* The bed's two front edges, a step brighter, with their ruler ticks. */
  pops.push(
    population("bed-front-a", dotsAlong(s.seed + 13, [W(a0, b0, 0), W(a1, b0, 0)], 0.045), {
      role: "structure",
      shape: "dot",
      size: 3.2,
      opacity: 0.6,
      reveal: [r0, r1],
    }),
    population("bed-front-b", dotsAlong(s.seed + 14, [W(a0, b0, 0), W(a0, b1, 0)], 0.045), {
      role: "structure",
      shape: "dot",
      size: 3.0,
      opacity: 0.52,
      reveal: [r0, r1],
    }),
    population("bed-ticks-a", ticksAlongA(a0, a1, b0, 0, s.major / 2, TICK), {
      role: "structure",
      shape: "dot",
      size: 3.0,
      opacity: 0.6,
      reveal: [r0, r1],
    }),
    population("bed-ticks-b", ticksAlongB(b0, b1, a0, 0, s.major / 2, TICK), {
      role: "structure",
      shape: "dot",
      size: 3.0,
      opacity: 0.6,
      reveal: [r0, r1],
    }),
    population(
      "bed-slab",
      slabLayers(s.seed + 15, a0, a1, b0, b1, s.slab.layers, s.slab.step, SLAB_PITCH),
      {
        role: "grid",
        shape: "dot",
        size: 2.6,
        opacity: 0.42,
        reveal: [r0 + 0.04, r1 + 0.1],
        sizeVar: 0.3,
      }
    )
  );

  /* The bed's outline, crisp. */
  lines.push({
    ...run(
      "bed-outline",
      [W(a0, b0, 0), W(a1, b0, 0), W(a1, b1, 0), W(a0, b1, 0), W(a0, b0, 0)].map((p) => V(p)),
      { role: "structure", width: 1.0, opacity: 0.4, reveal: [r0, r1] }
    ),
    batch: true,
  });

  const rect = { a0, a1, b0, b1 };
  const corners = [W(a0, b0, 0), W(a1, b0, 0), W(a1, b1, 0), W(a0, b1, 0)];
  /* The slab's lowest layer, so the crop holds it. */
  corners.push(W(a0, b0, -s.slab.layers * s.slab.step));
  return { pops, lines, rect, corners };
}
