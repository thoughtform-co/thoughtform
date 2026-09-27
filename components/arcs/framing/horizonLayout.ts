/**
 * horizonLayout — the geometry of THE HORIZON (ADR-130, redrawn in U1).
 *
 * Two lanes over one stretch of time, in the brandworld's isometric register.
 * FAR and above, a person operates a tool: short runs with a person after
 * every one. NEAR and on the plane, an agent runs one long task between a
 * person who sets the goal and a person who judges the result, passing three
 * GATE FRAMES of its own — wireframe hoops standing on the datum, each with a
 * dashed drop to the floor so it reads as standing rather than floating.
 *
 * ⚠ THE MARKS ARE THE DIAL'S (ADR-106): a filled node is a person's hand, an
 * open one the model. The nodes stay DOM, seated by fraction, so they are 7px
 * at every scale and nothing on the figure carries a `transform`.
 *
 * ⚠ THE TWO LANES ARE SEPARATED IN HEIGHT AS WELL AS DEPTH, and that is
 * arithmetic rather than taste: the agent's gates stand about a unit above its
 * rail, so two lanes on one plane put the gate labels through the far lane's
 * own row. Nothing is encoded by the lift — the lanes are two readings of the
 * same axis, which is what the beat's copy says.
 *
 * ⚠ PURE, every point absolute.
 */

import {
  ISO_BASIS_CABINET,
  ISO_SEED,
  type IsoFrame,
  type IsoLabel,
  type Pt,
  isoDust,
  isoFraction,
  isoGate,
  isoGrid,
  isoPath,
  isoProject,
  isoRail,
} from "./iso";

export const HORIZON_VB = { w: 1200, h: 440 } as const;

export const HZ_FRAME: IsoFrame = {
  w: HORIZON_VB.w,
  h: HORIZON_VB.h,
  ox: 110,
  oy: 400,
  k: 105,
  basis: ISO_BASIS_CABINET,
};

/** The datum, and where each lane runs on it. */
export const FLOOR = { a: 0, b: 0, w: 7.4, d: 4.4, pitch: 1 } as const;
/* ⚠ THE RUN STARTS AT 0.9, NOT AT THE FLOOR'S EDGE. Each lane's name is set
   from its right edge, ending where the lane begins, and the agent's lane is
   the near one — least offset by depth — so a run starting on the datum's own
   edge left its label hanging off the crop. The floor still starts at 0. */
export const RUN = { a0: 0.9, a1: 7.1 } as const;
export const AGENT_LANE = { b: 0.5, z: 0.6 } as const;
export const OPERATED_LANE = { b: 3.9, z: 1.3 } as const;
/** A gate straddles the agent's rail: a hoop in the depth-height plane. */
export const GATE = { b: 0.1, d: 0.8, z: 0.25, h: 0.7 } as const;

/** Where a fraction of the run lands along the time axis. */
export const along = (t: number) => RUN.a0 + t * (RUN.a1 - RUN.a0);

/** The operated tool's checks: one after every step, evenly along the axis. */
export const checksAt = (steps: number) =>
  Array.from({ length: steps }, (_, i) => RUN.a0 + ((i + 1) * (RUN.a1 - RUN.a0)) / steps);

/** How far a run stops short of the node it meets, in units. */
export const NODE_GAP = 0.09;

/** The short runs between checks on the far lane. */
export function operatedRuns(steps: number): readonly string[] {
  const checks = checksAt(steps);
  return checks.map((c, i) =>
    isoRail(
      i === 0 ? RUN.a0 : checks[i - 1] + NODE_GAP,
      c - NODE_GAP,
      OPERATED_LANE.b,
      OPERATED_LANE.z,
      HZ_FRAME
    )
  );
}

/** The agent's one run, from the first person to the last. */
export function agentRun(): string {
  return isoRail(RUN.a0 + 0.12, RUN.a1 - 0.12, AGENT_LANE.b, AGENT_LANE.z, HZ_FRAME);
}

export function horizonGrid() {
  return isoGrid(FLOOR.a, FLOOR.b, FLOOR.w, FLOOR.d, 0, FLOOR.pitch, HZ_FRAME);
}

export function gateAt(at: number) {
  return isoGate(along(at), GATE.b, GATE.z, GATE.d, GATE.h, HZ_FRAME);
}

/**
 * The retry's loop-back, drawn IN THE PLANE behind the rail: the run steps
 * back along the time axis and rejoins. A bezier under the rail would leave
 * the datum, which on an axonometric reads as the line lifting off the floor.
 */
