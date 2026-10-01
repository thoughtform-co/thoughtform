/**
 * STAGES · INSTRUMENT — a prompt, a tool, an agent, as three bodies of light
 * on an instrument bed (ADR-140, round four).
 *
 * Round three's composition (`stagesSphere`) is kept — the owner has not
 * rejected the reading, only the material — and re-cut on the bed at the
 * Arc sphere's own density: the agent is the sphere PROPER (the gyro's
 * cos-latitude dotted shell in 32 bands, an additive Fresnel atmosphere,
 * an equator and a meridian of beads, a tilted orbit that circulates, a
 * core cloud, six discharges pulsing into the cells it covers), the tool is
 * a loop whose beads run, the prompt a filled node a hand's length from the
 * green hand. Every bead that is a line travels along it (the life dial),
 * the clouds keep a constant drift, and a re-scan crosses the plate every
 * few seconds. Readouts sit in the bed's left margin as framed keys.
 *
 * Moira's three footprints and heights (`stagesLayout.STAGE_PRISMS`) are the
 * record; the words are the record's own (`ends`, `axes`, the stations).
 */

import { GRID_PITCH, TIME_A } from "@/components/arcs/framing/floor";
import { STAGE_PRISMS } from "@/components/arcs/framing/stagesLayout";

import type { StageView, Vec3 } from "../stageFit";
import type { HoloStageSpec, StageLine, StageShell, StageSweep } from "../stageGeom";
import {
  dotsAlong,
  dotsAlongT,
  flowing,
  lattice,
  motesAround,
  motesIn,
  population,
  ringDotsT,
  sphereShell,
  tendrilDotsT,
  ticksAlongA,
  W,
  V,
  type ParticlePopulation,
  type WorldPt,
} from "../stageParticles";
import { instrumentBed } from "./instrument";
import { abz, frameFor, run, type ABZ, type DirLabel, type Direction } from "./shared";

const FW = TIME_A;
const SEED = 7401;
const SWEEP: StageSweep = { axis: 0, from: -1.8, to: FW + 1.6, window: [0.06, 0.8], width: 0.36 };

export const STAGESINSTRUMENT_VIEW: StageView = "stage";

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

/** Where the person stands: off the floor's front corner, by the prompt. */
const YOU: WorldPt = W(-0.55, -0.55, 0);

/** The record's own words for the three stations (the v2 arc's `stages`). */
const STATIONS = [
  { key: "A PROMPT", value: "Ask, and check the answer" },
  { key: "A TOOL", value: "It builds, you operate" },
  { key: "AN AGENT", value: "It runs the loop" },
] as const;

