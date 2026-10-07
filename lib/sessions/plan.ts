/**
 * lib/sessions/plan — the table, drawn from above (ADR-150).
 *
 * An architect's plan in the hairline register (`lib/voidwalker/recordMarks.ts`'s
 * rule: every 1px stroke on the half pixel, so a hairline is one device pixel
 * and never two half-lit ones). The table, eight seats around it, the host
 * at the head and ONE seat marked as the reader's. Six to eight people sit
 * at a table set for eight.
 *
 * ⚠ PURE, and the SVG letters nothing: the three labels are DOM, seated by
 * the fractions emitted here.
 */

export const PLAN_VB = { w: 320, h: 224 } as const;

export const PLAN_TABLE = { x: 72.5, y: 76.5, w: 175, h: 71 } as const;

export const PLAN_SEAT = 18;

export type SeatRole = "host" | "you" | "seat";

export interface PlanSeat {
  id: string;
  x: number;
  y: number;
  role: SeatRole;
}

const SIDE_XS = [102.5, 151.5, 200.5];

/** Eight seats: three along each long side, one at each end. The host takes
 *  the head (the left end); the reader's seat is the top row's last. */
export function planSeats(): readonly PlanSeat[] {
  const t = PLAN_TABLE;
  const top = t.y - PLAN_SEAT - 12;
  const bottom = t.y + t.h + 12;
  const midY = t.y + t.h / 2 - PLAN_SEAT / 2;
  const seats: PlanSeat[] = [
    { id: "head", x: t.x - PLAN_SEAT - 12, y: midY, role: "host" },
    ...SIDE_XS.map((x, i) => ({
      id: `top-${i}`,
      x,
      y: top,
      role: (i === 2 ? "you" : "seat") as SeatRole,
    })),
    { id: "foot", x: t.x + t.w + 12, y: midY, role: "seat" },
    ...SIDE_XS.map((x, i) => ({ id: `bottom-${i}`, x, y: bottom, role: "seat" as SeatRole })),
  ];
  return seats;
}

/** The dimension line under the table — an architect's run with two end
 *  ticks, lettered nothing. */
export function planDimension(): { x1: number; x2: number; y: number; tick: number } {
  const t = PLAN_TABLE;
  return { x1: t.x, x2: t.x + t.w, y: t.y + t.h + 50.5, tick: 6 };
}

/** A label seat as fractions of the crop. */
export function planFraction(x: number, y: number): { ax: number; at: number } {
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  return { ax: r3(x / PLAN_VB.w), at: r3(y / PLAN_VB.h) };
}
