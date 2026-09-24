import { describe, expect, it } from "vitest";

import {
  RECORD_MARK_GRID,
  RECORD_MARK_MAX_LINES,
  RECORD_MARKS,
  type RecordMark,
  type RecordMarkLine,
} from "@/lib/voidwalker/recordMarks";
import { VW_OUTLET_KIND } from "@/lib/voidwalker/voidwalkerData";

/**
 * The ON RECORD thumbnails (ADR-082 U43) — the hairline register held clause
 * by clause, the way `era-marks.test.ts` holds the facts' pixel marks.
 *
 * ⚠ A GUARD IS NOT A CONTACT SHEET. Every clause below can pass on a drawing
 * that reads as the wrong thing — the magazine's four pixel cuts did — so a
 * change to a mark is re-judged on `scripts/capture-record-marks.mjs`'s
 * unlabelled sheet before it ships. What this file stops is the drawing that
 * is soft or illegal by construction: an axis line off the half pixel (a 2px
 * grey smear), a diagonal that is not 45°, a stroke past the grid, more than
 * one signal, or two kinds that are one drawing.
 */
const KINDS = ["newspaper", "magazine", "broadcast"] as const;

const EPS = 1e-9;
const isInt = (v: number) => Math.abs(v - Math.round(v)) < EPS;
const isHalf = (v: number) => Math.abs(v - Math.floor(v) - 0.5) < EPS;
const inGrid = (v: number) => v >= 0 && v <= RECORD_MARK_GRID;
const lineKey = (l: RecordMarkLine) => l.join(",");
const drawing = (m: RecordMark) =>
  [...m.lines.map(lineKey), `sig ${m.signal.x},${m.signal.y},${m.signal.w},${m.signal.h}`]
    .sort()
    .join(" ");

describe("ADR-082 U43 · the record marks", () => {
  it("draws exactly the three kinds the record names, and every outlet has one", () => {
    expect(Object.keys(RECORD_MARKS).sort()).toEqual([...KINDS].sort());
    // `RecordMarkKind` is a string union in a zero-import module; this is the
    // pin that keeps it equal to the record's own kinds.
    expect(new Set(Object.values(VW_OUTLET_KIND))).toEqual(new Set(KINDS));
    for (const [outlet, kind] of Object.entries(VW_OUTLET_KIND)) {
      expect(RECORD_MARKS, `${outlet} → ${kind}`).toHaveProperty(kind);
    }
  });

  for (const kind of KINDS) {
    const m = RECORD_MARKS[kind];
    describe(kind, () => {
      it("stays inside the 21-unit grid and under the line budget", () => {
        expect(m.lines.length).toBeGreaterThan(0);
        expect(m.lines.length).toBeLessThanOrEqual(RECORD_MARK_MAX_LINES);
        for (const l of m.lines) {
          for (const v of l) expect(inGrid(v), lineKey(l)).toBe(true);
          expect(l[0] === l[2] && l[1] === l[3], `zero-length ${lineKey(l)}`).toBe(false);
        }
      });

      it("sets every axis line on the half pixel across and on whole pixels along", () => {
        for (const l of m.lines) {
          const [x1, y1, x2, y2] = l;
          if (x1 === x2) {
            // Vertical: the column is n + 0.5, the run is integer to integer.
            expect(isHalf(x1), `vertical ${lineKey(l)} off the half pixel`).toBe(true);
            expect(isInt(y1) && isInt(y2), `vertical ${lineKey(l)} ends off whole pixels`).toBe(
              true
            );
          } else if (y1 === y2) {
            expect(isHalf(y1), `horizontal ${lineKey(l)} off the half pixel`).toBe(true);
            expect(isInt(x1) && isInt(x2), `horizontal ${lineKey(l)} ends off whole pixels`).toBe(
              true
            );
          }
        }
      });

      it("draws every diagonal at 45°, ending on pixel centres", () => {
        for (const l of m.lines) {
          const [x1, y1, x2, y2] = l;
          if (x1 === x2 || y1 === y2) continue;
          expect(Math.abs(x2 - x1), `diagonal ${lineKey(l)} is not 45°`).toBeCloseTo(
            Math.abs(y2 - y1),
            9
          );
          for (const v of l)
            expect(isHalf(v), `diagonal ${lineKey(l)} off a pixel centre`).toBe(true);
        }
      });

      it("carries exactly one signal, a whole-pixel rectangle inside the grid", () => {
        const s = m.signal;
        for (const v of [s.x, s.y, s.w, s.h]) expect(isInt(v)).toBe(true);
        expect(s.w).toBeGreaterThanOrEqual(2);
        expect(s.h).toBeGreaterThanOrEqual(2);
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.x + s.w).toBeLessThanOrEqual(RECORD_MARK_GRID);
        expect(s.y + s.h).toBeLessThanOrEqual(RECORD_MARK_GRID);
      });

      it("repeats no line", () => {
        const seen = m.lines.map(lineKey);
        expect(new Set(seen).size).toBe(seen.length);
      });
    });
  }

  it("no two marks are one drawing", () => {
    const sets = KINDS.map((k) => drawing(RECORD_MARKS[k]));
    expect(new Set(sets).size).toBe(sets.length);
  });
});
