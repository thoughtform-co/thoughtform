/**
 * lib/musings/orbit — the note's cover as the About drawing, re-seated for a
 * note (ADR-122). Pure; its one import is the cover's date arithmetic.
 *
 * The owner, 2026-09-24, on the gallery lab's v13: the visual "doesn't need to
 * be inside a frame … it can be a bit more creative, like the diagrams we have
 * behind my profile, in the About section". That drawing is
 * `AboutStage.tsx:305–396` — six rings on an alternating dash ladder, a rim
 * graduated every 15° off the cardinals with a stub on each, four gold spokes,
 * a halo of dots, bodies riding the rings. Here every one of those parts is
 * the RECORD rather than an ornament (the house's law, "draw the record, not
 * the metaphor"):
 *
 *   · the GOLD TRACK (r 124) is the note's year, January at twelve o'clock,
 *     clockwise; the note is lit on it at its filing day, the year elapsed up
 *     to that day is drawn over it, and a hand runs through it;
 *   · the OUTER SOLID RING (r 172) carries the year's other notes, where the
 *     About drawing's dawn bodies rode;
 *   · the HALO is twelve dots, one a month, with the note's month lit;
 *   · the beat's mark sits where the portrait sits in About, the inner rings
 *     passing around it.
 *
 * ⚠ **THE GRAMMAR IS COPIED, NEVER IMPORTED** (ADR-106). The arcs' dial
 * (`components/arcs/steps/dialLayout.ts`) carries the same point and arc
 * helpers; a station importing an arc is a dependency pointing the wrong way,
 * so the three functions are re-typed below at this drawing's own radii.
 * ⚠ **NOTHING SPINS** (ADR-106, ADR-097 U12) — About's rotating groups are
 * static here, each a fact of the record.
 * ⚠ **NO `new Date()`** — the day comes off the string, as `yearFraction` does,
 * for the same reason (an ISO date with no zone parses as UTC and moves a day
 * west of Greenwich).
 */

import { yearFraction } from "./cover";

/** The crop's half-side. ⚠ IT CARRIES THE LABELS' ROOM: a quarter month is
 *  ~30px of mono centred on its seat, and at 240 the lab's first still printed
 *  "ICT" and "API" — the cover clips at its box. 268 seats JAN · APR · JUL ·
 *  OCT whole with the halo inside them. */
export const ORBIT_HALF = 268;
/** The rim — About's outer dotted ring, and where the graduation hangs. */
export const ORBIT_RIM = 192;
/** The gold track — the note's year. */
export const ORBIT_TRACK = 124;
/** The outer solid ring — the year's other notes. */
export const ORBIT_OUTER = 172;
/** The inner dotted ring — the hand's start, the portrait's seat in About. */
export const ORBIT_CORE = 82;
/** The spokes' outer end — About's gold dashed ring. */
export const ORBIT_SPOKE = 150;
/** The halo's radius — outside the rim, inside the quarter months. */
export const ORBIT_HALO = 208;
/** Where the quarter months are seated. */
export const ORBIT_QUARTER_R = 234;

export type OrbitInk = "line" | "line2" | "faint" | "gold" | "soft";

/** About's six rings, radius for radius. `detail` is what the thumbnail
 *  drops: it keeps the gold track and the inner ring around the mark. */
export const ORBIT_RINGS: readonly {
  r: number;
  ink: OrbitInk;
  dash?: string;
  detail: boolean;
}[] = [
  { r: ORBIT_RIM, ink: "line2", dash: "1 7", detail: true },
  { r: ORBIT_OUTER, ink: "faint", detail: true },
  { r: ORBIT_SPOKE, ink: "soft", dash: "2 8", detail: true },
  { r: ORBIT_TRACK, ink: "gold", detail: false },
  { r: 104, ink: "soft", dash: "1 3", detail: true },
  { r: ORBIT_CORE, ink: "line", dash: "1 4", detail: false },
];

/** The quarter months at the cardinals, as the About drawing's bearings. */
export const ORBIT_QUARTERS: readonly (readonly [string, number])[] = [
  ["JAN", 0],
  ["APR", 90],
  ["JUL", 180],
  ["OCT", 270],
];

const RAD = Math.PI / 180;

/** A point on a compass bearing (0° up, clockwise), at a radius. */
export function orbitPoint(deg: number, r: number): { x: number; y: number } {
  return { x: r * Math.sin(deg * RAD), y: -r * Math.cos(deg * RAD) };
}

/** A radial segment on a bearing, as a path fragment. */
export function orbitSeg(deg: number, from: number, to: number): string {
  const a = orbitPoint(deg, from);
  const b = orbitPoint(deg, to);
  return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}

/** A closed circle as two arcs from twelve o'clock — never a `<circle>`, so
 *  its start is a declared fact (the dial's own rule). */
export function orbitCirclePath(r: number): string {
  return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${r} ${r} 0 0 1 0 ${-r}`;
}

/** An arc on a radius, clockwise from one bearing to another. */
export function orbitArcPath(r: number, fromDeg: number, toDeg: number): string {
  const a = orbitPoint(fromDeg, r);
  const b = orbitPoint(toDeg, r);
  const sweep = (((toDeg - fromDeg) % 360) + 360) % 360;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
}

/** A DOM label's seat, as percentages of the square crop. */
export function orbitSeat(x: number, y: number): { left: string; top: string } {
  return {
    left: `${((x + ORBIT_HALF) / (2 * ORBIT_HALF)) * 100}%`,
    top: `${((y + ORBIT_HALF) / (2 * ORBIT_HALF)) * 100}%`,
  };
}

/** Day of the year, 1-based, off the STRING. `NaN` for an unparseable date. */
export function dayOfYear(date: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return Number.NaN;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return cum[Math.min(11, Math.max(0, month - 1))] + (leap && month > 2 ? 1 : 0) + day;
}

/** A filing date's bearing on the track: the fraction of its year, as degrees. */
export const orbitBearing = (date: string) => yearFraction(date) * 360;

/** Everything the drawing plots for one note, resolved. */
export interface OrbitSpec {
  /** The note's bearing on the gold track. */
  lit: number;
  /** The note's month, 0-based — the halo's lit dot. */
  month: number;
  /** The year's other notes, as bearings on the outer ring. */
  others: readonly number[];
  /** `DAY 257` — the designation the card prints nowhere else. */
  day: string;
  /** The year, for the other designation. */
  year: string;
}

export function orbitSpec(
  post: { slug: string; date: string },
  posts: readonly { slug: string; date: string }[]
): OrbitSpec {
  const year = post.date.slice(0, 4);
  const d = dayOfYear(post.date);
  return {
    lit: orbitBearing(post.date),
    month: Math.min(11, Math.max(0, Number(post.date.slice(5, 7)) - 1 || 0)),
    others: posts
      .filter((q) => q.slug !== post.slug && q.date.slice(0, 4) === year)
      .map((q) => orbitBearing(q.date)),
    day: Number.isFinite(d) ? `Day ${d}` : "",
    year,
  };
}
