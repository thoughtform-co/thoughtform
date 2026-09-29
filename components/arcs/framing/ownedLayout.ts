/**
 * ownedLayout — the owned horizon's geometry (ADR-133 U2). Pure, zero-import.
 *
 * The horizon's two tracks, re-cut so the TOP track is the owner's own day:
 * three spans of upstream work, broken once where the agent asks, with the
 * owner standing at the three moments the agent reaches up (the goal, the
 * question, the result). Between the tracks, two rows of words that never
 * share a band: the handoffs (the human's green) on the upper row, the agent's
 * own gates (gold) on the lower. Everything left of `OWNED_AXIS.x0` is the
 * track names; the loop under the agent's run hangs to y 308.
 */

export const OWNED_W = 1100;
export const OWNED_H = 330;
/** The tracks' horizontal extent: everything left of `x0` is the track names.
 *  ⚠ NO TIME AXIS (U4, owner: "we don't need that"): its height went to the
 *  gap between the lanes, 152 → 190 units. */
export const OWNED_AXIS = { x0: 200, x1: 1070 } as const;
export const OWNED_TRACK_A_Y = 72;
export const OWNED_TRACK_B_Y = 262;
/** The handoffs' row, and the gates' row under it. */
export const OWNED_ROW_HAND_Y = 110;
export const OWNED_ROW_GATE_Y = 200;

export const ownedAlong = (t: number) => OWNED_AXIS.x0 + t * (OWNED_AXIS.x1 - OWNED_AXIS.x0);

/** How far a span keeps off a person standing on the line, in `t`. */
const CLEAR = 0.035;

/**
 * The owner's three spans: the day from the goal to the result, cut in three,
 * the last cut at the moment the agent asks — so the question lands BETWEEN two
 * pieces of the owner's own work, never through one.
 */
export function ownedSpans(askAt: number): { from: number; to: number }[] {
  const firstCut = askAt / 2;
  return [
    { from: CLEAR, to: firstCut - CLEAR / 2 },
    { from: firstCut + CLEAR / 2, to: askAt - CLEAR },
    { from: askAt + CLEAR, to: 1 - CLEAR },
  ];
}
