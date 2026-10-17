import type { Case, Cell, Chapter, Cut, Figure, FigureKind, Head, Still } from "./types";

/**
 * Reading a case: check it, then cut it. Pure; the tests run every case
 * through `assertCase`, and the page through `cutCase`.
 */

export const KINDS: readonly FigureKind[] = [
  "film",
  "plates",
  "pairs",
  "track",
  "exchange",
  "ledger",
  "field",
  "flow",
  "screen",
];

/** Pictures come only from folders already published with the site. */
export const ASSET_PREFIXES = ["/arcs/prompt-to-loop/", "/arcs/samako/", "/arcs/suri/"] as const;

/** The house cap on lettered elements in one drawing. */
export const LETTER_CAP = 15;

export const SHORT_MIN = 5;
export const SHORT_MAX = 6;

/** The case head options (`?head=`), the recommended one first. */
export const HEADS: readonly Head[] = ["c", "a", "b", "d"];
export const HEAD_DEFAULT: Head = "c";

/** The chapters a cut shows, in order. */
export function cutCase(c: Case, cut: Cut): Case {
  if (cut === "full") return c;
  return { ...c, chapters: c.chapters.filter((ch) => ch.short) };
}

/** Every picture a figure points at. */
export function stillsOf(f: Figure): Still[] {
  switch (f.kind) {
    case "film":
      return [
        { src: f.src, ratio: f.ratio, alt: f.alt },
        { src: f.poster, ratio: f.ratio, alt: f.alt },
      ];
    case "plates":
      return f.rows.flat().flatMap((c) => (c.kind === "still" ? [c.still] : []));
    case "pairs":
      return f.pairs.flatMap((p) => [p.sent.still, p.kept.still]);
    case "track":
      return (f.frames ?? []).map((x) => x.still);
    default:
      return [];
  }
}

function cellLetters(c: Cell): number {
  switch (c.kind) {
    case "still":
      return 1 + (c.note ? 1 : 0);
    case "list":
      return 1 + c.items.length;
    case "stat":
      return 2 + (c.note ? 1 : 0);
    case "safe":
      return 1 + 3 + (c.note ? 1 : 0);
  }
}

/**
 * How many separate lettered elements a figure draws: each label, each item,
 * each mark. A long sentence counts once; ten short tags count ten times,
 * because the eye reads them as ten things.
 */
export function letteredCount(f: Figure): number {
  switch (f.kind) {
    case "film":
      return f.facts.length + (f.sound ? 1 : 0);
    case "plates":
      return f.rows.flat().reduce((n, c) => n + cellLetters(c), 0) + (f.tags?.length ?? 0);
    case "pairs":
      return f.pairs.length * 3 + (f.reviewers?.length ?? 0);
    case "track": {
      const lanes = f.lanes.reduce(
        (n, l) => n + 1 + (l.segments ?? []).filter((s) => s.label).length + (l.marks ?? []).length,
        0
      );
      return lanes + (f.frames?.length ?? 0) + (f.key ? 1 : 0);
    }
    case "exchange":
      return (
        2 +
        (f.thought ? 1 : 0) +
        (f.question ? 1 + f.question.options.length : 0) +
        (f.answers?.rows.length ?? 0) +
        (f.result ? 1 : 0)
      );
    case "ledger":
      return (
        (f.bar?.parts.length ?? 0) +
        (f.rows?.length ?? 0) +
        (f.before ? 1 : 0) +
        (f.now ? 1 : 0) +
        (f.total ? 1 : 0)
      );
    case "field":
      return f.labels.length;
    case "flow":
      return f.stations.reduce((n, s) => n + 1 + (s.items?.length ?? 0), 0);
    case "screen": {
      const one = (x?: string) => (x ? 1 : 0);
      const tiles = (f.tiles ?? []).reduce(
        (n, t) => n + one(t.badge) + one(t.verdict) + one(t.hit),
        0
      );
      return (
        1 +
        (f.nav?.length ?? 0) +
        one(f.foot) +
        one(f.query) +
        one(f.action) +
        (f.facets?.length ?? 0) +
        one(f.status) +
        tiles +
        one(f.open) +
        one(f.pin) +
        one(f.title) +
        (f.states?.length ?? 0) +
        (f.tabs?.length ?? 0) +
        (f.lines?.length ?? 0)
      );
    }
  }
}

function fail(c: Case, where: string, what: string): never {
  throw new Error(`[case dossier] ${c.id} · ${where}: ${what}`);
}

function checkFigure(c: Case, where: string, f: Figure) {
  if (!KINDS.includes(f.kind)) fail(c, where, `unknown figure kind "${(f as Figure).kind}"`);
  for (const s of stillsOf(f)) {
    if (!ASSET_PREFIXES.some((p) => s.src.startsWith(p))) {
      fail(c, where, `picture "${s.src}" is outside the published folders`);
    }
    if (!/^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(s.ratio)) fail(c, where, `ratio "${s.ratio}"`);
  }
  const n = letteredCount(f);
  if (n > LETTER_CAP) fail(c, where, `${n} lettered elements, over the cap of ${LETTER_CAP}`);
}

function checkChapter(c: Case, ch: Chapter) {
  const where = `[${String(ch.n).padStart(2, "0")}] ${ch.id}`;
  if (ch.title.length !== 2) fail(c, where, "a title is two lines");
  if (ch.thought.length > 4) fail(c, where, "the thinking is at most four lines");
  checkFigure(c, where, ch.frame.figure);
}

/** Throws on the first fault; returns the case for chaining. */
export function assertCase(c: Case): Case {
  checkFigure(c, "opening", c.opening.figure);
  const ids = new Set<string>();
  let last = 0;
  for (const ch of c.chapters) {
    if (ids.has(ch.id)) fail(c, ch.id, "duplicate chapter id");
    ids.add(ch.id);
    if (ch.n <= last) fail(c, ch.id, "chapters are numbered in the order they happened");
    last = ch.n;
    checkChapter(c, ch);
  }
  const short = c.chapters.filter((ch) => ch.short).length;
  if (short < SHORT_MIN || short > SHORT_MAX) {
    fail(c, "short cut", `${short} chapters, not ${SHORT_MIN}–${SHORT_MAX}`);
  }
  return c;
}

/** `[04]` — the house's mono index. */
export function ordinal(n: number): string {
  return `[${String(n).padStart(2, "0")}]`;
}
