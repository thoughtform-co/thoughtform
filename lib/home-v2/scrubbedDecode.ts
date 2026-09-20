/**
 * scrubbedDecode — a set of lines typed on, or un-typed off, by SCROLL
 * POSITION (ADR-114; the Trinny turn's idiom, `turnDecode.ts`, one station
 * over, and `seamDecode.ts`'s wall).
 *
 * The house kernel's `scrambleFrame` is PURE in elapsed `t` and has no
 * latch, which is what makes a scroll-derived `t` reversible for free —
 * scrolling back re-types what scrolling on un-typed. ⚠ `advanceScrambles`
 * MAY NOT BE USED with any of these: it drops finished jobs, and a dropped
 * job is a latch nothing can unwind.
 *
 * REGISTER LAW (ArcDecodeText, ADR-103): mono chrome and the display title
 * SCRAMBLE; prose TYPES — the glyph pool is mono caps and reads as noise
 * through lowercase. So a title's lines go through `scrambleLinesOut` /
 * `scrambleLinesIn`, a paragraph through `untypeCount` / `typeCount`.
 *
 * ⚠ THE LENGTH IS WHY NOTHING MOVES. The kernel emits `" "` for every
 * character that has not started, so the string is always the target's full
 * length; the caller stacks the live leaf over a ghost that holds the box
 * (`lineLeaves`). Both halves are needed.
 */

import { scrambleDuration, scrambleFrame, type ScrambleJob } from "./captionScramble";

/** Seconds between one line starting and the next — the masthead's own
 *  title stagger, so lines land as a cascade rather than at once. */
export const LINE_STAGGER_S = 0.16;

/** The wall every line's `t` is mapped onto, so they finish TOGETHER at
 *  u = 1 however long each string is. */
function wall(finals: readonly string[], stagger: number): number {
  const longest = finals.reduce((max, f) => Math.max(max, scrambleDuration("", f)), 0);
  return longest + stagger * Math.max(0, finals.length - 1);
}

/**
 * Line `i` of a set SCRAMBLING OUT at `u` (0 = every line whole, 1 = every
 * line gone) — the decode run BACKWARDS, so the block empties the way it
 * arrived, mirrored: from the right of each line and the last line first.
 *
 * ⚠ NOT a `from: final, to: ""` job. The kernel resolves a character beyond
 * the target's length to NOTHING, so that string SHRINKS from its head as
 * its characters land and the survivors crawl left on a left-anchored leaf;
 * a title leaving that way reads as a scroll, not a decode. Reversing the
 * incoming job's time keeps every character's cell (`" "` before its window)
 * so the leaf holds its width and its left edge to the last frame.
 */
export function scrambleLinesOut(
  finals: readonly string[],
  i: number,
  u: number,
  random: () => number = Math.random
): string {
  const final = finals[i] ?? "";
  if (!final || !(u > 0)) return final;
  if (u >= 1) return "";
  return scrambleLinesIn(finals, i, 1 - u, random);
}

/**
 * Line `i` of a set SCRAMBLING IN at `u` (0 = blank, 1 = whole). First line
 * first. ⚠ Both ends are string-equal by comparison, never by asking the
 * kernel for its last frame (a floating-point bet).
 */
export function scrambleLinesIn(
  finals: readonly string[],
  i: number,
  u: number,
  random: () => number = Math.random
): string {
  const final = finals[i] ?? "";
  if (!final || !(u > 0)) return "";
  if (u >= 1) return final;
  const total = wall(finals, LINE_STAGGER_S);
  const t = u * total - i * LINE_STAGGER_S;
  if (t <= 0) return "";
  const job: Pick<ScrambleJob, "from" | "to"> = { from: "", to: final };
  return scrambleFrame(job, t, random) ?? final;
}

/** How many characters of a run of `len` still stand at `u` while it
 *  UN-TYPES from its tail (the whole run at 0, none at 1). */
export function untypeCount(len: number, u: number): number {
  if (!(u > 0)) return len;
  if (u >= 1) return 0;
  return Math.ceil(len * (1 - u));
}

/** How many characters of a run of `len` have been TYPED at `u`. */
export function typeCount(len: number, u: number): number {
  if (!(u > 0)) return 0;
  if (u >= 1) return len;
  return Math.floor(len * u);
}

/** One line's slice of a typed run: the line spans `[off, off + len)` of
 *  the run and `count` characters of the run stand. */
export function runSlice(line: string, off: number, count: number): string {
  const n = Math.max(0, Math.min(line.length, count - off));
  return line.slice(0, n);
}
