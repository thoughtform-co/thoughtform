import { describe, expect, it } from "vitest";

import { crewSeed } from "@/components/arcs/crewParticles";
import { ISO_BASIS_STAGE, labelBoxes, labelCollisions } from "@/components/arcs/framing/iso";
import {
  MAP_INSET,
  MAP_LABEL_ADVANCE,
  MAP_LABEL_LINE,
  MAP_LABEL_TYPE,
  MAP_MAX_LABELS,
  MAP_MIN_GRAIN,
  MAP_NODE,
  MAP_VB,
  jobMap,
  mapTiers,
} from "@/components/arcs/jobMap";
import { SURI_DRIVE_MAP } from "@/lib/arcs/content/shared/suriDriveMap";
import { ARCS } from "@/lib/arcs/registry";
import type { ArcJobMap, ArcJobMapLabel } from "@/lib/arcs/types";

/* ADR-153 U7: the Drive job's figure is the map itself, drawn as the house's
   grain field. The drawing is numbers before it is marks, so what the test
   asserts is the arithmetic: every grain inside the crop and never under two
   pixels at 1280 × 720, the ramp three shares of the sample, the callouts
   clear of each other and of the crop (`labelCollisions`, the walk the map
   city never had), and one seed one drawing. */

const FRAME = { w: MAP_VB, h: MAP_VB, ox: 0, oy: 0, k: 1, basis: ISO_BASIS_STAGE };

/** Every map a registered job draws, with its words, plus the shared record
 *  on its own: the drawing must hold for the record whatever a page letters. */
const SUBJECTS: { at: string; map: ArcJobMap; labels: readonly ArcJobMapLabel[] }[] = [
  { at: "suriDriveMap", map: SURI_DRIVE_MAP, labels: [] },
];
for (const arc of ARCS) {
  for (const s of arc.sections) {
    if (s.kind !== "job" || s.figure.kind !== "map") continue;
    SUBJECTS.push({ at: `${arc.slug}#${s.id}`, map: s.figure.map, labels: s.figure.labels ?? [] });
  }
}

