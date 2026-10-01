import { describe, expect, it } from "vitest";

import { surface } from "@/components/arcs/framing/curveSurface";
import { ISO_BASIS_STAGE, isoProject } from "@/components/arcs/framing/iso";
import {
  CURVE_FRAME,
  CURVE_GROUP_EFFORT,
  curveSpec,
  curveWorld,
} from "@/components/holo-stage/curveGeom";
import {
  spectrumFrame,
  spectrumSpec,
  type SpectrumData,
} from "@/components/holo-stage/spectrumGeom";
import { createAnchorChannel } from "@/components/holo-stage/stageAnchors";
import {
  stageCameraBasis,
  stageCameraPosition,
  stageFrustum,
  stageToCrop,
  toFlat,
  toThree,
} from "@/components/holo-stage/stageFit";
import {
  stagesSpec,
  sweepAt,
  sweepReaches,
  type HoloStageSpec,
} from "@/components/holo-stage/stageGeom";
import { PLOPSA_WORKSHOP_ARC } from "@/lib/arcs/content/plopsa-workshop";
import { THOUGHTFORM_WORKSHOP_V2_ARC } from "@/lib/arcs/content/thoughtform-workshop-v2";

const section = <K extends string>(id: K) => {
  const s = PLOPSA_WORKSHOP_ARC.sections.find((x) => x.id === id);
  if (!s) throw new Error(`no section ${id}`);
  return s;
};

/* A spectrum track as the mount measures it at ~1200px: the rail on top, the
   software band left, the intelligence band right, overlapping 38–62 %. */
const TRACK: SpectrumData = {
  w: 1200,
  h: 74,
  rail: { y: 1 },
  bands: [
    { x0: 0, y0: 20, x1: 744, y1: 44 },
    { x0: 456, y0: 50, x1: 1200, y1: 74 },
  ],
};

function specs(): Record<string, HoloStageSpec> {
  const stages = section("drie-manieren");
  if (stages.kind !== "stages") throw new Error("stages");
  const curve = THOUGHTFORM_WORKSHOP_V2_ARC.sections.find((x) => x.id === "the-curve");
  if (!curve || curve.kind !== "curve") throw new Error("curve");
  return {
    stages: stagesSpec({ stages: stages.stages.map((s) => ({ id: s.id, lit: s.lit })) }),
    curve: curveSpec({
      lanes: curve.lanes.map((l) => ({ id: l.id })),
      others: curve.others.map((s) => ({ points: s.points.map((p) => ({ t: p.t })) })),
    }),
    spectrum: spectrumSpec(TRACK),
  };
}