export function retryLoop(at: number): { loop: string; head: string } {
  const a = along(at);
  const back = a - 0.62;
  const b = AGENT_LANE.b;
  const z = AGENT_LANE.z;
  const p = (aa: number, bb: number) => isoProject(aa, bb, z, HZ_FRAME);
  return {
    loop: isoPath([p(a, b), p(a, b - 0.42), p(back, b - 0.42), p(back, b)]),
    head: isoPath([p(back + 0.1, b - 0.12), p(back, b), p(back + 0.02, b - 0.2)]),
  };
}

export function horizonDust(): readonly Pt[] {
  return isoDust(ISO_SEED, 24, FLOOR.a, FLOOR.b, FLOOR.w, FLOOR.d, 2.2, HZ_FRAME);
}

/** A point as fractions of the crop. */
export function horizonFraction(x: number, y: number): { ax: number; at: number } {
  return isoFraction({ x, y }, HZ_FRAME);
}

const lane = (a: number, l: { b: number; z: number }) =>
  isoProject(a, l.b, l.z, HZ_FRAME);

/** Every seat the renderer and the fit guard share. */
export function horizonSeats(steps: number, gates: readonly { at: number }[]) {
  const opStart = lane(RUN.a0, OPERATED_LANE);
  const agStart = lane(RUN.a0, AGENT_LANE);
  const agEnd = lane(RUN.a1, AGENT_LANE);
  const near0 = isoProject(FLOOR.a, FLOOR.b, 0, HZ_FRAME);
  const near1 = isoProject(FLOOR.w, FLOOR.b, 0, HZ_FRAME);
  return {
    operatedLabel: horizonFraction(opStart.x - 16, opStart.y),
    agentLabel: horizonFraction(agStart.x - 16, agStart.y),
    checks: checksAt(steps).map((a) => {
      const p = lane(a, OPERATED_LANE);
      return horizonFraction(p.x, p.y);
    }),
    check: (() => {
      const p = lane(checksAt(steps)[steps - 1], OPERATED_LANE);
      return horizonFraction(p.x, p.y + 14);
    })(),
    agentEnds: [horizonFraction(agStart.x, agStart.y), horizonFraction(agEnd.x, agEnd.y)],
    start: horizonFraction(agStart.x - 4, agStart.y + 20),
    end: horizonFraction(agEnd.x + 4, agEnd.y + 20),
    gates: gates.map((g) => {
      const p = lane(g.at === undefined ? 0 : along(g.at), AGENT_LANE);
      return horizonFraction(p.x, p.y);
    }),
    gateLabels: gates.map((g) => horizonFraction(gateAt(g.at).head.x, gateAt(g.at).head.y - 14)),
    from: horizonFraction(near0.x, near0.y + 14),
    to: horizonFraction(near1.x, near0.y + 14),
  };
}

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
      measure: 150,
      lines: 2,
    },
    {
      id: "agent",
      text: section.agent.label,
      ...s.agentLabel,
      anchor: "end",
      measure: 150,
      lines: 2,
    },
    { id: "check", text: section.operated.check, ...s.check, anchor: "end", vAlign: "top" },
    { id: "start", text: section.agent.start, ...s.start, anchor: "start", vAlign: "top" },
    { id: "end", text: section.agent.end, ...s.end, anchor: "end", vAlign: "top" },
    ...section.agent.gates.map((g, i) => ({
      id: `gate-${g.kind}`,
      text: g.label,
      ...s.gateLabels[i],
      anchor: "middle" as const,
      vAlign: "bottom" as const,
      measure: 150,
      lines: 2,
    })),
    { id: "from", text: section.axis.from, ...s.from, anchor: "start", vAlign: "top" },
    { id: "to", text: section.axis.to, ...s.to, anchor: "end", vAlign: "top" },
  ];
}

/** Every point the drawing uses, for the fit guard's containment walk. */
export function horizonExtent(): readonly Pt[] {
  return [
    isoProject(FLOOR.a, FLOOR.b, 0, HZ_FRAME),
    isoProject(FLOOR.w, FLOOR.b, 0, HZ_FRAME),
    isoProject(FLOOR.w, FLOOR.d, 0, HZ_FRAME),
    isoProject(FLOOR.a, FLOOR.d, 0, HZ_FRAME),
    lane(RUN.a1, OPERATED_LANE),
    isoProject(along(0.27), GATE.b + GATE.d, GATE.z + GATE.h, HZ_FRAME),
  ];
}
