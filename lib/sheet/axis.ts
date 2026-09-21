/**
 * lib/sheet/axis — the monitor's time axis (ADR-118).
 *
 * Day-linear over WHOLE divisions: a week while the record fits in sixteen
 * of them, a month up to two years, a quarter past that. A date sits at the
 * MIDDLE of its day, so a mark filed on a Monday sits just right of that
 * Monday's division line rather than on it, and the NOW cursor is placed by
 * the same rule as every mark.
 *
 * ⚠ THE LAST DIVISION ALWAYS HOLDS TODAY (the window closes at the end of
 * today's division), which is what lets the tick row give that division's
 * label to NOW without a second collision to solve: the date the dropped
 * label would have lettered is the datum strip's `Today` reading.
 *
 * Zero runtime imports but `./dates`.
 */

import { addDays, dayNumber, letterDateShort, letterDayMonth, mondayOf } from "./dates";
import type { SheetAxisWindow } from "./types";

/** Weeks while the window holds this many or fewer. */
export const AXIS_WEEKS_MAX = 16;
/** Months while the window holds this many or fewer; quarters past it. */
export const AXIS_MONTHS_MAX = 24;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function monthStart(iso: string, by = 0): string {
  const [y, m] = iso.split("-").map(Number);
  const idx = y * 12 + (m - 1) + by;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}-01`;
}

function quarterStart(iso: string, by = 0): string {
  const [y, m] = iso.split("-").map(Number);
  return monthStart(`${y}-${String(m - ((m - 1) % 3)).padStart(2, "0")}-01`, by * 3);
}

/** `20 Jul to 27 Sep 2026`; the first year is dropped when both share it. */
function rangeLabel(from: string, to: string): string {
  const head = from.slice(0, 4) === to.slice(0, 4) ? letterDayMonth(from) : letterDateShort(from);
  return `${head} to ${letterDateShort(to)}`;
}

/** Where a day sits on a window, 0..1, at the middle of the day. */
export function atOnWindow(window: Pick<SheetAxisWindow, "from" | "to">, iso: string): number {
  const span = dayNumber(window.to) - dayNumber(window.from) + 1;
  return (dayNumber(iso) - dayNumber(window.from) + 0.5) / span;
}

/**
 * The smallest window of whole divisions that holds `first` … `last`.
 *
 * Week and month windows open one division EARLY, so the oldest mark never
 * sits on the plot's left wall where the lane names are. A quarter window
 * opens on the division that holds `first`: it is the FULL window, whose
 * `first` is already the first day of the oldest relationship's year, and a
 * lead-in there would start the record in a year it did not exist.
 */
export function axisWindow(first: string, last: string): SheetAxisWindow {
  if (last < first) throw new Error(`axisWindow: ${last} is before ${first}`);

  const weekFrom = addDays(mondayOf(first), -7);
  const weekTo = addDays(mondayOf(last), 6);
  const weeks = (dayNumber(weekTo) - dayNumber(weekFrom) + 1) / 7;
  if (weeks <= AXIS_WEEKS_MAX) {
    const starts = Array.from({ length: weeks }, (_, k) => addDays(weekFrom, 7 * k));
    return build(weekFrom, weekTo, "week", "1 week", starts, (d) => letterDayMonth(d));
  }

  const monthFrom = monthStart(first, -1);
  const monthTo = addDays(monthStart(last, 1), -1);
  const [fy, fm] = monthFrom.split("-").map(Number);
  const [ty, tm] = monthTo.split("-").map(Number);
  const months = (ty - fy) * 12 + (tm - fm) + 1;
  if (months <= AXIS_MONTHS_MAX) {
    const starts = Array.from({ length: months }, (_, k) => monthStart(monthFrom, k));
    return build(monthFrom, monthTo, "month", "1 month", starts, (d, k) => {
      const [y, m] = d.split("-").map(Number);
      return k === 0 || m === 1 ? `${MONTH_SHORT[m - 1]} ${y}` : MONTH_SHORT[m - 1];
    });
  }

  const quarterFrom = quarterStart(first);
  const quarterTo = addDays(quarterStart(last, 1), -1);
  const starts: string[] = [];
  for (let d = quarterFrom; d <= quarterTo; d = quarterStart(d, 1)) starts.push(d);
  return build(quarterFrom, quarterTo, "quarter", "1 quarter", starts, (d, k) =>
    k === 0 || d.slice(5) === "01-01" ? d.slice(0, 4) : ""
  );
}

function build(
  from: string,
  to: string,
  division: SheetAxisWindow["division"],
  divisionLabel: string,
  starts: readonly string[],
  letter: (d: string, k: number) => string
): SheetAxisWindow {
  const span = dayNumber(to) - dayNumber(from) + 1;
  return {
    from,
    to,
    division,
    divisionLabel,
    rangeLabel: rangeLabel(from, to),
    ticks: starts.map((d, k) => ({
      at: (dayNumber(d) - dayNumber(from)) / span,
      // The division that holds the window's last day gives its label to NOW.
      label: k === starts.length - 1 ? "" : letter(d, k),
    })),
  };
}

/** How many days a window holds, both ends included. */
export function windowDays(window: Pick<SheetAxisWindow, "from" | "to">): number {
  return dayNumber(window.to) - dayNumber(window.from) + 1;
}