export function stagesInstrument(view: StageView = STAGESINSTRUMENT_VIEW): Direction {
  const pops: ParticlePopulation[] = [];
  const lines: StageLine[] = [];
  const shells: StageShell[] = [];
  const labels: DirLabel[] = [];
  const anchors: ABZ[] = [];

  const [prompt, tool, agent] = STAGE_PRISMS;
  const centre = (b: { a: number; b: number; w: number; d: number }) =>
    W(b.a + b.w / 2, b.b + b.d / 2, 0);

  /* ── The bed, and the floor's own brighter edges and time ruler ──────── */
  const bed = instrumentBed({
    seed: SEED,
    floor: { a0: 0, a1: FW, b0: 0, b1: FW },
    ext: { a0: 1.5, a1: 1.3, b0: 1.5, b1: 1.1 },
    pitch: 0.5,
    major: GRID_PITCH,
    slab: { layers: 4, step: 0.09 },
    reveal: [0, 0.38],
  });
  pops.push(...bed.pops);
  lines.push(...bed.lines);
  pops.push(
    population("front-edge", dotsAlong(SEED + 2, [W(0, 0, 0), W(FW, 0, 0)], 0.04), {
      role: "structure",
      shape: "dot",
      size: 3.6,
      opacity: 0.72,
      reveal: [0, 0.4],
    }),
    population("left-edge", dotsAlong(SEED + 3, [W(0, 0, 0), W(0, FW, 0)], 0.04), {
      role: "structure",
      shape: "dot",
      size: 3.4,
      opacity: 0.62,
      reveal: [0, 0.4],
    }),
    population("time-ticks", ticksAlongA(0, FW, 0, 0, GRID_PITCH / 2, 0.36), {
      role: "structure",
      shape: "dot",
      size: 3.2,
      opacity: 0.7,
      reveal: [0, 0.4],
    })
  );

  /* ── The footprints: the cells each station covers, lit ──────────────── */
  const foot = (id: string, b: typeof prompt, role: "structure" | "gold", opacity: number) =>
    population(
      `foot-${id}`,
      lattice(b.a + 0.1, b.a + b.w - 0.1, b.b + 0.1, b.b + b.d - 0.1, 0.004, 0.25),
      { role, shape: "voxel", size: 4.2, opacity, reveal: [0, 0.35] }
    );
  pops.push(
    foot("prompt", prompt, "structure", 0.42),
    foot("tool", tool, "structure", 0.48),
    foot("agent", agent, "gold", 0.36)
  );

  /* ── YOU: a green node, the hand everything starts from ──────────────── */
  pops.push(
    population("you-ring", [YOU], {
      role: "green",
      shape: "ring",
      size: 24,
      opacity: 0.95,
      reveal: [0, 0.25],
    }),
    population("you-disc", [YOU], {
      role: "green",
      shape: "disc",
      size: 10,
      opacity: 0.95,
      reveal: [0, 0.25],
    }),
    population("you", motesAround(SEED + 4, YOU, 0.06, 50), {
      role: "green",
      shape: "dot",
      size: 3.6,
      opacity: 0.9,
      reveal: [0, 0.25],
      twinkle: 0.3,
    })
  );
  labels.push({ id: "you", text: "YOU", at: YOU, dx: -16, dy: 8, anchor: "end", kind: "person" });

  /* ── A PROMPT: one bright node, a hand's length away ─────────────────── */
  const pc = W(centre(prompt).a, centre(prompt).b, prompt.h * 0.55);
  pops.push(
    population("prompt-node", [pc], {
      role: "structure",
      shape: "ring",
      size: 24,
      opacity: 0.95,
      reveal: [0, 0.3],
    }),
    population("prompt-disc", [pc], {
      role: "structure",
      shape: "disc",
      size: 9,
      opacity: 0.95,
      reveal: [0, 0.3],
    }),
    population("prompt-core", motesAround(SEED + 5, pc, 0.07, 80), {
      role: "structure",
      shape: "dot",
      size: 3.8,
      opacity: 0.9,
      reveal: [0, 0.3],
      twinkle: 0.3,
    }),
    population("prompt-drop", dotsAlong(SEED + 6, [pc, W(pc.a, pc.b, 0)], 0.06), {
      role: "structure",
      shape: "dot",
      size: 3.0,
      opacity: 0.5,
      reveal: [0, 0.3],
    }),
    flowing("you-prompt", dotsAlongT(SEED + 7, [W(YOU.a, YOU.b, 0.08), pc], 0.08, 0, 0.16), {
      role: "green",
      shape: "dot",
      size: 3.2,
      opacity: 0.66,
      reveal: [0, 0.3],
      flow: { period: 0.6 },
    })
  );
  labels.push({ id: "prompt", text: "A PROMPT", at: pc, dy: -34, anchor: "middle", kind: "name" });

  /* ── A TOOL: a loop you operate — two rings through each other, running ── */
  const tc = W(centre(tool).a, centre(tool).b, tool.h * 0.62);
  const tr = tool.w * 0.42;
  pops.push(
    flowing("tool-ring", ringDotsT(tc, tr, 150, "wall-a"), {
      role: "structure",
      shape: "dot",
      size: 4.4,
      opacity: 0.95,
      reveal: [0, 0.3],
      twinkle: 0.2,
      flow: { period: 0.5 },
    }),
    flowing("tool-ring-2", ringDotsT(tc, tr * 0.86, 120, "floor", 72, 0.4), {
      role: "structure",
      shape: "dot",
      size: 3.6,
      opacity: 0.74,
      reveal: [0, 0.3],
      flow: { period: 0.7 },
    }),
    population("tool-hub", motesAround(SEED + 8, tc, 0.06, 40), {
      role: "structure",
      shape: "dot",
      size: 3.8,
      opacity: 0.9,
      reveal: [0, 0.3],
    }),
    population(
      "tool-drop",
      dotsAlong(SEED + 9, [W(tc.a, tc.b, tc.z - tr), W(tc.a, tc.b, 0)], 0.06),
      { role: "structure", shape: "dot", size: 3.0, opacity: 0.46, reveal: [0, 0.3] }
    ),
    flowing(
      "you-tool",
      dotsAlongT(SEED + 10, [W(YOU.a, YOU.b, 0.08), W(tc.a - tr, tc.b, tc.z)], 0.1, 0, 0.2),
      {
        role: "green",
        shape: "dot",
        size: 3.0,
        opacity: 0.5,
        reveal: [0, 0.35],
        flow: { period: 0.7 },
      }
    )
  );
  labels.push({
    id: "tool",
    text: "A TOOL",
    at: W(tc.a - tr, tc.b, tc.z),
    dx: -18,
    anchor: "end",
    kind: "name",
  });

  /* ── AN AGENT: the Arc sphere proper, an orbit, a discharge into the floor ── */
  /* The globe is the plate's one lit object and it is BIG: a quarter of the
     frame's shorter side (the references' spheres fill their frames; round
     three's 0.5 measured 22 %). */
  const ar = agent.w * 0.62;
  /* The globe hovers well clear of the floor, so its discharge has a length. */
  const ac = W(centre(agent).a, centre(agent).b, agent.h * 0.8 + ar);
  pops.push(
    /* ⚠ 2000, not 3000: at this scale 3000 dots of 4.6 px fused into a solid
       ball and the shell's rows — what makes it read as a globe — were gone. */
    flowing("agent-shell", sphereShell(SEED + 11, ac, ar, 32, 2000, 16, 0.04), {
      role: "gold",
      shape: "dot",
      size: 4.2,
      opacity: 0.74,
      reveal: [0, 0.3],
      lit: true,
      twinkle: 0.4,
      sizeVar: 0.3,
      flow: { period: 7, mode: "wander" },
    }),
    flowing("agent-equator", ringDotsT(ac, ar * 1.02, 160, "floor", 16, 0), {
      role: "gold",
      shape: "dot",
      size: 4.2,
      opacity: 0.9,
      reveal: [0, 0.3],
      lit: true,
      flow: { period: 0.32 },
    }),
    flowing("agent-meridian", ringDotsT(ac, ar * 1.02, 140, "wall-a", 0, 0.3), {
      role: "gold",
      shape: "dot",
      size: 3.6,
      opacity: 0.6,
      reveal: [0, 0.3],
      flow: { period: 0.42 },
    }),
    flowing("agent-orbit", ringDotsT(ac, ar * 1.46, 220, "floor", 64, 0.9), {
      role: "accent",
      shape: "dot",
      size: 4.0,
      opacity: 0.95,
      reveal: [0, 0.3],
      twinkle: 0.4,
      flow: { period: 0.21 },
    }),
    population("agent-orbit-node", [ringDotsT(ac, ar * 1.46, 220, "floor", 64, 0.9).points[55]], {
      role: "accent",
      shape: "disc",
      size: 14,
      opacity: 0.95,
      reveal: [0, 0.3],
    }),
    population(
      "agent-axis",
      dotsAlong(
        SEED + 12,
        [W(ac.a, ac.b + ar * 0.42, ac.z + ar * 1.28), W(ac.a, ac.b - ar * 0.42, ac.z - ar * 1.28)],
        0.06
      ),
      { role: "accent", shape: "dot", size: 2.8, opacity: 0.55, reveal: [0, 0.3] }
    ),
    population("agent-core", motesAround(SEED + 13, ac, ar * 0.3, 300), {
      role: "gold",
      shape: "dot",
      size: 3.4,
      opacity: 0.55,
      reveal: [0, 0.3],
      lit: true,
      sizeVar: 0.8,
      order: 0,
      drift: 0.05,
      twinkle: 0.6,
    })
  );
  /* The atmosphere arrives WITH the globe, over the assembly's last third
     (`ASSEMBLE_END` 0.62): on the first clip it stood at full strength at
     0.8 s as a brown ring around dots still gathering. */
  shells.push({
    id: "agent-atmosphere",
    c: V(ac),
    r: ar * 1.06,
    role: "gold",
    opacity: 0.55,
    reveal: [0.34, 0.66],
  });
  /* The discharge: tendrils from the globe's underside into the cells it covers. */
  const strikes: WorldPt[] = [
    W(agent.a + agent.w * 0.2, agent.b + agent.d * 0.3, 0),
    W(agent.a + agent.w * 0.75, agent.b + agent.d * 0.22, 0),
    W(agent.a + agent.w * 0.5, agent.b + agent.d * 0.8, 0),
    W(agent.a + agent.w * 0.15, agent.b + agent.d * 0.72, 0),
    W(agent.a + agent.w * 0.85, agent.b + agent.d * 0.68, 0),
    W(agent.a + agent.w * 0.48, agent.b + agent.d * 0.48, 0),
  ];
  strikes.forEach((s, i) => {
    const from = W(ac.a + (s.a - ac.a) * 0.3, ac.b + (s.b - ac.b) * 0.3, ac.z - ar * 0.86);
    pops.push(
      flowing(`strike-${i}`, tendrilDotsT(SEED + 20 + i, from, s, 9, 0.7, 0.035), {
        role: "accent",
        shape: "dot",
        size: 3.6,
        opacity: 0.9,
        reveal: [0.1 + i * 0.03, 0.4 + i * 0.03],
        twinkle: 0.6,
        flow: { period: 0.25 },
      }),
      population(`strike-cell-${i}`, motesAround(SEED + 40 + i, W(s.a, s.b, 0.01), 0.14, 30), {
        role: "accent",
        shape: "voxel",
        size: 4.0,
        opacity: 0.72,
        reveal: [0.1 + i * 0.03, 0.4 + i * 0.03],
        twinkle: 0.5,
      })
    );
  });
  labels.push({
    id: "agent",
    text: "AN AGENT",
    at: W(ac.a, ac.b, ac.z + ar * 1.32),
    dy: -26,
    anchor: "middle",
    kind: "name",
    lit: true,
  });

  /* It reports back to you: a long run of beads from the globe to the hand. */
  pops.push(
    flowing(
      "reports",
      dotsAlongT(
        SEED + 14,
        [W(ac.a - ar * 0.8, ac.b - ar * 0.5, ac.z - ar * 0.3), W(YOU.a + 0.3, YOU.b + 0.25, 0.15)],
        0.14,
        0,
        0.28
      ),
      {
        role: "structure",
        shape: "dot",
        size: 3.0,
        opacity: 0.44,
        reveal: [0.3, 0.75],
        flow: { period: 0.5 },
      }
    )
  );
  labels.push({
    id: "reports",
    text: "IT REPORTS",
    /* On the run's first third, clear of the globe's halo and its discharge. */
    at: W(ac.a - ar * 1.25, ac.b - ar * 0.75, ac.z - ar * 1.15),
    anchor: "end",
    kind: "note",
    dx: -44,
    dy: 10,
  });

  /* ── Dust ────────────────────────────────────────────────────────────── */
  pops.push(
    population(
      "dust",
      motesIn(
        SEED + 50,
        { a: -1.2, b: -1.2, z: 0.05, w: FW + 2.4, d: FW + 2.4, h: agent.h + ar * 2.3 },
        900
      ),
      {
        role: "structure",
        shape: "dot",
        size: 2.6,
        opacity: 0.2,
        reveal: [0.05, 0.6],
        sizeVar: 1,
        order: 0,
        drift: 0.09,
        twinkle: 0.55,
      }
    )
  );

  /* ── The floor's outline, crisp ──────────────────────────────────────── */
  lines.push({
    ...run(
      "floor-outline",
      [abz(0, 0, 0), abz(FW, 0, 0), abz(FW, FW, 0), abz(0, FW, 0), abz(0, 0, 0)].map((p) => V(p)),
      { role: "structure", width: 1.2, opacity: 0.55, reveal: [0.02, 0.4] }
    ),
    batch: true,
  });

  /* ── The words, outside the bed; the readouts in its left margin ────── */
  const { rect } = bed;
  labels.push(
    {
      id: "axis-time",
      text: "HOW LONG, WITHOUT YOU →",
      at: W(FW * 0.5, rect.b0 - 0.5, 0),
      rot: -22,
      anchor: "middle",
      kind: "axis",
    },
    {
      id: "axis-work",
      text: "← HOW MUCH OF THE WORK",
      at: W(rect.a0 - 0.5, FW * 0.5, 0),
      rot: 22,
      anchor: "middle",
      kind: "axis",
    },
    { id: "end-near", text: "MINUTES", at: W(0, rect.b0 - 0.95, 0), anchor: "middle", kind: "end" },
    {
      id: "end-far",
      text: "HALF A DAY",
      at: W(rect.a1 + 0.5, rect.b0 - 0.3, 0),
      anchor: "start",
      kind: "end",
    },
    {
      id: "end-top",
      text: "ALL OF IT",
      at: W(rect.a0 - 0.45, rect.b1 + 0.4, 0),
      anchor: "end",
      kind: "end",
    }
  );
  /* The readouts: a column in the plate's upper-left, the one empty corner,
     stacked in SCREEN px from one anchor so no two can collide — the first
     cut seated them along the left edge and they crossed the rotated axis
     word. The agent's plate is lit and sits at the top, nearest its globe. */
  [prompt, tool, agent].forEach((b, i) => {
    labels.push({
      id: `readout-${i}`,
      key: STATIONS[i].key,
      text: STATIONS[i].value,
      at: W(rect.a0 - 0.6, rect.b1 + 0.1, 0),
      dy: -70 - (2 - i) * 66,
      anchor: "end",
      kind: "readout",
      lit: i === 2,
    });
    void b;
  });
  anchors.push(
    W(rect.a0 - 2.2, FW * 0.5, 0),
    W(FW * 0.5, rect.b0 - 1.7, 0),
    W(rect.a1 + 2.6, rect.b0 - 0.3, 0),
    W(rect.a0 - 1.6, rect.b1 + 0.7, 0),
    /* The readout column's reach: its width to the left, its height above. */
    W(rect.a0 - 5.6, rect.b1 + 0.1, 0),
    W(rect.a0 - 0.6, rect.b1 + 0.1, 5.2),
    W(ac.a, ac.b, ac.z + ar * 1.8)
  );

  const all: ABZ[] = [...anchors, ...bed.corners];
  for (const p of pops) for (const v of p.points) all.push({ a: v[0], b: -v[2], z: v[1] });
  const frame = frameFor(all, { l: 40, r: 40, t: 36, b: 48 }, view);
  const points = pops.flatMap((p) => p.points);

  const spec: HoloStageSpec = {
    id: "stages-instrument",
    frame,
    bounds: boundsOf(points),
    lines,
    faces: [],
    dust: [],
    anchors: [],
    shells,
    view,
    sweep: SWEEP,
    particles: { populations: pops, scatter: 2.8 },
  };

  return {
    id: "stages-instrument",
    figure: "stages",
    name: "Instrument",
    reference: "round three's sphere, on the bed, at the Arc sphere's density",
    claim:
      "The three bodies on a bed that fills the glass: the agent is the Arc sphere itself — a dotted shell, an atmosphere, an orbit that circulates — discharging into the cells it covers; every run of beads flows, and the plate re-scans itself.",
    spec,
    labels,
  };
}