/** Every leaf of the record, so a name or an id cannot ride in as a string. */
function leaves(value: unknown, out: unknown[] = []): unknown[] {
  if (Array.isArray(value)) value.forEach((v) => leaves(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => leaves(v, out));
  else out.push(value);
  return out;
}

describe("the Drive map, as a record (ADR-153 U7)", () => {
  it("is the mapped Drive reduced to counts and positions, and nothing else", () => {
    expect(SURI_DRIVE_MAP.total).toBe(82307);
    expect(SURI_DRIVE_MAP.clusters.length).toBe(60);
    expect(SURI_DRIVE_MAP.clusters.reduce((sum, c) => sum + c.count, 0)).toBe(SURI_DRIVE_MAP.total);
    /* About 2,400 points, spread by the groups' size: the largest group
       holds the most of them, every group at least one. */
    expect(SURI_DRIVE_MAP.points.length).toBeGreaterThanOrEqual(2300);
    expect(SURI_DRIVE_MAP.points.length).toBeLessThanOrEqual(2500);
    const perGroup = new Array(60).fill(0);
    for (const p of SURI_DRIVE_MAP.points) perGroup[p.c] += 1;
    const largest = SURI_DRIVE_MAP.clusters.reduce(
      (best, c, i) => (c.count > SURI_DRIVE_MAP.clusters[best].count ? i : best),
      0
    );
    expect(Math.max(...perGroup)).toBe(perGroup[largest]);
    expect(Math.min(...perGroup)).toBeGreaterThanOrEqual(1);
    for (const leaf of leaves(SURI_DRIVE_MAP)) {
      expect(typeof leaf, "a leaf that is not a number").toBe("number");
    }
  });

  it("the jobs that draw it letter at most four generic words, each on a real group", () => {
    const pages = SUBJECTS.filter((s) => s.at !== "suriDriveMap");
    expect(pages.length, "the X-Bionic page's Drive job").toBeGreaterThanOrEqual(1);
    for (const { at, map, labels } of pages) {
      expect(labels.length, at).toBeLessThanOrEqual(MAP_MAX_LABELS);
      for (const l of labels) {
        expect(map.clusters[l.group], `${at}: "${l.text}" on group ${l.group}`).toBeTruthy();
        expect(l.text, `${at}: "${l.text}"`).not.toMatch(/\d/);
        expect(l.text.length, `${at}: "${l.text}"`).toBeLessThanOrEqual(14);
      }
    }
  });
});

describe("the Drive map, drawn (jobMap)", () => {
  it("draws one grain per sample point, inside the crop, never under two pixels", () => {
    for (const { at, map, labels } of SUBJECTS) {
      const d = jobMap(map, labels, crewSeed(at));
      expect(d.vb).toBe(MAP_VB);
      expect(d.grains.length, `${at}: one grain a point`).toBe(map.points.length);
      for (const g of d.grains) {
        expect(g.x, `${at}: a grain off the left`).toBeGreaterThanOrEqual(0);
        expect(g.y, `${at}: a grain off the top`).toBeGreaterThanOrEqual(0);
        expect(g.x + g.s, `${at}: a grain off the right`).toBeLessThanOrEqual(MAP_VB);
        expect(g.y + g.s, `${at}: a grain off the bottom`).toBeLessThanOrEqual(MAP_VB);
        /* 2px at 1280 × 720: the frame there is ~330px square, 1.375px a unit. */
        expect(g.s, `${at}: a sub-pixel grain`).toBeGreaterThanOrEqual(MAP_MIN_GRAIN);
        expect(g.a > 0 && g.a <= 1, `${at}: an alpha in range`).toBe(true);
      }
      /* The paths carry every grain, grouped by tier then alpha. */
      const drawn = d.tiers.reduce(
        (sum, t) => sum + t.paths.reduce((n, p) => n + (p.d.match(/M/g) ?? []).length, 0),
        0
      );
      expect(drawn, `${at}: every grain on a path`).toBe(d.grains.length);
    }
  });

  it("the ramp is three shares of the sample, the cores the densest", () => {
    const tiers = mapTiers(SURI_DRIVE_MAP.points);
    const n = SURI_DRIVE_MAP.points.length;
    const count = (t: string) => tiers.filter((x) => x === t).length;
    expect(count("core")).toBe(Math.ceil(n * 0.12));
    expect(count("body")).toBe(Math.floor(n * 0.48));
    expect(count("core") + count("body") + count("sparse")).toBe(n);
    /* A core grain sits in the cloud's middle: its mean distance to the
       centroid of everything is less than a sparse grain's. */
    const cx = SURI_DRIVE_MAP.points.reduce((s, p) => s + p.x, 0) / n;
    const cy = SURI_DRIVE_MAP.points.reduce((s, p) => s + p.y, 0) / n;
    const mean = (t: string) => {
      const ps = SURI_DRIVE_MAP.points.filter((_, i) => tiers[i] === t);
      return ps.reduce((s, p) => s + Math.hypot(p.x - cx, p.y - cy), 0) / ps.length;
    };
    expect(mean("core")).toBeLessThan(mean("sparse"));
  });

  it("one seed is one drawing", () => {
    const seed = crewSeed("job-ops");
    const a = jobMap(SURI_DRIVE_MAP, [], seed);
    const b = jobMap(SURI_DRIVE_MAP, [], seed);
    expect(a).toEqual(b);
    expect(jobMap(SURI_DRIVE_MAP, [], seed + 1)).not.toEqual(a);
  });

  it("the callouts clear each other and the crop, one corner each, a leader to its node", () => {
    for (const { at, map, labels } of SUBJECTS) {
      const d = jobMap(map, labels, crewSeed(at));
      expect(d.callouts.length, at).toBe(Math.min(labels.length, MAP_MAX_LABELS));
      expect(new Set(d.callouts.map((c) => c.id)).size, `${at}: a corner twice`).toBe(
        d.callouts.length
      );
      const boxes = labelBoxes(
        d.callouts.map((c) => ({
          id: c.id,
          text: c.text,
          ax: c.ax,
          at: c.at,
          anchor: c.anchor,
          vAlign: c.vAlign,
          lines: 1,
          measure: c.text.length * MAP_LABEL_TYPE * MAP_LABEL_ADVANCE,
        })),
        MAP_LABEL_TYPE,
        FRAME,
        MAP_LABEL_LINE
      );
      expect(labelCollisions(boxes), `${at}: labels on each other`).toEqual([]);
      for (const b of boxes) {
        expect(b.x0, `${at}: ${b.id} off the left`).toBeGreaterThanOrEqual(0);
        expect(b.y0, `${at}: ${b.id} off the top`).toBeGreaterThanOrEqual(0);
        expect(b.x1, `${at}: ${b.id} off the right`).toBeLessThanOrEqual(MAP_VB);
        expect(b.y1, `${at}: ${b.id} off the bottom`).toBeLessThanOrEqual(MAP_VB);
      }
      for (const c of d.callouts) {
        /* The leader ends a node's half-side short of the node's centre, and
           the node sits on the group's centroid. */
        const leader = c.leader.match(/^M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)$/);
        const node = c.node.match(/^M([\d.]+) ([\d.]+)h/);
        expect(leader, `${at}: ${c.id}'s leader`).toBeTruthy();
        expect(node, `${at}: ${c.id}'s node`).toBeTruthy();
        if (!leader || !node) continue;
        const nx = Number(node[1]) + MAP_NODE / 2;
        const ny = Number(node[2]) + MAP_NODE / 2;
        const gap = Math.hypot(Number(leader[3]) - nx, Number(leader[4]) - ny);
        expect(gap, `${at}: ${c.id}'s leader meets its node`).toBeLessThan(MAP_NODE / 2 + 2.5);
        expect(gap, `${at}: ${c.id}'s leader stops short of its node`).toBeGreaterThan(1);
        const g = map.clusters[c.group];
        const seatX = MAP_INSET + g.x * (MAP_VB - 2 * MAP_INSET);
        const seatY = MAP_INSET + g.y * (MAP_VB - 2 * MAP_INSET);
        expect(Math.abs(nx - seatX), `${at}: ${c.id}'s node on its group`).toBeLessThan(0.2);
        expect(Math.abs(ny - seatY), `${at}: ${c.id}'s node on its group`).toBeLessThan(0.2);
      }
    }
  });

  it("the collision walk can fail: two words in one box are a collision", () => {
    const box = { id: "a", x0: 10, y0: 10, x1: 80, y1: 24 };
    expect(labelCollisions([box, { ...box, id: "b" }])).toEqual([["a", "b"]]);
  });

  it("refuses a word on a group the map does not hold", () => {
    expect(() => jobMap(SURI_DRIVE_MAP, [{ group: 99, text: "Nowhere" }], 1)).toThrow(/group 99/);
  });
});
