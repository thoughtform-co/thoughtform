/**
 * GAUGE — the spectrum as a graduated half-ring, standing on the floor.
 *
 * From the owner's instrument references: a graduated arc, a needle, bands
 * on the scale. TOOL at the left end, COLLABORATOR at the right; two band
 * arcs on the scale — software reaching from the tool's end, intelligence
 * from the collaborator's — overlapping in the middle under a gold wash; the
 * needle standing at the overlap, where AI sits. Under the dial, on the floor,
 * the field: a lattice of motes on the tool's side dissolving into a cloud on
 * the collaborator's — software is deterministic, intelligence is
 * probabilistic. Gold buys the needle and the overlap.
 */

import { ISO_SEED, mulberry32 } from "@/components/arcs/framing/iso";

import type { StageView, Vec3 } from "../stageFit";
import {
  gridLines,
  specBounds,
  type HoloStageSpec,
  type StageDust,
  type StageLine,
  type StageStrip,
  type StageSweep,
} from "../stageGeom";
import {
  abz,
  collector,
  frameFor,
  ring,
  run,
  type ABZ,
  type DirLabel,
  type Direction,
} from "./shared";

const W = 12;
const D = 4.5;
const C: ABZ = abz(6, 2.4, 0);
const R = 4.6;
const SWEEP: StageSweep = { axis: 0, from: -0.4, to: W + 0.6, window: [0.04, 0.66], width: 0.3 };
const V = (p: ABZ): Vec3 => [p.a, p.z, -p.b];

/** A point on the dial at angle `deg` (0 = the tool's end, 180 = the collaborator's). */
const dial = (deg: number, r: number): ABZ => {
  const t = (deg * Math.PI) / 180;
  return abz(C.a - Math.cos(t) * r, C.b, C.z + Math.sin(t) * r);
};
const arc = (d0: number, d1: number, r: number, n = 48): Vec3[] =>
  Array.from({ length: n + 1 }, (_, i) => V(dial(d0 + ((d1 - d0) * i) / n, r)));

/** The direction's own vantage; the lab may turn it. */
export const SPECTRUMGAUGE_VIEW: StageView = { azimuthDeg: 14, elevationDeg: 16 };

