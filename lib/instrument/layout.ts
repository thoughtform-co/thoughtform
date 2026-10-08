/**
 * layout — the geometry of the instrument at every altitude (ADR-154).
 *
 * Pure, every point absolute. The WORK altitude is `questionsLayout`'s crop
 * copied, not imported: that kind retires with its guard once the instrument
 * holds its pages (ADR-070 U35), and a geometry imported from a retired file
 * is a geometry that moves when the file goes. The other altitudes are DOM
 * grids and need no points; what they share is the ORDER the parts take, so
 * a part keeps its node and the same six nodes reshuffle (`data-ins-part`).
 *
 * ⚠ A RIBBON ENDS AT A PLATE'S EDGE, NEVER UNDER IT (TUCK 0).
 */

import type { Pt } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";

import type { Altitude, PartId } from "./types";

/* ── The work altitude: the crop ─────────────────────────────────────── */

export const WORK_VB = { w: 1200, h: 600 } as const;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const WORK_PLATE = { w: 300, h: 172 } as const;
export const WORK_LEFT_X = 24;
export const WORK_RIGHT_X = WORK_VB.w - WORK_LEFT_X - WORK_PLATE.w;
export const WORK_TOPS = [16, 214, 412] as const;
export const WORK_CARD: Rect = { x: 420, y: 90, w: 360, h: 420 };
export const WORK_PORTS = [170, 300, 430] as const;
export const WORK_STUB = 12;
/** Eight conductors at pitch four: R4's ribbon. The `ribbon` knob halves it. */
export const WORK_WIRES = 8;
export const WORK_PITCH = 4;

export type Side = "left" | "right";

/** The owner's layout: three a side, top to bottom. */
export const WORK_SIDES: Record<Side, readonly PartId[]> = {
  left: ["model", "context", "evals"],
  right: ["data", "interface", "owner"],
};

export function sideOf(id: PartId): { side: Side; i: number } {
  const l = WORK_SIDES.left.indexOf(id);
  if (l >= 0) return { side: "left", i: l };
  return { side: "right", i: WORK_SIDES.right.indexOf(id) };
}

export function plateRect(side: Side, i: number): Rect {
  return {
    x: side === "left" ? WORK_LEFT_X : WORK_RIGHT_X,
    y: WORK_TOPS[i] ?? WORK_TOPS[2],
    w: WORK_PLATE.w,
    h: WORK_PLATE.h,
  };
}

/** A level stub off the plate, a 45° jog to the port, a level run to the card. */
export function workRun(side: Side, i: number): Pt[] {
  const plate = plateRect(side, i);
  const from = plate.y + plate.h / 2;
  const to = WORK_PORTS[i] ?? WORK_PORTS[2];
  const dir = side === "left" ? 1 : -1;
  const x0 = side === "left" ? plate.x + plate.w : plate.x;
  const x3 = side === "left" ? WORK_CARD.x : WORK_CARD.x + WORK_CARD.w;
  if (from === to) {
    return [
      [x0, from],
      [x3, to],
    ];
  }
  const x1 = x0 + dir * WORK_STUB;
  const x2 = x1 + dir * Math.abs(to - from);
  return [
    [x0, from],
    [x1, from],
    [x2, to],
    [x3, to],
  ];
}

/** A rect as the custom properties the stage positions a plate by. */
export function rectVars(r: Rect): Record<string, string> {
  const p = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
  return {
    "--ix": p(r.x, WORK_VB.w),
    "--iy": p(r.y, WORK_VB.h),
    "--iw": p(r.w, WORK_VB.w),
    "--ih": p(r.h, WORK_VB.h),
  };
}

/* ── The run altitude: the five stations ─────────────────────────────── */

/** Which part each station is the opening of. Chrome words live in the
 *  component (`STATION_WORDS`); the order is the record's. */
export const STATION_PARTS: readonly PartId[] = ["interface", "model", "context", "evals", "owner"];

/* ── The plugin altitude: the parts as a plugin's folders ────────────── */

/** The plugin frame's grid: the lit two first, then the rest. */
export const PLUGIN_ORDER: readonly PartId[] = [
  "context",
  "evals",
  "data",
  "owner",
  "model",
  "interface",
];

/* ── Every altitude's reading order, for the phone and for the index ─── */

export const ORDER_AT: Record<Altitude, readonly PartId[]> = {
  org: ["model", "data", "interface", "context", "evals", "owner"],
  plugin: PLUGIN_ORDER,
  work: ["context", "evals", "owner", "model", "data", "interface"],
  run: [...STATION_PARTS, "data"],
  check: ["evals", "owner", "context", "model", "data", "interface"],
};

/** The breadcrumb's words, in zoom order. */
export const ALTITUDE_WORDS: Record<Altitude, string> = {
  org: "Organisation",
  plugin: "Plugin",
  work: "Work",
  run: "Run",
  check: "Check",
};
