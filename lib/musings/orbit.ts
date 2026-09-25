/**
 * lib/musings/orbit — the note's cover as the field behind the owner's
 * portrait, re-seated for a note (ADR-122 → U2). Pure; its imports are the
 * cover's own date and seed arithmetic.
 *
 * The owner, 2026-09-25, on the ledger's cover: make it "less like a compass
 * and more abstract, like the diagrams behind our profile picture in the about
 * section". The first cut of this module WAS a compass and said so in its own
 * parts — a rim graduated every 15° off four cardinal stubs, four spokes on
 * those cardinals, a HAND from the core to the day, JAN · APR · JUL · OCT
 * hung round the rim, and, dead centre, a beat mark that for three notes in
 * five is literally a compass needle. Every one of those is a BEARING
 * instrument's vocabulary, and none of them is in the About drawing:
 * `AboutStage.tsx:305–396` is six rings on an alternating dash ladder with
 * small bodies riding them and a drift of dust, read behind a portrait.
 *
 * So the graduation, the spokes, the hand, the labels and the mark are gone,
 * and what is left still draws the RECORD (the house's law — draw the record,
 * not the metaphor):
 *
 *   · the SIX RINGS are About's own, radius for radius — the field, and the
 *     only thing here that is not a fact;
 *   · the ORBIT is the note's YEAR: one ellipse, tilted and flattened off the
 *     slug, so each note's cover is its own figure and two notes of one month
 *     are not one picture;
 *   · the ELAPSED ARC is how much of that year had passed when the note was
 *     filed, drawn along the orbit from its twelve o'clock, clockwise;
 *   · the BODY is the note, on its own day; the OPEN DOTS are the year's
 *     other notes on the same orbit;
 *   · the DRIFT is About's dust, seeded off the slug.
 *
 * ⚠ **THE BEAT LETTERS ON THE ROW, NOT IN THE DRAWING.** ADR-119's ruling —
 * that the Arc's three marks are proper nouns and reusing them here is
 * correct — held while the cover was the only thing that said which beat a
 * note belonged to. In the ledger the row prints `[ NAVIGATE ]` an inch to the
 * left of the drawing, so the mark was the surface's said-twice defect AND
 * its loudest compass signal at once.
 *
 * ⚠ **THE GRAMMAR IS COPIED, NEVER IMPORTED** (ADR-106). The arcs' dial
 * (`components/arcs/steps/dialLayout.ts`) carries the same point and arc
 * helpers; a station importing an arc is a dependency pointing the wrong way,
 * so they are re-typed here at this drawing's own radii.
 * ⚠ **NOTHING SPINS** (ADR-106, ADR-097 U12) — About's three rotating groups
 * are static here, each one a fact of the record.
 * ⚠ **NO `new Date()`** — every date comes off the string, through
 * `yearFraction`, for the reason that function records (an ISO date with no
 * zone parses as UTC and moves a day west of Greenwich).
 * ⚠ **NO `transform` ATTRIBUTE**: the orbit's tilt is carried by the arc
 * command's own rotation term and every other mark is drawn at its own
 * coordinates, so `getBBox` and the crop agree (the substrate lab's finding —
 * a group transform makes every child report its box in the wrong space).
 */

import { slugSeed, yearFraction } from "./cover";

/** The crop's half-side. ⚠ IT IS THE DRIFT'S ROOM, NOT A LABEL'S: this
 *  drawing letters nothing, so the only thing outside the rim is the dust. */
export const ORBIT_HALF = 210;
/** About's outermost dotted ring. */
export const ORBIT_RIM = 192;
/** About's innermost ring — the portrait's seat over there, open here. */
export const ORBIT_CORE = 82;
/** The orbit's semi-major axis. ⚠ IT SITS INSIDE THE FIELD, NOT AROUND IT: at
 *  168 its apsides landed within 4 units of About's 172 ring, so the year read
 *  as a gold lasso THROWN OVER the drawing rather than as a body orbiting
 *  inside it — and the field, which is the whole reason this register was
 *  asked for, became the background of the orbit instead of the subject. 142
 *  crosses the 124 and 104 rings and clears the 150 one. */
export const ORBIT_PATH = 142;
/** How many motes of About's dust the drift carries. */
export const ORBIT_DRIFT = 16;

export type OrbitInk = "line" | "line2" | "faint" | "gold" | "soft";

/**
 * About's six rings, radius for radius. ⚠ ALL THREE GOLD RUNGS STAY QUIET:
 * over there the only bright gold is a BODY riding a ring, and that is the
 * balance this drawing keeps — the rings are the field, the elapsed arc and
 * the note are the record.
 *
 * ⚠ **THE DASHES ARE SCALED, AND THE RADII ARE NOT.** About's ladder is
 * authored in a 400-unit crop rendered at ~400–500px, so its scale is ~1 and
 * `1 7` paints a 1px dash. This cover is a 420-unit crop in a ~190–240px box
 * — a scale of **0.45–0.57** — where the same array paints a 0.5px dash with
 * 4px of gap and the browser pays the rest in alpha: the interior rings
 * simply were not there on the first still. `DASH_K` is that scale's
 * reciprocal, rounded, and it is applied to the PITCH alone (ADR-070 U16's
 * own finding, one drawing over: a 1-unit rule paints under a device pixel
 * here, and the answer is the unit, never a second alpha).
 */
const DASH_K = 2;
const dash = (on: number, off: number) => `${on * DASH_K} ${off * DASH_K}`;

