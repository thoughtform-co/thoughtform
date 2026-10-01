/**
 * POLES — the spectrum as two objects and the field between them.
 *
 * At the tool's end a MACHINE: a slab, solid, ruled, deterministic. At the
 * collaborator's end an INTELLIGENCE: a wire sphere, open, holding a cloud.
 * Between them on the floor the field — a lattice of motes leaving the
 * machine dissolving into a cloud approaching the sphere — and a rail along
 * the floor's centre with a graduation. Where the two halves overlap stands
 * the one gold node, a tendril to each pole: AI sits here, both at once.
 */

import { ISO_SEED, mulberry32 } from "@/components/arcs/framing/iso";

import type { StageView, Vec3 } from "../stageFit";
import {
  boxEdges,
  boxFaces,
  gridLines,
  specBounds,
  type HoloStageSpec,
  type StageDust,
  type StageFace,
  type StageLine,
  type StageSweep,
} from "../stageGeom";
import {
  abz,
  collector,
  frameFor,
  icosphere,
  ring,
  run,
  sphereMotes,
  tendril,
  type ABZ,
  type DirLabel,
  type Direction,
} from "./shared";

const W = 12;
const D = 4;
const SWEEP: StageSweep = { axis: 0, from: -0.4, to: W + 0.6, window: [0.04, 0.66], width: 0.3 };
const V = (p: ABZ): Vec3 => [p.a, p.z, -p.b];

/** The direction's own vantage; the lab may turn it. */
export const SPECTRUMPOLES_VIEW: StageView = { azimuthDeg: 58, elevationDeg: 26 };

