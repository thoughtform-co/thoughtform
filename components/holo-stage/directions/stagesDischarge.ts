/**
 * DISCHARGE — a prompt, a tool, an agent, as what strikes the work.
 *
 * From the owner's reference of a geodesic sphere hovering over a ruled plane
 * and discharging tendrils into it. The FLOOR IS THE WORK. A prompt is one
 * bolt from your hand into one cell. A tool is a low loop you operate,
 * striking a strip of cells one after another. An agent is a gold sphere
 * hovering over a wide field, tendrils into dozens of cells at once — a storm
 * you are not standing in; you receive its report at the far edge.
 *
 * How much of the work = the area lit. How long without you = how far along
 * the time edge the station stands. Gold buys the agent and its field.
 */

import { TIME_A } from "@/components/arcs/framing/floor";
import { ISO_SEED, mulberry32 } from "@/components/arcs/framing/iso";

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
  cell,
  collector,
  dashes,
  frameFor,
  icosphere,
  personNode,
  ring,
  run,
  sphereMotes,
  tendril,
  type DirLabel,
  type Direction,
} from "./shared";

const W = TIME_A;
const SWEEP: StageSweep = { axis: 0, from: -0.4, to: W + 0.6, window: [0.04, 0.66], width: 0.3 };
const at = (a: number) => sweepReaches(SWEEP, a);
const V = (a: number, b: number, z: number): Vec3 => [a, z, -b];

/** The direction's own vantage; the lab may turn it. */
export const STAGESDISCHARGE_VIEW: StageView = { azimuthDeg: 30, elevationDeg: 36 };

