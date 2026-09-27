/**
 * stagesLayout — the geometry of THE THREE STAGES (ADR-130).
 *
 * A prompt, a tool, an agent, standing on one floor. The Moira workshop drew
 * it as an isometric plinth floor (`loop-moira/lib/workshops/stages.ts`); the
 * owner chose the house's own register instead (2026-09-27): a graticule on
 * the dot matrix, and three machined housings — the width is how long each
 * runs without you, the height how much of the work it holds. Each is bigger
 * on both axes than the one before it, which is the whole argument, and the
 * agent's is the drawing's one gold object.
 *
 * ⚠ PURE. No React, no DOM. Every point is in ABSOLUTE viewBox units — no
 * `transform` on any node, because every overlap walk on this surface compares
 * `getBBox`, which is blind to an element's own transform.
 * ⚠ THE SVG LETTERS NOTHING. The three tags and the axis words are DOM,
 * seated by the fractions `stageFraction` emits (the dial's `--ax/--at`).
 */

export const STAGES_VB = { w: 960, h: 540 } as const;

/** The floor — the time axis every housing stands on. */
export const FLOOR_Y = 480;
/** The work axis, up the left, and where the two axes run to. */
export const AXIS_X = 60;
export const AXIS_END_X = 932;
export const AXIS_TOP_Y = 36;

/** Horizontal graticule hairlines — a quarter, a half, three quarters. */
export const GRATICULE: readonly number[] = [150, 260, 370];
/** The floor's graduation: a tick every 40 units, the dial's rim signature. */
export const TICK_PITCH = 40;
export const TICK_LEN = 6;

/** The housing's corner cut and its head band, R4's module rungs. */
export const STAGE_CUT = 12;
export const STAGE_HEAD = 36;
/** The inset every tag hangs off inside its band. */
export const STAGE_PAD = 14;

export interface StageBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Prompt, tool, agent: each wider and taller than the one before it, all
 *  standing on the floor. The gaps are equal so position reads as order. */
export const STAGE_BOXES: readonly [StageBox, StageBox, StageBox] = [
  { x: 84, y: FLOOR_Y - 130, w: 176, h: 130 },
  { x: 284, y: FLOOR_Y - 250, w: 260, h: 250 },
  { x: 568, y: FLOOR_Y - 400, w: 352, h: 400 },
];

/** A point as fractions of the crop — what a DOM label is seated by. */
export function stageFraction(x: number, y: number): { ax: number; at: number } {
  return { ax: x / STAGES_VB.w, at: y / STAGES_VB.h };
}

/** A housing's tag seat: inset from the left of its band, on its midline. */
export function stageTagSeat(i: number): { ax: number; at: number } {
  const b = STAGE_BOXES[i] ?? STAGE_BOXES[2];
  return stageFraction(b.x + STAGE_PAD, b.y + STAGE_HEAD / 2);
}

/** The floor's ticks, under the axis, from the first pitch to the last box. */
export function floorTicks(): readonly number[] {
  const out: number[] = [];
  for (let x = AXIS_X + TICK_PITCH; x <= STAGE_BOXES[2].x + STAGE_BOXES[2].w; x += TICK_PITCH) {
    out.push(x);
  }
  return out;
}

/** Every point the drawing uses, for the fit test's containment walk. */
export function stagesExtent(): readonly { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [
    { x: AXIS_X, y: AXIS_TOP_Y },
    { x: AXIS_X, y: FLOOR_Y + TICK_LEN },
    { x: AXIS_END_X, y: FLOOR_Y },
  ];
  for (const b of STAGE_BOXES) {
    pts.push({ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y + b.h });
  }
  return pts;
}
