import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ISO_ANGLE, labelBoxes, labelCollisions } from "@/components/arcs/framing/iso";
import { SLAB_PATHS } from "@/components/arcs/stack/stackLayout";
import {
  CONN_A,
  VIS_WORDS_COL,
  phaseRows,
  teamFigure,
  visionLabels,
} from "@/components/arcs/visionFigure";
import type { VisRowDrawing, VisTeamDrawing } from "@/components/arcs/visionFigure";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";
import { X_BIONIC_INSTRUMENT } from "@/lib/instrument/records/x-bionic";
import { PS_DEFAULTS, knobsFor } from "@/lib/proposal-system/variants";
import { xBionicV2 } from "@/lib/proposal-system/xBionicV2";

/* The vision in two routes (the proposal system lab, 2026-10-11), the
   `arc-plugin-layer.test.ts` pattern: the knob's first value is production
   (`PA` draws the console by reference), every mark inside its crop, every
   word's block clear of its neighbours at the binding height, the words the
   records' own, and the slab at the stage's angle. */

const ROOT = join(__dirname, "..", "..");
const PROD_VISION = X_BIONIC_PROPOSAL_ARC.sections.find((s) => s.id === "vision");

/** Every point a path visits: M L V H. */
function pathPoints(d: string): [number, number][] {
  const tokens = d.match(/[MLVHZz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const out: [number, number][] = [];
  let cmd = "";
  let x = 0;
  let y = 0;
  const nums: number[] = [];
  const flush = () => {
    if (cmd === "M" || cmd === "L") {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        x = nums[i];
        y = nums[i + 1];
        out.push([x, y]);
      }
    } else if (cmd === "V" || cmd === "H") {
      for (const n of nums) {
        if (cmd === "V") y = n;
        else x = n;
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

function expectInside(name: string, marks: { d: string }[], vb: { w: number; h: number }) {
  const points = marks.flatMap((m) => pathPoints(m.d));
  /* The host row is the leanest: one plain plate (18 points) and three drops. */
  expect(points.length, `${name}: the walk reads the drawing`).toBeGreaterThan(20);
  for (const [x, y] of points) {
    expect(x, `${name}: x off the left`).toBeGreaterThanOrEqual(0);
    expect(x, `${name}: x off the right`).toBeLessThanOrEqual(vb.w);
    expect(y, `${name}: y off the top`).toBeGreaterThanOrEqual(0);
    expect(y, `${name}: y off the bottom`).toBeLessThanOrEqual(vb.h);
  }
}

/* The DOM words render at ~11.5px, 1.35 leading, over a crop drawn at
   ~0.43px a unit at the binding size (the plot is 214 × 259px at 1280×720
   for the team's 494 × 598 crop): ~26 units a line. */
const TYPE = 26;

const vision = (id: string) => {
  const s = xBionicV2(knobsFor(id)).sections.find((x) => x.id === "vision");
  if (s?.kind !== "leverage") throw new Error(`${id}: the vision`);
  return s;
};

describe("the vision in two routes (the proposal system lab)", () => {
  it("the knob's first value is production: PA draws the console by reference", () => {
    expect(PS_DEFAULTS.vision).toBe("console");
    expect(xBionicV2(knobsFor("PA")).sections).toBe(X_BIONIC_PROPOSAL_ARC.sections);
    expect(PROD_VISION?.kind).toBe("leverage");
    if (PROD_VISION?.kind === "leverage") expect(PROD_VISION.figure).toBeUndefined();
  });

  it("VA and VB swap the vision in place, spreading production's section", () => {
    for (const [id, kind] of [
      ["VA", "team"],
      ["VB", "phases"],
    ] as const) {
      const arc = xBionicV2(knobsFor(id));
      expect(arc.sections.map((s) => s.id)).toEqual(
        X_BIONIC_PROPOSAL_ARC.sections.map((s) => s.id)
      );
      const s = vision(id);
      if (PROD_VISION?.kind !== "leverage") throw new Error("production's vision");
      expect(s.figure?.kind).toBe(kind);
      expect(s.head.title, `${id}: the title`).toBe(PROD_VISION.head.title);
      expect(s.uses, `${id}: the 2×2`).toBe(PROD_VISION.uses);
      expect(s.console, `${id}: the console`).toBe(PROD_VISION.console);
      /* The note's sentence moved into the head: one paragraph, no em
         dash, no first person, inside its measure. */
      const sub = s.head.sub ?? "";
      expect(sub.length).toBeLessThanOrEqual(230);
      expect(sub.length).toBeGreaterThan(0);
      expect(sub).not.toMatch(/—/);
      expect(sub).toContain("handed over with an owner per workstream");
      expect(sub).not.toMatch(/(^|[^\p{L}])(I|my|me|we|our)(?=[^\p{L}]|$)/iu);
    }
  });

  it("letters the records' own words, within their measures", () => {
    const org = X_BIONIC_INSTRUMENT.org!;
    for (const id of ["VA", "VB"]) {
      const s = vision(id);
      const f = s.figure!;
      /* The team: the record's workstreams and owners, in the vision's
         order, never retyped. */
      expect(f.tiles.map((t) => t.id)).toEqual(org.workstreams.map((w) => w.id));
      expect(f.tiles.map((t) => t.name)).toEqual(org.workstreams.map((w) => w.bucket));
      expect(f.tiles.map((t) => t.role)).toEqual(org.workstreams.map((w) => w.line));
      expect(f.tiles.map((t) => t.name)).toEqual(s.uses.items.map((u) => u.label));
      /* The levels are mono labels; the connectors the plugin's own. */
      for (const l of Object.values(f.levels)) {
        expect(l.length, l).toBeLessThanOrEqual(18);
        expect(l, l).not.toMatch(/\d/);
      }
      expect(f.connectors.length).toBeGreaterThanOrEqual(1);
      expect(f.connectors.length).toBeLessThanOrEqual(3);
      for (const c of f.connectors) expect(c.length, c).toBeLessThanOrEqual(12);
      const engine = xBionicV2(knobsFor(id)).sections.find((x) => x.kind === "instrument");
      if (engine?.kind === "instrument") expect(f.connectors).toBe(engine.face?.connectors);
      /* The layer's line is the vision's own plate's. */
      expect(f.layerLine).toBe(PROD_VISION?.kind === "leverage" ? PROD_VISION.stack[0].line : "");
      const courses = [...f.courses.skills, ...f.courses.evals];
      expect(courses.length).toBeLessThanOrEqual(8);
      for (const c of courses) {
        expect(c.length, c).toBeLessThanOrEqual(32);
        expect(c, c).not.toMatch(/\d/);
      }
      for (const t of f.tiles) {
        expect(t.role.length, t.id).toBeLessThanOrEqual(40);
        expect(t.role, t.id).not.toMatch(/\d/);
      }
      if (f.kind === "phases") {
        expect(f.lines, `${id}: three lines`).toHaveLength(3);
        for (const l of f.lines!) {
          expect(l.length, l).toBeLessThanOrEqual(76);
          expect(l, l).not.toMatch(/—/);
          expect(l, l).not.toMatch(/, not /);
        }
      } else {
        expect(f.lines).toBeUndefined();
        /* The readout foot: no digit lettered, the team spelled. */
        for (const r of s.readout) {
          expect(r.label, r.label).not.toMatch(/\d/);
          expect(r.value, r.value).not.toMatch(/\d/);
        }
        expect(s.readout.map((r) => r.label.toLowerCase())).toEqual(["team", "layer", "claude"]);
      }
    }
  });

  it("the team stack: every mark inside the crop, the seats on it, the drops under the host", () => {
    const d: VisTeamDrawing = teamFigure(4);
    expectInside("team", d.marks, d.vb);
    const seats = Object.values(d.callouts);
    for (const s of seats) {
      expect(s.ax >= 0 && s.ax <= 1, "a seat across").toBe(true);
      expect(s.at >= 0 && s.at <= 1, "a seat down").toBe(true);
      expect(s.ay >= 0 && s.ay <= 1, "a block's centre").toBe(true);
      expect(s.ay, "a block never above its floor").toBeGreaterThanOrEqual(s.at - 1e-9);
    }
    /* Top to bottom: the team, the layer, the host, their blocks in the
       same order. */
    expect(d.callouts.team.at).toBeLessThan(d.callouts.layer.at);
    expect(d.callouts.layer.at).toBeLessThan(d.callouts.host.at);
    expect(d.callouts.team.ay).toBeLessThan(d.callouts.layer.ay);
    expect(d.callouts.layer.ay).toBeLessThan(d.callouts.host.ay);
    /* Four people on four tiles, one hatch on the lit layer, the drops. */
    expect(d.marks.filter((m) => m.cls === "person")).toHaveLength(4);
    expect(d.marks.filter((m) => m.cls === "hatch")).toHaveLength(1);
    expect(d.marks.filter((m) => m.cls === "face-lit")).toHaveLength(1);
    const link = d.marks.find((m) => m.cls === "link")!;
    expect((link.d.match(/M/g) ?? []).length).toBe(CONN_A.length);
    expect(teamFigure(4)).toEqual(d);
  });

  it("the team's word blocks never sit on one another at the binding height", () => {
    const d = teamFigure(4);
    const { labels, frame } = visionLabels(
      [
        { id: "team", callout: d.callouts.team, lines: 6 },
        { id: "layer", callout: d.callouts.layer, lines: 3 },
        { id: "host", callout: d.callouts.host, lines: 5 },
      ],
      d.vb
    );
    expect(labelCollisions(labelBoxes(labels, TYPE, frame))).toEqual([]);
    /* Inside the crop's height, top and bottom. */
    for (const b of labelBoxes(labels, TYPE, frame)) {
      expect(b.y0, b.id).toBeGreaterThanOrEqual(-1);
      expect(b.y1, b.id).toBeLessThanOrEqual(d.vb.h + 1);
    }
  });

  it("the guard can fail: two blocks at one seat collide", () => {
    const d = teamFigure(4);
    const { labels, frame } = visionLabels(
      [
        { id: "a", callout: d.callouts.layer, lines: 3 },
        { id: "b", callout: { ...d.callouts.layer, ay: d.callouts.layer.ay + 0.02 }, lines: 3 },
      ],
      d.vb
    );
    expect(labelCollisions(labelBoxes(labels, TYPE, frame)).length).toBeGreaterThan(0);
    expect(frame.w).toBe(d.vb.w + VIS_WORDS_COL);
  });

  it("the phases: three crops of one height, every mark inside, the flow from corner to corner", () => {
    const rows: VisRowDrawing[] = phaseRows(4, { skills: 3, evals: 2 });
    expect(rows).toHaveLength(3);
    const h = rows[0].vb.h;
    for (const [i, r] of rows.entries()) {
      expect(r.vb.h, `row ${i}: one height`).toBe(h);
      expect(r.vb.w, `row ${i}: one width`).toBe(rows[0].vb.w);
      expectInside(`row ${i}`, r.marks, r.vb);
      for (const v of [r.callout.ax, r.callout.at, r.callout.ay, r.flow.fx, r.flow.fb, r.flow.fa]) {
        expect(v >= 0 && v <= 1, `row ${i}: a fraction`).toBe(true);
      }
      expect(r.callout.ay, `row ${i}: the block's floor`).toBeGreaterThanOrEqual(
        r.callout.at - 1e-9
      );
      /* The leader leaves below where the next one lands, at one x. */
      expect(r.flow.fb).toBeGreaterThan(r.flow.fa);
      expect(r.flow.fx).toBeCloseTo(rows[0].flow.fx, 3);
    }
    expect(rows[0].marks.filter((m) => m.cls === "person")).toHaveLength(4);
    expect(rows[0].marks.filter((m) => m.cls === "deck")).toHaveLength(1);
    expect(rows[1].marks.filter((m) => m.cls === "course")).toHaveLength(3);
    expect(rows[1].marks.filter((m) => m.cls === "course-eval")).toHaveLength(2);
    expect(rows[1].marks.filter((m) => m.cls === "hatch")).toHaveLength(1);
    expect(rows[2].marks.filter((m) => m.cls === "link")).toHaveLength(1);
    expect(rows[2].marks.filter((m) => m.cls === "face-lit")).toHaveLength(0);
    /* The lowest point of the host row is the drops' feet, inside the crop. */
    const feet = pathPoints(rows[2].marks.find((m) => m.cls === "link")!.d);
    expect(Math.max(...feet.map((p) => p[1]))).toBeLessThanOrEqual(rows[2].vb.h);
    expect(phaseRows(4, { skills: 3, evals: 2 })).toEqual(rows);
  });

  it("leans at the stage's own angle, the Slab's", () => {
    const deg = (d: string) => {
      const [[x0, y0], [x1, y1]] = pathPoints(d);
      return (Math.atan2(Math.abs(y1 - y0), Math.abs(x1 - x0)) * 180) / Math.PI;
    };
    const d = teamFigure(4);
    const top = d.marks.find((m) => m.cls === "face-lit")!;
    expect(deg(top.d)).toBeCloseTo(ISO_ANGLE, 1);
    expect(deg(top.d)).toBeCloseTo(deg(SLAB_PATHS.top), 0);
  });

  it("the sheet is a route import, in the run's own place, on the page and in the lab", () => {
    for (const rel of [
      "app/(marketing)/arcs/[slug]/[leaf]/page.tsx",
      "app/(internal)/test/proposal-system/page.tsx",
    ]) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      const run = src.indexOf('"@/components/arcs/config-run.css"');
      const vis = src.indexOf('"@/components/arcs/vision-figure.css"');
      expect(run, `${rel}: the run's sheet`).toBeGreaterThan(-1);
      expect(vis, `${rel}: the vision's sheet`).toBeGreaterThan(run);
    }
  });
});
