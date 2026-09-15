/**
 * seamDecode — the carriers' two lines, decoded from the chip's words into
 * each plate's (ADR-101 §B).
 *
 * The owner ruled out a cross-dissolve on the OBJECT; the same ruling covers
 * its text, and this surface already owns the answer. `scrambleFrame` is the
 * house kernel, pure in elapsed `t`, with no internal latch — which is what
 * makes a scroll-derived `t` reversible for free. `turnDecode` is the same
 * idiom one station up; this one runs six pairs on ONE wall instead of four
 * lines on two clocks.
 *
 * ⚠ `advanceScrambles` MAY NOT BE USED HERE, for the reason `turnDecode`
 * records: it drops finished jobs, and a dropped job is a latch. Scrolling
 * back up would find nothing to unwind.
 *
 * ⚠ AND ONE WALL PER CARRIER, OVER BOTH OF ITS LINES. Each pair is a
 * different length, so per-pair timing would land `M1` while `Setup, insight
 * and briefing` is still shuffling — a band whose two lines resolve at two
 * moments reads as two effects rather than as one object arriving. The wall
 * is the LONGER pair's duration, so both lines land exactly at the end of
 * their carrier's travel, which is the frame it hands over to the real head.
 * (ADR-101 ran six pairs on one wall because its three carriers travelled at
 * once; since ADR-102 they travel one after another, each on its own window.)
 */

import { scrambleDuration, scrambleFrame, type ScrambleJob } from "@/lib/home-v2/captionScramble";

export interface SeamPair {
  from: string;
  to: string;
}

/** The wall every pair's `u` is mapped onto: the longest one's own duration. */
export function seamWall(pairs: readonly SeamPair[]): number {
  return pairs.reduce((max, p) => Math.max(max, scrambleDuration(p.from, p.to)), 0);
}

/**
 * One pair's display string at `u` (0 → 1 across the seat window).
 *
 * ⚠ THE ENDS ARE EXACT, NOT NEARLY. At `u ≤ 0` this is the chip's own word
 * and at `u ≥ 1` the plate's own — byte-equal, because those two frames are
 * the WELDS: at 0 the carrier is covering the chip and has to read as it, and
 * at 1 it is replaced by the real head and has to have arrived at its text.
 * The kernel's own last frame is the target, but asking it for one is a
 * floating-point bet; this is a string comparison instead.
 */
export function seamDecodeFrame(
  pair: SeamPair,
  u: number,
  wall: number,
  random: () => number = Math.random
): string {
  if (!(u > 0)) return pair.from;
  if (u >= 1) return pair.to;
  const job: Pick<ScrambleJob, "from" | "to"> = { from: pair.from, to: pair.to };
  return scrambleFrame(job, u * wall, random) ?? pair.to;
}

/** The share of a typed pair's window spent UN-typing the outgoing line; the
 *  rest types the incoming one. Deleting reads faster than typing (the arcs'
 *  own ratio, `arcMotion`'s `UNTYPE_CPS` against `TYPE_CHARS_PER_S`). */
export const TYPE_UNTYPE_SHARE = 0.4;

/**
 * A sentence-case pair at `u`: the outgoing line un-typed from its end, then
 * the incoming line typed from its start (ADR-103).
 *
 * ⚠ PROSE TYPES, IT NEVER SCRAMBLES — `ArcDecodeText`'s own law: the glyph
 * pool is mono caps, so a scrambled sentence reads as noise through
 * lowercase. Same contract as `seamDecodeFrame` at the ends: byte-equal to
 * `from` at `u ≤ 0` and to `to` at `u ≥ 1`, pure in `u`, reversible.
 */
export function typeFrame(from: string, to: string, u: number): string {
  const c = typeCounts(from.length, to.length, u);
  return c.keep > 0 || u <= 0 ? from.slice(0, c.keep) : to.slice(0, c.typed);
}

/**
 * How many characters of the outgoing run still stand (`keep`, from its
 * start) and how many of the incoming run have been typed (`typed`), at `u`
 * — over a WHOLE run, so a paragraph broken across lines un-types from its
 * last line up and types from its first line down as ONE typewriter, each
 * line showing its own slice of the count. `keep` is the full length at
 * `u ≤ 0`; `typed` the full length at `u ≥ 1`.
 */
export function typeCounts(
  fromLen: number,
  toLen: number,
  u: number
): { keep: number; typed: number } {
  if (!(u > 0)) return { keep: fromLen, typed: 0 };
  if (u >= 1) return { keep: 0, typed: toLen };
  if (u < TYPE_UNTYPE_SHARE) {
    return { keep: Math.ceil(fromLen * (1 - u / TYPE_UNTYPE_SHARE)), typed: 0 };
  }
  return {
    keep: 0,
    typed: Math.floor(toLen * ((u - TYPE_UNTYPE_SHARE) / (1 - TYPE_UNTYPE_SHARE))),
  };
}

/** One line's slice of a typed run: the line spans `[off, off + len)` of the
 *  run, and the count is how much of the run stands. */
export function typedSlice(line: string, off: number, count: number): string {
  const n = Math.max(0, Math.min(line.length, count - off));
  return line.slice(0, n);
}
