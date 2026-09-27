/**
 * horizonLayout — the geometry of THE HORIZON (ADR-130).
 *
 * Two tracks on one time axis. On the top track a person operates a tool, so
 * a person checks after every step; on the bottom an agent runs one long task
 * between a person who sets the goal and the checks and a person who judges
 * the result, passing three gates of its own. Copied BY HAND from the Moira
 * workshop's `lib/workshops/geometry.ts` §horizon (ADR-106's law: grammar
 * from another repo is copied, never imported), numbers unchanged.
 *
 * ⚠ THE MARKS ARE THE DIAL'S (ADR-106), NOT MOIRA'S PERSON GLYPH: a filled
 * node is a person's hand, an open one the model. Moira's person carried a
 * `translate()`, which no drawing on this surface may (the overlap walks
 * compare `getBBox`). The nodes are DOM, seated by fraction, so they stay 7px
 * at every scale.
 *
 * ⚠ PURE, every point absolute.
 */

export const HORIZON_VB = { w: 1200, h: 360 } as const;
export const AXIS = { x0: 170, x1: 1150, y: 330 } as const;
export const TRACK_A_Y = 96;
export const TRACK_B_Y = 236;
/** How far a run stops short of the node it meets. */
export const NODE_GAP = 14;

/** Where a fraction of the run lands on the agent's track. */
export const along = (t: number) => AXIS.x0 + t * (AXIS.x1 - AXIS.x0);

/** The operated tool's checks: one after every step, evenly along the axis. */
export const checksAt = (steps: number) =>
  Array.from({ length: steps }, (_, i) => AXIS.x0 + ((i + 1) * (AXIS.x1 - AXIS.x0)) / steps);

/** The short runs between checks on the top track. */
export function operatedRuns(steps: number): readonly { x1: number; x2: number }[] {
  const checks = checksAt(steps);
  return checks.map((cx, i) => ({
    x1: i === 0 ? AXIS.x0 : checks[i - 1] + NODE_GAP,
    x2: cx - NODE_GAP,
  }));
}

/** The agent's one run, from the first person to the last. */
export const AGENT_RUN = { x1: AXIS.x0 + 16, x2: AXIS.x1 - 16 } as const;

/** The retry's loop-back under the run: back 64 units, and its arrowhead. */
export function retryLoop(at: number): { loop: string; head: string } {
  const x = along(at);
  const y = TRACK_B_Y;
  return {
    loop: `M${x.toFixed(1)} ${y + 12} C${x.toFixed(1)} ${y + 46}, ${(x - 64).toFixed(1)} ${y + 46}, ${(x - 64).toFixed(1)} ${y + 12}`,
    head: `M${(x - 70).toFixed(1)} ${y + 21} L${(x - 64).toFixed(1)} ${y + 12} L${(x - 58).toFixed(1)} ${y + 21}`,
  };
}

/** A point as fractions of the crop. */
export function horizonFraction(x: number, y: number): { ax: number; at: number } {
  return { ax: x / HORIZON_VB.w, at: y / HORIZON_VB.h };
}
