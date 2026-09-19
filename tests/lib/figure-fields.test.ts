import { describe, expect, it } from "vitest";

import {
  bodyFor,
  dendriteBody,
  reliefBody,
  type BodyFamily,
} from "@/lib/services-ring/figureFields";
import { FIGURE_SLOTS } from "@/lib/services-ring/serviceFigures";

const FAMILIES: readonly BodyFamily[] = ["bodies", "solids", "knots", "dendrite", "relief"];

/** A coarse sample of the band's unit space: does the body occupy any of it? */
function occupancy(field: (x: number, y: number, z: number) => number): number {
  let inside = 0;
  let total = 0;
  for (let z = -1.2; z <= 1.2; z += 0.1) {
    for (let y = -1.1; y <= 1.1; y += 0.1) {
      for (let x = -1.1; x <= 1.1; x += 0.1) {
        total++;
        if (field(x, y, z) < 0) inside++;
      }
    }
  }
  return inside / total;
}

describe("figureFields — one body library, two materials", () => {
  it("yields a body for every family and every slot, occupying some of the band and not all of it", () => {
    for (const family of FAMILIES) {
      for (const slot of FIGURE_SLOTS) {
        const body = bodyFor(family, slot);
        const share = occupancy(body.field);
        expect(share, `${family}/${slot} is empty`).toBeGreaterThan(0.002);
        expect(share, `${family}/${slot} fills the band`).toBeLessThan(0.6);
        for (const m of body.marks) {
          expect(Math.abs(m.x)).toBeLessThanOrEqual(1.05);
          expect(Math.abs(m.y)).toBeLessThanOrEqual(1.05);
          expect(m.r).toBeGreaterThan(0);
        }
      }
    }
  });

  it("falls back to the embedded body for an unknown id, never to nothing", () => {
    const a = bodyFor("solids", "advisory");
    const b = bodyFor("solids", "embedded");
    expect(occupancy(a.field)).toBeCloseTo(occupancy(b.field), 6);
  });

  it("grows the same dendrite every time — no Math.random in the rule", () => {
    for (const slot of FIGURE_SLOTS) {
      const a = dendriteBody(slot);
      const b = dendriteBody(slot);
      expect(a.marks).toEqual(b.marks);
      for (let k = 0; k < 40; k++) {
        const x = -1 + (k % 5) * 0.5;
        const y = -1 + Math.floor(k / 5) * 0.25;
        expect(a.field(x, y, 0.1)).toBeCloseTo(b.field(x, y, 0.1), 12);
      }
    }
  });

  it("keeps the dendrite and the relief in front of the face plane — a hologram never goes through its card", () => {
    for (const slot of FIGURE_SLOTS) {
      for (const body of [dendriteBody(slot), reliefBody(slot)]) {
        // Nothing of the body lives behind z = −1 (the face).
        for (let y = -1; y <= 1; y += 0.2) {
          for (let x = -1; x <= 1; x += 0.2) {
            expect(body.field(x, y, -1.12)).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });
});
