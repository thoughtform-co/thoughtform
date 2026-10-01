/**
 * SPECTRUM · INSTRUMENT — tool ↔ collaborator, as one field changing state on
 * an instrument bed (ADR-140, round four).
 *
 * Round three's dissolve (`spectrumDissolve`) kept and re-cut: the slab lies
 * on a BED that runs to the glass's edges, the lattice is finer and its cells
 * larger (a grid you can count, at the gyro's dot size), the cloud it comes
 * apart into keeps a constant drift, the rail's beads FLOW from software
 * toward intelligence, the gold seat is a disc in a ring with a dense core
 * and a strike that pulses down to the rail, and the three columns read out
 * as framed keys under the bed's front edge.
 *
 * The reading is the spectrum's one sentence — software is deterministic,
 * intelligence is probabilistic.
 */

import { mulberry32 } from "@/components/arcs/framing/iso";

import type { StageView, Vec3 } from "../stageFit";
import type { HoloStageSpec, StageLine, StageSweep } from "../stageGeom";
import {
  dotsAlong,
  dotsAlongT,
  flowing,
  motesAround,
  motesIn,
  population,
  tendrilDotsT,
  W,
  V,
  type ParticlePopulation,
  type WorldPt,
} from "../stageParticles";
import { instrumentBed } from "./instrument";
import { abz, frameFor, run, type ABZ, type DirLabel, type Direction } from "./shared";

const L = 12;
const D = 2.4;
const SEED = 9303;
const SWEEP: StageSweep = { axis: 0, from: -1.6, to: L + 1.6, window: [0.06, 0.8], width: 0.36 };

export const SPECTRUMINSTRUMENT_VIEW: StageView = "stage";

function boundsOf(points: readonly Vec3[]) {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const p of points) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], p[i]);
      max[i] = Math.max(max[i], p[i]);
    }
  }
  return { min: min as Vec3, max: max as Vec3 };
}

/** The lattice's order along the rail: 1 at the tool's end, 0 at the collaborator's. */
const orderAt = (a: number) => Math.max(0, Math.min(1, 1 - (a / L - 0.28) / 0.46));

/** Where AI sits on the rail: both at once, a little past the middle. */
const SEAT_A = L * 0.56;

