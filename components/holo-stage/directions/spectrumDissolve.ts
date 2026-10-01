/**
 * DISSOLVE — tool ↔ collaborator, as one field changing state (ADR-140,
 * round three).
 *
 * From the owner's dot-matrix horse: a figure of ordered cells coming apart
 * into drifting motes. The reading is the spectrum's one sentence — software
 * is deterministic, intelligence is probabilistic — and it is drawn as ONE
 * population changing phase along the rail: a perfect lattice of cells at
 * the tool's end, dissolving cell by cell into a cloud of soft motes that
 * drift at the collaborator's end, over a long stacked slab in the stage's
 * isometric. The three columns are registration marks on the rail; the one
 * gold node is where AI sits — both at once — with its own discharge down
 * to the rail.
 */

import { mulberry32 } from "@/components/arcs/framing/iso";

import type { StageView, Vec3 } from "../stageFit";
import type { HoloStageSpec, StageLine, StageSweep } from "../stageGeom";
import {
  dotsAlong,
  motesAround,
  motesIn,
  population,
  slabLayers,
  tendrilDots,
  W,
  V,
  type ParticlePopulation,
  type WorldPt,
} from "../stageParticles";
import { abz, frameFor, run, type ABZ, type DirLabel, type Direction } from "./shared";

const L = 12;
const D = 2.4;
const SEED = 9203;
const SWEEP: StageSweep = { axis: 0, from: -0.6, to: L + 0.8, window: [0.06, 0.78], width: 0.34 };

export const SPECTRUMDISSOLVE_VIEW: StageView = "stage";

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

