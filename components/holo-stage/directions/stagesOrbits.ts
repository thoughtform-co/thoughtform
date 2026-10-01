/**
 * ORBITS — a prompt, a tool, an agent, as three sizes of orbit.
 *
 * From the owner's wire-planet reference: a geodesic sphere, a tilted orbit
 * crossing it, ringed instruments on its surface. The reading is AUTONOMY AS
 * ORBIT. A prompt is one straight pulse between your hand and the model — you
 * hold both ends. A tool is a closed ring your hand sits ON: every revolution
 * passes through you. An agent is a wire sphere (the goal) with a tilted
 * orbit carrying its own checks, running on its own; you stand at the edge
 * of the floor and it reaches you once, on a dashed handoff, to ask.
 *
 * The floor and the two axes are the stage's (time along the front-right
 * edge, the work up the left); each station stands further along both and
 * its FOOTPRINT ring on the floor is the work it covers. Gold buys the agent's
 * orbit and nothing else; green is the person.
 */

import { GRID_PITCH, TIME_A } from "@/components/arcs/framing/floor";
import { ISO_SEED } from "@/components/arcs/framing/iso";

import type { StageView, Vec3 } from "../stageFit";
import {
  gridLines,
  specBounds,
  sweepReaches,
  type HoloStageSpec,
  type StageDust,
  type StageFace,
  type StageLine,
  type StageSweep,
} from "../stageGeom";
import {
  abz,
  collector,
  dashes,
  frameFor,
  icosphere,
  openNode,
  orbit,
  orbitAt,
  personNode,
  ring,
  run,
  sphereMotes,
  type ABZ,
  type DirLabel,
  type Direction,
} from "./shared";

const W = TIME_A;
const SWEEP: StageSweep = { axis: 0, from: -0.4, to: W + 0.6, window: [0.04, 0.66], width: 0.3 };
const at = (a: number) => sweepReaches(SWEEP, a);

/** The direction's own vantage; the lab may turn it. */
export const STAGESORBITS_VIEW: StageView = { azimuthDeg: 40, elevationDeg: 30 };

