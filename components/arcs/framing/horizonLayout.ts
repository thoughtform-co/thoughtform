/**
 * horizonLayout — THE HORIZON, as two lanes on the stage (ADR-130 U4).
 *
 * The Moira workshop's own figure (`loop-moira/components/workshops/visuals/
 * Horizon.tsx`): the same stretch of time, twice. A tool you operate is short
 * runs with a person after every one; an agent on a long task is one long run
 * between a person who sets the goal and a person who judges the result, with
 * the model's own gates on it. Moira draws it as two flat tracks; here the two
 * tracks are LANE MARKINGS on the stage's floor, running up the same time
 * edge as the two drawings before it (`floor.ts`) — "vijf minuten" at the
 * front corner, "een halve dag" at the right tip.
 *
 * ⚠ U2's GATE FRAMES, POSTS AND LIFTED LANES ARE GONE (owner: "because it's
 * 3D it looks ugly"). Nothing stands up off this floor; the lanes are drawn ON
 * it, so the drawing is flat where the argument is flat and the stage only
 * lends it the same view as its neighbours.
 *
 * ⚠ THE DIAL'S LAW FOR EVERY MARK (ADR-106): a FILLED node is a person's hand,
 * an OPEN one the model. The nodes are DOM, seated by fraction.
 *
 * ⚠ PURE, every point absolute.
 */

import {
  type IsoFrame,
  type IsoLabel,
  type Pt,
  isoFraction,
  isoGrid,
  isoPath,
  isoProject,
} from "./iso";
import { GRID_PITCH, TIME_A, type WorldPt, floorCorners, frameAround } from "./floor";

/** The floor: the shared time edge by six units of depth, two lanes on it. */
export const FLOOR = { w: TIME_A, d: 6 } as const;
/** The agent's lane is the NEAR one — the gold run, in front. */
export const AGENT_LANE = 1.6;
export const OPERATED_LANE = 4.6;
export const RUN = { a0: 0.6, a1: TIME_A - 0.6 } as const;

/** Where a fraction of the run lands along the time edge. */
export const along = (t: number) => RUN.a0 + t * (RUN.a1 - RUN.a0);

/** The operated tool's checks: one after every step, evenly along the edge. */
export const checksAt = (steps: number) =>
  Array.from({ length: steps }, (_, i) => RUN.a0 + ((i + 1) * (RUN.a1 - RUN.a0)) / steps);

/** How far a run stops short of the node it meets, in world units. */
export const NODE_GAP = 0.18;

function worldExtent(): WorldPt[] {
  return floorCorners(FLOOR.w, FLOOR.d);
}

/* The left pad holds the two lane names, the right the end's sentence, the
   foot the start's sentence and the time edge's two words. */
export const HZ_FRAME: IsoFrame = frameAround(worldExtent(), { l: 150, r: 190, t: 44, b: 60 });
export const HORIZON_VB = { w: HZ_FRAME.w, h: HZ_FRAME.h } as const;

const P = (a: number, b: number) => isoProject(a, b, 0, HZ_FRAME);

export function horizonFraction(p: Pt): { ax: number; at: number } {
  return isoFraction(p, HZ_FRAME);
}

export function horizonGrid() {
  return isoGrid(0, 0, FLOOR.w, FLOOR.d, 0, GRID_PITCH, HZ_FRAME);
}

export function horizonAxis(): string {
  return isoPath([P(0, 0), P(FLOOR.w, 0)]);
}

/** The short runs between checks on the operated lane. */
export function operatedRuns(steps: number): readonly string[] {
  const checks = checksAt(steps);
  return checks.map((c, i) =>
    isoPath([
      P((i === 0 ? RUN.a0 : checks[i - 1]) + NODE_GAP, OPERATED_LANE),
      P(c - NODE_GAP, OPERATED_LANE),
    ])
  );
}

/** The agent's one run, from the first person to the last. */
export function agentRun(): string {
  return isoPath([P(RUN.a0 + NODE_GAP, AGENT_LANE), P(RUN.a1 - NODE_GAP, AGENT_LANE)]);
}

/**
 * The retry's step back, drawn ON THE FLOOR in front of the run: the agent
 * leaves the lane, goes back along the time edge and rejoins it.
 */
export function retryLoop(at: number): { loop: string; head: string } {
  const a = along(at);
  const back = a - 1.3;
  const b = AGENT_LANE - 0.7;
  return {
    loop: isoPath([P(a, AGENT_LANE), P(a, b), P(back, b), P(back, AGENT_LANE - NODE_GAP)]),
    head: isoPath([
      P(back - 0.16, AGENT_LANE - 0.45),
      P(back, AGENT_LANE - NODE_GAP),
      P(back + 0.16, AGENT_LANE - 0.45),
    ]),
  };
}

/** The point on the time edge straight below a screen x: a sentence set under
 *  the edge must clear it at its LEFT end, where the rising edge is lowest. */
