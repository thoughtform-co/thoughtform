import { describe, expect, it } from "vitest";

import {
  ISO_BASIS_2TO1,
  ISO_BASIS_STAGE,
  type IsoFrame,
  type IsoLabel,
  isoBox,
  isoDepth,
  isoDust,
  isoPath,
  isoProject,
  labelBoxes,
  labelCollisions,
} from "@/components/arcs/framing/iso";
import { frameAround } from "@/components/arcs/framing/floor";
import { DH, DW, MARGIN, extent as curveExtent } from "@/components/arcs/framing/curveSurface";
import {
  STAGES_FRAME,
  STAGES_VB,
  STAGE_PRISMS,
  stagesExtent,
  stagesLabels,
} from "@/components/arcs/framing/stagesLayout";
import { AI_STORYTELLING_CLASS_1_ARC } from "@/lib/arcs/content/ai-storytelling-class-1";
import { PLOPSA_WORKSHOP_ARC } from "@/lib/arcs/content/plopsa-workshop";
import { THOUGHTFORM_WORKSHOP_ARC } from "@/lib/arcs/content/thoughtform-workshop";
import type { ArcDef, ArcSectionKind, ArcSectionOf } from "@/lib/arcs/types";

/**
 * The workshop framing's one projection (ADR-130 U1, re-cut in U4).
 *
 * ⚠ THE LABEL WALK IS THE POINT OF THIS FILE. `.claude/rules/proof.md` records
 * what an isometric costs on this surface: the Intelligence Map city printed
 * its district plaques through their own plates 10-13 times per sheet, at every
 * viewport, in both themes, with every containment guard green — because
 * nothing asked whether two labels were inside EACH OTHER. Every drawing here
 * declares what it names and this file walks the pairs.
 */

const UNIT: IsoFrame = { w: 200, h: 200, ox: 0, oy: 0, k: 100, basis: ISO_BASIS_STAGE };

/**
 * The type the DOM words render at, in each crop's own units, at the binding
 * 1280×720: the span's ~11–13px over the figure's scale there (the stages
 * figure is ~620px wide, the curve and the horizon ~50svh tall).
 */
const TYPE = { stages: 17 } as const;

/* ⚠ THE WORDS ARE THE DRAWING'S, AND EACH PAGE HAS ITS OWN SET. The figure's
   geometry is fixed, but a label's BOX is its text: the Dutch stages and the
   English ones are different string sets at the same seats, so a walk over one
   says nothing about the other. Every page that mounts a framing leaf is
   listed below. */
const section = <K extends ArcSectionKind>(arc: ArcDef, id: string) =>
  arc.sections.find((s) => s.id === id) as ArcSectionOf<K>;

const stagesCase = (name: string, arc: ArcDef, id: string) => {
  const s = section<"stages">(arc, id);
  return {
    name,
    vb: STAGES_VB,
    frame: STAGES_FRAME,
    extent: stagesExtent(),
    labels: stagesLabels(
      s.stages.map((x) => x.label),
      s.axes,
      s.ends
    ),
    type: TYPE.stages,
  };
};

