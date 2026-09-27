/**
 * questionsLayout — the geometry of ONE PIECE OF WORK, SIX QUESTIONS AROUND
 * IT (ADR-130).
 *
 * The Moira workshop's board (`loop-moira/lib/workshops/geometry.ts`, ADR-041
 * there), copied BY HAND and re-cut for the owner's layout: the work in the
 * middle, the model · the context · the evaluations on the left, the data ·
 * the interface · the owner on the right, each joined to the work by a
 * ribbon. The ribbons are the house's R4 bundles (eight wires at pitch 4,
 * `ribbon.ts`), drawn with 45° jogs so the top and bottom bundles converge on
 * the card rather than running parallel past it.
 *
 * ⚠ THE PLATES ARE DOM (the house's `.arc-plate`), THE SVG CARRIES ONLY THE
 * RIBBONS. The answers are sentences that wrap, and SVG `<text>` cannot; the
 * stage keeps this crop's aspect so the plates, positioned by percentage, land
 * on the wires' ends at every width.
 *
 * ⚠ A RIBBON ENDS AT A PLATE'S EDGE, NEVER UNDER IT (TUCK 0): a plate is 0.55
 * alpha in dark, so a wire tucked under it shows through.
 *
 * ⚠ PURE, every point absolute.
 */

import type { Pt } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";

export const Q_VB = { w: 1200, h: 600 } as const;

export interface QRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const Q_PLATE = { w: 300, h: 172 } as const;
export const Q_LEFT_X = 24;
export const Q_RIGHT_X = Q_VB.w - Q_LEFT_X - Q_PLATE.w;
export const Q_TOPS = [16, 214, 412] as const;
export const Q_CARD: QRect = { x: 420, y: 90, w: 360, h: 420 };
/** Where the ribbons meet the card, top to bottom, on both edges. */
export const Q_PORTS = [170, 300, 430] as const;
/** The level stub a ribbon leaves its plate on, before it jogs. */
export const Q_STUB = 12;
/** Eight conductors, four units apart — R4's ribbon. */
export const Q_WIRES = 8;
export const Q_PITCH = 4;

export type QSide = "left" | "right";

export function plateRect(side: QSide, i: number): QRect {
  return {
    x: side === "left" ? Q_LEFT_X : Q_RIGHT_X,
    y: Q_TOPS[i] ?? Q_TOPS[2],
    w: Q_PLATE.w,
    h: Q_PLATE.h,
  };
}

/**
 * The centre line from plate i on one side to the card: a level stub off the
 * plate, a 45° jog to the port's height, a level run into the card. The middle
 * plate sits on its port and runs straight.
 */
export function qRun(side: QSide, i: number): Pt[] {
  const plate = plateRect(side, i);
  const from = plate.y + plate.h / 2;
  const to = Q_PORTS[i] ?? Q_PORTS[2];
  const dir = side === "left" ? 1 : -1;
  const x0 = side === "left" ? plate.x + plate.w : plate.x;
  const x3 = side === "left" ? Q_CARD.x : Q_CARD.x + Q_CARD.w;
  if (from === to) {
    return [
      [x0, from],
      [x3, to],
    ];
  }
  const x1 = x0 + dir * Q_STUB;
  const x2 = x1 + dir * Math.abs(to - from);
  return [
    [x0, from],
    [x1, from],
    [x2, to],
    [x3, to],
  ];
}

/** A rect as the custom properties the stage positions a plate by. ⚠ Custom
 *  properties, not `left`/`top`: the phone's grid ignores them. */
export function qRectVars(r: QRect): Record<string, string> {
  const p = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
  return {
    "--qx": p(r.x, Q_VB.w),
    "--qy": p(r.y, Q_VB.h),
    "--qw": p(r.w, Q_VB.w),
    "--qh": p(r.h, Q_VB.h),
  };
}
