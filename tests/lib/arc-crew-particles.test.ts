import { describe, expect, it } from "vitest";

import {
  PARTICLE_VB,
  crewParticles,
  crewSeed,
  grainPaths,
  personPath,
  type CrewParticles,
} from "@/components/arcs/crewParticles";
import { ARCS } from "@/lib/arcs/registry";
import type { CrewOutput } from "@/lib/arcs/types";

/* ADR-153 U5: the Loop return's four figures as particles. The drawings are
   numbers before they are marks, so the counts the record states are
   asserted as counts, every mark is asserted inside the crop the lane draws
   under `meet`, and the same seed is the same drawing on every render. */

/** The margin a mark may use past the drawing's inner box, never the crop. */
const PAD = 4;

function inCrop(p: CrewParticles, at: string) {
  for (const g of p.grains) {
    expect(g.x, `${at}: a grain off the left`).toBeGreaterThanOrEqual(PAD);
    expect(g.y, `${at}: a grain off the top`).toBeGreaterThanOrEqual(PAD);
    expect(g.x + g.s, `${at}: a grain off the right`).toBeLessThanOrEqual(PARTICLE_VB.w - PAD);
    expect(g.y + g.s, `${at}: a grain off the bottom`).toBeLessThanOrEqual(PARTICLE_VB.h - PAD);
    expect(g.a >= 0 && g.a <= 1, `${at}: an alpha in range`).toBe(true);
  }
  for (const q of p.people) {
    expect(q.cx - q.r, `${at}: a person off the left`).toBeGreaterThanOrEqual(PAD);
    expect(q.cy - q.r, `${at}: a person off the top`).toBeGreaterThanOrEqual(PAD);
    expect(q.cx + q.r, `${at}: a person off the right`).toBeLessThanOrEqual(PARTICLE_VB.w - PAD);
    expect(q.cy + q.r, `${at}: a person off the bottom`).toBeLessThanOrEqual(PARTICLE_VB.h - PAD);
  }
}

const KINDS: readonly CrewOutput[] = [
  { kind: "field", count: 700 },
  { kind: "field", count: 37 },
  { kind: "funnel", lines: 12 },
  { kind: "funnel", lines: 1 },
  { kind: "tenfold" },
  { kind: "split", parts: 6 },
  { kind: "split", parts: 1 },
];

describe("the crew's particles (ADR-153 U5)", () => {
  it("the field draws exactly its count, and nothing else", () => {
    for (const count of [1, 37, 700, 1000]) {
      const p = crewParticles({ kind: "field", count }, crewSeed("assets"));
      expect(p.grains.length, `field ${count}`).toBe(count);
      expect(p.people.length, `field ${count}: no person on a count`).toBe(0);
      expect(p.traces.length, `field ${count}: no structure`).toBe(0);
    }
  });

  it("a person is a person and nothing else: one where one checks, none on a count", () => {
    expect(crewParticles({ kind: "funnel", lines: 12 }, 1).people.length).toBe(1);
    expect(crewParticles({ kind: "tenfold" }, 1).people.length).toBe(1);
    expect(crewParticles({ kind: "field", count: 12 }, 1).people.length).toBe(0);
    expect(crewParticles({ kind: "split", parts: 6 }, 1).people.length).toBe(0);
  });

  it("each drawing's structure is its parameter", () => {
    const funnel = crewParticles({ kind: "funnel", lines: 12 }, 7);
    expect(funnel.traces.length, "one trace a line of copy").toBe(12);

    const tenfold = crewParticles({ kind: "tenfold" }, 7);
    // Ten reviews of twenty grains, and the four that lift the tenth.
    expect(tenfold.grains.length).toBe(10 * 20 + 4);
    expect(tenfold.traces.length).toBe(1);

    for (const parts of [1, 3, 6]) {
      const split = crewParticles({ kind: "split", parts }, 7);
      expect(split.traces.length, `split ${parts}: one stream a brief`).toBe(parts);
      // The briefs are the one larger grain at each stream's end.
      expect(split.grains.filter((g) => g.s === 4).length, `split ${parts}: briefs`).toBe(parts);
      expect(split.grains.length, `split ${parts}: the mass and the streams`).toBe(
        120 + parts * 12
      );
    }
  });

  it("the same seed is the same drawing, and a different seed a different scatter", () => {
    for (const o of KINDS) {
      expect(crewParticles(o, 42), `${o.kind}: seeded`).toEqual(crewParticles(o, 42));
    }
    expect(crewParticles({ kind: "field", count: 700 }, 1)).not.toEqual(
      crewParticles({ kind: "field", count: 700 }, 2)
    );
  });

  it("every mark stays inside the crop the lane draws", () => {
    for (const o of KINDS) {
      for (const seed of [0, 1, 42, crewSeed("assets"), crewSeed("strategy")]) {
        inCrop(crewParticles(o, seed), `${o.kind} @${seed}`);
      }
    }
  });

  it("every case-card lane on a registered page draws inside its crop", () => {
    let lanes = 0;
    for (const arc of ARCS) {
      for (const s of arc.sections) {
        if (s.kind !== "crew" || s.layout !== "case") continue;
        const seeds = s.rows.map((r) => crewSeed(r.id));
        expect(new Set(seeds).size, `${arc.slug}#${s.id}: one scatter a lane`).toBe(seeds.length);
        for (const r of s.rows) {
          lanes += 1;
          inCrop(crewParticles(r.output, crewSeed(r.id)), `${arc.slug}#${s.id}/${r.id}`);
        }
      }
    }
    expect(lanes, "the X-Bionic return's four lanes").toBeGreaterThanOrEqual(4);
  });

  it("the paths carry one subpath a grain, bucketed by alpha", () => {
    for (const o of KINDS) {
      const p = crewParticles(o, 3);
      const paths = grainPaths(p.grains);
      const subpaths = paths.reduce((n, g) => n + (g.d.match(/M/g)?.length ?? 0), 0);
      expect(subpaths, `${o.kind}: every grain drawn once`).toBe(p.grains.length);
      const alphas = paths.map((g) => g.a);
      expect(alphas, `${o.kind}: dimmest first`).toEqual([...alphas].sort((a, b) => a - b));
      expect(new Set(alphas).size, `${o.kind}: one path an alpha`).toBe(alphas.length);
    }
  });

  it("a person's diamond is one closed path", () => {
    const d = personPath({ cx: 238, cy: 50, r: 5 });
    expect(d).toBe("M238 45L243 50L238 55L233 50Z");
  });
});