describe("the projection", () => {
  it("keeps the map's own 2:1 available, byte-for-byte", () => {
    // `mapProjection.iso(cx, cy, a, b)` is `[cx + a - b, cy + (a + b) * 0.5]`.
    const f: IsoFrame = { ...UNIT, basis: ISO_BASIS_2TO1, ox: 10, oy: 20, k: 1 };
    for (const [a, b] of [
      [0, 0],
      [3, 1],
      [-2, 5],
    ] as const) {
      const p = isoProject(a, b, 0, f);
      expect(p.x).toBeCloseTo(10 + a - b, 10);
      expect(p.y).toBeCloseTo(20 + (a + b) * 0.5, 10);
    }
  });

  it("is Moira's view: both floor edges at 22 degrees, symmetric about the front corner", () => {
    /* ⚠ NO VANISHING POINT, AND NO SIDE (owner, 2026-09-28). `a` runs up to
       the right and `b` up to the left at the SAME angle, so the floor is a
       rhombus centred on its front corner — the viewer looks from it. */
    const a = isoProject(1, 0, 0, UNIT);
    const b = isoProject(0, 1, 0, UNIT);
    const z = isoProject(0, 0, 1, UNIT);
    expect(a.x).toBeCloseTo(92.72, 1);
    expect(a.y).toBeCloseTo(-37.46, 1);
    expect(b.x).toBeCloseTo(-92.72, 1);
    expect(b.y).toBeCloseTo(-37.46, 1);
    expect((Math.atan2(-a.y, a.x) * 180) / Math.PI).toBeCloseTo(22, 6);
    // z is vertical and ONLY vertical, foreshortened by the camera's elevation.
    expect(z.x).toBeCloseTo(0, 6);
    expect(z.y).toBeCloseTo(-119.94, 1);
  });

  it("orders far before near: a larger a + b is farther away", () => {
    expect(isoDepth(3, 3)).toBeGreaterThan(isoDepth(0, 0));
  });

  it("never emits a NaN, an Infinity or a transform", () => {
    const all = [
      isoPath([isoProject(0, 0, 0, UNIT), isoProject(1, 1, 1, UNIT)]),
      isoBox({ a: 0, b: 0, w: 1, d: 1, z: 0, h: 1 }, UNIT).visible,
    ].join(" ");
    expect(all).not.toMatch(/NaN|Infinity|transform|matrix/);
  });
});

describe("a box", () => {
  const box = isoBox({ a: 0, b: 0, w: 1, d: 1, z: 0, h: 1 }, UNIT);

  it("hides exactly three edges, and they all meet the far-back-bottom vertex", () => {
    const runs = box.hidden.split("M").filter(Boolean);
    expect(runs).toHaveLength(3);
    // (1, 1, 0) — the one corner whose every adjoining face points away.
    const far = isoProject(1, 1, 0, UNIT);
    for (const run of runs) {
      const pts = run.replace(/L/g, " ").trim().split(/\s+/).map(Number);
      const touches =
        (Math.abs(pts[0] - far.x) < 0.05 && Math.abs(pts[1] - far.y) < 0.05) ||
        (Math.abs(pts[2] - far.x) < 0.05 && Math.abs(pts[3] - far.y) < 0.05);
      expect(touches).toBe(true);
    }
  });

  it("shows the other nine", () => {
    expect(box.visible.split("M").filter(Boolean)).toHaveLength(6);
    expect(box.visible).toMatch(/Z/);
  });

  it("seats a name beside its right-hand edge, at half its height", () => {
    expect(box.side).toEqual(isoProject(1, 0, 0.5, UNIT));
  });
});

describe("the stages build up", () => {
  it("each block runs longer, holds more of the work, and stands taller than the last", () => {
    for (let i = 1; i < STAGE_PRISMS.length; i += 1) {
      const p = STAGE_PRISMS[i - 1];
      const q = STAGE_PRISMS[i];
      expect(q.a).toBeGreaterThan(p.a + p.w);
      expect(q.b).toBeGreaterThan(p.b + p.d);
      expect(q.w).toBeGreaterThan(p.w);
      expect(q.h).toBeGreaterThan(p.h);
    }
  });

  it("the front corner sits on the stage's centre line", () => {
    const o = isoProject(0, 0, 0, STAGES_FRAME);
    expect(o.x).toBeCloseTo(STAGES_VB.w / 2, 0);
  });
});

describe("the curve (Moira's surface, ported)", () => {
  it("keeps every point of the surface MARGIN inside its box", () => {
    for (const p of curveExtent()) {
      expect(p.x).toBeGreaterThanOrEqual(MARGIN);
      expect(p.x).toBeLessThanOrEqual(DW - MARGIN);
      expect(p.y).toBeGreaterThanOrEqual(MARGIN);
      expect(p.y).toBeLessThanOrEqual(DH - MARGIN);
    }
  });
});

describe("the dust", () => {
  it("is the same on the server and in the handout", () => {
    const a = isoDust(368, 12, 0, 0, 4, 2, 1, UNIT);
    const b = isoDust(368, 12, 0, 0, 4, 2, 1, UNIT);
    expect(a).toEqual(b);
    expect(isoDust(369, 12, 0, 0, 4, 2, 1, UNIT)).not.toEqual(a);
  });
});

