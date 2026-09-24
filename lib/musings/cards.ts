/**
 * lib/musings/cards — the homepage list's projection (ADR-119 → ADR-122).
 * Zero imports beyond the types, so the guard can walk it and the landing does
 * not drag the registry's `fs` reader into a client chunk.
 *
 * ⚠ **THE HOMEPAGE SHOWS A WINDOW, NOT THE INDEX.** `/musings` lists every
 * post; the station is a beat in a scroll and holds a list. `MUSINGS_LIST_MAX`
 * is what the list draws, newest first, and the station's own `→ All musings`
 * link is what carries the rest.
 */
import type { MusingCardData, MusingPost } from "./types";

/**
 * ⚠ **FIVE, THE OWNER'S NUMBER** (2026-09-24: "maybe we can show more, maybe
 * 5 in total"). The list's rows are solved from the count inside the frame
 * (ADR-122): at five on the owner's 1920×1247 every row keeps a v4 title near
 * its full size with the open card whole; past that the titles shrink with
 * their rows, and at 1280×720 five already scroll inside the list. The
 * landing has three published notes today, so it shows three.
 */
export const MUSINGS_LIST_MAX = 5;

export function cardsFor(posts: readonly MusingPost[]): MusingCardData[] {
  return posts.slice(0, MUSINGS_LIST_MAX).map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    summary: p.summary,
    tags: p.tags,
    readingMinutes: p.readingMinutes,
    author: p.author,
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
