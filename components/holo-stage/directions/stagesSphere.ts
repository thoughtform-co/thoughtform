/**
 * SPHERE — a prompt, a tool, an agent, as three bodies of light (ADR-140,
 * round three).
 *
 * The owner's Arc sphere brought onto the stage: the agent is a GLOBE of
 * latitude rings of gold motes with a tilted orbit, hovering over the work
 * it covers and discharging into the floor — the lightning of his isometric-
 * grid reference. The tool is a LOOP you operate: a standing ring of beads
 * with a second ring turned through it, a gyroscope in your hand's reach.
 * The prompt is one bright node a hand's length from you. The floor is a
 * lattice of cells on a stacked slab, time ticking along its front edge; each
 * station's FOOTPRINT lights the cells it covers (how much of the work) and
 * stands further along time (how long, without you). Green is the person.
 *
 * Moira's three footprints and heights (`stagesLayout.STAGE_PRISMS`) are the
 * record; what each stands for is drawn as the body it is.
 */

import { GRID_PITCH, TIME_A } from "@/components/arcs/framing/floor";
import { STAGE_PRISMS } from "@/components/arcs/framing/stagesLayout";

import type { StageView, Vec3 } from "../stageFit";
import type { HoloStageSpec, StageLine, StageSweep } from "../stageGeom";
import {
  dotsAlong,
  lattice,
  motesAround,
  motesIn,
  population,
  ringDots,
  slabLayers,
  sphereRings,
  tendrilDots,
  ticksAlongA,
  W,
  V,
  type ParticlePopulation,
  type WorldPt,
} from "../stageParticles";
import { abz, frameFor, run, type ABZ, type DirLabel, type Direction } from "./shared";

const FW = TIME_A;
const SEED = 7301;
const SWEEP: StageSweep = { axis: 0, from: -0.6, to: FW + 0.8, window: [0.06, 0.78], width: 0.34 };

export const STAGESSPHERE_VIEW: StageView = "stage";

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