export function spectrumPoles(view: StageView = SPECTRUMPOLES_VIEW): Direction {
  const pts = collector();
  const lines: StageLine[] = [];
  const faces: StageFace[] = [];
  const dust: StageDust[] = [];
  const labels: DirLabel[] = [];

  /* The floor and the rail along its centre. */
  lines.push(
    ...gridLines("grid", { a: 0, b: 0, w: W, d: D, pitch: 1 }).map((l) => ({
      ...l,
      batch: true,
      opacity: 0.08,
    }))
  );
  lines.push(
    run("rail", [V(abz(0.4, D / 2, 0)), V(abz(W - 0.4, D / 2, 0))], {
      role: "structure",
      width: 1.3,
      opacity: 0.6,
      reveal: [0.04, 0.7],
    })
  );
  for (let i = 0; i <= 12; i++) {
    const a = 0.4 + ((W - 0.8) * i) / 12;
    const major = i % 3 === 0;
    lines.push(
      run(`tick-${i}`, [V(abz(a, D / 2, 0)), V(abz(a, D / 2 - (major ? 0.3 : 0.16), 0))], {
        role: "structure",
        width: 1,
        opacity: major ? 0.55 : 0.3,
        reveal: [0.04 + (i / 12) * 0.5, 0.12 + (i / 12) * 0.5],
      })
    );
  }
  pts.add(abz(0, 0, 0), abz(W, 0, 0), abz(W, D, 0), abz(0, D, 0));

  /* ── The machine: a slab, solid and ruled ────────────────────────────── */
  const box = { a: 0.9, b: D / 2 - 0.8, w: 1.6, d: 1.6, z: 0, h: 1.15 };
  lines.push(
    ...boxEdges("machine", box, {
      role: "structure",
      width: 1.4,
      opacity: 0.85,
      reveal: [0.06, 0.3],
    }).map((l) => ({ ...l, batch: true }))
  );
  faces.push(...boxFaces("machine", box, { role: "machine", opacity: 0.06, reveal: [0.1, 0.34] }));
  /* Its ruling: three lines across the top, like a punched card. */
  for (let i = 1; i <= 3; i++) {
    const b = box.b + (box.d * i) / 4;
    lines.push(
      run(
        `machine-rule-${i}`,
        [V(abz(box.a, b, box.h + 0.002)), V(abz(box.a + box.w, b, box.h + 0.002))],
        { role: "structure", width: 0.9, opacity: 0.5, reveal: [0.14, 0.36] }
      )
    );
  }
  pts.add(abz(box.a, box.b, box.h), abz(box.a + box.w, box.b + box.d, box.h));

  /* ── The intelligence: a wire sphere, open, holding a cloud ──────────── */
  const sc = abz(W - 1.7, D / 2, 1.35);
  const RS = 1.05;
  const geo = icosphere(sc, RS, 1);
  for (const [i, [p, q]] of geo.edges.entries())
    lines.push(
      run(`sphere-${i}`, [V(p), V(q)], {
        role: "structure",
        width: 0.95,
        opacity: 0.55,
        reveal: [0.5, 0.9],
      })
    );
  dust.push({
    id: "sphere-cloud",
    points: sphereMotes(ISO_SEED + 1501, sc, RS * 0.9, 200),
    opacity: 0.5,
    role: "structure",
    size: 5,
  });
  lines.push(
    run("sphere-stem", [V(abz(sc.a, sc.b, 0)), V(abz(sc.a, sc.b, sc.z - RS))], {
      role: "grid",
      width: 0.85,
      opacity: 0.35,
      reveal: [0.5, 0.8],
    })
  );
  lines.push(
    run("sphere-foot", ring(abz(sc.a, sc.b, 0), RS, 36, "floor"), {
      role: "grid",
      width: 0.9,
      opacity: 0.3,
      reveal: [0.5, 0.8],
    })
  );
  pts.add(
    abz(sc.a - RS, sc.b, sc.z + RS),
    abz(sc.a + RS, sc.b, sc.z + RS),
    abz(sc.a, sc.b, sc.z + RS + 0.2)
  );

  /* ── The field between them: lattice → cloud ─────────────────────────── */
  {
    const rnd = mulberry32(ISO_SEED + 1601);
    const motes: Vec3[] = [];
    const order: number[] = [];
    const pitch = 0.3;
    for (let a = box.a + box.w + 0.4; a < sc.a - RS - 0.3; a += pitch)
      for (let b = 0.3; b < D - 0.2; b += pitch) {
        const k = Math.min(1, Math.max(0, (a - W * 0.38) / (W * 0.24)));
        const o = k * k * (3 - 2 * k);
        const ja = (rnd() - 0.5) * 2;
        const jb = (rnd() - 0.5) * 2;
        motes.push(
          V(abz(a + o * ja * pitch * 0.9, b + o * jb * pitch * 0.9, 0.02 + o * rnd() * 0.7))
        );
        order.push(o);
      }
    dust.push({
      id: "field",
      points: motes,
      order,
      opacity: 0.85,
      role: "structure",
      size: 6.5,
      drift: 0.14,
      inkScale: 1.6,
    });
  }

  /* ── Where AI sits: the one gold node, a tendril to each pole ────────── */
  const node = abz(W / 2, D / 2, 0.75);
  lines.push(
    run("ai-node", ring(node, 0.2, 18, "screen", view), {
      role: "gold",
      width: 2.2,
      opacity: 1,
      reveal: [0.56, 0.84],
      donor: true,
    })
  );
  lines.push(
    run("ai-stem", [V(abz(node.a, node.b, 0)), V(abz(node.a, node.b, node.z - 0.2))], {
      role: "gold",
      width: 1,
      opacity: 0.6,
      reveal: [0.56, 0.84],
    })
  );
  lines.push(
    run(
      "ai-to-machine",
      tendril(ISO_SEED + 1701, node, abz(box.a + box.w, box.b + box.d / 2, box.h), 7, 0.1),
      { role: "gold", width: 1.1, opacity: 0.75, reveal: [0.62, 0.9], batch: false }
    )
  );
  lines.push(
    run(
      "ai-to-sphere",
      tendril(ISO_SEED + 1702, node, abz(sc.a - RS * 0.9, sc.b, sc.z - 0.2), 7, 0.14),
      { role: "gold", width: 1.1, opacity: 0.75, reveal: [0.62, 0.9], batch: false }
    )
  );
  /* The overlap on the floor: a gold wash between the two halves' reach. */
  faces.push({
    id: "overlap",
    quad: [
      V(abz(W * 0.38, 0, 0)),
      V(abz(W * 0.62, 0, 0)),
      V(abz(W * 0.62, D, 0)),
      V(abz(W * 0.38, D, 0)),
    ],
    role: "gold",
    opacity: 0.07,
    reveal: [0.5, 0.8],
  });
  pts.add(abz(node.a, node.b, node.z + 0.5));

  /* ── The words ───────────────────────────────────────────────────────── */
  labels.push(
    {
      id: "tool",
      text: "TOOL",
      at: abz(box.a + box.w / 2, -0.4, 0),
      anchor: "middle",
      kind: "name",
    },
    {
      id: "exec",
      text: "EXECUTES COMMANDS",
      at: abz(box.a + box.w / 2, -0.4, 0),
      anchor: "middle",
      kind: "end",
      dy: 16,
    },
    { id: "collab", text: "COLLABORATOR", at: abz(sc.a, -0.4, 0), anchor: "middle", kind: "name" },
    {
      id: "interp",
      text: "INTERPRETS INTENT",
      at: abz(sc.a, -0.4, 0),
      anchor: "middle",
      kind: "end",
      dy: 16,
    },
    {
      id: "ai",
      text: "AI SITS HERE",
      at: abz(node.a, node.b, node.z + 0.45),
      anchor: "middle",
      kind: "name",
      lit: true,
    },
    {
      id: "both",
      text: "BOTH, AT ONCE",
      at: abz(node.a, -0.4, 0),
      anchor: "middle",
      kind: "end",
      lit: true,
      dy: 16,
    },
    {
      id: "soft",
      text: "SOFTWARE →",
      at: abz(W * 0.24, D + 0.4, 0),
      anchor: "middle",
      kind: "end",
    },
    {
      id: "intel",
      text: "← INTELLIGENCE",
      at: abz(W * 0.76, D + 0.4, 0),
      anchor: "middle",
      kind: "end",
    }
  );
  pts.add(abz(0, -1.1, 0), abz(W, -1.1, 0), abz(W / 2, D + 0.9, 0));

  const frame = frameFor(pts.all, { l: 70, r: 70, t: 24, b: 48 }, view);
  const spec: HoloStageSpec = {
    id: "spectrum-poles",
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
    id: "poles",
    figure: "spectrum",
    name: "Poles",
    reference: "the slab and the wire sphere, the field between",
    claim:
      "A machine at one end, an intelligence at the other, the field dissolving from lattice to cloud between them; the gold node where both meet.",
    spec,
    labels,
  };
}
