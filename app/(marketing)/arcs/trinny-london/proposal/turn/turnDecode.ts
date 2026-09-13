/**
 * turnDecode — the turn's line, decoded by SCROLL POSITION (ADR-095 U1).
 *
 * The owner asked for the line to appear "like it doesn't move, but with
 * glitch text" — the site's own masthead law (type in, un-type out, at a
 * fixed position, both directions), and its own decode voice.
 *
 * So this reuses the house kernel rather than inventing a second one:
 * `lib/home-v2/captionScramble.ts`'s `scrambleFrame` is PURE in elapsed `t`
 * and has no internal latch, which is exactly what makes a scroll-derived
 * `t` reversible for free — the Voidwalker hologram's `writeScrolled` found
 * that first and this is the same idiom with a second window bolted on.
 *
 * ⚠ `advanceScrambles` MAY NOT BE USED HERE. It drops finished jobs, and a
 * dropped job is a latch: scrolling back up would find nothing to unwind.
 * Position IS the decode, in both directions.
 *
 * ⚠ AND THE LENGTH IS WHY IT DOES NOT MOVE. The kernel emits `" "` for
 * every character that has not started, so the string is always the target's
 * full length; the markup then stacks an absolutely-positioned live layer
 * over an in-flow ghost that holds the true box, so even a wider glyph run
 * cannot push the block around. Both halves are needed: the kernel keeps the
 * count, the ghost keeps the geometry.
 *
 * Pure and unit-tested — the first test of a scrubbed decode in this repo.
 */

import { scrambleDuration, scrambleFrame, type ScrambleJob } from "@/lib/home-v2/captionScramble";

/** Seconds between one line starting and the next — the masthead's own
 *  title stagger, so the four lines land as a cascade rather than at once. */
export const TURN_LINE_STAGGER_S = 0.16;
/** The un-type runs quicker than the type, and in reverse order (the arcs'
 *  ruling: the effect leaves the way it arrived, mirrored). */
export const TURN_UNTYPE_STAGGER_RATIO = 0.6;

/** The wall every line's `t` is mapped onto, so they finish TOGETHER at
 *  p = 1 however long each string is (without it a short line resolves at
 *  p 0.4 and the longest at 1). */
function wall(finals: readonly string[], to: boolean, stagger: number): number {
  const longest = finals.reduce(
    (max, f) => Math.max(max, to ? scrambleDuration("", f) : scrambleDuration(f, "")),
    0
  );
  return longest + stagger * Math.max(0, finals.length - 1);
}

/**
 * Line `i`'s display string at the beat's two clocks.
 *
 * `pIn` types the lines on; `pOut` (which only leaves 0 later in the beat)
 * dissolves them again. Both are 0 → 1 and both are pure functions of the
 * station's rect, so every intermediate state is reachable in either
 * direction of travel.
 */
export function turnDecodeFrame(
  finals: readonly string[],
  i: number,
  pIn: number,
  pOut: number,
  random: () => number = Math.random
): string {
  const final = finals[i] ?? "";
  if (!final) return final;
  const n = finals.length;

  if (pOut > 0) {
    const stagger = TURN_LINE_STAGGER_S * TURN_UNTYPE_STAGGER_RATIO;
    const total = wall(finals, false, stagger);
    // Last line first: the block empties from the bottom up.
    const rank = n - 1 - i;
    const t = pOut * total - rank * stagger;
    if (t <= 0) return final;
    const job: Pick<ScrambleJob, "from" | "to"> = { from: final, to: "" };
    return scrambleFrame(job, t, random) ?? "";
  }

  const total = wall(finals, true, TURN_LINE_STAGGER_S);
  const t = pIn * total - i * TURN_LINE_STAGGER_S;
  if (t <= 0) return "";
  const job: Pick<ScrambleJob, "from" | "to"> = { from: "", to: final };
  return scrambleFrame(job, t, random) ?? final;
}
