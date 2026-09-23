/**
 * lib/musings/cards — the homepage row's projection (ADR-119 → ADR-121). Zero
 * imports beyond the types, so the guard can walk it and the landing does not
 * drag the registry's `fs` reader into a client chunk.
 *
 * ⚠ **THE HOMEPAGE SHOWS A WINDOW, NOT THE INDEX.** `/musings` lists every
 * post; the station is a beat in a scroll and holds a row. `MUSINGS_ROW_MAX`
 * is what the row draws, newest first, and the station's own `→ All musings`
 * link is what carries the rest. Raising it does not lengthen the page any
 * more (the runway is one dwell since ADR-121) — it NARROWS the open card:
 * every closed strip costs `--mu-closed + --mu-gap` of the band, so at seven
 * posts the open card has ~384px of a 1200px band and at five ~656px.
 */
import type { MusingCardData, MusingPost } from "./types";

/**
 * ⚠ **THE ROW READS BEST AT FIVE.** At three the open card is ~928px of the
 * band and the two strips beside it read as afterthoughts; at seven the open
 * card is under 400px and the row is mostly strips. Neither is a crash and no
 * guard can see either — the arithmetic is correct at every count — so it is
 * written down here. The landing has three posts today.
 */
export const MUSINGS_ROW_MAX = 7;

export function cardsFor(posts: readonly MusingPost[]): MusingCardData[] {
  return posts.slice(0, MUSINGS_ROW_MAX).map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    summary: p.summary,
    tags: p.tags,
    readingMinutes: p.readingMinutes,
  }));
}

/**
 * `14 SEP 2026` — the card's kicker.
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