export function stagesOrbits(view: StageView = STAGESORBITS_VIEW): Direction {
  const pts = collector();
  const lines: StageLine[] = [];
  const faces: StageFace[] = [];
  const dust: StageDust[] = [];
  const labels: DirLabel[] = [];

  /* The floor and its two front edges. */
  lines.push(
    ...gridLines("grid", { a: 0, b: 0, w: W, d: W, pitch: GRID_PITCH }).map((l) => ({
      ...l,
      batch: true,
      opacity: 0.11,
    }))
  );
  lines.push(
    run(
      "axis-a",
      [abz(0, 0, 0), abz(W, 0, 0)].map((p) => [p.a, p.z, -p.b] as Vec3),
      { role: "structure", width: 1.1, opacity: 0.5, reveal: [0.02, 0.3] }
    ),
    run(
      "axis-b",
      [abz(0, 0, 0), abz(0, W, 0)].map((p) => [p.a, p.z, -p.b] as Vec3),
      { role: "structure", width: 1.1, opacity: 0.5, reveal: [0.04, 0.3] }
    )
  );
  pts.add(abz(0, 0, 0), abz(W, 0, 0), abz(W, W, 0), abz(0, W, 0));

  /* ── 1 · the prompt: one pulse, your hand at one end ─────────────────── */
  {
    const c = abz(1.9, 1.6, 0.85);
    const you = abz(c.a - 0.95, c.b, c.z);
    const model = abz(c.a + 0.95, c.b, c.z);
    const r = [at(you.a), at(model.a) + 0.08] as const;
    lines.push(...personNode("p-you", you, r, view));
    lines.push(openNode("p-model", model, r, view));
    lines.push(
      run(
        "p-pulse",
        [you, model].map((p) => [p.a, p.z, -p.b] as Vec3),
        { role: "structure", width: 1.4, opacity: 0.9, reveal: r }
      )
    );
    lines.push(
      run("p-foot", ring(abz(c.a, c.b, 0), 0.55, 28, "floor"), {
        role: "grid",
        width: 0.9,
        opacity: 0.3,
        reveal: r,
      })
    );
    /* Its stem: the pulse's height above the floor, a hairline. */
    lines.push(
      run(
        "p-stem",
        [
          [c.a, 0, -c.b],
          [c.a, c.z, -c.b],
        ],
        { role: "grid", width: 0.85, opacity: 0.35, reveal: r }
      )
    );
    pts.add(you, model, abz(c.a - 0.6, c.b - 0.6, 0), abz(c.a + 0.6, c.b + 0.6, 0));
    labels.push({
      id: "name-prompt",
      text: "A PROMPT",
      at: abz(model.a + 0.35, model.b, model.z),
      anchor: "start",
      kind: "name",
      dx: 10,
    });
    labels.push({
      id: "you",
      text: "YOU",
      at: abz(you.a - 0.3, you.b, you.z),
      anchor: "end",
      kind: "person",
      dx: -10,
    });
  }

  /* ── 2 · the tool: a ring your hand sits on ───────────────────────────── */
  {
    const c = abz(5.4, 4.9, 1.35);
    const R = 0.95;
    const r = [at(c.a - R), at(c.a + R) + 0.1] as const;
    const loop = ring(c, R, 48, "screen", view);
    lines.push(run("t-loop", loop, { role: "structure", width: 1.5, opacity: 0.9, reveal: r }));
    /* Your hand ON the ring (lower left), the model on it opposite. */
    const you: ABZ = { a: loop[30][0], b: -loop[30][2], z: loop[30][1] };
    const model: ABZ = { a: loop[6][0], b: -loop[6][2], z: loop[6][1] };
    lines.push(...personNode("t-you", you, r, view));
    lines.push(openNode("t-model", model, r, view));
    lines.push(
      run("t-foot", ring(abz(c.a, c.b, 0), 1.15, 36, "floor"), {
        role: "grid",
        width: 0.9,
        opacity: 0.3,
        reveal: r,
      })
    );
    lines.push(
      run(
        "t-stem",
        [
          [c.a, 0, -c.b],
          [c.a, c.z - R, -c.b],
        ],
        { role: "grid", width: 0.85, opacity: 0.35, reveal: r }
      )
    );
    pts.add(
      abz(c.a - R, c.b, c.z - R),
      abz(c.a + R, c.b, c.z + R),
      abz(c.a - 1.2, c.b - 1.2, 0),
      abz(c.a + 1.2, c.b + 1.2, 0)
    );
    labels.push({
      id: "name-tool",
      text: "A TOOL",
      at: abz(c.a + R + 0.25, c.b, c.z),
      anchor: "start",
      kind: "name",
    });
  }

  /* ── 3 · the agent: a sphere with its own orbit ───────────────────────── */
  {
    const c = abz(9.2, 8.8, 2.6);
    const RS = 1.15;
    const RO = 2.35;
    const TILT = 24;
    const YAW = 18;
    const r = [at(c.a - RO), at(c.a + RO) + 0.08] as const;
    const geo = icosphere(c, RS, 1);
    for (const [i, [p, q]] of geo.edges.entries()) {
      lines.push(
        run(
          `a-geo-${i}`,
          [
            [p.a, p.z, -p.b],
            [q.a, q.z, -q.b],
          ],
          { role: "gold", width: 0.95, opacity: 0.5, reveal: r }
        )
      );
    }
    dust.push({
      id: "a-core",
      points: sphereMotes(ISO_SEED + 404, c, RS * 0.92, 240),
      opacity: 0.55,
      role: "gold",
      size: 6,
    });
    /* The orbit: the one lit run, the beat's gold. */
    lines.push(
      run("a-orbit", orbit(c, RO, RO, TILT, 96, YAW), {
        role: "gold",
        width: 2.2,
        opacity: 1,
        reveal: [r[0] + 0.02, r[1] + 0.14],
        donor: true,
      })
    );
    /* Its checks ride the orbit — open nodes, the model's own. */
    for (const [i, deg] of [25, 150, 265].entries()) {
      const s = orbitAt(c, RO, RO, TILT, deg, YAW);
      lines.push(
        openNode(`a-check-${i}`, s, [r[0] + 0.1 + i * 0.03, r[1] + 0.16], view, "gold", 0.14)
      );
      pts.add(s);
    }
    lines.push(
      run("a-foot", ring(abz(c.a, c.b, 0), RO, 48, "floor"), {
        role: "grid",
        width: 0.9,
        opacity: 0.3,
        reveal: r,
      })
    );
    lines.push(
      run(
        "a-stem",
        [
          [c.a, 0, -c.b],
          [c.a, c.z - RS, -c.b],
        ],
        { role: "grid", width: 0.85, opacity: 0.35, reveal: r }
      )
    );
    /* You, at the floor's edge; it reaches you once, dashed. */
    const you = abz(W + 0.3, 5.2, 0.6);
    lines.push(...personNode("a-you", you, [r[1], r[1] + 0.12], view));
    const ask = orbitAt(c, RO, RO, TILT, 330, YAW);
    lines.push(
      ...dashes(
        "a-ask",
        [
          [ask.a, ask.z, -ask.b],
          [you.a, you.z, -you.b],
        ],
        { role: "green", width: 1.1, opacity: 0.7, reveal: [r[1] + 0.04, r[1] + 0.2] }
      )
    );
    pts.add(
      you,
      abz(c.a - RO, c.b - RO, 0),
      abz(c.a + RO, c.b + RO, c.z + RO * 0.5),
      abz(c.a, c.b, c.z + RS + 0.2)
    );
    pts.add(abz(c.a - RO * 1.05, c.b, c.z), abz(c.a + RO * 1.05, c.b, c.z));
    labels.push({
      id: "name-agent",
      text: "AN AGENT",
      at: abz(c.a + RO * 0.55, c.b + RO * 0.9, c.z + 0.9),
      anchor: "start",
      kind: "name",
      lit: true,
    });
    labels.push({
      id: "asks",
      text: "IT ASKS",
      at: abz(you.a + 0.3, you.b, you.z),
      anchor: "start",
      kind: "person",
      dx: 12,
    });
  }

  /* The axis words, along their edges; the ends. */
  labels.push(
    {
      id: "axis-time",
      text: "HOW LONG, WITHOUT YOU →",
      at: abz(W * 0.62, -1.15, 0),
      anchor: "middle",
      rot: -22,
      kind: "axis",
    },
    {
      id: "axis-work",
      text: "← HOW MUCH OF THE WORK",
      at: abz(-1.15, W * 0.55, 0),
      anchor: "middle",
      rot: 22,
      kind: "axis",
    },
    { id: "end-near", text: "MINUTES", at: abz(0, -1.0, 0), anchor: "middle", kind: "end" },
    { id: "end-far", text: "HALF A DAY", at: abz(W + 0.9, -0.3, 0), anchor: "start", kind: "end" },
    { id: "end-top", text: "ALL OF IT", at: abz(-0.9, W + 0.3, 0), anchor: "end", kind: "end" }
  );
  pts.add(abz(W + 1.6, -1.2, 0), abz(-1.6, W + 0.8, 0), abz(0, -1.6, 0));

  const frame = frameFor(pts.all, { l: 72, r: 72, t: 24, b: 56 }, view);
  const spec: HoloStageSpec = {
    id: "stages-orbits",
    frame,
    view,
    bounds: specBounds(lines, faces),
    lines,
    faces,
    dust,
    anchors: [],
    sweep: SWEEP,
  };
  return {
    id: "orbits",
    figure: "stages",
    name: "Orbits",
    reference: "the wire planet with a tilted orbit",
    claim:
      "Autonomy is orbit: a pulse you hold, a ring you sit on, a sphere that runs its own loop and reaches you once.",
    spec,
    labels,
  };
}
