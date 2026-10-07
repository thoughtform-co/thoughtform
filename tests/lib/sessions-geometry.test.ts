/**
 * ADR-150 — the Home sessions page's three drawings: the dial, the ASCII
 * field and the table plan. Pure geometry, so it is checked as arithmetic.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SessionsField } from "@/components/sessions/SessionsField";
import {
  DIAL_BAND_IN,
  DIAL_BAND_OUT,
  DIAL_RINGS,
  DIAL_VB,
  dialSectors,
  dialStubs,
  dialTicks,
} from "@/lib/sessions/dial";
import { FIELD_CELL, fieldGeom, fieldSeed } from "@/lib/sessions/field";
import { MOVEMENTS, sessionsPageModel } from "@/lib/sessions/page";
import { PLAN_SEAT, PLAN_TABLE, PLAN_VB, planSeats } from "@/lib/sessions/plan";
import { sessionsSorted } from "@/lib/sessions/registry";

const NOW = new Date("2026-10-07T09:00:00Z");

const inCrop = (x: number, y: number) =>
  x >= DIAL_VB.x && x <= DIAL_VB.x + DIAL_VB.w && y >= DIAL_VB.y && y <= DIAL_VB.y + DIAL_VB.h;

describe("the dial", () => {
  const sectors = dialSectors(MOVEMENTS);

  it("divides the whole face from twelve o'clock, each sweep its share of the morning", () => {
    expect(sectors[0].from).toBe(0);
    expect(sectors[sectors.length - 1].to).toBeCloseTo(360, 6);
    const total = MOVEMENTS.reduce((n, m) => n + m.minutes, 0);
    expect(total).toBe(180); // the record's "three hours"
    sectors.forEach((s, i) => {
      if (i > 0) expect(s.from).toBeCloseTo(sectors[i - 1].to, 6);
      expect(s.to - s.from).toBeCloseTo((MOVEMENTS[i].minutes / total) * 360, 2);
    });
  });

  it("keeps the ring ladder descending and every mark inside the crop", () => {
    const rs = DIAL_RINGS.map((r) => r.r);
    expect(rs).toEqual([...rs].sort((a, b) => b - a));
    expect(DIAL_BAND_IN).toBeLessThan(DIAL_BAND_OUT);
    for (const seg of [
      ...dialTicks(),
      ...dialStubs(),
      ...sectors.flatMap((s) => [s.hand, s.leader]),
    ]) {
      expect(inCrop(seg.x1, seg.y1), seg.id).toBe(true);
      expect(inCrop(seg.x2, seg.y2), seg.id).toBe(true);
    }
    for (const s of sectors) {
      expect(s.label.ax).toBeGreaterThan(0);
      expect(s.label.ax).toBeLessThan(1);
      expect(s.label.at).toBeGreaterThan(0);
      expect(s.label.at).toBeLessThan(1);
      expect(s.wedge).not.toMatch(/transform|NaN/);
      expect(s.wedge.endsWith("Z")).toBe(true);
    }
  });

  it("graduates every 15° and puts a stub, not a tick, on the three hours", () => {
    expect(dialTicks()).toHaveLength(24 - 3);
    expect(dialStubs()).toHaveLength(3);
  });
});

describe("the ASCII field", () => {
  const days = sessionsSorted().map((s) => ({ id: s.id, day: s.date.slice(8, 10) }));
  const seed = fieldSeed(sessionsSorted().map((s) => s.date));

  it("is deterministic for the same calendar, and moves when the calendar does", () => {
    const a = fieldGeom(days, 0, seed);
    const b = fieldGeom(days, 0, seed);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(fieldSeed(["2026-10-15"])).not.toBe(fieldSeed(["2026-10-16"]));
  });

  it("letters no digit, and every row is the same number of cells", () => {
    const g = fieldGeom(days, 0, seed);
    for (const row of g.rows) {
      const text = row.runs.map((r) => r.text).join("");
      expect(text).not.toMatch(/\d/);
      expect(text.length).toBe(g.cols);
    }
    expect(g.vb.w).toBe(g.cols * FIELD_CELL.w);
  });

  it("draws each numeral, lights only the one asked for, and seats its label under it", () => {
    const g = fieldGeom(days, 1, seed);
    const lit = g.rows.flatMap((r) => r.runs.filter((x) => x.lit));
    const ink = g.rows.flatMap((r) => r.runs.filter((x) => x.ink && !x.lit));
    expect(lit.length).toBeGreaterThan(0);
    expect(ink.length).toBeGreaterThan(0);
    expect(g.numerals.filter((n) => n.lit).map((n) => n.id)).toEqual([days[1].id]);
    const xs = g.numerals.map((n) => n.ax);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(g.numerals.every((n) => n.foot > 0.5 && n.foot < 1)).toBe(true);
  });

  it("renders as one text node per row and stays small", () => {
    const field = sessionsPageModel(NOW).field;
    const html = renderToStaticMarkup(SessionsField({ field }));
    expect((html.match(/<text /g) ?? []).length).toBe(field.rows.length);
    expect(field.rows.length).toBeLessThanOrEqual(40);
    expect(html.length).toBeLessThan(40_960);
  });
});

describe("the table plan", () => {
  const seats = planSeats();

  it("sets eight seats around the table, the host at the head and one seat yours", () => {
    expect(seats).toHaveLength(8);
    expect(seats.filter((s) => s.role === "host")).toHaveLength(1);
    expect(seats.filter((s) => s.role === "you")).toHaveLength(1);
    const host = seats.find((s) => s.role === "host")!;
    expect(host.x + PLAN_SEAT).toBeLessThan(PLAN_TABLE.x);
  });

  it("keeps every seat inside the crop and clear of the table", () => {
    const t = PLAN_TABLE;
    for (const s of seats) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.x + PLAN_SEAT).toBeLessThanOrEqual(PLAN_VB.w);
      expect(s.y + PLAN_SEAT).toBeLessThanOrEqual(PLAN_VB.h);
      const overlaps =
        s.x < t.x + t.w && s.x + PLAN_SEAT > t.x && s.y < t.y + t.h && s.y + PLAN_SEAT > t.y;
      expect(overlaps, s.id).toBe(false);
    }
    // the hairline rule: the table's edges sit on the half pixel
    expect(t.x % 1).toBe(0.5);
    expect(t.y % 1).toBe(0.5);
  });
});
