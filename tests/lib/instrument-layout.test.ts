import { describe, expect, it } from "vitest";

import {
  ALTITUDE_WORDS,
  ORDER_AT,
  PLUGIN_ORDER,
  STATION_PARTS,
  WORK_CARD,
  WORK_PLATE,
  WORK_SIDES,
  WORK_VB,
  plateRect,
  rectVars,
  sideOf,
  workRun,
} from "@/lib/instrument/layout";
import { ALTITUDES, PART_ORDER } from "@/lib/instrument/types";

/** The geometry's law (ADR-154): every ribbon starts on a plate's edge and
 *  ends on the card's; every altitude's order is a permutation of the six. */
describe("the instrument layout (ADR-154)", () => {
  it("the two sides are the six, in the owner's layout", () => {
    expect([...WORK_SIDES.left, ...WORK_SIDES.right]).toEqual(PART_ORDER);
    for (const id of PART_ORDER) {
      const { side, i } = sideOf(id);
      expect(WORK_SIDES[side][i]).toBe(id);
    }
  });

  it("every ribbon leaves its plate's edge and ends on the card's edge, inside the crop", () => {
    for (const id of PART_ORDER) {
      const { side, i } = sideOf(id);
      const pts = workRun(side, i);
      const plate = plateRect(side, i);
      const [x0, y0] = pts[0];
      const [xn, yn] = pts[pts.length - 1];
      expect(x0).toBe(side === "left" ? plate.x + plate.w : plate.x);
      expect(y0).toBe(plate.y + plate.h / 2);
      expect(xn).toBe(side === "left" ? WORK_CARD.x : WORK_CARD.x + WORK_CARD.w);
      expect(yn).toBeGreaterThan(WORK_CARD.y);
      expect(yn).toBeLessThan(WORK_CARD.y + WORK_CARD.h);
      for (const [x, y] of pts) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(WORK_VB.w);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(WORK_VB.h);
      }
    }
  });

  it("no two plates overlap, and none leaves the crop", () => {
    const rects = PART_ORDER.map((id) => {
      const { side, i } = sideOf(id);
      return { id, ...plateRect(side, i) };
    });
    for (const r of rects) {
      expect(r.x + r.w).toBeLessThanOrEqual(WORK_VB.w);
      expect(r.y + r.h).toBeLessThanOrEqual(WORK_VB.h);
      expect(r.w).toBe(WORK_PLATE.w);
    }
    for (let a = 0; a < rects.length; a += 1) {
      for (let b = a + 1; b < rects.length; b += 1) {
        const A = rects[a];
        const B = rects[b];
        const apart = A.x + A.w <= B.x || B.x + B.w <= A.x || A.y + A.h <= B.y || B.y + B.h <= A.y;
        expect(apart, `${A.id} × ${B.id}`).toBe(true);
      }
    }
  });

  it("every altitude's order is a permutation of the six, and every altitude has a word", () => {
    for (const a of ALTITUDES) {
      expect([...ORDER_AT[a]].sort()).toEqual([...PART_ORDER].sort());
      expect(ALTITUDE_WORDS[a]).toBeTruthy();
    }
    expect([...PLUGIN_ORDER].sort()).toEqual([...PART_ORDER].sort());
    expect(STATION_PARTS).toHaveLength(5);
    expect(new Set(STATION_PARTS).size).toBe(5);
  });

  it("rectVars are percentages of the crop", () => {
    const v = rectVars(WORK_CARD);
    expect(v["--ix"]).toBe("35.000%");
    expect(v["--iw"]).toBe("30.000%");
    expect(v["--ih"]).toBe("70.000%");
  });
});
