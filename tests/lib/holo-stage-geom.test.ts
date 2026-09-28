import { describe, expect, it } from "vitest";

import { ISO_BASIS_STAGE, isoProject } from "@/components/arcs/framing/iso";
import { createAnchorChannel } from "@/components/holo-stage/stageAnchors";
import {
  stageCameraBasis,
  stageCameraPosition,
  stageFrustum,
  stageToCrop,
  toThree,
} from "@/components/holo-stage/stageFit";
import { stagesSpec, type HoloStageSpec } from "@/components/holo-stage/stageGeom";
import { PLOPSA_WORKSHOP_ARC } from "@/lib/arcs/content/plopsa-workshop";

const section = <K extends string>(id: K) => {
  const s = PLOPSA_WORKSHOP_ARC.sections.find((x) => x.id === id);
  if (!s) throw new Error(`no section ${id}`);
  return s;
};

function specs(): Record<string, HoloStageSpec> {
  const stages = section("drie-manieren");
  if (stages.kind !== "stages") throw new Error("stages");
  return {
    stages: stagesSpec({ stages: stages.stages.map((s) => ({ id: s.id, lit: s.lit })) }),
  };
}

describe("the workshop's live stage (ADR-130 U2, re-cut in U4)", () => {
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
      const pts = [
        ...spec.lines.flatMap((l) => l.points),
        ...spec.faces.flatMap((q) => q.quad),
        ...spec.dust.flatMap((d) => d.points),
      ];
      expect(pts.length).toBeGreaterThan(20);
      for (const p of pts) {
        const q = stageToCrop(p, f);
        expect(q.x, `${id} x`).toBeGreaterThanOrEqual(-0.5);
        expect(q.x, `${id} x`).toBeLessThanOrEqual(f.w + 0.5);
        expect(q.y, `${id} y`).toBeGreaterThanOrEqual(-0.5);
        expect(q.y, `${id} y`).toBeLessThanOrEqual(f.h + 0.5);
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
    const fr = stageFrustum(f);
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
    expect(spec.lines.length).toBeGreaterThan(4);
  });

  it.each(Object.keys(specs()))("%s spends gold once, and on one donor", (id) => {
    /* The register's standing rule: gold is the record's one lit object. */
    const donors = S[id].lines.filter((l) => l.donor);
    expect(donors.length, `${id} donors`).toBe(1);
    expect(donors[0].role).toBe("gold");
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
