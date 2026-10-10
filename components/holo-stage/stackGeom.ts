/**
 * stackGeom — THE LAYER STACK as world-space data for the live stage (the
 * proposal system, 2026-10-10): the approach's figure, written in three steps.
 *
 * Every world number is read from `components/arcs/stack/stackLayout.ts`,
 * never restated (stageGeom's law: the SVG fallback and the hologram are one
 * picture). The hologram adds what a drawing cannot: the organisation's slab
 * and the tiles as wire volumes with opaque faces, the layer as a translucent
 * gold volume whose courses draw on when the team writes them (group
 * `write`), and Claude's RUNS as beads travelling the layer's front edge
 * (group `run`): the equilibrium's motes-through-the-gate, on a slab. The
 * team's tacit knowledge drifts above the tiles from step 0 as a quiet cloud.
 *
 * ⚠ THREE-FREE AND PURE. ⚠ ONE lit population and one donor run: the layer's
 * top rim. ⚠ The courses' lattice is the written knowledge: order 1, seated.
 */

import { STAGE_K } from "@/components/arcs/framing/floor";
import { ISO_SEED, type IsoFrame } from "@/components/arcs/framing/iso";
import {
  DECK_AIR,
  PLATE,
  TILE,
  courseLines,
  plateBox,
  runEdge,
  stackFrame,
  tileBoxes,
  type StackTier,
} from "@/components/arcs/stack/stackLayout";

import { toThree, type Vec3 } from "./stageFit";
import {
  boxEdges,
  boxFaces,
  gridLines,
  motes,
  specBounds,
  sweepReaches,
  type Box,
  type HoloStageSpec,
  type StageDust,
  type StageFace,
  type StageLine,
  type StageSweep,
} from "./stageGeom";
import { dotsAlongT, type ParticlePopulation } from "./stageParticles";

export const STACK_GROUP_WRITE = "write";
export const STACK_GROUP_RUN = "run";

export interface StackData {
  tiers: readonly StackTier[];
  courses: { skills: number; evals: number };
  tiles: readonly { id: string; lit?: boolean }[];
}

const V = (a: number, b: number, z: number): Vec3 => toThree(a, b, z);

/** The arrival: one front along the plates' edge, front corner to the far tip. */
export const STACK_SWEEP: StageSweep = {
  axis: 0,
  from: -0.4,
  to: PLATE.w + 0.4,
  window: [0.04, 0.6],
  width: 0.3,
};

/** The SVG's own crop, as the camera's frame. */
export function stackSpecFrame(tiers: readonly StackTier[]): IsoFrame {
  return stackFrame(tiers);
}