describe("a derived crop", () => {
  it("holds every point it was given, inside its pads", () => {
    const pts = [
      { a: 0, b: 0, z: 0 },
      { a: 12, b: 0, z: 0 },
      { a: 0, b: 12, z: 3 },
    ];
    const f = frameAround(pts, { l: 10, r: 20, t: 5, b: 15 });
    for (const p of pts) {
      const q = isoProject(p.a, p.b, p.z, f);
      expect(q.x).toBeGreaterThanOrEqual(10 - 1e-6);
      expect(q.x).toBeLessThanOrEqual(f.w - 20 + 1);
      expect(q.y).toBeGreaterThanOrEqual(5 - 1e-6);
      expect(q.y).toBeLessThanOrEqual(f.h - 15 + 1);
    }
  });
});

describe("every drawing fits its crop, and no two labels overlap", () => {
  const cases = [
    stagesCase("stages · plopsa", PLOPSA_WORKSHOP_ARC, "drie-manieren"),
    stagesCase("stages · archetype", THOUGHTFORM_WORKSHOP_ARC, "three-ways"),
    /* A label's box is its TEXT, so a third page mounting the drawing walks
       its own strings (ADR-131's finding, one page later). */
    stagesCase("stages · class one", AI_STORYTELLING_CLASS_1_ARC, "three-ways"),
  ];

  for (const c of cases) {
    it(`${c.name}: every drawn point is inside the crop`, () => {
      for (const p of c.extent) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(c.vb.w);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(c.vb.h);
      }
    });

    it(`${c.name}: every label is seated inside the stage`, () => {
      expect(c.labels.length).toBeGreaterThan(0);
      for (const b of labelBoxes(c.labels, c.type, c.frame)) {
        expect(b.x0, `${b.id} left`).toBeGreaterThanOrEqual(-2);
        expect(b.x1, `${b.id} right`).toBeLessThanOrEqual(c.vb.w + 2);
        expect(b.y0, `${b.id} top`).toBeGreaterThanOrEqual(-2);
        expect(b.y1, `${b.id} bottom`).toBeLessThanOrEqual(c.vb.h + 2);
      }
    });

    it(`${c.name}: no two labels print through each other`, () => {
      const hits = labelCollisions(labelBoxes(c.labels, c.type, c.frame));
      expect(hits, `${c.name}: ${JSON.stringify(hits)}`).toEqual([]);
    });
  }
});

describe("the collision walk itself", () => {
  it("fails on two labels at one seat", () => {
    // ⚠ A GUARD THAT HAS NEVER FAILED IS A GUARD NOBODY HAS CHECKED. The map
    // city's containment walk was green while its plaques printed through
    // their plates; this asserts the walk can see an overlap at all.
    const two: IsoLabel[] = [
      { id: "a", text: "EEN PROMPT", ax: 0.5, at: 0.5, anchor: "start" },
      { id: "b", text: "EEN TOOL", ax: 0.52, at: 0.5, anchor: "start" },
    ];
    expect(labelCollisions(labelBoxes(two, 11, STAGES_FRAME))).toEqual([["a", "b"]]);
  });

  it("tests a rotated word by its rectangle, not its bounding box", () => {
    /* Two parallel rows of words along one edge: the bounding boxes overlap,
       the rectangles do not. An AABB walk would fail a clean drawing. */
    const rows: IsoLabel[] = [
      { id: "near", text: "HOE LANG ZONDER JOU", ax: 0.5, at: 0.5, anchor: "middle", rot: -22 },
      { id: "far", text: "HOE LANG ZONDER JOU", ax: 0.5, at: 0.56, anchor: "middle", rot: -22 },
    ];
    expect(labelCollisions(labelBoxes(rows, 11, STAGES_FRAME))).toEqual([]);
    const same: IsoLabel[] = [rows[0], { ...rows[1], at: 0.505 }];
    expect(labelCollisions(labelBoxes(same, 11, STAGES_FRAME))).toHaveLength(1);
  });
});
