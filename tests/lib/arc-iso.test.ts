import { describe, expect, it } from "vitest";

import { explodedExtent, explodedLabels, XP_FRAME, XP_VB } from "@/components/arcs/framing/explodedLayout";
import {
  ISO_BASIS_2TO1,
  ISO_BASIS_CABINET,
  type IsoFrame,
  type IsoLabel,
  isoBox,
  isoDepth,
  isoDust,
  isoPath,
  isoPlate,
  isoProject,
  isoSteps,
  labelBoxes,
  labelCollisions,
} from "@/components/arcs/framing/iso";
import {
  CURVE_FRAME,
  CURVE_VB,
  NOW_A,
  TREADS,
  curveExtent,
  curveLabels,
  ladder,
  profile,
} from "@/components/arcs/framing/curveLayout";
import {
  HORIZON_VB,
  HZ_FRAME,
  horizonExtent,
  horizonLabels,
} from "@/components/arcs/framing/horizonLayout";
import {
  STAGES_FRAME,
  STAGES_VB,
  stagesExtent,
  stagesLabels,
} from "@/components/arcs/framing/stagesLayout";
import { PLOPSA_WORKSHOP_ARC } from "@/lib/arcs/content/plopsa-workshop";
import type { ArcSectionKind, ArcSectionOf } from "@/lib/arcs/types";

/**
 * The workshop framing's one projection (ADR-130 U1).
 *
 * ⚠ THE LABEL WALK IS THE POINT OF THIS FILE. `.claude/rules/proof.md` records
 * what an isometric costs on this surface: the Intelligence Map city printed
 * its district plaques through their own plates 10-13 times per sheet, at every
 * viewport, in both themes, with every containment guard green — because
 * nothing asked whether two labels were inside EACH OTHER. Every drawing here
 * declares what it names and this file walks the pairs.
 */

const UNIT: IsoFrame = { w: 200, h: 200, ox: 0, oy: 0, k: 100, basis: ISO_BASIS_CABINET };

/** The type sizes the drawings' DOM labels render at, in each crop's units. */
const TYPE = { stages: 13, curve: 13, horizon: 15, exploded: 11 } as const;

const section = <K extends ArcSectionKind>(id: string) =>
  PLOPSA_WORKSHOP_ARC.sections.find((s) => s.id === id) as ArcSectionOf<K>;

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

  it("puts a is right, b is back-and-up, z is up", () => {
    expect(isoProject(1, 0, 0, UNIT)).toEqual({ x: 100, y: 0 });
    expect(isoProject(0, 1, 0, UNIT)).toEqual({ x: 43.3, y: -25 });
    expect(isoProject(0, 0, 1, UNIT)).toEqual({ x: 0, y: -100 });
  });

  it("orders far before near", () => {
    expect(isoDepth(0, 0)).toBeLessThan(isoDepth(0, 3));
  });

  it("never emits a NaN, an Infinity or a transform", () => {
    const all = [
      isoPath([isoProject(0, 0, 0, UNIT), isoProject(1, 1, 1, UNIT)]),
      isoBox({ a: 0, b: 0, w: 1, d: 1, z: 0, h: 1 }, UNIT).visible,
      isoPlate({ a: 0, b: 0, w: 1, d: 1, z: 0, h: 0.1 }, 0.2, UNIT).top,
    ].join(" ");
    expect(all).not.toMatch(/NaN|Infinity|transform|matrix/);
  });
});

describe("a box", () => {
  const box = isoBox({ a: 0, b: 0, w: 1, d: 1, z: 0, h: 1 }, UNIT);

  it("hides exactly three edges, and they all meet the far-bottom vertex", () => {
    const runs = box.hidden.split("M").filter(Boolean);
    expect(runs).toHaveLength(3);
    // (0, 1, 0) — the one corner whose every adjoining face points away.
    const far = isoProject(0, 1, 0, UNIT);
    for (const run of runs) {
      const pts = run
        .replace(/L/g, " ")
        .trim()
        .split(/\s+/)
        .map(Number);
      const touches =
        (Math.abs(pts[0] - far.x) < 0.05 && Math.abs(pts[1] - far.y) < 0.05) ||
        (Math.abs(pts[2] - far.x) < 0.05 && Math.abs(pts[3] - far.y) < 0.05);
      expect(touches).toBe(true);
    }
  });

  it("shows the other nine", () => {
    // The top face is one closed run of four edges; five more run singly.
    expect(box.visible.split("M").filter(Boolean)).toHaveLength(6);
    expect(box.visible).toMatch(/Z/);
  });

  it("hangs its tag off the top face's far-left corner", () => {
    expect(box.apex).toEqual(isoProject(0, 1, 1, UNIT));
  });
});

