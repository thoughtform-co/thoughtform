/**
 * lib/musings/cards — the homepage rack's projection (ADR-119). Zero imports
 * beyond the types, so the guard can walk it and the landing does not drag
 * the registry's `fs` reader into a client chunk.
 *
 * ⚠ **THE HOMEPAGE SHOWS A WINDOW, NOT THE INDEX.** `/musings` lists every
 * post; the station is a beat in a scroll and holds a rack. `MUSINGS_RACK_MAX`
 * is what the rack draws, newest first, and the station's own `→ All musings`
 * link is what carries the rest. Raising it lengthens the station's runway by
 * `MUSINGS_STEP_SVH` per card, which is the page getting longer — a dial with
 * a cost, not a free number.
 */
import type { MusingCardData, MusingPost } from "./types";

/**
 * ⚠ **THE RACK WANTS FIVE, AND BELOW THAT IT IS NOT A RACK.** It draws the
 * front card plus two either side (`RACK_DEPTH`), so at five every seat is a
 * different post; at four the far seats show the same card twice and at three
 * a card appears on both flanks at once. That is not a crash and no guard can
 * see it — the wrap is correct arithmetic — so it is written down here.
 */
export const MUSINGS_RACK_MAX = 7;

export function cardsFor(posts: readonly MusingPost[]): MusingCardData[] {
  return posts.slice(0, MUSINGS_RACK_MAX).map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    summary: p.summary,
    tags: p.tags,
    readingMinutes: p.readingMinutes,
  }));
}

/**
 * `14 SEP 2026` — the rack's kicker.
 *
 * ⚠ FORMATTED FROM THE STRING, never through `Date`/`toLocaleDateString`: an
 * ISO date with no zone parses as UTC and renders a day earlier for anyone
 * west of Greenwich, and a locale-formatted month would differ between the
 * server render and the client's. Same trap `lib/musings/cover.ts` records
 * for the plotted mark.
 */
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function rackDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ""} ${m[1]}`;
}
