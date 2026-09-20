/**
 * lib/sheet/dates — lettering a date, with no locale call (ADR-114).
 *
 * `toLocaleDateString` differs between the server's ICU and the browser's,
 * which is a hydration mismatch on the first date a page prints. These
 * letter a `YYYY-MM-DD` the same way everywhere. Zero imports.
 */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** `Thursday 15 October 2026`. */
export function letterDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${day} ${d} ${MONTHS[m - 1]} ${y}`;
}

/** `15 Oct 2026` — the short form for a table cell. */
export function letterDateShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

/** `Oct 2026` for an axis tick, from `YYYY-MM`. */
export function letterMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

/** `YYYY-MM` shifted by `by` months. */
export function shiftMonth(ym: string, by: number): string {
  const [y, m] = ym.split("-").map(Number);
  const idx = y * 12 + (m - 1) + by;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

/** Months from `from` (inclusive) to `to` (inclusive), both `YYYY-MM`. */
export function monthSpan(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  for (let i = 0; i < 120 && cur <= to; i++) {
    out.push(cur);
    cur = shiftMonth(cur, 1);
  }
  return out;
}

/** Where a day sits on an axis of whole months, as a fraction 0..1. */
export function axisPosition(iso: string, from: string, to: string): number {
  const months = monthSpan(from, to);
  const ym = iso.slice(0, 7);
  const idx = months.indexOf(ym);
  if (idx < 0) return iso < from ? 0 : 1;
  const [y, m, d] = iso.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return (idx + (d - 1) / daysInMonth) / months.length;
}