function edgeBelow(x: number): Pt {
  const a = (x - HZ_FRAME.ox) / (HZ_FRAME.k * Math.cos((22 * Math.PI) / 180));
  return P(a, 0);
}

/** Every seat the renderer and the fit guard share. */
export function horizonSeats(steps: number, gates: readonly { at: number }[]) {
  const checks = checksAt(steps);
  const last = P(checks[steps - 1], OPERATED_LANE);
  const start = P(RUN.a0, AGENT_LANE);
  const end = P(RUN.a1, AGENT_LANE);
  const opStart = P(RUN.a0, OPERATED_LANE);
  const corner = P(0, 0);
  const tip = P(FLOOR.w, 0);
  return {
    operatedLabel: horizonFraction({ x: opStart.x - 14, y: opStart.y }),
    agentLabel: horizonFraction({ x: start.x - 14, y: start.y }),
    checks: checks.map((a) => horizonFraction(P(a, OPERATED_LANE))),
    check: horizonFraction({ x: last.x, y: last.y - 30 }),
    agentEnds: [horizonFraction(start), horizonFraction(end)],
    start: horizonFraction({ x: corner.x - 8, y: corner.y + 14 }),
    end: horizonFraction({ x: end.x - 4, y: edgeBelow(end.x).y + 10 }),
    gates: gates.map((g) => horizonFraction(P(along(g.at), AGENT_LANE))),
    gateLabels: gates.map((g) => {
      const p = P(along(g.at), AGENT_LANE);
      return horizonFraction({ x: p.x, y: p.y - 16 });
    }),
    from: horizonFraction({ x: corner.x + 8, y: corner.y + 14 }),
    to: horizonFraction({ x: tip.x + 10, y: tip.y }),
  };
}

/** The short ticks that join a label to its node, where the two are apart. */
export function horizonLeaders(steps: number, gates: readonly { at: number }[]): readonly string[] {
  const checks = checksAt(steps);
  const last = P(checks[steps - 1], OPERATED_LANE);
  const start = P(RUN.a0, AGENT_LANE);
  const corner = P(0, 0);
  return [
    isoPath([
      { x: last.x, y: last.y - 5 },
      { x: last.x, y: last.y - 28 },
    ]),
    ...gates.map((g) => {
      const p = P(along(g.at), AGENT_LANE);
      return isoPath([
        { x: p.x, y: p.y - 5 },
        { x: p.x, y: p.y - 14 },
      ]);
    }),
    isoPath([
      { x: start.x - 4, y: start.y + 4 },
      { x: corner.x - 8, y: corner.y + 10 },
    ]),
    (() => {
      const end = P(RUN.a1, AGENT_LANE);
      return isoPath([
        { x: end.x, y: end.y + 5 },
        { x: end.x, y: edgeBelow(end.x).y + 8 },
      ]);
    })(),
  ];
}

/** The type the lane's sentences are set at, in viewbox units at 1280×720. */
export const HZ_SENTENCE_MEASURE = 104;

export function horizonLabels(section: {
  axis: { from: string; to: string };
  operated: { label: string; check: string; steps: number };
  agent: {
    label: string;
    start: string;
    end: string;
    gates: readonly { kind: string; at: number; label: string }[];
  };
}): readonly IsoLabel[] {
  const s = horizonSeats(section.operated.steps, section.agent.gates);
  return [
    {
      id: "operated",
      text: section.operated.label,
      ...s.operatedLabel,
      anchor: "end",
      measure: 136,
      lines: 2,
    },
    {
      id: "agent",
      text: section.agent.label,
      ...s.agentLabel,
      anchor: "end",
      measure: 136,
      lines: 2,
    },
    { id: "check", text: section.operated.check, ...s.check, anchor: "middle", vAlign: "bottom" },
    {
      id: "start",
      text: section.agent.start,
      ...s.start,
      anchor: "end",
      vAlign: "top",
      measure: 170,
      lines: 2,
    },
    {
      id: "end",
      text: section.agent.end,
      ...s.end,
      anchor: "start",
      vAlign: "top",
      measure: 150,
      lines: 2,
    },
    ...section.agent.gates.map((g, i) => ({
      id: `gate-${g.kind}`,
      text: g.label,
      ...s.gateLabels[i],
      anchor: "middle" as const,
      vAlign: "bottom" as const,
      measure: HZ_SENTENCE_MEASURE,
      lines: 2,
    })),
    { id: "from", text: section.axis.from, ...s.from, anchor: "start", vAlign: "top" },
    { id: "to", text: section.axis.to, ...s.to, anchor: "start" },
  ];
}

/** Every point the drawing uses, for the containment walk. */
export function horizonExtent(): readonly Pt[] {
  return worldExtent().map((p) => isoProject(p.a, p.b, p.z, HZ_FRAME));
}