export const ORBIT_RINGS: readonly { r: number; ink: OrbitInk; dash?: string }[] = [
  { r: ORBIT_RIM, ink: "line2", dash: dash(1, 7) },
  { r: 172, ink: "faint" },
  { r: 150, ink: "soft", dash: dash(2, 8) },
  { r: 124, ink: "gold" },
  { r: 104, ink: "soft", dash: dash(1, 3) },
  { r: ORBIT_CORE, ink: "line", dash: dash(1, 4) },
];

const RAD = Math.PI / 180;

/** A point on a compass bearing (0° up, clockwise), at a radius. */
export function orbitPoint(deg: number, r: number): { x: number; y: number } {
  return { x: r * Math.sin(deg * RAD), y: -r * Math.cos(deg * RAD) };
}

/** A closed circle as two arcs from twelve o'clock — never a `<circle>`, so
 *  its start is a declared fact (the dial's own rule). */
export function orbitCirclePath(r: number): string {
  return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${r} ${r} 0 0 1 0 ${-r}`;
}

/** The note's own orbit. */
export interface OrbitEllipse {
  rx: number;
  ry: number;
  /** Degrees, the SVG arc command's own rotation term. */
  deg: number;
}

/** Rotate a point about the origin, in SVG's screen space. */
function rot(x: number, y: number, deg: number): { x: number; y: number } {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return { x: x * c - y * s, y: x * s + y * c };
}

/**
 * The orbit, seeded off the slug — the one thing on this cover that is a
 * property of the note rather than of its date.
 *
 * ⚠ **TWO SEEDS, NOT ONE.** Tilt and flattening off a single number move
 * together, so every cover would sit on one line through the family: a flat
 * orbit would always be the steep one. The second hash is the slug with a
 * separator, which `slugSeed` already makes stable across a render on the
 * server and one on the client.
 * ⚠ **AND NEITHER OF THEM IS THE DATE.** The date is drawn twice already —
 * the arc's length and the body's seat — and a third, unreadable encoding of
 * it in the shape would be the map's own said-twice defect.
 */
export function orbitEllipse(slug: string): OrbitEllipse {
  const tilt = slugSeed(slug);
  const flat = slugSeed(`${slug}·orbit`);
  return {
    rx: ORBIT_PATH,
    ry: ORBIT_PATH * (0.26 + 0.2 * flat),
    deg: -34 + 68 * tilt,
  };
}

/** A seat on the orbit at a fraction of the year — twelve o'clock is 1 Jan,
 *  the year running clockwise, then the whole figure tilted. */
export function orbitEllipsePoint(e: OrbitEllipse, f: number): { x: number; y: number } {
  const a = (f * 360 - 90) * RAD;
  return rot(e.rx * Math.cos(a), e.ry * Math.sin(a), e.deg);
}

/** The orbit, closed, as two arcs — the tilt carried by the arc command. */
export function orbitEllipsePath(e: OrbitEllipse): string {
  const a = orbitEllipsePoint(e, 0);
  const b = orbitEllipsePoint(e, 0.5);
  return (
    `M ${a.x} ${a.y} A ${e.rx} ${e.ry} ${e.deg} 0 1 ${b.x} ${b.y} ` +
    `A ${e.rx} ${e.ry} ${e.deg} 0 1 ${a.x} ${a.y}`
  );
}

/** The year elapsed: one arc from the orbit's twelve o'clock to `f`. */
export function orbitElapsedPath(e: OrbitEllipse, f: number): string {
  const a = orbitEllipsePoint(e, 0);
  const b = orbitEllipsePoint(e, f);
  return `M ${a.x} ${a.y} A ${e.rx} ${e.ry} ${e.deg} ${f > 0.5 ? 1 : 0} 1 ${b.x} ${b.y}`;
}

/** One mote of About's dust. */
export interface OrbitMote {
  x: number;
  y: number;
  r: number;
  o: number;
}

/**
 * The drift — About's halo, seeded. ⚠ **IT IS AN ANNULUS, NOT A BOX**: a
 * square scatter puts motes in the corners, where this crop has no field and
 * the eye reads them as dirt on the glass rather than as the drawing's own
 * dust. Every mote sits between the core and just outside the rim.
 */
export function orbitDrift(slug: string, n: number = ORBIT_DRIFT): OrbitMote[] {
  const out: OrbitMote[] = [];
  for (let i = 0; i < n; i++) {
    const a = slugSeed(`${slug}·a${i}`);
    const b = slugSeed(`${slug}·b${i}`);
    const p = orbitPoint(a * 360, ORBIT_CORE - 20 + b * (ORBIT_RIM + 12 - (ORBIT_CORE - 20)));
    out.push({ x: p.x, y: p.y, r: 1 + b * 1.2, o: 0.22 + a * 0.4 });
  }
  return out;
}

/** Everything the drawing plots for one note, resolved. */
export interface OrbitSpec {
  /** How far through its year the note was filed, `[0, 1]`. */
  f: number;
  /** The year's other notes, as fractions on the same orbit. */
  others: readonly number[];
  /** The note's own orbit. */
  path: OrbitEllipse;
  /** About's dust. */
  drift: readonly OrbitMote[];
}

export function orbitSpec(
  post: { slug: string; date: string },
  posts: readonly { slug: string; date: string }[]
): OrbitSpec {
  const year = post.date.slice(0, 4);
  return {
    f: yearFraction(post.date),
    others: posts
      .filter((q) => q.slug !== post.slug && q.date.slice(0, 4) === year)
      .map((q) => yearFraction(q.date)),
    path: orbitEllipse(post.slug),
    drift: orbitDrift(post.slug),
  };
}
