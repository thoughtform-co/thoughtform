/**
 * captionScramble — scramble-decode text morph for the corridor
 * caption card's chrome (meta row + coord tag).
 *
 * On station change each readout TRANSFORMS into the next station's
 * text instead of hard-swapping: characters shuffle through HUD glyphs
 * and resolve left-to-right into the incoming string. Jobs are queued
 * and advanced by `CorridorStationHeaders`' RAF tick (single writer,
 * in step with everything else the loop drives). PT Mono keeps glyph
 * widths stable so the shuffle reads as a decode rather than a reflow;
 * whitespace is never scrambled so the word rhythm holds.
 *
 * Pure logic, no DOM reads beyond the job's element handle — unit
 * tested in `tests/lib/caption-scramble.test.ts` (same convention as
 * `seamPixelize`, ADR-021: kernels live in lib/, not components).
 */

/** Glyph pool the shuffle draws from — the same character family the
 *  readouts themselves use (mono caps, digits, HUD separators). */
export const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·-+";
/** Seconds until the FIRST character resolves. */
export const SCRAMBLE_LEAD_S = 0.12;
/** Additional resolve delay per character — chars land left-to-right. */
export const SCRAMBLE_STAGGER_S = 0.03;
/** How long a character shuffles before its resolve moment; before
 *  that window opens it still shows the outgoing text. */
export const SCRAMBLE_SHUFFLE_S = 0.22;

/** Minimal element contract — anything with writable/readable text.
 *  (`HTMLElement` satisfies it; tests use a plain object.) */
export interface ScrambleTarget {
  textContent: string | null;
}

export interface ScrambleJob {
  el: ScrambleTarget;
  from: string;
  to: string;
  startSec: number;
}

/** Total seconds a scramble takes for a given incoming/outgoing pair
 *  (the last character's resolve moment). */
export function scrambleDuration(from: string, to: string): number {
  const len = Math.max(from.length, to.length);
  return len === 0 ? 0 : SCRAMBLE_LEAD_S + (len - 1) * SCRAMBLE_STAGGER_S;
}

/** Queue (or re-target) a scramble for one element. An element already
 *  mid-scramble restarts FROM ITS CURRENT display text, so fast
 *  back-and-forth station changes chain naturally. Queuing the text an
 *  element already shows is a no-op (and clears any stale job). */
export function queueScramble(
  jobs: ScrambleJob[],
  el: ScrambleTarget,
  to: string,
  startSec: number
): void {
  const from = el.textContent ?? "";
  const existing = jobs.findIndex((j) => j.el === el);
  if (existing !== -1) jobs.splice(existing, 1);
  if (from === to) return;
  jobs.push({ el, from, to, startSec });
}

/** Compute the display string for one job at elapsed time `t` seconds.
 *  Exposed for tests; `advanceScrambles` is the runtime driver.
 *  Returns `null` once every character has resolved (job complete —
 *  the caller writes `job.to` and drops the job). */
export function scrambleFrame(
  job: Pick<ScrambleJob, "from" | "to">,
  t: number,
  random: () => number = Math.random
): string | null {
  const len = Math.max(job.from.length, job.to.length);
  let out = "";
  let done = true;
  for (let c = 0; c < len; c++) {
    const resolveAt = SCRAMBLE_LEAD_S + c * SCRAMBLE_STAGGER_S;
    if (t >= resolveAt) {
      out += job.to[c] ?? "";
      continue;
    }
    done = false;
    const incoming = job.to[c] ?? "";
    const outgoing = job.from[c] ?? "";
    if (t < resolveAt - SCRAMBLE_SHUFFLE_S) {
      out += outgoing || " ";
    } else if (incoming === " " || (incoming === "" && outgoing === " ")) {
      // Never scramble whitespace — the word rhythm holds.
      out += " ";
    } else {
      out += SCRAMBLE_GLYPHS[(random() * SCRAMBLE_GLYPHS.length) | 0];
    }
  }
  return done ? null : out;
}

/** Advance all in-flight scrambles to `nowSec`, writing each job's
 *  current frame to its element; finished jobs resolve to their target
 *  text and are removed. Characters beyond the incoming text's length
 *  resolve to nothing, so longer readouts contract as they decode. */
export function advanceScrambles(jobs: ScrambleJob[], nowSec: number): void {
  for (let i = jobs.length - 1; i >= 0; i--) {
    const job = jobs[i];
    if (!job) continue;
    const frame = scrambleFrame(job, nowSec - job.startSec);
    if (frame === null) {
      job.el.textContent = job.to;
      jobs.splice(i, 1);
    } else {
      job.el.textContent = frame;
    }
  }
}
