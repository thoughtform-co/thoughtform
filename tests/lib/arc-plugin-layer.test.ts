import { describe, expect, it } from "vitest";

import { crewParticles, crewSeed } from "@/components/arcs/crewParticles";
import { ISO_ANGLE } from "@/components/arcs/framing/iso";
import { PLUG_VB, pluginLayer } from "@/components/arcs/pluginLayer";
import { SLAB_PATHS } from "@/components/arcs/stack/stackLayout";
import type { PlugDrawing } from "@/components/arcs/pluginLayer";
import { ARCS } from "@/lib/arcs/registry";
import type { ArcSectionOf } from "@/lib/arcs/types";

/* ADR-153 U6: the plugin, drawn as the layer opened. The words are the
   record's (`org.workstreams`, read by the label column) and the drawing is
   the section's (`face`), so the two can only disagree through the lane
   order: lane k on the slab and row k in the column must be the same
   workstream. Every mark is asserted inside the crop, because an SVG path
   past its viewBox is cut off with nothing on screen to say so. */

type Faced = { slug: string; section: ArcSectionOf<"instrument"> };

const FACED: Faced[] = ARCS.flatMap((arc) =>
  arc.sections.flatMap((s) =>
    s.kind === "instrument" && s.face ? [{ slug: arc.slug, section: s }] : []
  )
);

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

function everyPath(d: PlugDrawing): string[] {
  return [
    d.layer.top,
    ...d.layer.sides,
    d.host.top,
    ...d.host.sides,
    d.seams,
    d.connectors,
    ...d.lanes.flatMap((l) => [l.traces, ...l.grains.map((g) => g.d), ...l.people]),
  ].filter(Boolean);
}

const grainCount = (l: PlugDrawing["lanes"][number]) =>
  l.grains.reduce((n, g) => n + (g.d.match(/M/g)?.length ?? 0), 0);

describe("the plugin's opened layer (ADR-153 U6)", () => {
  it("is mounted on the X-Bionic proposal, so the walk below is not empty", () => {
    expect(FACED.map((f) => f.slug)).toContain("x-bionic-proposal");
  });

  it("draws one lane per workstream, in the label column's order", () => {
    for (const { slug, section } of FACED) {
      const org = section.record.org;
      expect(org, `${slug}: a face needs the record's org`).toBeTruthy();
      const face = section.face!;
      expect(
        face.lanes.map((l) => l.id),
        `${slug}: lane k on the slab is row k in the column`
      ).toEqual(org!.workstreams.map((w) => w.id));
    }
  });

  it("names one to three connectors, each short enough for its seat", () => {
    for (const { slug, section } of FACED) {
      const { connectors, layer, host } = section.face!;
      expect(connectors.length, `${slug}: connectors`).toBeGreaterThanOrEqual(1);
      expect(connectors.length, `${slug}: connectors`).toBeLessThanOrEqual(3);
      for (const c of connectors) expect(c.length, `${slug}: "${c}"`).toBeLessThanOrEqual(12);
      expect(layer.trim(), `${slug}: the layer's tag`).not.toBe("");
      expect(host.trim(), `${slug}: the host's tag`).not.toBe("");
    }
  });

  it("keeps every mark inside the crop, and every word's seat on it", () => {
    for (const { slug, section } of FACED) {
      const face = section.face!;
      const d = pluginLayer(face.lanes, face.connectors.length);
      const points = everyPath(d).flatMap(pathPoints);
      expect(points.length, `${slug}: the walk reads the drawing`).toBeGreaterThan(100);
      for (const p of everyPath(d)) {
        for (const [x, y] of pathPoints(p)) {
          expect(x, `${slug}: x off the left`).toBeGreaterThanOrEqual(PLUG_VB.x);
          expect(x, `${slug}: x off the right`).toBeLessThanOrEqual(PLUG_VB.x + PLUG_VB.w);
          expect(y, `${slug}: y off the top`).toBeGreaterThanOrEqual(PLUG_VB.y);
          expect(y, `${slug}: y off the bottom`).toBeLessThanOrEqual(PLUG_VB.y + PLUG_VB.h);
        }
      }
      const seats = [d.seats.layer, d.seats.host, ...d.seats.index, ...d.seats.connectors];
      for (const s of seats) {
        expect(s.ax >= 0 && s.ax <= 1, `${slug}: a seat across`).toBe(true);
        expect(s.at >= 0 && s.at <= 1, `${slug}: a seat down`).toBe(true);
      }
      expect(d.seats.index.length, `${slug}: an index per lane`).toBe(face.lanes.length);
      expect(d.seats.connectors.length, `${slug}: a seat per connector`).toBe(
        face.connectors.length
      );
    }
  });

  it("draws the record's own count on a field, and the keepers it names", () => {
    for (const { slug, section } of FACED) {
      const face = section.face!;
      const d = pluginLayer(face.lanes, face.connectors.length);
      face.lanes.forEach((lane, k) => {
        const drawn = d.lanes[k];
        const own = crewParticles(lane.output, crewSeed(lane.seed));
        if (lane.output.kind === "field") {
          expect(grainCount(drawn), `${slug} ${lane.id}: one grain per asset`).toBe(
            lane.output.count
          );
        }
        expect(drawn.people.length, `${slug} ${lane.id}: the people on the lane`).toBe(
          lane.keepers ?? own.people.length
        );
      });
    }
  });

  it("is the same drawing on every render", () => {
    for (const { section } of FACED) {
      const face = section.face!;
      expect(pluginLayer(face.lanes, face.connectors.length)).toEqual(
        pluginLayer(face.lanes, face.connectors.length)
      );
    }
  });

  /* One projection on the page: the opened layer sat at 20.6 degrees for a
     day after the vision's stack and every Slab moved to the stage's 22
     (2026-10-10), which reads as a rendering fault, not a second view. */
  it("leans at the stage's own angle, the Slab's", () => {
    const deg = (d: string) => {
      const [[x0, y0], [x1, y1]] = pathPoints(d);
      return (Math.atan2(Math.abs(y1 - y0), Math.abs(x1 - x0)) * 180) / Math.PI;
    };
    const { section } = FACED[0];
    const face = section.face!;
    const d = pluginLayer(face.lanes, face.connectors.length);
    expect(deg(d.layer.top)).toBeCloseTo(ISO_ANGLE, 1);
    expect(deg(d.layer.top)).toBeCloseTo(deg(SLAB_PATHS.top), 0);
  });
});
