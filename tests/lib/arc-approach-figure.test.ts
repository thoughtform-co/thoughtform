import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ASK_A,
  DECK_LIFT,
  PASS_COL,
  WORDS_L,
  WORDS_R,
  writtenDrawing,
  writtenLabels,
} from "@/components/arcs/approachWritten";
import type { WrittenDrawing } from "@/components/arcs/approachWritten";
import { labelBoxes, labelCollisions } from "@/components/arcs/framing/iso";
import { PLUG_VB, PLUG_VB_OPENED, pluginLayer } from "@/components/arcs/pluginLayer";
import type { PlugDrawing } from "@/components/arcs/pluginLayer";
import { PLATE, courseLines, tilesZ } from "@/components/arcs/stack/stackLayout";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";
import { PS_DEFAULTS, PS_KNOB_LIST, knobsFor } from "@/lib/proposal-system/variants";
import { xBionicV2 } from "@/lib/proposal-system/xBionicV2";

/**
 * The approach's two lab figures (2026-10-11), on `arc-plugin-layer`'s
 * pattern: every path inside its crop, every word's seat on it and never on
 * another's, the knob's first value production, the three lines ≤ 76. The
 * written drawing is walked at the lab's own composition (`AA`); the opened
 * lane at `AB`.
 */
const ROOT = join(__dirname, "..", "..");

const AA = xBionicV2(knobsFor("AA")).sections.find((s) => s.id === "adoption");
const AB = xBionicV2(knobsFor("AB")).sections.find((s) => s.id === "adoption");
const WRITTEN = AA?.kind === "handoff" ? AA.written : undefined;
const OPENED = AB?.kind === "handoff" ? AB.opened : undefined;