export function stagesDischarge(view: StageView = STAGESDISCHARGE_VIEW): Direction {
  const pts = collector();
  const lines: StageLine[] = [];
  const faces: StageFace[] = [];
  const dust: StageDust[] = [];
  const labels: DirLabel[] = [];

  /* A finer graticule: every cell is a unit of the work. */
  lines.push(
    ...gridLines("fine", { a: 0, b: 0, w: W, d: W, pitch: 1 }).map((l) => ({
      ...l,
      batch: true,
      opacity: 0.06,
    }))
  );
  lines.push(
    ...gridLines("grid", { a: 0, b: 0, w: W, d: W, pitch: 3 }).map((l) => ({
      ...l,
      batch: true,
      opacity: 0.13,
    }))
  );
  lines.push(
    run("axis-a", [V(0, 0, 0), V(W, 0, 0)], {
      role: "structure",
      width: 1.1,
      opacity: 0.5,
      reveal: [0.02, 0.3],
    }),
    run("axis-b", [V(0, 0, 0), V(0, W, 0)], {
      role: "structure",
      width: 1.1,
      opacity: 0.5,
      reveal: [0.04, 0.3],
    })
  );
  pts.add(abz(0, 0, 0), abz(W, 0, 0), abz(W, W, 0), abz(0, W, 0));

  /* ── 1 · the prompt: one bolt into one cell ───────────────────────────── */
  {
    const ca = 1;
    const cb = 1;
    const target = abz(ca + 0.5, cb + 0.5, 0);
    const you = abz(0.5, -0.3, 0.9);
    const r = [at(0.3), at(2.2)] as const;
    faces.push(
      cell("p-cell", ca, cb, 1, {
        role: "structure",
        opacity: 0.22,
        reveal: [r[1] - 0.03, r[1] + 0.06],
      })
    );
    lines.push(...personNode("p-you", you, r, view));
    lines.push(
      run("p-bolt", tendril(ISO_SEED + 11, you, target, 7, 0.14), {
        role: "structure",
        width: 1.3,
        opacity: 0.9,
        reveal: r,
        batch: false,
      })
    );
    pts.add(you, abz(ca, cb, 0), abz(ca + 1, cb + 1, 0));
    labels.push({
      id: "name-prompt",
      text: "A PROMPT",
      at: abz(ca + 1.3, cb + 0.5, 0.15),
      anchor: "start",
      kind: "name",
      dx: 12,
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

  /* ── 2 · the tool: a loop striking a strip ────────────────────────────── */
  {
    const a0 = 3.5;
    const b0 = 3;
    const n = 4;
    const loopC = abz(a0 + n / 2, b0 + 0.5, 1.2);
    const you = abz(a0 - 0.9, b0 + 0.5, 1.2);
    const r = [at(a0 - 1), at(a0 + n) + 0.08] as const;
    for (let i = 0; i < n; i++) {
      faces.push(
        cell(`t-cell-${i}`, a0 + i, b0, 1, {
          role: "structure",
          opacity: 0.16 + 0.03 * i,
          reveal: [at(a0 + i) + 0.02, at(a0 + i) + 0.1],
        })
      );
      const target = abz(a0 + i + 0.5, b0 + 0.5, 0);
      lines.push(
        run(`t-strike-${i}`, tendril(ISO_SEED + 31 + i, loopC, target, 6, 0.12), {
          role: "structure",
          width: 1.1,
          opacity: 0.75,
          reveal: [at(a0 + i), at(a0 + i) + 0.1],
          batch: false,
        })
      );
    }
    lines.push(
      run("t-loop", ring(loopC, 0.5, 36, "screen", view), {
        role: "structure",
        width: 1.5,
        opacity: 0.95,
        reveal: r,
      })
    );
    lines.push(...personNode("t-you", you, r, view));
    lines.push(
      run("t-hand", [V(you.a + 0.2, you.b, you.z), V(loopC.a - 0.5, loopC.b, loopC.z)], {
        role: "green",
        width: 1.1,
        opacity: 0.8,
        reveal: r,
      })
    );
    pts.add(you, abz(a0, b0, 0), abz(a0 + n, b0 + 1, 0), abz(loopC.a, loopC.b, loopC.z + 0.6));
    labels.push({
      id: "name-tool",
      text: "A TOOL",
      at: abz(loopC.a + 0.75, loopC.b, loopC.z),
      anchor: "start",
      kind: "name",
      dx: 12,
    });
  }

  /* ── 3 · the agent: a sphere over the field ───────────────────────────── */
  {
    const c = abz(9, 9, 3.1);
    const RS = 1.1;
    const f0 = 6;
    const F = 6;
    const r = [at(f0 - 0.5), at(f0 + F) + 0.08] as const;
    const rnd = mulberry32(ISO_SEED + 909);
    /* The field: every cell lit a little, by the record's own randomness. */
    for (let i = 0; i < F; i++)
      for (let j = 0; j < F; j++) {
        const a = f0 + i;
        const b = f0 + j;
        const k = rnd();
        faces.push(
          cell(`a-cell-${i}-${j}`, a, b, 1, {
            role: "gold",
            opacity: 0.05 + k * 0.13,
            reveal: [at(a) + 0.03, at(a) + 0.12],
          })
        );
      }
    /* The sphere, its core, its equator — the one lit run. */
    const geo = icosphere(c, RS, 1);
    for (const [i, [p, q]] of geo.edges.entries()) {
      lines.push(
        run(`a-geo-${i}`, [V(p.a, p.b, p.z), V(q.a, q.b, q.z)], {
          role: "gold",
          width: 0.95,
          opacity: 0.55,
          reveal: r,
        })
      );
    }
    dust.push({
      id: "a-core",
      points: sphereMotes(ISO_SEED + 505, c, RS * 0.9, 220),
      opacity: 0.55,
      role: "gold",
      size: 6,
    });
    lines.push(
      run("a-equator", ring(c, RS * 1.02, 64, "screen", view), {
        role: "gold",
        width: 2.2,
        opacity: 1,
        reveal: [r[0] + 0.04, r[1] + 0.12],
        donor: true,
      })
    );
    /* The discharge: tendrils into a seeded dozen of the field's cells. */
    const picks = new Set<number>();
    const prnd = mulberry32(ISO_SEED + 606);
    while (picks.size < 12) picks.add(Math.floor(prnd() * F * F));
    let k = 0;
    for (const idx of picks) {
      const i = Math.floor(idx / F);
      const j = idx % F;
      const target = abz(f0 + i + 0.5, f0 + j + 0.5, 0);
      lines.push(
        run(`a-bolt-${k}`, tendril(ISO_SEED + 700 + k, c, target, 9, 0.3), {
          role: "gold",
          width: 1.05,
          opacity: 0.72,
          reveal: [at(target.a) + 0.02, at(target.a) + 0.1],
          batch: false,
        })
      );
      k++;
    }
    /* Sparks where the bolts land. */
    const sparks: Vec3[] = [];
    const srnd = mulberry32(ISO_SEED + 808);
    for (let i = 0; i < 160; i++) sparks.push(V(f0 + srnd() * F, f0 + srnd() * F, srnd() * 0.5));
    dust.push({ id: "a-sparks", points: sparks, opacity: 0.45, role: "gold", size: 5 });
    /* You, at the far edge, receiving the report. */
    const you = abz(W + 0.4, 4.6, 0.6);
    lines.push(...personNode("a-you", you, [r[1], r[1] + 0.12], view));
    lines.push(
      ...dashes(
        "a-report",
        [V(c.a + RS * 0.7, c.b - RS * 0.5, c.z - 0.4), V(you.a, you.b, you.z)],
        { role: "green", width: 1.1, opacity: 0.7, reveal: [r[1] + 0.04, r[1] + 0.2] }
      )
    );
    pts.add(
      you,
      abz(f0, f0, 0),
      abz(f0 + F, f0 + F, 0),
      abz(c.a, c.b, c.z + RS + 0.3),
      abz(c.a - RS * 1.1, c.b, c.z),
      abz(c.a + RS * 1.1, c.b, c.z)
    );
    labels.push({
      id: "name-agent",
      text: "AN AGENT",
      at: abz(c.a + RS + 0.35, c.b, c.z + 0.2),
      anchor: "start",
      kind: "name",
      lit: true,
    });
    labels.push({
      id: "report",
      text: "IT REPORTS",
      at: abz(you.a + 0.3, you.b, you.z),
      anchor: "start",
      kind: "person",
      dx: 12,
    });
  }

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
    id: "stages-discharge",
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
    id: "discharge",
    figure: "stages",
    name: "Discharge",
    reference: "the sphere over the grid, tendrils into the cells",
    claim:
      "The floor is the work. One bolt from your hand; a loop you operate striking a strip; a storm over a field you are not standing in.",
    spec,
    labels,
  };
}
