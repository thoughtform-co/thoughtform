/**
 * lib/musings/outline — an essay's shape, read off its own source.
 *
 * A post's record is more than its title, date and tags: it has SECTIONS, and
 * each section a length. That is what a drawing of a post can plot without
 * inventing anything — the house law is that every instrument draws a record,
 * never a metaphor ("draw the record, not the metaphor"). The musings gallery
 * lab (`/test/musings-gallery`) draws it; nothing on the landing reads it yet.
 *
 * ⚠ ZERO IMPORTS, and it takes the BODY as a string: the caller is a server
 * component holding a `MusingPost`, and only the projection it returns may
 * cross into a client chunk — `body` (every post's whole MDX source) never
 * does, the same reason `cardsFor()` exists.
 *
 * ⚠ THE SPLIT FOLLOWS WHAT THE PAGE RENDERS. `lib/musings/mdx.tsx` maps BOTH
 * `#` and `##` to the page's section heading (`sh-prose__h2`) and `###` to a
 * sub-heading, so a section starts at a `#`/`##` line and never at `###`.
 * Fenced code and `<Figure>` blocks carry no prose words.
 */

export interface MusingSection {
  /** The heading as a reader sees it (marks stripped); `null` for the lead. */
  heading: string | null;
  /** Prose words in the section, split the way the registry counts them. */
  words: number;
}

export interface MusingOutline {
  sections: readonly MusingSection[];
  /** The sum of the sections' words. */
  words: number;
}

/** The registry's own split (`registry.ts`: `body.split(/\s+/)`). */
const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** A heading's inline marks, removed: links keep their text, emphasis its words. */
const plain = (s: string) =>
  s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

const SECTION_HEADING = /^(#{1,2})\s+(.*?)\s*#*\s*$/;
const SUB_HEADING = /^#{3,6}\s+/;
const FENCE = /^\s*(```|~~~)/;
const FIGURE_OPEN = /^\s*<Figure\b/;
const FIGURE_CLOSED = /(\/>|<\/Figure>)\s*$/;

export function outlineOf(body: string): MusingOutline {
  /* ⚠ CRLF FIRST: this repo checks out with `core.autocrlf`, so a `\r` left on
     a heading line would print on every heading and break the `#*$` strip. */
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const sections: MusingSection[] = [];
  let current: MusingSection = { heading: null, words: 0 };
  let inFence = false;
  let inFigure = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (inFigure || FIGURE_OPEN.test(line)) {
      inFigure = !FIGURE_CLOSED.test(line);
      continue;
    }
    const heading = SECTION_HEADING.exec(line);
    if (heading) {
      sections.push(current);
      current = { heading: plain(heading[2]), words: 0 };
      continue;
    }
    current.words += countWords(line.replace(SUB_HEADING, ""));
  }
  sections.push(current);

  /* A lead with no prose is not a section: a post that opens on its first
     heading has nothing before it to draw. */
  const kept = sections.filter((s) => s.heading !== null || s.words > 0);
  return { sections: kept, words: kept.reduce((sum, s) => sum + s.words, 0) };
}