export function spectrumGauge(view: StageView = SPECTRUMGAUGE_VIEW): Direction {
  const pts = collector();
  const lines: StageLine[] = [];
  const strips: StageStrip[] = [];
  const dust: StageDust[] = [];
  const labels: DirLabel[] = [];

  /* The floor under the dial. */
  lines.push(
    ...gridLines("grid", { a: 0, b: 0, w: W, d: D, pitch: 1.5 }).map((l) => ({
      ...l,
      batch: true,
      opacity: 0.1,
    }))
  );
  lines.push(
    run("axis-a", [V(abz(0, 0, 0)), V(abz(W, 0, 0))], {
      role: "structure",
      width: 1.1,
      opacity: 0.45,
      reveal: [0.02, 0.3],
    })
  );
  pts.add(abz(0, 0, 0), abz(W, 0, 0), abz(W, D, 0), abz(0, D, 0));

  /* ── The dial ────────────────────────────────────────────────────────── */
  lines.push(
    run("scale", arc(0, 180, R, 90), {
      role: "structure",
      width: 1.3,
      opacity: 0.7,
      reveal: [0.04, 0.7],
    })
  );
  for (let d = 0; d <= 180; d += 5) {
    const major = d % 45 === 0;
    const mid = d % 15 === 0;
    const len = major ? 0.34 : mid ? 0.22 : 0.12;
    lines.push(
      run(`tick-${d}`, [V(dial(d, R)), V(dial(d, R + len))], {
        role: "structure",
        width: major ? 1.2 : 1,
        opacity: major ? 0.7 : 0.35,
        reveal: [0.04 + (d / 180) * 0.5, 0.12 + (d / 180) * 0.5],
      })
    );
  }
  /* The two posts at the ends, and the base line through the centre. */
  for (const d of [0, 180])
    lines.push(
      run(`post-${d}`, [V(dial(d, R)), V(abz(dial(d, R).a, C.b, 0))], {
        role: "structure",
        width: 1,
        opacity: 0.4,
        reveal: [0.04, 0.5],
      })
    );
  lines.push(
    run("base", [V(dial(0, R)), V(dial(180, R))], {
      role: "structure",
      width: 1,
      opacity: 0.4,
      reveal: [0.04, 0.5],
    })
  );

  /* The bands: software from the tool's end to 62 %, intelligence from 38 % to the collaborator's. */
  const RB = R - 0.5;
  const RI = R - 1.15;
  /* Two RIBBONS on the scale, each a band of the dial's own material, edged. */
  strips.push({
    id: "band-soft",
    left: arc(0, 0.62 * 180, RB, 40),
    right: arc(0, 0.62 * 180, RB - 0.34, 40),
    role: "structure",
    opacity: 0.1,
    reveal: [0.2, 0.7],
  });
  lines.push(
    run("band-soft-o", arc(0, 0.62 * 180, RB), {
      role: "structure",
      width: 1.1,
      opacity: 0.7,
      reveal: [0.2, 0.7],
    })
  );
  lines.push(
    run("band-soft-i", arc(0, 0.62 * 180, RB - 0.34), {
      role: "structure",
      width: 1.1,
      opacity: 0.7,
      reveal: [0.2, 0.7],
    })
  );
  strips.push({
    id: "band-intel",
    left: arc(0.38 * 180, 180, RI, 40),
    right: arc(0.38 * 180, 180, RI - 0.34, 40),
    role: "structure",
    opacity: 0.1,
    reveal: [0.3, 0.8],
  });
  lines.push(
    run("band-intel-o", arc(0.38 * 180, 180, RI), {
      role: "structure",
      width: 1.1,
      opacity: 0.7,
      reveal: [0.3, 0.8],
    })
  );
  lines.push(
    run("band-intel-i", arc(0.38 * 180, 180, RI - 0.34), {
      role: "structure",
      width: 1.1,
      opacity: 0.7,
      reveal: [0.3, 0.8],
    })
  );
  /* The overlap: washed in the beat's gold across both ribbons. */
  strips.push({
    id: "overlap",
    left: arc(0.38 * 180, 0.62 * 180, RB + 0.1, 24),
    right: arc(0.38 * 180, 0.62 * 180, RI - 0.44, 24),
    role: "gold",
    opacity: 0.16,
    reveal: [0.45, 0.8],
  });
  for (const d of [0.38 * 180, 0.62 * 180])
    lines.push(
      run(`ov-edge-${d.toFixed(0)}`, [V(dial(d, RI - 0.44)), V(dial(d, RB + 0.1))], {
        role: "gold",
        width: 0.9,
        opacity: 0.55,
        reveal: [0.45, 0.8],
      })
    );

  /* The needle: the one lit run, from the centre to the overlap's middle. */
  const tip = dial(90, R + 0.1);
  lines.push(
    run("needle", [V(abz(C.a, C.b, 0)), V(tip)], {
      role: "gold",
      width: 2.2,
      opacity: 1,
      reveal: [0.5, 0.9],
      donor: true,
    })
  );
  lines.push(
    run("needle-head", ring(tip, 0.16, 16, "screen", view), {
      role: "gold",
      width: 2.2,
      opacity: 1,
      reveal: [0.7, 0.95],
    })
  );
  lines.push(
    run("hub", ring(abz(C.a, C.b, 0), 0.22, 16, "floor"), {
      role: "gold",
      width: 1.2,
      opacity: 0.8,
      reveal: [0.5, 0.9],
    })
  );
  pts.add(dial(90, R + 0.6), dial(0, R + 0.5), dial(180, R + 0.5), tip);

  /* ── The field ON THE DIAL'S FACE: a lattice on the tool's side dissolving
     into a cloud on the collaborator's, inside the inner ribbon ─────────── */
  {
    const rnd = mulberry32(ISO_SEED + 1401);
    const motes: Vec3[] = [];
    const order: number[] = [];
    const pitch = 0.26;
    const RF = RI - 0.6;
    for (let x = -RF; x <= RF; x += pitch)
      for (let z = 0.35; z <= RF; z += pitch) {
        if (x * x + z * z > RF * RF) continue;
        const k = Math.min(1, Math.max(0, (x + RF * 0.3) / (RF * 0.6)));
        const o = k * k * (3 - 2 * k);
        const jx = (rnd() - 0.5) * 2;
        const jz = (rnd() - 0.5) * 2;
        motes.push(
          V(
            abz(
              C.a + x + o * jx * pitch * 0.9,
              C.b - 0.02 - o * rnd() * 0.3,
              C.z + z + o * jz * pitch * 0.9
            )
          )
        );
        order.push(o);
      }
    dust.push({
      id: "field",
      points: motes,
      order,
      opacity: 0.8,
      role: "structure",
      size: 6.5,
      drift: 0.12,
      inkScale: 1.6,
    });
  }

  /* ── The words ───────────────────────────────────────────────────────── */
  labels.push(
    { id: "tool", text: "TOOL", at: dial(0, R + 0.9), anchor: "middle", kind: "name" },
    { id: "collab", text: "COLLABORATOR", at: dial(180, R + 0.9), anchor: "middle", kind: "name" },
    {
      id: "ai",
      text: "AI SITS HERE",
      at: dial(90, R + 0.75),
      anchor: "middle",
      kind: "name",
      lit: true,
      dy: -8,
    },
    { id: "soft", text: "SOFTWARE", at: dial(0.19 * 180, RB + 0.55), anchor: "end", kind: "end" },
    {
      id: "intel",
      text: "INTELLIGENCE",
      at: dial(0.81 * 180, RI + 1.05),
      anchor: "start",
      kind: "end",
    },
    {
      id: "exec",
      text: "EXECUTES COMMANDS",
      at: abz(dial(0, R).a, 0, -0.6),
      anchor: "middle",
      kind: "end",
    },
    {
      id: "interp",
      text: "INTERPRETS INTENT",
      at: abz(dial(180, R).a, 0, -0.6),
      anchor: "middle",
      kind: "end",
    },
    {
      id: "both",
      text: "BOTH, AT ONCE",
      at: abz(C.a, 0, -0.6),
      anchor: "middle",
      kind: "end",
      lit: true,
    }
  );
  pts.add(dial(90, R + 1.3), abz(-0.8, 0, -1), abz(W + 0.8, 0, -1));

  const frame = frameFor(pts.all, { l: 70, r: 70, t: 24, b: 48 }, view);
  const spec: HoloStageSpec = {
    id: "spectrum-gauge",
    frame,
    view,
    bounds: specBounds(lines),
    lines,
    faces: [],
    strips,
    dust,
    anchors: [],
    sweep: SWEEP,
  };
  return {
    id: "gauge",
    figure: "spectrum",
    name: "Gauge",
    reference: "the graduated instrument, a needle on a scale",
    claim:
      "A dial from tool to collaborator, two bands overlapping on its scale, the needle standing where AI sits; under it a lattice dissolving into a cloud.",
    spec,
    labels,
  };
}