export function spectrumDissolve(view: StageView = SPECTRUMDISSOLVE_VIEW): Direction {
  const pops: ParticlePopulation[] = [];
  const lines: StageLine[] = [];
  const labels: DirLabel[] = [];
  const anchors: ABZ[] = [];
  const rnd = mulberry32(SEED);

  /* ── The slab and the rail ───────────────────────────────────────────── */
  pops.push(
    population("slab", slabLayers(SEED + 1, 0, L, 0, D, 4, 0.09, 0.12), {
      role: "grid",
      shape: "dot",
      size: 2.3,
      opacity: 0.5,
      reveal: [0.04, 0.5],
      sizeVar: 0.3,
    }),
    population("rail", dotsAlong(SEED + 2, [W(0, D / 2, 0.02), W(L, D / 2, 0.02)], 0.05), {
      role: "structure",
      shape: "dot",
      size: 2.9,
      opacity: 0.7,
      reveal: [0, 0.35],
    }),
    population("front-edge", dotsAlong(SEED + 3, [W(0, 0, 0), W(L, 0, 0)], 0.05), {
      role: "structure",
      shape: "dot",
      size: 2.4,
      opacity: 0.45,
      reveal: [0, 0.4],
    })
  );

  /* ── The field: one lattice changing phase along the rail ────────────── */
  const PITCH = 0.3;
  const cells: WorldPt[] = [];
  const cloud: WorldPt[] = [];
  const cloudOrder: number[] = [];
  const Z0 = 0.3;
  const Z1 = 1.75;
  const na = Math.round((L - 1.5) / PITCH);
  const nb = Math.round((D - 0.5) / PITCH);
  const nz = Math.round((Z1 - Z0) / PITCH);
  for (let i = 0; i <= na; i++) {
    const a = 0.3 + i * PITCH;
    const o = orderAt(a);
    for (let j = 0; j <= nb; j++) {
      for (let k = 0; k <= nz; k++) {
        const p = W(a, 0.25 + j * PITCH, Z0 + k * PITCH);
        /* A cell stays a cell with probability `o`; otherwise it has come
           loose — a mote, free to drift, a little off its old seat. */
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
      opacity: 0.76,
      reveal: [0, 0.35],
      twinkle: 0.1,
    }),
    population("cloud", cloud, {
      role: "structure",
      shape: "dot",
      size: 3.2,
      opacity: 0.55,
      reveal: [0, 0.4],
      order: cloudOrder,
      drift: 0.1,
      sizeVar: 0.9,
      twinkle: 0.6,
    })
  );

  /* ── The three columns: registration marks on the rail ───────────────── */
  const cols = [
    { id: "tool", a: L * 0.17, name: "TOOL", sub: "EXECUTES COMMANDS" },
    { id: "both", a: L * 0.5, name: "BOTH, AT ONCE", sub: "" },
    { id: "collab", a: L * 0.83, name: "COLLABORATOR", sub: "INTERPRETS INTENT" },
  ];
  for (const c of cols) {
    const p = W(c.a, D / 2, 0.02);
    pops.push(
      population(`col-${c.id}`, [p], {
        role: "structure",
        shape: "cross",
        size: 14,
        opacity: 0.8,
        reveal: [0, 0.35],
      }),
      population(
        `col-stub-${c.id}`,
        dotsAlong(SEED + 10, [W(c.a, -0.05, 0), W(c.a, -0.42, 0)], 0.06),
        {
          role: "structure",
          shape: "dot",
          size: 2.4,
          opacity: 0.5,
          reveal: [0, 0.35],
        }
      )
    );
    labels.push({
      id: `col-${c.id}`,
      text: c.name,
      at: W(c.a, -0.55, 0),
      dy: 10,
      anchor: "middle",
      kind: "name",
    });
    if (c.sub)
      labels.push({
        id: `col-sub-${c.id}`,
        text: c.sub,
        at: W(c.a, -0.55, 0),
        dy: 26,
        anchor: "middle",
        kind: "end",
      });
    anchors.push(W(c.a, -1.6, 0));
  }

  /* ── The seat: where AI sits, the one gold thing ─────────────────────── */
  const seat = W(SEAT_A, D / 2, Z1 + 0.35);
  pops.push(
    population("seat-ring", [seat], {
      role: "gold",
      shape: "ring",
      size: 22,
      opacity: 0.95,
      reveal: [0, 0.35],
      lit: true,
    }),
    population("seat-core", motesAround(SEED + 20, seat, 0.09, 110), {
      role: "gold",
      shape: "dot",
      size: 3.2,
      opacity: 0.85,
      reveal: [0, 0.35],
      lit: true,
      twinkle: 0.4,
      sizeVar: 0.6,
    }),
    population("seat-halo", motesAround(SEED + 21, seat, 0.3, 140), {
      role: "accent",
      shape: "dot",
      size: 2.4,
      opacity: 0.45,
      reveal: [0, 0.4],
      order: 0,
      drift: 0.06,
      sizeVar: 0.9,
      twinkle: 0.7,
    }),
    population(
      "seat-strike",
      tendrilDots(
        SEED + 22,
        W(seat.a, seat.b, seat.z - 0.15),
        W(SEAT_A, D / 2, 0.03),
        7,
        0.4,
        0.045
      ),
      {
        role: "accent",
        shape: "dot",
        size: 2.5,
        opacity: 0.8,
        reveal: [0.2, 0.55],
        twinkle: 0.6,
      }
    )
  );
  labels.push({
    id: "seat",
    text: "AI SITS HERE",
    at: seat,
    dy: -30,
    anchor: "middle",
    kind: "name",
    lit: true,
  });
  anchors.push(W(seat.a, seat.b, seat.z + 0.9));

  /* ── Dust ────────────────────────────────────────────────────────────── */
  pops.push(
    population(
      "dust",
      motesIn(SEED + 30, { a: -0.6, b: -0.5, z: 0.05, w: L + 1.2, d: D + 1.2, h: Z1 + 0.9 }, 360),
      {
        role: "structure",
        shape: "dot",
        size: 2.0,
        opacity: 0.16,
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
      { role: "structure", width: 1.1, opacity: 0.5, reveal: [0.02, 0.4] }
    ),
    batch: true,
  });

  /* ── The words ───────────────────────────────────────────────────────── */
  labels.push(
    { id: "software", text: "SOFTWARE →", at: W(-0.45, D / 2, 0.1), anchor: "end", kind: "axis" },
    {
      id: "intelligence",
      text: "← INTELLIGENCE",
      at: W(L + 0.45, D / 2, 0.1),
      anchor: "start",
      kind: "axis",
    }
  );
  anchors.push(W(-2.6, D / 2, 0), W(L + 3.0, D / 2, 0));

  const all: ABZ[] = [...anchors];
  for (const p of pops) for (const v of p.points) all.push({ a: v[0], b: -v[2], z: v[1] });
  const frame = frameFor(all, { l: 70, r: 70, t: 44, b: 80 }, view);
  const points = pops.flatMap((p) => p.points);

  const spec: HoloStageSpec = {
    id: "spectrum-dissolve",
    frame,
    bounds: boundsOf(points),
    lines,
    faces: [],
    dust: [],
    anchors: [],
    view,
    sweep: SWEEP,
    particles: { populations: pops, scatter: 2.2 },
  };

  return {
    id: "dissolve",
    figure: "spectrum",
    name: "Dissolve",
    reference: "the dot-matrix horse coming apart; one field changing phase",
    claim:
      "A lattice of cells at the tool's end dissolving, cell by cell, into a drifting cloud at the collaborator's — software is deterministic, intelligence is probabilistic — with the one gold node where AI sits, both at once.",
    spec,
    labels,
  };
}