describe("a plate", () => {
  it("cuts the top face's SCREEN top-right and bottom-left corners", () => {
    const cut = 0.2;
    const plate = isoPlate({ a: 0, b: 0, w: 1, d: 1, z: 0, h: 0.1 }, cut, UNIT);
    const pts = plate.top
      .replace(/[MLZ]/g, " ")
      .trim()
      .split(/\s+/)
      .map(Number);
    const xy: [number, number][] = [];
    for (let i = 0; i < pts.length; i += 2) xy.push([pts[i], pts[i + 1]]);
    expect(xy).toHaveLength(6);
    // The two SHARP corners are the world (a+w, b) and (a, b+d) vertices; the
    // two CUT ones are (a, b) [screen BL] and (a+w, b+d) [screen TR], each
    // replaced by a pair. ⚠ ADR-065's diagonal is the reader's, not the
    // world's: under this basis screen x rises with both axes.
    const has = (p: { x: number; y: number }) =>
      xy.some(([x, y]) => Math.abs(x - p.x) < 0.05 && Math.abs(y - p.y) < 0.05);
    expect(has(isoProject(1, 0, 0.1, UNIT))).toBe(true);
    expect(has(isoProject(0, 1, 0.1, UNIT))).toBe(true);
    expect(has(isoProject(0, 0, 0.1, UNIT))).toBe(false);
    expect(has(isoProject(1, 1, 0.1, UNIT))).toBe(false);
  });
});

describe("a stepped relief", () => {
  it("rises once per tread and ends where the run ends", () => {
    const relief = isoSteps(profile(), NOW_A, 0, 0.7, CURVE_FRAME);
    // One corner for the first tread, two for every riser, one for the tail.
    expect(relief.ties).toHaveLength((TREADS - 1) * 2 + 2);
    expect(relief.end.x).toBeCloseTo(isoProject(NOW_A, 0, 0, CURVE_FRAME).x, 6);
  });

  it("never descends", () => {
    const zs = profile().map((p) => p.z);
    for (let i = 1; i < zs.length; i += 1) expect(zs[i]).toBeGreaterThan(zs[i - 1]);
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

describe("every drawing fits its crop, and no two labels overlap", () => {
  const cases = [
    {
      name: "stages",
      vb: STAGES_VB,
      frame: STAGES_FRAME,
      extent: stagesExtent(),
      labels: (() => {
        const s = section<"stages">("drie-manieren");
        return stagesLabels(
          s.stages.map((x) => x.label),
          s.axes,
          s.ends
        );
      })(),
      type: TYPE.stages,
    },
    {
      name: "curve",
      vb: CURVE_VB,
      frame: CURVE_FRAME,
      extent: curveExtent(),
      labels: curveLabels(section<"curve">("de-curve")),
      type: TYPE.curve,
    },
    {
      name: "horizon",
      vb: HORIZON_VB,
      frame: HZ_FRAME,
      extent: horizonExtent(),
      labels: horizonLabels(section<"horizon">("de-horizon")),
      type: TYPE.horizon,
    },
    {
      name: "exploded",
      vb: XP_VB,
      frame: XP_FRAME,
      extent: explodedExtent(5),
      labels: (() => {
        const s = section<"list-groups">("vandaag");
        return explodedLabels(s.exploded?.layers ?? []);
      })(),
      type: TYPE.exploded,
    },
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
      for (const l of c.labels as readonly IsoLabel[]) {
        expect(l.ax, `${l.id} ax`).toBeGreaterThanOrEqual(0);
        expect(l.ax, `${l.id} ax`).toBeLessThanOrEqual(1);
        expect(l.at, `${l.id} at`).toBeGreaterThanOrEqual(0);
        expect(l.at, `${l.id} at`).toBeLessThanOrEqual(1);
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
      { id: "a", text: "VRIJE ZONE", ax: 0.5, at: 0.5, anchor: "start" },
      { id: "b", text: "TAGLINE", ax: 0.52, at: 0.5, anchor: "start" },
    ];
    expect(labelCollisions(labelBoxes(two, 11, XP_FRAME))).toEqual([["a", "b"]]);
  });
});

describe("the crest draws on", () => {
  it("is one run, and the relief's other lines are not", () => {
    const relief = ladder();
    expect(relief.crest.startsWith("M")).toBe(true);
    expect(relief.crest.split("M")).toHaveLength(2);
  });
});
