/**
 * TRACE — the frontier on a circular instrument.
 *
 * From the owner's Smith-chart reference: a graduated circular field, a
 * measured trace, markers with readouts hung off the rim. The reading is
 * Moira's; the figure is an INSTRUMENT read face-on (the flat view): the
 * frontier is a trace spiralling out from the centre — further round is more
 * intelligence, further out is more it can finish — with every model a
 * marker on it and its name and price read off the rim on a radial leader.
 * The effort dial is the same trace drawn again at the outer radius it
 * reaches at maximum effort, with a tick joining the two at every marker:
 * the lift effort buys, as a length.
 *
 * ⚠ The one departure from the house's isometric register on this figure,
 * offered as the alternative: a chart on the terminal, not a thing on the
 * floor. Gold buys the own trace; the other vendor is dawn.
 */

import { END_T, T, world } from "@/components/arcs/framing/curveSurface";
import {
  ISO_BASIS_STAGE,
  ISO_SEED,
  mulberry32,
  type IsoFrame,
} from "@/components/arcs/framing/iso";
import { FRONTIER_CURVE } from "@/lib/arcs/content/shared/frontierCurve";

import { toFlat, type StageView, type Vec3 } from "../stageFit";
import {
  specBounds,
  type HoloStageSpec,
  type StageDust,
  type StageLine,
  type StageSweep,
} from "../stageGeom";
import { flatAnchor, run, type DirLabel, type Direction } from "./shared";

const W = 980;
const H = 600;
const CX = 420;
const CY = 300;
const R = 236;
/** The trace's sweep in angle, from twelve o'clock, clockwise. */
const A0 = -90;
const A1 = 215;
/** The trace's radius at zero and at the frontier's own full height. */
const R0 = 46;
const R1 = 170;

const polar = (deg: number, r: number): Vec3 => {
  const t = (deg * Math.PI) / 180;
  return toFlat(CX + Math.cos(t) * r, CY + Math.sin(t) * r);
};

/** Height in viewbox px at (t, v), normalised to the own curve's full height at v = 0. */
const hMax = world(END_T, 0).h;
const rOf = (t: number, v: number, series: "own" | "other" = "own") =>
  R0 + ((R1 - R0) * world(t, v, series).h) / hMax;
const aOf = (t: number) => A0 + ((A1 - A0) * t) / END_T;