export function stackSpec(data: StackData): HoloStageSpec {
  const S = STACK_SWEEP;
  const frame = stackSpecFrame(data.tiers);
  const lines: StageLine[] = [];
  const faces: StageFace[] = [];
  const dust: StageDust[] = [];
  const populations: ParticlePopulation[] = [];

  /* The datum under the organisation's slab. */
  if (data.tiers.includes("host")) {
    const host = plateBox("host");
    lines.push(
      ...gridLines(
        "grid",
        { a: -1.5, b: -1.5, w: PLATE.w + 3, d: PLATE.d + 3, pitch: 1.5 },
        host.z
      ).map((l) => ({ ...l, batch: true, opacity: 0.1 }))
    );
    const at0 = sweepReaches(S, host.a);
    const at1 = sweepReaches(S, host.a + host.w);
    lines.push(
      ...boxEdges("host", host, {
        role: "structure",
        width: 1.4,
        opacity: 0.85,
        reveal: [at0, at1 + 0.05],
      }).map((l) => ({ ...l, batch: true }))
    );
    faces.push(
      ...boxFaces("host", host, {
        role: "machine",
        opacity: 0.08,
        reveal: [at1 + 0.04, at1 + 0.28],
      })
    );
  }

  /* The layer: a translucent gold volume, drawn when the team writes it. */
  if (data.tiers.includes("layer")) {
    const layer = plateBox("layer");
    const box: Box = { ...layer };
    lines.push(
      ...boxEdges("layer", box, {
        role: "gold",
        width: 1.9,
        opacity: 1,
        reveal: [0, 0.4],
      }).map((l) => ({ ...l, batch: true, group: STACK_GROUP_WRITE }))
    );
    faces.push(
      ...boxFaces("layer", box, { role: "gold", opacity: 0.14, reveal: [0.2, 0.6] }).map((f) => ({
        ...f,
        shade: undefined,
        group: STACK_GROUP_WRITE,
      }))
    );
    const courses = courseLines(data.courses.skills + data.courses.evals);
    courses.forEach((pts, i) => {
      const t0 = 0.35 + (i / Math.max(1, courses.length)) * 0.5;
      lines.push({
        id: `course-${i}`,
        points: pts.map((p) => V(p.a, p.b, p.z)),
        role: "gold",
        width: 1.2,
        opacity: i < data.courses.skills ? 0.9 : 0.6,
        reveal: [t0, Math.min(1, t0 + 0.12)],
        batch: true,
        group: STACK_GROUP_WRITE,
      });
      /* The written knowledge as a seated lattice along each course. */
      const beads = dotsAlongT(ISO_SEED + 500 + i, pts, 0.42);
      populations.push({
        id: `written-${i}`,
        role: "gold",
        shape: "cell",
        size: 4,
        opacity: 0.75,
        points: beads.points.map((p) => V(p.a, p.b, p.z + 0.02)),
        order: 1,
        reveal: [t0, Math.min(1, t0 + 0.2)],
        group: STACK_GROUP_WRITE,
      });
    });
    /* The one donor: the layer's lit top rim, front edges. */
    lines.push({
      id: "crest",
      points: [
        V(box.a, box.b + box.d, box.z + box.h),
        V(box.a, box.b, box.z + box.h),
        V(box.a + box.w, box.b, box.z + box.h),
      ],
      role: "gold",
      width: 2.6,
      opacity: 0.95,
      reveal: [0.5, 0.9],
      donor: true,
      group: STACK_GROUP_WRITE,
    });
    /* Claude's runs: beads travelling the front edge, a bead the whole edge long. */
    const run = runEdge();
    const beads = dotsAlongT(
      ISO_SEED + 777,
      run.map((p) => ({ ...p, z: p.z + 0.12 })),
      0.3,
      0,
      0.3
    );
    populations.push({
      id: "beads",
      role: "gold",
      shape: "dash",
      size: 5,
      opacity: 0.95,
      points: beads.points.map((p) => V(p.a, p.b, p.z)),
      tangents: beads.tangents.map((t) => V(t.a, t.b, t.z)),
      order: 1,
      reveal: [0, 0.5],
      group: STACK_GROUP_RUN,
      lit: true,
      flow: { period: 7, mode: "run" },
    });
  }

  /* The tiles: wire volumes on the deck, the lit one in gold. */
  if (data.tiers.includes("tiles")) {
    const boxes = tileBoxes(Math.max(1, data.tiles.length));
    boxes.forEach((b, i) => {
      const tile = data.tiles[i];
      const lit = tile?.lit === true;
      const at0 = sweepReaches(S, b.a);
      const at1 = sweepReaches(S, b.a + b.w);
      lines.push(
        ...boxEdges(`tile-${tile?.id ?? i}`, b, {
          role: lit ? "gold" : "structure",
          width: lit ? 1.6 : 1.1,
          opacity: lit ? 1 : 0.7,
          reveal: [at0, at1 + 0.05],
        }).map((l) => ({ ...l, batch: true }))
      );
      faces.push(
        ...boxFaces(`tile-${tile?.id ?? i}`, b, {
          role: lit ? "gold" : "machine",
          opacity: lit ? 0.16 : 0.07,
          reveal: [at1 + 0.03, at1 + 0.25],
        })
      );
    });
    /* The team's tacit knowledge: a quiet cloud above the deck, from step 0. */
    const deckZ = boxes[0].z + TILE.h;
    dust.push({
      id: "tacit",
      points: motes(ISO_SEED + 913, 160, {
        a: 0.3,
        b: 0.3,
        w: PLATE.w - 0.6,
        d: PLATE.d - 0.6,
        z: deckZ + 0.1,
        h: DECK_AIR - 0.3,
      }),
      opacity: 0.35,
      role: "machine",
      drift: 0.18,
      size: 3,
    });
  }

  return {
    id: "stack",
    frame,
    bounds: specBounds(lines, faces),
    lines,
    faces,
    dust,
    anchors: [],
    view: "stage",
    sweep: S,
    groups: [STACK_GROUP_WRITE, STACK_GROUP_RUN],
    particles: populations.length
      ? { populations, scatter: STAGE_K / 40 + 2.5, assembleMs: 1400 }
      : undefined,
  };
}
