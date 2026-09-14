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
 * ⚠ AND ONE WALL FOR ALL SIX. Each pair is a different length, so per-pair
 * timing would land `M1` while `Creative operations and scaling` is still
 * shuffling — three head bands resolving at three different moments reads as
 * three separate effects rather than as one object arriving in triplicate.
 * The wall is the LONGEST pair's duration, so every line lands exactly at
 * t = 1, which is the frame the carriers hand over to the real heads.
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