/** Every point a path visits, control points included: M L C V H h v Z. */
function pathPoints(d: string): [number, number][] {
  const tokens = d.match(/[MLCVHhvZz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const out: [number, number][] = [];
  let cmd = "";
  let x = 0;
  let y = 0;
  const nums: number[] = [];
  const flush = () => {
    if (cmd === "M" || cmd === "L" || cmd === "C") {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        x = nums[i];
        y = nums[i + 1];
        out.push([x, y]);
      }
    } else if (cmd === "V" || cmd === "H" || cmd === "v" || cmd === "h") {
      for (const n of nums) {
        if (cmd === "V") y = n;
        else if (cmd === "H") x = n;
        else if (cmd === "v") y += n;
        else x += n;
        out.push([x, y]);
      }
    }
    nums.length = 0;
  };
  for (const t of tokens) {
    if (/[A-Za-z]/.test(t)) {
      flush();
      cmd = t;
    } else nums.push(Number(t));
  }
  flush();
  return out;
}

function writtenPaths(d: WrittenDrawing): string[] {
  const box = (b: { top: string; left: string; right: string; hidden: string }) => [
    b.top,
    b.left,
    b.right,
    b.hidden,
  ];
  return [
    ...box(d.host),
    ...box(d.layer),
    ...d.tiles.flatMap(box),
    ...d.courses.map((c) => c.d),
    d.run,
    ...d.beads.map((b) => b.d),
    ...d.people,
    d.ask,
  ].filter(Boolean);
}

function openedPaths(d: PlugDrawing): string[] {
  const o = d.opened!;
  return [
    d.layer.top,
    ...d.layer.sides,
    d.host.top,
    ...d.host.sides,
    d.seams,
    d.connectors,
    o.face,
    o.spine,
    ...o.dim,
    o.head,
    o.end,
    ...o.courses.map((c) => c.d),
    ...o.adopted.map((g) => g.d),
    ...o.beads.map((g) => g.d),
  ].filter(Boolean);
}

/* The DOM words render at ~11.5px (mono) and ~14.5px (sans) over a stage
   ~0.6px a unit at 1280×720, the binding viewport: a line box is ~31 units,
   i.e. type 23 at the walk's 1.35 leading. */
const TYPE = 23;

describe("the approach's knob and its two variations", () => {
  it("keeps the run first (production) and names both variations", () => {
    const def = PS_KNOB_LIST.find((k) => k.key === "approach")!.def;
    expect(def.values[0]).toBe("run");
    expect(PS_DEFAULTS.approach).toBe("run");
    expect(def.values).toContain("written");
    expect(def.values).toContain("opened");
    expect(knobsFor("AA").approach).toBe("written");
    expect(knobsFor("AB").approach).toBe("opened");
  });

  it("production's approach carries neither variation", () => {
    const prod = X_BIONIC_PROPOSAL_ARC.sections.find((s) => s.id === "adoption");
    expect(prod?.kind).toBe("handoff");
    if (prod?.kind !== "handoff") return;
    expect(prod.written).toBeUndefined();
    expect(prod.opened).toBeUndefined();
    expect(prod.run).toBeTruthy();
  });

  it("letters the three passes in one line each, at most 76, with no digit", () => {
    for (const v of [WRITTEN, OPENED]) {
      expect(v).toBeTruthy();
      expect(v!.lines).toHaveLength(3);
      for (const l of v!.lines) {
        expect(l.length, l).toBeLessThanOrEqual(76);
        expect(l, l).not.toMatch(/\d/);
        expect(l, l).not.toMatch(/—/);
      }
    }
  });

  it("the sheet is a route import on the page and in the lab", () => {
    for (const rel of [
      "app/(marketing)/arcs/[slug]/[leaf]/page.tsx",
      "app/(internal)/test/proposal-system/page.tsx",
    ]) {
      expect(readFileSync(join(ROOT, rel), "utf8"), rel).toContain(
        '"@/components/arcs/approach-figure.css"'
      );
    }
  });
});

describe("the layer written, read whole", () => {
  const d = writtenDrawing("adoption", {
    tiles: WRITTEN?.team ?? [],
    skills: WRITTEN?.courses.skills.length ?? 3,
    evals: WRITTEN?.courses.evals.length ?? 2,
  });

  it("keeps every mark inside the crop, in the drawing's own column", () => {
    const paths = writtenPaths(d);
    const points = paths.flatMap(pathPoints);
    expect(points.length, "the walk reads the drawing").toBeGreaterThan(200);
    for (const [x, y] of points) {
      expect(x, "x off the left").toBeGreaterThanOrEqual(WORDS_L);
      expect(x, "x off the right").toBeLessThanOrEqual(d.vb.w - WORDS_R);
      expect(y, "y off the top").toBeGreaterThanOrEqual(0);
      expect(y, "y off the bottom").toBeLessThanOrEqual(d.vb.h);
    }
  });

  it("draws the record's own count: four tiles, four people, five courses, one owner", () => {
    expect(d.tiles).toHaveLength(4);
    expect(d.tiles.filter((t) => t.lit)).toHaveLength(1);
    expect(d.people).toHaveLength(4);
    expect(d.courses).toHaveLength(5);
    expect(d.courses.map((c) => c.kind)).toEqual(["skill", "skill", "skill", "eval", "eval"]);
    expect(d.beads.reduce((n, b) => n + (b.d.match(/M/g)?.length ?? 0), 0)).toBeGreaterThan(20);
    expect(d.ask).toMatch(/^M/);
    /* The owner stands past the run's tip, on the front edge. */
    expect(ASK_A).toBeGreaterThan(PLATE.w);
  });

  it("lifts the deck one course over the vision's", () => {
    const pitch = courseLines(5)[1][0].b - courseLines(5)[0][0].b;
    expect(DECK_LIFT).toBeCloseTo(pitch, 2);
    expect(tilesZ() + DECK_LIFT).toBeGreaterThan(tilesZ());
  });

  it("seats every word on the crop and never on another's, with a leader to its mark", () => {
    const labels = writtenLabels(d, {
      layer: WRITTEN?.layer ?? "YOUR LAYER",
      host: WRITTEN?.host ?? "X-BIONIC'S CLAUDE ENTERPRISE",
      courses: 5,
      keys: ["01 ADOPTION", "02 ENCODING", "03 AUTOMATION"],
    });
    expect(labels).toHaveLength(5);
    const frame = {
      w: d.vb.w,
      h: d.vb.h,
      ox: 0,
      oy: 0,
      k: 1,
      basis: { A: [1, 0], B: [0, 1], Z: [0, 1] },
    } as const;
    const boxes = labelBoxes(labels, TYPE, frame);
    expect(labelCollisions(boxes)).toEqual([]);
    for (const b of boxes) {
      expect(b.x0, b.id).toBeGreaterThanOrEqual(-1);
      expect(b.x1, b.id).toBeLessThanOrEqual(d.vb.w + 1);
      expect(b.y0, b.id).toBeGreaterThanOrEqual(-1);
      expect(b.y1, b.id).toBeLessThanOrEqual(d.vb.h + 1);
    }
    /* The passes stand in their column, past the drawing; the layer's
       words in theirs, before it. */
    for (const s of d.seats.passes) expect(s.ax * d.vb.w).toBeGreaterThanOrEqual(d.vb.w - WORDS_R);
    expect(d.seats.layer.ax * d.vb.w).toBeLessThanOrEqual(WORDS_L);
    expect(d.passW * d.vb.w).toBeCloseTo(PASS_COL, 1);
    /* A leader per word, each inside the crop and a hairline in one axis. */
    const leads = [d.leads.layer, ...d.leads.passes.flat()];
    expect(leads.length).toBeGreaterThanOrEqual(4);
    for (const l of leads) {
      expect(l.aw === 0 || l.ah === 0, "one axis").toBe(true);
      expect(l.ax).toBeGreaterThanOrEqual(0);
      expect(l.at).toBeGreaterThanOrEqual(0);
      expect(l.ax + l.aw).toBeLessThanOrEqual(1);
      expect(l.at + l.ah).toBeLessThanOrEqual(1);
    }
    /* Pass 02's leader meets the layer's back-right edge inside the
       courses' own depth range, so it points at what it names. */
    const bs = courseLines(5).map((c) => c[0].b);
    expect(d.courseB).toBeGreaterThanOrEqual(Math.min(...bs) - 0.3);
    expect(d.courseB).toBeLessThanOrEqual(Math.max(...bs) + 0.3);
    /* Pass 01's leader is level with the team's nearest diamond. */
    expect(d.leads.passes[0]).toHaveLength(1);
    expect(d.leads.passes[0][0].at).toBeCloseTo(d.seats.passes[0].at + 11 / d.vb.h, 3);
  });

  it("the guard can fail: two passes at one seat collide", () => {
    const labels = writtenLabels(d, {
      layer: "YOUR LAYER",
      host: "X-BIONIC",
      courses: 5,
      keys: ["01", "02", "03"],
    }).map((l, i, all) => (i === 3 ? { ...l, at: all[2].at } : l));
    const frame = {
      w: d.vb.w,
      h: d.vb.h,
      ox: 0,
      oy: 0,
      k: 1,
      basis: { A: [1, 0], B: [0, 1], Z: [0, 1] },
    } as const;
    expect(labelCollisions(labelBoxes(labels, TYPE, frame)).length).toBeGreaterThan(0);
  });

  it("is the same drawing on every render", () => {
    const again = writtenDrawing("adoption", { tiles: WRITTEN?.team ?? [], skills: 3, evals: 2 });
    expect(again).toEqual(d);
  });
});

describe("the lane opened", () => {
  const d = pluginLayer(OPENED?.lanes ?? [], OPENED?.connectors.length ?? 3, {
    lane: OPENED?.lit ?? "production",
    courses: { skills: 3, evals: 2 },
    seed: "adoption",
  });

  it("takes the opened crop and keeps every mark inside it", () => {
    expect(d.vb).toEqual(PLUG_VB_OPENED);
    expect(d.opened, "the opened lane").toBeTruthy();
    const points = openedPaths(d).flatMap(pathPoints);
    expect(points.length).toBeGreaterThan(100);
    for (const [x, y] of points) {
      expect(x, "x off the left").toBeGreaterThanOrEqual(d.vb.x);
      expect(x, "x off the right").toBeLessThanOrEqual(d.vb.x + d.vb.w);
      expect(y, "y off the top").toBeGreaterThanOrEqual(d.vb.y);
      expect(y, "y off the bottom").toBeLessThanOrEqual(d.vb.y + d.vb.h);
    }
  });

  it("lights one lane, dims the other three, and draws no Loop figure", () => {
    const o = d.opened!;
    expect(o.lane).toBe(OPENED?.lit ?? "production");
    expect(o.dim).toHaveLength(3);
    expect(d.lanes, "no figures on the lanes").toEqual([]);
    expect(d.seats.index, "no lane indices: the skill takes the seat").toEqual([]);
    expect(o.courses.map((c) => c.kind)).toEqual(["skill", "skill", "skill", "eval", "eval"]);
    expect(o.beads.length).toBeGreaterThan(0);
    expect(o.adopted.length).toBeGreaterThan(0);
  });

  it("seats the three pass tags off the layer's faces, on leaders to their marks", () => {
    const o = d.opened!;
    const seats = [o.seats.skill, ...o.seats.passes];
    for (const s of seats) {
      expect(s.ax >= 0 && s.ax <= 1, "a seat across").toBe(true);
      expect(s.at >= 0 && s.at <= 1, "a seat down").toBe(true);
    }
    const toUnits = (s: { ax: number; at: number }) => ({
      x: d.vb.x + s.ax * d.vb.w,
      y: d.vb.y + s.at * d.vb.h,
    });
    const rise = Math.tan((22 * Math.PI) / 180);
    /* 01 left of the layer's left tip; 02 and 03 above the back edges
       (the back-left edge runs y = -rise·x to the top vertex at x 200,
       the back-right edge rises from there). */
    const [t1, t2, t3] = o.seats.passes.map(toUnits);
    expect(t1.x).toBeLessThan(0);
    expect(t2.y).toBeLessThan(-rise * t2.x - 6);
    expect(t3.y).toBeLessThan(-rise * 200 + rise * (t3.x - 200) - 6);
    /* The tags never sit on one another, nor on the layer's or the
       skill's word. */
    const labels = [
      {
        id: "layer",
        text: OPENED?.layer ?? "YOUR LAYER",
        ax: d.seats.layer.ax,
        at: d.seats.layer.at,
        anchor: "start" as const,
      },
      {
        id: "skill",
        text: OPENED?.skill ?? "",
        ax: o.seats.skill.ax,
        at: o.seats.skill.at,
        anchor: "start" as const,
      },
      {
        id: "p1",
        text: "01",
        ax: o.seats.passes[0].ax,
        at: o.seats.passes[0].at,
        anchor: "end" as const,
      },
      {
        id: "p2",
        text: "02",
        ax: o.seats.passes[1].ax,
        at: o.seats.passes[1].at,
        anchor: "middle" as const,
      },
      {
        id: "p3",
        text: "03",
        ax: o.seats.passes[2].ax,
        at: o.seats.passes[2].at,
        anchor: "middle" as const,
      },
    ];
    const frame = {
      w: d.vb.w,
      h: d.vb.h,
      ox: 0,
      oy: 0,
      k: 1,
      basis: { A: [1, 0], B: [0, 1], Z: [0, 1] },
    } as const;
    expect(labelCollisions(labelBoxes(labels, 10.5, frame))).toEqual([]);
    expect(o.leads).toHaveLength(3);
    for (const l of o.leads) {
      expect(l.aw === 0 || l.ah === 0, "one axis").toBe(true);
      expect(l.ax + l.aw).toBeLessThanOrEqual(1);
      expect(l.at + l.ah).toBeLessThanOrEqual(1);
    }
  });

  it("leaves the plugin beat's own drawing untouched", () => {
    const engine = X_BIONIC_PROPOSAL_ARC.sections.find((s) => s.id === "engine");
    if (engine?.kind !== "instrument" || !engine.face) throw new Error("the engine's face");
    const prod = pluginLayer(engine.face.lanes, engine.face.connectors.length);
    expect(prod.vb).toEqual(PLUG_VB);
    expect(prod.opened).toBeUndefined();
    expect(prod.lanes).toHaveLength(4);
    expect(prod.seats.index).toHaveLength(4);
  });
});