export function spectrumInstrument(view: StageView = SPECTRUMINSTRUMENT_VIEW): Direction {
  const pops: ParticlePopulation[] = [];
  const lines: StageLine[] = [];
  const labels: DirLabel[] = [];
  const anchors: ABZ[] = [];
  const rnd = mulberry32(SEED);

  /* ── The bed, the slab and the rail ──────────────────────────────────── */
  const bed = instrumentBed({
    seed: SEED,
    floor: { a0: 0, a1: L, b0: 0, b1: D },
    ext: { a0: 1.3, a1: 1.3, b0: 1.2, b1: 1.0 },
    pitch: 0.4,
    major: 2,
    slab: { layers: 4, step: 0.09 },
    reveal: [0, 0.38],
  });
  pops.push(...bed.pops);
  lines.push(...bed.lines);
  pops.push(
    flowing("rail", dotsAlongT(SEED + 2, [W(0, D / 2, 0.02), W(L, D / 2, 0.02)], 0.045, 0, 0.1), {
      role: "structure",
      shape: "dot",
      size: 3.6,
      opacity: 0.74,
      reveal: [0, 0.35],
      flow: { period: 0.5 },
    }),
    population("front-edge", dotsAlong(SEED + 3, [W(0, 0, 0), W(L, 0, 0)], 0.045), {
      role: "structure",
      shape: "dot",
      size: 3.2,
      opacity: 0.6,
      reveal: [0, 0.4],
    })
  );

  /* ── The field: one lattice changing phase along the rail ────────────── */
  /* ⚠ A LATTICE IS COUNTABLE ONLY WHILE ITS COLUMNS DO NOT STACK (grammar.md
     §7.5): at 0.22 with seven layers the rows fused into vertical bars in the
     parallel view. Four layers at 0.26, and the cells a step quieter. */
  const PITCH = 0.26;
  const cells: WorldPt[] = [];
  const cloud: WorldPt[] = [];
  const cloudOrder: number[] = [];
  const Z0 = 0.3;
  const Z1 = 1.1;
  const na = Math.round((L - 1.5) / PITCH);
  const nb = Math.round((D - 0.5) / PITCH);
  const nz = Math.round((Z1 - Z0) / PITCH);
  for (let i = 0; i <= na; i++) {
    const a = 0.3 + i * PITCH;
    const o = orderAt(a);
    for (let j = 0; j <= nb; j++) {
      for (let k = 0; k <= nz; k++) {
        const p = W(a, 0.25 + j * PITCH, Z0 + k * PITCH);
        if (rnd() < o) cells.push(p);
        else {
          const loose = 1 - o;
          cloud.push(
            W(
              p.a + (rnd() - 0.5) * 0.3 * loose,
              p.b + (rnd() - 0.5) * 0.3 * loose,
              p.z + (rnd() - 0.5) * 0.35 * loose + loose * 0.15
            )
          );
          cloudOrder.push(o * 0.6);
        }
      }
    }
  }
  pops.push(
    population("cells", cells, {
      role: "structure",
      shape: "cell",
      size: 5.2,
      opacity: 0.58,
      reveal: [0, 0.35],
      twinkle: 0.1,
    }),
    population("cloud", cloud, {
      role: "structure",
      shape: "dot",
      size: 4.0,
      opacity: 0.6,
      reveal: [0, 0.4],
      order: cloudOrder,
      drift: 0.14,
      sizeVar: 0.9,
      twinkle: 0.6,
    })
  );

  /* ── The three columns: registration marks on the rail, read out below ── */
  const { rect } = bed;
  const cols = [
    { id: "tool", a: L * 0.17, key: "TOOL", value: "Executes commands" },
    { id: "both", a: L * 0.5, key: "AI SITS HERE", value: "Both, at once" },
    { id: "collab", a: L * 0.83, key: "COLLABORATOR", value: "Interprets intent" },
  ];
  for (const c of cols) {
    const p = W(c.a, D / 2, 0.02);
    pops.push(
      population(`col-${c.id}`, [p], {
        role: "structure",
        shape: "cross",
        size: 16,
        opacity: 0.85,
        reveal: [0, 0.35],
      }),
      population(
        `col-stub-${c.id}`,
        dotsAlong(SEED + 10, [W(c.a, -0.05, 0), W(c.a, rect.b0 + 0.15, 0)], 0.06),
        { role: "structure", shape: "dot", size: 3.0, opacity: 0.5, reveal: [0, 0.35] }
      )
    );
    labels.push({
      id: `readout-${c.id}`,
      key: c.key,
      text: c.value,
      at: W(c.a, rect.b0 - 0.55, 0),
      anchor: "middle",
      kind: "readout",
      lit: c.id === "both",
    });
    anchors.push(W(c.a, rect.b0 - 2.0, 0));
  }

  /* ── The seat: where AI sits, the one gold thing ─────────────────────── */
  const seat = W(SEAT_A, D / 2, Z1 + 0.75);
  pops.push(
    /* The seat is a LOCATOR on the rail, not a body — the reading is the field
       around it — so it is the one gold object that stays small: a ring over
       a disc over a dense core, ~8 % of the frame's shorter side. */
    population("seat-ring", [seat], {
      role: "gold",
      shape: "ring",
      size: 44,
      opacity: 0.95,
      reveal: [0, 0.35],
      lit: true,
    }),
    population("seat-disc", [seat], {
      role: "gold",
      shape: "disc",
      size: 20,
      opacity: 0.95,
      reveal: [0, 0.35],
      lit: true,
    }),
    population("seat-core", motesAround(SEED + 20, seat, 0.14, 280), {
      role: "gold",
      shape: "dot",
      size: 3.6,
      opacity: 0.85,
      reveal: [0, 0.35],
      lit: true,
      twinkle: 0.4,
      sizeVar: 0.6,
    }),
    population("seat-halo", motesAround(SEED + 21, seat, 0.34, 320), {
      role: "accent",
      shape: "dot",
      size: 3.0,
      opacity: 0.45,
      reveal: [0, 0.4],
      order: 0,
      drift: 0.06,
      sizeVar: 0.9,
      twinkle: 0.7,
    }),
    flowing(
      "seat-strike",
      tendrilDotsT(
        SEED + 22,
        W(seat.a, seat.b, seat.z - 0.16),
        W(SEAT_A, D / 2, 0.03),
        7,
        0.4,
        0.04
      ),
      {
        role: "accent",
        shape: "dot",
        size: 3.4,
        opacity: 0.85,
        reveal: [0.2, 0.55],
        twinkle: 0.6,
        flow: { period: 0.25 },
      }
    )
  );
  labels.push({
    id: "seat",
    text: "AI SITS HERE",
    at: seat,
    dy: -34,
    anchor: "middle",
    kind: "name",
    lit: true,
  });
  anchors.push(W(seat.a, seat.b, seat.z + 1.0));

  /* ── Dust ────────────────────────────────────────────────────────────── */
  pops.push(
    population(
      "dust",
      motesIn(SEED + 30, { a: -1.0, b: -0.8, z: 0.05, w: L + 2.0, d: D + 1.6, h: Z1 + 1.0 }, 700),
      {
        role: "structure",
        shape: "dot",
        size: 2.6,
        opacity: 0.18,
        reveal: [0.05, 0.6],
        sizeVar: 1,
        order: 0,
        drift: 0.09,
        twinkle: 0.55,
      }
    )
  );

  /* ── The slab's outline, crisp ───────────────────────────────────────── */
  lines.push({
    ...run(
      "slab-outline",
      [abz(0, 0, 0), abz(L, 0, 0), abz(L, D, 0), abz(0, D, 0), abz(0, 0, 0)].map((p) => V(p)),
      { role: "structure", width: 1.2, opacity: 0.55, reveal: [0.02, 0.4] }
    ),
    batch: true,
  });

  /* ── The words, in the bed's margins ────────────────────────────────── */
  labels.push(
    {
      id: "software",
      text: "SOFTWARE →",
      at: W(rect.a0 - 0.4, D / 2, 0.1),
      anchor: "end",
      kind: "axis",
    },
    {
      id: "intelligence",
      text: "← INTELLIGENCE",
      at: W(rect.a1 + 0.4, D / 2, 0.1),
      anchor: "start",
      kind: "axis",
    }
  );
  anchors.push(W(rect.a0 - 2.8, D / 2, 0), W(rect.a1 + 3.4, D / 2, 0));

  const all: ABZ[] = [...anchors, ...bed.corners];
  for (const p of pops) for (const v of p.points) all.push({ a: v[0], b: -v[2], z: v[1] });
  const frame = frameFor(all, { l: 40, r: 40, t: 44, b: 60 }, view);
  const points = pops.flatMap((p) => p.points);

  const spec: HoloStageSpec = {
    id: "spectrum-instrument",
    frame,
    bounds: boundsOf(points),
    lines,
    faces: [],
    dust: [],
    anchors: [],
    view,
    sweep: SWEEP,
    particles: { populations: pops, scatter: 2.4 },
  };

  return {
    id: "spectrum-instrument",
    figure: "spectrum",
    name: "Instrument",
    reference: "round three's dissolve, on the bed, the rail flowing",
    claim:
      "A lattice of cells at the tool's end coming apart into a drifting cloud at the collaborator's, on a bed that fills the glass; the rail's beads flow from software toward intelligence, the one gold seat pulses down to it, and the three columns read out as framed keys.",
    spec,
    labels,
  };
}