/** Face-on; a vantage override does not apply to a chart. */
export function curveTrace(_view?: StageView): Direction {
  const lines: StageLine[] = [];
  const dust: StageDust[] = [];
  const labels: DirLabel[] = [];
  const C = FRONTIER_CURVE;

  /* ── The instrument: rim, graduation, three rings, the Smith arcs ────── */
  const rim: Vec3[] = [];
  for (let i = 0; i <= 120; i++) rim.push(polar((i / 120) * 360, R));
  lines.push(run("rim", rim, { role: "structure", width: 1.2, opacity: 0.6, reveal: [0.02, 0.5] }));
  for (let d = 0; d < 360; d += 5) {
    const major = d % 45 === 0;
    const mid = d % 15 === 0;
    lines.push(
      run(`tick-${d}`, [polar(d, R), polar(d, R + (major ? 14 : mid ? 9 : 5))], {
        role: "structure",
        width: 1,
        opacity: major ? 0.6 : 0.3,
        reveal: [0.02 + (d / 360) * 0.4, 0.1 + (d / 360) * 0.4],
      })
    );
  }
  for (const [i, r] of [R0, (R0 + R1) / 2, R1].entries()) {
    const ringPts: Vec3[] = [];
    for (let k = 0; k <= 96; k++) ringPts.push(polar((k / 96) * 360, r));
    lines.push(
      run(`ring-${i}`, ringPts, { role: "grid", width: 0.85, opacity: 0.22, reveal: [0.05, 0.5] })
    );
  }
  /* The Smith chart's own circles: tangent at the rim's right-hand point. */
  for (const k of [0.5, 0.3, 0.17]) {
    const rr = R * k;
    const cx = CX + R - rr;
    const arc: Vec3[] = [];
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * Math.PI * 2;
      arc.push(toFlat(cx + Math.cos(t) * rr, CY + Math.sin(t) * rr));
    }
    lines.push(
      run(`smith-${k}`, arc, { role: "grid", width: 0.85, opacity: 0.14, reveal: [0.1, 0.55] })
    );
  }
  /* Cardinal spokes, faint. */
  for (const d of [0, 90, 180, 270])
    lines.push(
      run(`spoke-${d}`, [polar(d, R0), polar(d, R)], {
        role: "grid",
        width: 0.85,
        opacity: 0.12,
        reveal: [0.05, 0.4],
      })
    );

  /* The phosphor: a faint seeded field inside the rim. */
  {
    const rnd = mulberry32(ISO_SEED + 1301);
    const motes: Vec3[] = [];
    while (motes.length < 420) {
      const x = rnd() * 2 - 1;
      const y = rnd() * 2 - 1;
      if (x * x + y * y > 1) continue;
      motes.push(toFlat(CX + x * R, CY + y * R));
    }
    dust.push({ id: "phosphor", points: motes, opacity: 0.16, role: "machine", size: 3 });
  }

  /* ── The traces ──────────────────────────────────────────────────────── */
  const trace = (v: number, series: "own" | "other" = "own"): Vec3[] => {
    const out: Vec3[] = [];
    for (let i = 0; i <= 80; i++) {
      const t = (END_T * i) / 80;
      out.push(polar(aOf(t), rOf(t, v, series)));
    }
    return out;
  };
  /* The effort dial: the same trace at full effort, outside; ticks join the two at the models. */
  lines.push(
    run("effort-trace", trace(1), { role: "gold", width: 1, opacity: 0.4, reveal: [0.3, 0.9] })
  );
  if (C.others.length)
    lines.push(
      run("other", trace(0, "other"), {
        role: "structure",
        width: 1.3,
        opacity: 0.8,
        reveal: [0.2, 0.84],
      })
    );
  lines.push(
    run("own", trace(0), {
      role: "gold",
      width: 2.2,
      opacity: 1,
      reveal: [0.22, 0.86],
      donor: true,
    })
  );

  /* ── Markers and their readouts off the rim ──────────────────────────── */
  const marker = (
    id: string,
    t: number,
    series: "own" | "other",
    role: "gold" | "structure",
    lit: boolean,
    name: string,
    price: string
  ) => {
    const a = aOf(t);
    const p = polar(a, rOf(t, 0, series));
    const ringPts: Vec3[] = [];
    for (let k = 0; k <= 16; k++) {
      const th = (k / 16) * Math.PI * 2;
      ringPts.push([p[0] + Math.cos(th) * 7, p[1] + Math.sin(th) * 7, 0]);
    }
    lines.push(
      run(`${id}-mark`, ringPts, {
        role,
        width: role === "gold" ? 1.8 : 1.3,
        opacity: 1,
        reveal: [0.5, 0.9],
      })
    );
    if (series === "own")
      lines.push(
        run(`${id}-lift`, [p, polar(a, rOf(t, 1))], {
          role: "gold",
          width: 1,
          opacity: 0.6,
          reveal: [0.6, 0.95],
        })
      );
    /* The readout leader: marker → rim, then the words outside it. */
    lines.push(
      run(`${id}-lead`, [polar(a, rOf(t, 1) + 6), polar(a, R + 18)], {
        role,
        width: 0.9,
        opacity: 0.5,
        reveal: [0.6, 0.95],
      })
    );
    const outer = polar(a, R + 26);
    const right = Math.cos((a * Math.PI) / 180) >= 0;
    const anchor = right ? "start" : "end";
    labels.push({
      id: `${id}-name`,
      text: name,
      at: flatAnchor(outer),
      anchor,
      kind: "name",
      lit,
      dy: -7,
      dx: right ? 6 : -6,
    });
    labels.push({
      id: `${id}-price`,
      text: price,
      at: flatAnchor(outer),
      anchor,
      kind: "end",
      dy: 8,
      dx: right ? 6 : -6,
    });
  };
  for (const lane of C.lanes) {
    const names = lane.models.map((m) => m.name).join(" · ");
    const price = lane.models.map((m) => `$${m.input} in · $${m.output} out`).join("  ");
    marker(
      `lane-${lane.id}`,
      T[lane.id],
      "own",
      "gold",
      lane.id === "frontier",
      `${lane.label.toUpperCase()} · ${names}`,
      price
    );
  }
  C.others.forEach((s, si) =>
    s.points.forEach((pt, pi) =>
      marker(
        `other-${si}-${pi}`,
        pt.t,
        "other",
        "structure",
        false,
        pt.model.name,
        `$${pt.model.input} in · $${pt.model.output} out`
      )
    )
  );

  /* ── The words ───────────────────────────────────────────────────────── */
  labels.push(
    {
      id: "axis-round",
      text: `${C.axes.x.toUpperCase()} ↻`,
      at: flatAnchor(toFlat(CX, CY + R + 44)),
      anchor: "middle",
      kind: "axis",
    },
    {
      id: "axis-out",
      text: `${C.axes.y.toUpperCase()} →`,
      at: flatAnchor(toFlat(CX + R0 + 6, CY - 12)),
      anchor: "start",
      kind: "axis",
    },
    {
      id: "effort-low",
      text: C.effort.levels[0].toUpperCase(),
      at: flatAnchor(polar(A0 + 6, rOf(0.03, 0))),
      anchor: "start",
      kind: "end",
      dx: 6,
    },
    {
      id: "effort-max",
      text: C.effort.levels[2].toUpperCase(),
      at: flatAnchor(polar(A0 + 6, rOf(0.03, 1))),
      anchor: "start",
      kind: "end",
      dx: 6,
      dy: -12,
    },
    {
      id: "effort-word",
      text: C.effort.axis.toUpperCase(),
      at: flatAnchor(toFlat(CX - R - 30, CY + 20)),
      anchor: "end",
      kind: "axis",
    }
  );

  const frame: IsoFrame = { w: W, h: H, ox: 0, oy: 0, k: 1, basis: ISO_BASIS_STAGE };
  const sweep: StageSweep = {
    axis: 0,
    from: CX - R - 40,
    to: CX + R + 40,
    window: [0.04, 0.7],
    width: 14,
  };
  const spec: HoloStageSpec = {
    id: "curve-trace",
    frame,
    view: "flat",
    bounds: specBounds(lines),
    lines,
    faces: [],
    dust,
    anchors: [],
    sweep,
  };
  return {
    id: "trace",
    figure: "curve",
    name: "Trace",
    reference: "the Smith chart on the terminal",
    claim:
      "The frontier as a trace on a graduated instrument: further round is more intelligence, further out is more it can finish, every model read off the rim.",
    spec,
    labels,
  };
}
