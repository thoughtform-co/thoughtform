/**
 * lib/musings/headDecode — the musings head's decode, on the services
 * masthead's clock (ADR-119 U2). Pure, three-free, DOM-free.
 *
 * The owner, on the live read of U1: _"The texts, like the H1 and the
 * paragraph, shouldn't move into view. It should just appear with a glitch
 * effect, just like we have in the services section."_
 *
 * ⚠ THE HEAD WAS PINNED ALL ALONG. WHAT MOVED WAS TEXT THAT WAS NEVER BLANK.
 * U1 scrubbed the decode off the scroll position and blanked it by asking the
 * kernel for its frame at `t = 0` — but `scrambleFrame` opens each character's
 * shuffle window `SCRAMBLE_SHUFFLE_S` BEFORE it resolves, so at `t = 0` the
 * first three or four characters of every run are random glyphs. The head was
 * therefore never empty: `F-ZO` / `TSJ` rode the stage up the frame on the way
 * in, rode it up again on the way out, and re-rolled on every scroll frame.
 * `headFrame` returns `""` at level 0, and that is the whole of the fix for
 * "moving into view"; the rest of this module is the services parity.
 *
 * ⚠ TIME DRIVES THE LEVEL, SCROLL ONLY DECIDES WHERE IT IS GOING. The services
 * masthead decodes on its OWN clock once the stage has parked (~0.9s, lines
 * 0.18s apart, the paragraph typing at 220 chars/s behind a 0.12s lead) — a
 * scrubbed decode resolves at the speed of the reader's thumb and stands
 * half-shuffled when the thumb stops, which is not that effect. So the writer
 * picks a target with `headTarget` and a bounded burst walks the level to it
 * (ADR-021's sanctioned exception — the aperture beside it is the same kind).
 * ⚠ AND THE LEVEL IS STILL ONE SCALAR, which is what keeps the un-type free:
 * a falling level replays the same frames backwards, so every character
 * leaves through its own cell and there is no second job to latch.
 */
import { SCRAMBLE_LEAD_S, SCRAMBLE_STAGGER_S, scrambleFrame } from "@/lib/home-v2/captionScramble";

/** Per-line start stagger, s — `ServicesMasthead`'s `TARGET_STAGGER_S`. */
export const HEAD_LINE_STAGGER_S = 0.18;
/** The paragraph's lead behind the title, s — `PARA_START_DELAY_S`. */
export const HEAD_TYPE_DELAY_S = 0.12;
/** The paragraph's typing rate — `PARA_CHARS_PER_S`. */
export const HEAD_TYPE_CPS = 220;
/** The un-type runs this much faster than the decode: leaving is a gesture,
 *  not a performance, and a reader scrolling on should not wait on it. */
export const HEAD_OUT_SPEEDUP = 2;

export type HeadMode = "scramble" | "type";

export interface HeadRun {
  text: string;
  mode: HeadMode;
  /** Stagger slot: 0 for the first title line and the chrome, 1 for the second. */
  order: number;
}

/** When a run has fully resolved, in seconds from the burst's start. */
export function headRunEnd(run: HeadRun): number {
  if (!run.text.length) return 0;
  if (run.mode === "type") return HEAD_TYPE_DELAY_S + run.text.length / HEAD_TYPE_CPS;
  return (
    run.order * HEAD_LINE_STAGGER_S + SCRAMBLE_LEAD_S + (run.text.length - 1) * SCRAMBLE_STAGGER_S
  );
}

/** The whole burst's length: the latest run's end. Level 1 is this many seconds in. */
export function headSpan(runs: readonly HeadRun[]): number {
  return runs.reduce((m, r) => Math.max(m, headRunEnd(r)), 0);
}

/**
 * How many characters of a typed run show at `t` seconds.
 *
 * ⚠ IT ROUNDS UP FROM THE FIRST NON-ZERO FRACTION, so the first character
 * appears the instant the run opens — a typewriter that stands on an empty
 * line reads as a stall, not as typing.
 */
export function typedCount(len: number, t: number): number {
  if (len <= 0) return 0;
  const f = (t - HEAD_TYPE_DELAY_S) * HEAD_TYPE_CPS;
  if (f <= 0) return 0;
  return Math.max(1, Math.min(len, Math.ceil(f)));
}

/**
 * A run's frame at `level` (0 blank → 1 whole) of a burst `span` seconds long.
 *
 * ⚠ LEVEL 0 IS THE EMPTY STRING, FOR EVERY RUN — see the module note. This is
 * the one line the regression test exists for.
 */
export function headFrame(
  run: HeadRun,
  level: number,
  span: number,
  random: () => number = Math.random
): string {
  if (!(level > 0)) return "";
  if (level >= 1) return run.text;
  const t = level * span;
  if (run.mode === "type") return run.text.slice(0, typedCount(run.text.length, t));
  const local = t - run.order * HEAD_LINE_STAGGER_S;
  if (local <= 0) return "";
  return scrambleFrame({ from: "", to: run.text }, local, random) ?? run.text;
}

/** Is this run still resolving at `level`? The CRT cursor rides the first one that is. */
export function headRunLive(run: HeadRun, level: number, span: number): boolean {
  if (!(level > 0) || level >= 1) return false;
  const t = level * span;
  const start = run.mode === "type" ? HEAD_TYPE_DELAY_S : run.order * HEAD_LINE_STAGGER_S;
  return t >= start && t < headRunEnd(run);
}

/**
 * Where the head is going, given where it was going and where the stage is.
 *
 * ⚠ NEVER SHOWN ON A MOVING STAGE. `pinned` is false while the runway does
 * not cover the frame — the stage is travelling in or out — and the answer is
 * then 0 at once; the writer also snaps the LEVEL to 0 there rather than
 * letting a burst play out on text that is moving (the masthead motion law:
 * copy never travels, never fades).
 * ⚠ ONE HYSTERESIS BAND, so a reader resting on the edge does not re-trigger
 * a 0.7s decode: in at `HEAD_REVEAL_AT`, back out below `HEAD_REARM_BELOW`.
 * ⚠ THERE IS NO EXIT AT THE BOTTOM ANY MORE (ADR-105 U4). ADR-119 U2 un-typed
 * the head at p 0.965, just before the release, so the exit was the entry
 * backwards. Since the footer rises OVER the pinned stage, the footer
 * covering the head IS the exit — un-typing first would leave the footer
 * rising over an empty frame, which is the dead space the owner named. The
 * head stays whole under the footer, and scrolling back up the footer lifts
 * off a whole head. (The writer's clock is measured over the dwell, so `p`
 * saturates at 1 through the rise.)
 */
export const HEAD_REVEAL_AT = 0.02;
export const HEAD_REARM_BELOW = 0.01;

export type HeadWant = 0 | 1;

export function headTarget(prev: HeadWant | null, p: number, pinned: boolean): HeadWant {
  if (!pinned) return 0;
  const at: HeadWant = prev ?? 0;
  if (!Number.isFinite(p)) return at;
  if (at === 1) return p < HEAD_REARM_BELOW ? 0 : 1;
  return p >= HEAD_REVEAL_AT ? 1 : 0;
}
