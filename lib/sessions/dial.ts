/**
 * lib/sessions/dial — the morning's dial (ADR-150).
 *
 * The house ring register (the About drawing's six rings on their dash
 * ladder, the graduated rim, the cardinal stubs), COPIED from
 * `components/arcs/steps/dialLayout.ts`, never imported: a register is
 * copied onto each surface that draws it (ADR-106). What is new here is the
 * reading: the dial is a CLOCK FACE of the three-hour morning, and the four
 * movements are annular sectors whose sweep IS the time each takes.
 *
 * ⚠ PURE. No React, no DOM. Every point is emitted in ABSOLUTE viewBox
 * coordinates and never as a `transform` (an overlap walk compares
 * `getBBox`, which is blind to an element's own transform).
 *
 * ⚠ THE SVG LETTERS NOTHING. Every string is a DOM label seated by the
 * `ax` / `at` fractions this module emits.
 *
 * Bearings are compass bearings: 0° is twelve o'clock, clockwise.
 */

/** The crop: square, centred on the origin, with room outside the rim for
 *  the movement labels' leaders. */
export const DIAL_VB = { x: -150, y: -150, w: 300, h: 300 } as const;

export const DIAL_RIM = 115;
export const DIAL_OUTER = 103;
export const DIAL_TRACK = 74;
export const DIAL_CORE = 49;
/** The sector band: between the two gold-soft rings either side of the track. */
export const DIAL_BAND_IN = 62;
export const DIAL_BAND_OUT = 90;
/** Where a movement's label sits, outside the rim. */
export const DIAL_LABEL_R = 134;

export type DialInk = "line" | "line2" | "tick" | "stub" | "gold" | "gold-soft";

export interface DialRing {
  id: string;
  r: number;
  ink: DialInk;
  dash?: string;
}

export interface DialSeg {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ink: DialInk;
}

/** The ring ladder, the About drawing's set on this crop; the dash rhythm
 *  alternates so no two neighbours read as a pair. */
export const DIAL_RINGS: readonly DialRing[] = [
  { id: "r1", r: DIAL_RIM, ink: "line", dash: "1 4" },
  { id: "r2", r: DIAL_OUTER, ink: "line" },
  { id: "r3", r: DIAL_BAND_OUT, ink: "gold-soft", dash: "2 5" },
  { id: "r4", r: DIAL_TRACK, ink: "gold" },
  { id: "r5", r: DIAL_BAND_IN, ink: "gold-soft", dash: "1 2" },
  { id: "r6", r: DIAL_CORE, ink: "line2", dash: "1 3" },
];

const RAD = Math.PI / 180;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function dialPoint(deg: number, r: number): { x: number; y: number } {
  return { x: r3(r * Math.sin(deg * RAD)), y: r3(-r * Math.cos(deg * RAD)) };
}

/** A point as fractions of the crop — what a DOM label is seated by. */
export function dialFraction(deg: number, r: number): { ax: number; at: number } {
  const p = dialPoint(deg, r);
  return { ax: r3((p.x - DIAL_VB.x) / DIAL_VB.w), at: r3((p.y - DIAL_VB.y) / DIAL_VB.h) };
}

function seg(id: string, deg: number, from: number, to: number, ink: DialInk): DialSeg {
  const a = dialPoint(deg, from);
  const b = dialPoint(deg, to);
  return { id, x1: a.x, y1: a.y, x2: b.x, y2: b.y, ink };
}

/** The rim's graduation. On a three-hour face an hour is 120°, so every 15°
 *  is seven and a half minutes; the three hour bearings take STUBS instead. */
export const DIAL_HOURS = [0, 120, 240] as const;

export function dialTicks(): readonly DialSeg[] {
  const out: DialSeg[] = [];
  for (let deg = 0; deg < 360; deg += 15) {
    if ((DIAL_HOURS as readonly number[]).includes(deg)) continue;
    out.push(seg(`t${deg}`, deg, DIAL_RIM, DIAL_RIM - 6, "tick"));
  }
  return out;
}

export function dialStubs(): readonly DialSeg[] {
  return DIAL_HOURS.map((deg) => seg(`s${deg}`, deg, DIAL_RIM + 4, DIAL_RIM - 12, "stub"));
}

/** A closed circle as an explicit two-arc path from twelve o'clock (never a
 *  `<circle>`, whose start point is three o'clock). */
export function dialCirclePath(r: number): string {
  return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${r} ${r} 0 0 1 0 ${-r}`;
}

/** An arc on a radius, clockwise from one bearing to another. */
export function dialArcPath(r: number, fromDeg: number, toDeg: number): string {
  const a = dialPoint(fromDeg, r);
  const b = dialPoint(toDeg, r);
  const sweep = (((toDeg - fromDeg) % 360) + 360) % 360;
  const large = sweep > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

export interface DialSector {
  id: string;
  /** Bearings, clockwise from twelve o'clock. */
  from: number;
  to: number;
  /** The annular wedge on the sector band, closed. */
  wedge: string;
  /** The wedge's outer edge on the band's outer ring — the lit arc. */
  arc: string;
  /** The hand: a radial line from the core to the rim at the sector's start. */
  hand: DialSeg;
  /** The leader from the band's outer ring to the label, at the mid bearing. */
  leader: DialSeg;
  /** The label's seat, outside the rim, as fractions of the crop. */
  label: { ax: number; at: number };
  /** Which side of the label's seat the text runs to. */
  side: "left" | "right";
}

/**
 * The four movements as sectors. `minutes` sum to the morning; each sweep is
 * its share of 360°, starting at twelve o'clock.
 */
export function dialSectors(
  movements: readonly { id: string; minutes: number }[]
): readonly DialSector[] {
  const total = movements.reduce((sum, m) => sum + m.minutes, 0);
  let at = 0;
  return movements.map((m) => {
    const from = at;
    const to = at + (m.minutes / total) * 360;
    at = to;
    const a = dialPoint(from, DIAL_BAND_OUT);
    const b = dialPoint(to, DIAL_BAND_OUT);
    const c = dialPoint(to, DIAL_BAND_IN);
    const d = dialPoint(from, DIAL_BAND_IN);
    const large = to - from > 180 ? 1 : 0;
    const wedge =
      `M ${a.x} ${a.y} A ${DIAL_BAND_OUT} ${DIAL_BAND_OUT} 0 ${large} 1 ${b.x} ${b.y} ` +
      `L ${c.x} ${c.y} A ${DIAL_BAND_IN} ${DIAL_BAND_IN} 0 ${large} 0 ${d.x} ${d.y} Z`;
    const mid = (from + to) / 2;
    return {
      id: m.id,
      from: r3(from),
      to: r3(to),
      wedge,
      arc: dialArcPath(DIAL_BAND_OUT, from, to),
      hand: seg(`h-${m.id}`, from, DIAL_CORE, DIAL_RIM, "gold"),
      leader: seg(`l-${m.id}`, mid, DIAL_BAND_OUT, DIAL_RIM + 10, "line"),
      label: dialFraction(mid, DIAL_LABEL_R),
      side: mid <= 180 ? "right" : "left",
    };
  });
}
