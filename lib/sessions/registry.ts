/**
 * lib/sessions — the Home sessions record (ADR-114).
 *
 * The fourth service (ADR-112): six to eight people at the owner's table in
 * Antwerp for one morning, the argument in full and then the skill by hand.
 * This module holds WHEN — the mornings on the calendar — and nothing else;
 * the copy is the services record's own (`serviceData.ts` /
 * `servicePlateData.ts`, id `guided-build`), read by `lib/sheet/home-sessions`.
 *
 * ⚠ OWNER-TO-CONFIRM (2026-09-20). No session had a date when this page was
 * built, so the four mornings below are a FIRST DRAFT — monthly, a Thursday,
 * mid-month — placed so the timeline plots something real-shaped for the first
 * read. Replace them with the real dates; nothing else on the page changes.
 *
 * ⚠ THE STATUS IS DERIVED, NEVER AUTHORED. `sessionStatus` compares a date to
 * `now`, so the page's "next morning" moves by itself and no row has to be
 * edited when a morning passes. The route revalidates daily for that reason.
 *
 * ⚠ NO PRICE, EVER. Ops prices this one per seat and money stays in the
 * proposal (the services card law, `tests/lib/services-copy.test.ts`).
 * `tests/lib/sessions-registry.test.ts` bans currency here outright. Dates ARE
 * digits, and the card-only digit ban does not extend to a page whose subject
 * is a calendar.
 *
 * One import — `shiftMonth` from `lib/sheet/dates`, itself zero-import — so
 * the sessions timeline and the arcs axis cannot disagree about a month (the
 * 2026-09-24 review found a byte-identical copy here). Nothing else.
 */

import { shiftMonth } from "@/lib/sheet/dates";

export interface Session {
  /** Kebab-case, unique — the timeline node's and the step's shared id. */
  id: string;
  /** ISO date, `YYYY-MM-DD`. The morning's day. */
  date: string;
  /** A NAME, not an aphorism (the copy law): the morning by its month. */
  title: string;
  /** The seats, in words — the card's own phrase. */
  seats: "six to eight";
}

export type SessionStatus = "upcoming" | "past";

export const SESSIONS: readonly Session[] = [
  { id: "october", date: "2026-10-15", title: "October morning", seats: "six to eight" },
  { id: "november", date: "2026-11-12", title: "November morning", seats: "six to eight" },
  { id: "december", date: "2026-12-10", title: "December morning", seats: "six to eight" },
  { id: "january", date: "2027-01-14", title: "January morning", seats: "six to eight" },
];

/** `YYYY-MM-DD` of a Date, in UTC — the record is dated in days. */
export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function sessionsSorted(): Session[] {
  return [...SESSIONS].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** A morning is past once its day has ended. */
export function sessionStatus(s: Session, now: Date): SessionStatus {
  return s.date < isoDay(now) ? "past" : "upcoming";
}

/** The next morning, or the last one when every date has passed — the page
 *  always lights one node, because a timeline with nothing lit has no reading. */
export function nextSession(now: Date): Session {
  const sorted = sessionsSorted();
  return sorted.find((s) => sessionStatus(s, now) === "upcoming") ?? sorted[sorted.length - 1];
}

/**
 * The axis the timeline plots: from the month before the first morning to the
 * month after the last, `YYYY-MM` at both ends.
 */
export function sessionsAxis(): { from: string; to: string } {
  const sorted = sessionsSorted();
  const first = sorted[0].date.slice(0, 7);
  const last = sorted[sorted.length - 1].date.slice(0, 7);
  return { from: shiftMonth(first, -1), to: shiftMonth(last, 1) };
}

export { shiftMonth };