export function stagesSphere(view: StageView = STAGESSPHERE_VIEW): Direction {
  const pops: ParticlePopulation[] = [];
  const lines: StageLine[] = [];
  const labels: DirLabel[] = [];
  const anchors: ABZ[] = [];

  const [prompt, tool, agent] = STAGE_PRISMS;
  const centre = (b: { a: number; b: number; w: number; d: number }) =>
    W(b.a + b.w / 2, b.b + b.d / 2, 0);

  /* ── The floor: a lattice of cells on a stacked slab, time along its edge ── */
  const PITCH = GRID_PITCH / 6;
  pops.push(
    population("floor", lattice(0, FW, 0, FW, 0, PITCH), {
      role: "grid",
      shape: "cell",
      size: 4.8,
      opacity: 0.6,
      reveal: [0, 0.35],
      twinkle: 0.12,
    }),
    population("slab", slabLayers(SEED + 1, 0, FW, 0, FW, 4, 0.09, 0.12), {
      role: "grid",
      shape: "dot",
      size: 2.3,
      opacity: 0.48,
      reveal: [0.04, 0.5],
      sizeVar: 0.3,
    }),
    population("front-edge", dotsAlong(SEED + 2, [W(0, 0, 0), W(FW, 0, 0)], 0.045), {
      role: "structure",
      shape: "dot",
      size: 2.7,
      opacity: 0.6,
      reveal: [0, 0.4],
    }),
    population("left-edge", dotsAlong(SEED + 3, [W(0, 0, 0), W(0, FW, 0)], 0.045), {
      role: "structure",
      shape: "dot",
      size: 2.5,
      opacity: 0.5,
      reveal: [0, 0.4],
    }),
    population("time-ticks", ticksAlongA(0, FW, 0, 0, GRID_PITCH / 2, 0.34), {
      role: "structure",
      shape: "dot",
      size: 2.7,
      opacity: 0.62,
      reveal: [0, 0.4],
    })
  );

  /* ── The footprints: the cells each station covers, lit ──────────────── */
  const foot = (id: string, b: typeof prompt, role: "structure" | "gold", opacity: number) =>
    population(
      `foot-${id}`,
      lattice(b.a + 0.1, b.a + b.w - 0.1, b.b + 0.1, b.b + b.d - 0.1, 0.004, PITCH / 2),
      {
        role,
        shape: "voxel",
        size: 3.2,
        opacity,
        reveal: [0, 0.35],
      }
    );
  pops.push(
    foot("prompt", prompt, "structure", 0.34),
    foot("tool", tool, "structure", 0.4),
    foot("agent", agent, "gold", 0.3)
  );

  /* ── YOU: a green node, the hand everything starts from ──────────────── */
  pops.push(
    population("you-ring", [YOU], {
      role: "green",
      shape: "ring",
      size: 18,
      opacity: 0.95,
      reveal: [0, 0.25],
    }),
    population("you", motesAround(SEED + 4, YOU, 0.05, 40), {
      role: "green",
      shape: "dot",
      size: 3.2,
      opacity: 0.9,
      reveal: [0, 0.25],
    })
  );
  labels.push({ id: "you", text: "YOU", at: YOU, dx: -14, dy: 6, anchor: "end", kind: "person" });

  /* ── A PROMPT: one bright node, a hand's length away ─────────────────── */
  const pc = W(centre(prompt).a, centre(prompt).b, prompt.h * 0.55);
  pops.push(
    population("prompt-node", [pc], {
      role: "structure",
      shape: "ring",
      size: 16,
      opacity: 0.95,
      reveal: [0, 0.3],
    }),
    population("prompt-core", motesAround(SEED + 5, pc, 0.06, 60), {
      role: "structure",
      shape: "dot",
      size: 3.4,
      opacity: 0.9,
      reveal: [0, 0.3],
      twinkle: 0.3,
    }),
    population("prompt-drop", dotsAlong(SEED + 6, [pc, W(pc.a, pc.b, 0)], 0.07), {
      role: "structure",
      shape: "dot",
      size: 2.3,
      opacity: 0.45,
      reveal: [0, 0.3],
    }),
    population("you-prompt", dotsAlong(SEED + 7, [W(YOU.a, YOU.b, 0.08), pc], 0.09), {
      role: "green",
      shape: "dot",
      size: 2.6,
      opacity: 0.6,
      reveal: [0, 0.3],
    })
  );
  labels.push({ id: "prompt", text: "A PROMPT", at: pc, dy: -30, anchor: "middle", kind: "name" });

  /* ── A TOOL: a loop you operate — two rings through each other ───────── */
  const tc = W(centre(tool).a, centre(tool).b, tool.h * 0.62);
  const tr = tool.w * 0.42;
  pops.push(
    population("tool-ring", ringDots(tc, tr, 140, "wall-a"), {
      role: "structure",
      shape: "dot",
      size: 3.9,
      opacity: 0.95,
      reveal: [0, 0.3],
      twinkle: 0.2,
    }),
    population("tool-ring-2", ringDots(tc, tr * 0.86, 110, "floor", 72, 0.4), {
      role: "structure",
      shape: "dot",
      size: 3.1,
      opacity: 0.7,
      reveal: [0, 0.3],
    }),
    population("tool-hub", motesAround(SEED + 8, tc, 0.05, 30), {
      role: "structure",
      shape: "dot",
      size: 3.2,
      opacity: 0.9,
      reveal: [0, 0.3],
    }),
    population(
      "tool-drop",
      dotsAlong(SEED + 9, [W(tc.a, tc.b, tc.z - tr), W(tc.a, tc.b, 0)], 0.07),
      {
        role: "structure",
        shape: "dot",
        size: 2.3,
        opacity: 0.4,
        reveal: [0, 0.3],
      }
    ),
    population(
      "you-tool",
      dotsAlong(SEED + 10, [W(YOU.a, YOU.b, 0.08), W(tc.a - tr, tc.b, tc.z)], 0.12),
      {
        role: "green",
        shape: "dot",
        size: 2.4,
        opacity: 0.45,
        reveal: [0, 0.35],
      }
    )
  );
  labels.push({
    id: "tool",
    text: "A TOOL",
    at: W(tc.a - tr, tc.b, tc.z),
    dx: -16,
    anchor: "end",
    kind: "name",
  });

  /* ── AN AGENT: the Arc sphere, an orbit, a discharge into the floor ──── */
  const ar = agent.w * 0.5;
  /* The globe hovers well clear of the floor, so its discharge has a length. */
  const ac = W(centre(agent).a, centre(agent).b, agent.h * 0.85 + ar);
  pops.push(
    population("agent-globe", sphereRings(ac, ar, 24, 150, 16, SEED + 11), {
      role: "gold",
      shape: "dot",
      size: 3.2,
      opacity: 0.78,
      reveal: [0, 0.3],
      lit: true,
      twinkle: 0.55,
      sizeVar: 0.4,
    }),
    population("agent-orbit", ringDots(ac, ar * 1.42, 190, "floor", 64, 0.9), {
      role: "accent",
      shape: "dot",
      size: 3.0,
      opacity: 0.85,
      reveal: [0, 0.3],
      twinkle: 0.4,
    }),
    population("agent-orbit-node", [ringDots(ac, ar * 1.42, 190, "floor", 64, 0.9)[47]], {
      role: "accent",
      shape: "ring",
      size: 14,
      opacity: 0.95,
      reveal: [0, 0.3],
    }),
    population(
      "agent-axis",
      dotsAlong(
        SEED + 12,
        [W(ac.a, ac.b + ar * 0.42, ac.z + ar * 1.25), W(ac.a, ac.b - ar * 0.42, ac.z - ar * 1.25)],
        0.06
      ),
      {
        role: "accent",
        shape: "dot",
        size: 2.4,
        opacity: 0.55,
        reveal: [0, 0.3],
      }
    ),
    population("agent-core", motesAround(SEED + 13, ac, ar * 0.28, 160), {
      role: "gold",
      shape: "dot",
      size: 2.6,
      opacity: 0.5,
      reveal: [0, 0.3],
      lit: true,
      sizeVar: 0.8,
      order: 0,
      drift: 0.06,
      twinkle: 0.6,
    })
  );
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
      population(`strike-${i}`, tendrilDots(SEED + 20 + i, from, s, 9, 0.7, 0.04), {
        role: "accent",
        shape: "dot",
        size: 2.9,
        opacity: 0.9,
        reveal: [0.1 + i * 0.03, 0.4 + i * 0.03],
        twinkle: 0.7,
      }),
      population(`strike-cell-${i}`, motesAround(SEED + 40 + i, W(s.a, s.b, 0.01), 0.14, 26), {
        role: "accent",
        shape: "voxel",
        size: 3.4,
        opacity: 0.7,
        reveal: [0.1 + i * 0.03, 0.4 + i * 0.03],
        twinkle: 0.5,
      })
    );
  });
  labels.push({
    id: "agent",
    text: "AN AGENT",
    at: W(ac.a, ac.b, ac.z + ar * 1.3),
    dy: -22,
    anchor: "middle",
    kind: "name",
    lit: true,
  });

  /* It reports back to you: a long dotted line from the globe to the hand. */
  pops.push(
    population(
      "reports",
      dotsAlong(
        SEED + 14,
        [W(ac.a - ar * 0.8, ac.b - ar * 0.5, ac.z - ar * 0.3), W(YOU.a + 0.3, YOU.b + 0.25, 0.15)],
        0.16
      ),
      {
        role: "structure",
        shape: "dot",
        size: 2.4,
        opacity: 0.4,
        reveal: [0.3, 0.75],
      }
    )
  );
  labels.push({
    id: "reports",
    text: "IT REPORTS",
    at: W(ac.a - ar * 0.95, ac.b - ar * 0.45, ac.z - ar * 0.55),
    anchor: "end",
    kind: "note",
    dx: -16,
    dy: 4,
  });

  /* ── Dust ────────────────────────────────────────────────────────────── */
  pops.push(
    population(
      "dust",
      motesIn(
        SEED + 50,
        { a: -0.8, b: -0.8, z: 0.05, w: FW + 1.6, d: FW + 1.6, h: agent.h + ar * 2.2 },
        520
      ),
      {
        role: "structure",
        shape: "dot",
        size: 2.0,
        opacity: 0.17,
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
      { role: "structure", width: 1.1, opacity: 0.5, reveal: [0.02, 0.4] }
    ),
    batch: true,
  });

  /* ── The words ───────────────────────────────────────────────────────── */
  labels.push(
    {
      id: "axis-time",
      text: "HOW LONG, WITHOUT YOU →",
      at: W(FW * 0.5, -0.75, 0),
      rot: -22,
      anchor: "middle",
      kind: "axis",
    },
    {
      id: "axis-work",
      text: "← HOW MUCH OF THE WORK",
      at: W(-0.75, FW * 0.5, 0),
      rot: 22,
      anchor: "middle",
      kind: "axis",
    },
    { id: "end-near", text: "MINUTES", at: W(0, -1.15, 0), anchor: "middle", kind: "end" },
    { id: "end-far", text: "HALF A DAY", at: W(FW + 0.4, -0.35, 0), anchor: "start", kind: "end" },
    { id: "end-top", text: "ALL OF IT", at: W(-0.5, FW + 0.35, 0), anchor: "end", kind: "end" }
  );
  anchors.push(
    W(-1.9, FW * 0.5, 0),
    W(FW * 0.5, -1.6, 0),
    W(FW + 1.6, -0.4, 0),
    W(-1.4, FW + 0.6, 0),
    W(ac.a, ac.b, ac.z + ar * 1.75)
  );

  const all: ABZ[] = [...anchors];
  for (const p of pops) for (const v of p.points) all.push({ a: v[0], b: -v[2], z: v[1] });
  const frame = frameFor(all, { l: 70, r: 70, t: 44, b: 70 }, view);
  const points = pops.flatMap((p) => p.points);

  const spec: HoloStageSpec = {
    id: "stages-sphere",
    frame,
    bounds: boundsOf(points),
    lines,
    faces: [],
    dust: [],
    anchors: [],
    view,
    sweep: SWEEP,
    particles: { populations: pops, scatter: 2.6 },
  };

  return {
    id: "sphere",
    figure: "stages",
    name: "Sphere",
    reference: "the Arc sphere, on the stage; the discharge grid",
    claim:
      "One node a hand's length from you; a loop you operate; a globe of light running on its own over the work it covers, discharging into the floor and reporting back once.",
    spec,
    labels,
  };
}
