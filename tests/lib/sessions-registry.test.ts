import { describe, expect, it } from "vitest";

import {
  SESSIONS,
  isoDay,
  nextSession,
  sessionStatus,
  sessionsAxis,
  sessionsSorted,
} from "@/lib/sessions/registry";
import {
  axisPosition,
  letterDate,
  letterDateShort,
  monthSpan,
  shiftMonth,
} from "@/lib/sheet/dates";

/**
 * The Home sessions record (ADR-114): a first draft of four mornings the
 * owner has yet to confirm, whose STATUS is derived from the date at
 * request time and never authored. Dates are the one digit this page may
 * print; a seat count is spelled and a price never appears.
 */

describe("sessions registry (ADR-114)", () => {
  it("ids are kebab-case and unique, dates are ISO days", () => {
    const ids = SESSIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SESSIONS) {
      expect(s.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(s.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(s.date))).toBe(false);
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.title).not.toMatch(/\d/);
      expect(s.seats).toBe("six to eight");
    }
  });

  it("sorts ascending, derives status from the day, and lights the next morning", () => {
    const sorted = sessionsSorted();
    for (let i = 1; i < sorted.length; i++) expect(sorted[i - 1].date < sorted[i].date).toBe(true);
    const first = sorted[0];
    const dayBefore = new Date(Date.parse(first.date) - 86_400_000);
    const dayOf = new Date(Date.parse(first.date) + 12 * 3_600_000);
    const dayAfter = new Date(Date.parse(first.date) + 2 * 86_400_000);
    expect(sessionStatus(first, dayBefore)).toBe("upcoming");
    expect(sessionStatus(first, dayOf)).toBe("upcoming");
    expect(sessionStatus(first, dayAfter)).toBe("past");
    expect(nextSession(dayBefore).id).toBe(first.id);
    expect(nextSession(dayAfter).id).toBe(sorted[1].id);
    /* After the last morning the last one stays lit: a calendar with nothing
       lit reads as a page that failed to load. */
    const afterAll = new Date(Date.parse(sorted[sorted.length - 1].date) + 30 * 86_400_000);
    expect(nextSession(afterAll).id).toBe(sorted[sorted.length - 1].id);
    expect(isoDay(new Date("2026-10-15T23:59:00Z"))).toBe("2026-10-15");
  });

  it("the axis spans every session with a month of air on both ends", () => {
    const axis = sessionsAxis();
    expect(axis.from).toMatch(/^\d{4}-\d{2}$/);
    expect(axis.to).toMatch(/^\d{4}-\d{2}$/);
    const sorted = sessionsSorted();
    expect(axis.from < sorted[0].date.slice(0, 7)).toBe(true);
    expect(axis.to > sorted[sorted.length - 1].date.slice(0, 7)).toBe(true);
    const months = monthSpan(axis.from, axis.to);
    expect(months[0]).toBe(axis.from);
    expect(months[months.length - 1]).toBe(axis.to);
    let last = -1;
    for (const s of sorted) {
      const p = axisPosition(s.date, axis.from, axis.to);
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
      expect(p).toBeGreaterThan(last);
      last = p;
    }
  });

  it("letters a date the way a letter would", () => {
    expect(letterDate("2026-10-15")).toBe("Thursday 15 October 2026");
    expect(letterDateShort("2026-10-15")).toBe("15 Oct 2026");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});
