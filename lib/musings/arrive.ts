/**
 * lib/musings/arrive — the row's arrival, a BOUNDED BURST on a hysteresis
 * (ADR-121). Pure, three-free, DOM-free.
 *
 * Lifted out of ADR-119 U2's `rowMath.ts`, which is deleted with the 3D row it
 * posed: the row opens on hover now and has no geometry to compute, but the
 * cards still ARRIVE — on the corridor caption card's centre-out aperture,
 * after the head has decoded (the owner's order: _"the text should appear with
 * a glitch effect, and then the cards should come into view"_).
 *
 * ⚠ A BURST HAS A DIRECTION AND A PROGRESS VALUE DOES NOT (ADR-021's one
 * sanctioned exception). The writer decides the state ONCE per crossing with
 * this function and the sheet plays the aperture off the stamp; re-deriving
 * `in`/`out` from `p` every frame would make it a channel, and a channel
 * scrubbed by the thumb stands half-open when the thumb stops.
 *
 * ⚠ COPIED from `turnClock.ts`'s `arriveNext` — a landing component importing
 * a route module is a dependency in the wrong direction. This module is the
 * lift ADR-119 U1 named as the follow-up; the Trinny route keeps its own.
 */

/**
 * The thresholds, as fractions of the pinned travel (`--mu-dwell`, 120svh
 * since ADR-122 U1; 60svh before).
 *
 * ⚠ RE-SOLVED FOR THE SHORT DWELL (ADR-121). ADR-119 U2 opened at 0.26 of a
 * runway that grew one step per card (~100svh of travel at three posts, so
 * ~26svh into the pin); the row pins for ONE dwell of 60svh, and 0.26 of that
 * would hold the cards shut for 16svh after the head had resolved. 0.10 is 6svh
 * — the arrival is armed almost at once, and the writer's hold on the head's
 * level (~0.7s) is what actually paces it. ⚠ ADR-122 U1 DOUBLED THE DWELL, so
 * the threshold halved to keep the same 6svh (0.05 × 120), and the close rung
 * with it; 0.10 of the longer dwell would have held the notes shut for 12svh.
 *
 * ⚠ IT CLOSES AT `ROW_ARRIVE_END`, BEFORE THE HEAD LEAVES (`HEAD_LEAVE_AT`,
 * 0.965), so the exit is the entry run backwards: cards first, then the text.
 * `tests/lib/musings-row.test.ts` pins the order.
 */
export const ROW_ARRIVE_IN = 0.05;
export const ROW_ARRIVE_OUT = 0.025;
export const ROW_ARRIVE_END = 0.95;

export type RowArrive = "await" | "in" | "out";

/**
 * The next arrival state, given the last one and the station's progress.
 *
 * ⚠ NaN LEAVES THE STATE ALONE. ⚠ A DEEP RELOAD SEEDS `in`, NOT `await`.
 * ⚠ `await` IS NOT `out`: both paint nothing, but `out` plays the close and
 * `await` has never been seen — collapsing them shuts the row on the way IN.
 */
export function rowArrive(prev: RowArrive | null, p: number): RowArrive {
  const at = prev ?? "await";
  if (!Number.isFinite(p)) return at;
  if (p >= ROW_ARRIVE_END) return at === "in" ? "out" : at;
  if (p >= ROW_ARRIVE_IN) return "in";
  if (p <= ROW_ARRIVE_OUT) return at === "in" ? "out" : at;
  return at;
}