describe("the workshop's live stage (ADR-130 U2, re-cut in U4, three drawings since ADR-140)", () => {
  const S = specs();

  it("the camera IS the fallback's projection, exactly", () => {
    /* ⚠ ONE PICTURE, NOT TWO CLOSE ONES. U2's perspective camera reproduced
       the cabinet fallback "close, not identical"; the owner read its depth as
       a vanishing point on the right. The stage camera is orthographic at the
       floor's front corner, and projecting a world point through it must land
       on the SVG's own `isoProject` to the unit. */
    const f = S.stages.frame;
    for (const [a, b, z] of [
      [0, 0, 0],
      [12, 0, 0],
      [0, 12, 0],
      [7, 4, 3],
    ] as const) {
      const live = stageToCrop(toThree(a, b, z), f);
      const flat = isoProject(a, b, z, { ...f, basis: ISO_BASIS_STAGE });
      expect(live.x).toBeCloseTo(flat.x, 6);
      expect(live.y).toBeCloseTo(flat.y, 6);
    }
  });

  it("the curve's hologram lands on Moira's surface, to the unit (ADR-140)", () => {
    /* `curveSurface.ts` is the stage basis at k = 1; the spec lifts it into
       the stage's world at k = 40 and the camera brings it back. If this ever
       drifts, the hologram and the SVG are two drawings of one record. */
    for (const [t, v] of [
      [0, 0],
      [0.18, 0],
      [0.47, 0.5],
      [0.74, 1],
      [0.82, 1 / 3],
    ] as const) {
      for (const series of ["own", "other"] as const) {
        const live = stageToCrop(curveWorld(t, v, series), CURVE_FRAME);
        const flat = surface(t, v, series);
        expect(live.x, `t ${t} v ${v} x`).toBeCloseTo(flat.x, 6);
        expect(live.y, `t ${t} v ${v} y`).toBeCloseTo(flat.y, 6);
      }
    }
  });

  it("the flat view is the track's own px, straight on (ADR-140)", () => {
    const f = spectrumFrame(TRACK);
    for (const [x, y] of [
      [0, 0],
      [600, 37],
      [1200, 74],
    ] as const) {
      const live = stageToCrop(toFlat(x, y), f, "flat");
      expect(live.x).toBeCloseTo(x, 9);
      expect(live.y).toBeCloseTo(y, 9);
    }
    const cam = stageCameraPosition(30, "flat");
    expect(cam).toEqual([0, 0, 30]);
    const basis = stageCameraBasis("flat");
    expect(basis.x).toEqual([1, 0, 0]);
    expect(basis.y).toEqual([0, 1, 0]);
  });

  it("the camera looks from the floor's front corner, at 22 degrees on both edges", () => {
    const basis = stageCameraBasis();
    const screen = (a: number, b: number, z: number) => {
      const p = toThree(a, b, z);
      return {
        x: basis.x[0] * p[0] + basis.x[1] * p[1] + basis.x[2] * p[2],
        y: basis.y[0] * p[0] + basis.y[1] * p[1] + basis.y[2] * p[2],
      };
    };
    const a = screen(1, 0, 0);
    const b = screen(0, 1, 0);
    expect(a.x).toBeCloseTo(-b.x, 9);
    expect(a.y).toBeCloseTo(b.y, 9);
    expect((Math.atan2(a.y, a.x) * 180) / Math.PI).toBeCloseTo(22, 6);
    // The camera stands on the front corner's side: negative a, negative b.
    const cam = stageCameraPosition();
    expect(cam[0]).toBeLessThan(0);
    expect(cam[2]).toBeGreaterThan(0);
  });

  it.each(Object.keys(specs()))(
    "%s: every point it draws lands inside the crop the canvas frames",
    (id) => {
      /* ⚠ THE GUARD U2 NEVER HAD. Its lens was clamped and never checked the
       projected extremes, so the stages beat printed its agent prism 85px
       past the canvas at 1920×1247 with every guard green. The canvas frames
       exactly `spec.frame` (`stageFrustum`), so a point inside the frame is
       on screen at every width — and this walks every point. */
      const spec = S[id];
      const f = spec.frame;
      const view = spec.view ?? "stage";
      const pts = [
        ...spec.lines.flatMap((l) => l.points),
        ...spec.faces.flatMap((q) => q.quad),
        ...(spec.strips ?? []).flatMap((s) => [...s.left, ...s.right]),
        ...spec.dust.flatMap((d) => d.points),
      ];
      expect(pts.length).toBeGreaterThan(20);
      /* A drifting mote wanders off its home by its drift; the field is
         measured inside the track, so the crop has that much to give. */
      const slack = Math.max(0.5, ...spec.dust.map((d) => d.drift ?? 0));
      for (const p of pts) {
        const q = stageToCrop(p, f, view);
        expect(q.x, `${id} x`).toBeGreaterThanOrEqual(-slack);
        expect(q.x, `${id} x`).toBeLessThanOrEqual(f.w + slack);
        expect(q.y, `${id} y`).toBeGreaterThanOrEqual(-slack);
        expect(q.y, `${id} y`).toBeLessThanOrEqual(f.h + slack);
      }
    }
  );

  it("the guard can fail: a point outside the crop is caught", () => {
    const f = S.stages.frame;
    const q = stageToCrop(toThree(40, 0, 0), f);
    expect(q.x > f.w || q.y < 0).toBe(true);
  });

  it.each(Object.keys(specs()))("%s: the frustum is the crop, edge for edge", (id) => {
    const f = S[id].frame;
    const fr = stageFrustum(f, S[id].view ?? "stage");
    expect(fr.right - fr.left).toBeGreaterThan(0);
    expect(fr.top - fr.bottom).toBeGreaterThan(0);
    // The frustum's aspect is the crop's: no stretch between the two renderings.
    expect((fr.right - fr.left) / (fr.top - fr.bottom)).toBeCloseTo(f.w / f.h, 9);
  });

  it.each(Object.keys(specs()))("%s draws only finite world", (id) => {
    const spec = S[id];
    for (const l of spec.lines)
      for (const p of l.points) for (const v of p) expect(Number.isFinite(v)).toBe(true);
    for (const f of spec.faces)
      for (const p of f.quad) for (const v of p) expect(Number.isFinite(v)).toBe(true);
    for (const s of spec.strips ?? []) {
      expect(s.left.length).toBe(s.right.length);
      for (const p of [...s.left, ...s.right])
        for (const v of p) expect(Number.isFinite(v)).toBe(true);
    }
    expect(spec.lines.length).toBeGreaterThan(4);
  });

  it.each(Object.keys(specs()))("%s spends gold once: at most one donor, and it is gold", (id) => {
    /* The register's standing rule: gold is the record's one lit object. The
       spectrum's one gold object is the DOM handle (ADR-136), so its field
       carries no donor at all. */
    const donors = S[id].lines.filter((l) => l.donor);
    expect(donors.length, `${id} donors`).toBeLessThanOrEqual(1);
    for (const d of donors) expect(d.role).toBe("gold");
  });

  it("the stages and the curve each light one donor; the spectrum none", () => {
    expect(S.stages.lines.filter((l) => l.donor)).toHaveLength(1);
    expect(S.curve.lines.filter((l) => l.donor)).toHaveLength(1);
    expect(S.spectrum.lines.filter((l) => l.donor)).toHaveLength(0);
  });

  it.each(Object.keys(specs()))("%s names every group it uses (ADR-140)", (id) => {
    /* A line in a group the spec does not list would ride the intro's clock
       in the shader — drawn on arrival, never on its button — with nothing
       failing. */
    const spec = S[id];
    const named = new Set(spec.groups ?? []);
    expect(named.size).toBeLessThanOrEqual(4);
    const used = [
      ...spec.lines.map((l) => l.group),
      ...spec.faces.map((f) => f.group),
      ...(spec.strips ?? []).map((s) => s.group),
      ...spec.dust.map((d) => d.group),
    ].filter((g): g is string => typeof g === "string");
    for (const g of used) expect(named.has(g), `${id}: group ${g}`).toBe(true);
  });

  it("the curve's second dial is one group, and the front edge is not in it", () => {
    expect(S.curve.groups).toEqual([CURVE_GROUP_EFFORT]);
    const own = S.curve.lines.find((l) => l.id === "own");
    expect(own?.donor).toBe(true);
    expect(own?.group).toBeUndefined();
    const iso = S.curve.lines.filter((l) => l.id.startsWith("iso-"));
    expect(iso.length).toBe(6);
    for (const l of iso) expect(l.group).toBe(CURVE_GROUP_EFFORT);
    expect((S.curve.strips ?? []).filter((s) => s.group === CURVE_GROUP_EFFORT)).toHaveLength(6);
  });

  it("the sweep crosses the object inside the intro, and a face can seat itself behind it", () => {
    for (const id of ["curve", "spectrum"]) {
      const s = S[id].sweep;
      expect(s, `${id} sweep`).toBeDefined();
      if (!s) continue;
      expect(sweepAt(s, 0)).toBe(s.from);
      expect(sweepAt(s, 1)).toBe(s.to);
      expect(sweepAt(s, (s.window[0] + s.window[1]) / 2)).toBeCloseTo((s.from + s.to) / 2, 9);
      const mid = (s.from + s.to) / 2;
      expect(sweepReaches(s, mid)).toBeCloseTo((s.window[0] + s.window[1]) / 2, 9);
      expect(sweepReaches(s, s.from - 100)).toBe(s.window[0]);
      expect(sweepReaches(s, s.to + 100)).toBe(s.window[1]);
    }
    /* The curve's band arrives as the front passes it, never before. */
    const band = S.curve.faces.find((f) => f.id === "band");
    expect(band).toBeDefined();
    expect(band!.reveal[0]).toBeGreaterThan(0);
    expect(band!.reveal[1]).toBeGreaterThan(band!.reveal[0]);
  });

  it("the spectrum's field is a lattice that dissolves across the overlap", () => {
    const field = S.spectrum.dust.find((d) => d.id === "field");
    expect(field).toBeDefined();
    const order = field!.order!;
    expect(order.length).toBe(field!.points.length);
    const x = (i: number) => field!.points[i][0];
    /* Left of the overlap every mote is a lattice mote; right of it a cloud. */
    for (let i = 0; i < order.length; i++) {
      if (x(i) < 440) expect(order[i], `mote ${i} at ${x(i)}`).toBe(0);
      if (x(i) > 760) expect(order[i], `mote ${i} at ${x(i)}`).toBe(1);
    }
    expect(order.some((o) => o > 0.2 && o < 0.8)).toBe(true);
    expect(field!.drift).toBeGreaterThan(0);
  });

  it("the specs are deterministic, seed for seed", () => {
    const a = specs();
    const b = specs();
    for (const id of Object.keys(a)) {
      expect(JSON.stringify(a[id].dust)).toBe(JSON.stringify(b[id].dust));
      expect(a[id].dust.every((d) => d.points.length > 0)).toBe(true);
    }
  });

  it("an anchor channel is per canvas, not a module singleton", () => {
    const one = createAnchorChannel();
    const two = createAnchorChannel();
    one.publish([{ id: "a", x: 0.5, y: 0.5, frontness: 1, visible: true, side: "up" }]);
    expect(one.read()).toHaveLength(1);
    expect(two.read()).toHaveLength(0);
    two.clear();
    expect(one.read()).toHaveLength(1);
  });
});
