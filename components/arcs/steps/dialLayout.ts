/**
 * dialLayout — the geometry of the outcomes' DIAL (ADR-106).
 *
 * The house's own ring register, ported to the arcs. The reference is the
 * About section's orbit drawing (`AboutStage.tsx`) and the gateway's
 * concentric armature behind the brandmark: six rings on an alternating
 * dash ladder, a graduated rim, four cardinal stubs, four radial spokes.
 * One instrument, read three ways — the packshot seated in it on stage 1,
 * the studio's production run on stage 2, the engagement's terminating arc
 * on stage 3.
 *
 * ⚠ PURE. No React, no DOM, no store. Every point is emitted in ABSOLUTE
 * viewBox coordinates and NEVER as a `transform` attribute: the smoke's
 * overlap walk compares `getBBox`, which is blind to an element's own
 * transform, so two marks are comparable only while every node is at
 * identity (`.claude/rules/arcs.md`, the board's own law).
 *
 * ⚠ THE SVG LETTERS NOTHING. Every string on this figure is a DOM label on
 * its own opaque bed, seated by the `--ax` / `--at` fractions this module
 * emits — the callout idiom `.arc-scan__callout` already ships. That is why
 * there is no declared-`measure` ladder here: ADR-100's fit discipline
 * exists because SVG `<text>` neither wraps nor reports overflow, and there
 * is no SVG text on this drawing.
 *
 * Bearings are compass bearings: 0° is up, clockwise.
 */

/** The crop. Square, centred on the origin — the celestial kit's own space. */
export const DIAL_VB = { x: -120, y: -120, w: 240, h: 240 } as const;

/** The rim (the outermost ring) and the innermost ring. */
export const DIAL_RIM = 115;
export const DIAL_CORE = 49;

/** The track the lit run travels on both figures — the solid gold ring. */
export const DIAL_TRACK = 74;

/** The track the engagement's arc runs on — one ring out from the rim's pair. */
export const DIAL_OUTER = 103;

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

/**
 * The ring ladder, scaled from the About drawing's own set (192 · 172 · 150 ·
 * 124 · 104 · 82 in a 400-unit box) onto this 240-unit crop. The dash rhythm
 * alternates so no two neighbours read as a pair.
 */
export const DIAL_RINGS: readonly DialRing[] = [
  { id: "r1", r: DIAL_RIM, ink: "line", dash: "1 4" },
  { id: "r2", r: DIAL_OUTER, ink: "line" },
  { id: "r3", r: 90, ink: "gold-soft", dash: "2 5" },
  { id: "r4", r: DIAL_TRACK, ink: "gold" },
  { id: "r5", r: 62, ink: "gold-soft", dash: "1 2" },
  { id: "r6", r: DIAL_CORE, ink: "line2", dash: "1 3" },
];

const RAD = Math.PI / 180;

/** A point on a bearing, at a radius, in viewBox coordinates. */
export function dialPoint(deg: number, r: number): { x: number; y: number } {
  return { x: r * Math.sin(deg * RAD), y: -r * Math.cos(deg * RAD) };
}

/** A point as fractions of the crop — what a DOM label is seated by. */
export function dialFraction(deg: number, r: number): { ax: number; at: number } {
  const p = dialPoint(deg, r);
  return { ax: (p.x - DIAL_VB.x) / DIAL_VB.w, at: (p.y - DIAL_VB.y) / DIAL_VB.h };
}

function seg(id: string, deg: number, from: number, to: number, ink: DialInk): DialSeg {
  const a = dialPoint(deg, from);
  const b = dialPoint(deg, to);
  return { id, x1: a.x, y1: a.y, x2: b.x, y2: b.y, ink };
}

/** The rim's graduation: every 15° off the cardinals, twenty of them. */
export function dialTicks(): readonly DialSeg[] {
  const out: DialSeg[] = [];
  for (let deg = 0; deg < 360; deg += 15) {
    if (deg % 90 === 0) continue;
    out.push(seg(`t${deg}`, deg, DIAL_RIM, DIAL_RIM - 6, "tick"));
  }
  return out;
}

/** The four cardinal stubs — longer and heavier than a tick, so the
 *  instrument reads as oriented rather than merely graduated. */
export function dialStubs(): readonly DialSeg[] {
  return [0, 90, 180, 270].map((deg) => seg(`s${deg}`, deg, DIAL_RIM, DIAL_RIM - 11, "stub"));
}

/** Four radial spokes on the diagonals, so they never sit under a stub. */
export function dialSpokes(): readonly DialSeg[] {
  return [45, 135, 225, 315].map((deg) => seg(`k${deg}`, deg, 90, DIAL_CORE, "gold-soft"));
}

/**
 * A closed circle as an explicit two-arc path, starting at twelve o'clock.
 *
 * ⚠ NOT a `<circle>`: a circle's draw-on starts at three o'clock and the only
 * way to move it is a `rotate()`, which this drawing may not carry. Emitting
 * the path is also what makes the start point a declared fact.
 */
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

/* ── Stage 2: the run ──────────────────────────────────────────────── */

export interface DialStationSeat {
  id: string;
  /** Its bearing on the track, clockwise from the top. */
  deg: number;
  /** The node's seat, as fractions of the crop. */
  ax: number;
  at: number;
  /** The label's seat — in the annulus between the spoke ring and the rim. */
  labelAx: number;
  labelAt: number;
  /** How far round the run this station sits, 0 → 1. The node opens as the
   *  run reaches it. */
  at0: number;
}

/** The label rides the annulus, clear of both the track and the graduation. */
const STATION_LABEL_R = 97;

/** Four stations, clockwise from the top. The order is the run's order. */
export function dialStations(ids: readonly string[]): readonly DialStationSeat[] {
  return ids.map((id, i) => {
    const deg = i * (360 / ids.length);
    const node = dialFraction(deg, DIAL_TRACK);
    const label = dialFraction(deg, STATION_LABEL_R);
    return {
      id,
      deg,
      ax: node.ax,
      at: node.at,
      labelAx: label.ax,
      labelAt: label.at,
      at0: i / ids.length,
    };
  });
}

/* ── Stage 3: the arc that ends ────────────────────────────────────── */

/** Where the engagement's arc opens and where it terminates. It runs through
 *  twelve o'clock and stops in the upper right, so the bare track is the
 *  larger part of the ring and reads as the deliberate absence it is. */
export const DIAL_ENGAGEMENT = { from: 292, to: 62 } as const;

export interface DialHandoverGeom {
  /** The closed inner circle: what keeps running. */
  inner: string;
  /** The engagement's arc, which terminates. */
  outer: string;
  /** The bare remainder of the outer track, drawn at the faintest rung so the
   *  arc reads as stopping ON a track rather than as a broken ring. */
  bare: string;
  /** The terminal cap: a radial stub across the track at the arc's end. */
  cap: DialSeg;
  /** The node the arc terminates at. */
  node: { ax: number; at: number };
  /** The node's label, seated just outside the track at the same bearing. */
  label: { ax: number; at: number };
  /** The engagement arc's own label, seated in the annulus at its midpoint. */
  arcLabel: { ax: number; at: number };
}

/** The bearing halfway along a clockwise sweep. */
function midBearing(from: number, to: number): number {
  const sweep = (((to - from) % 360) + 360) % 360;
  return (from + sweep / 2) % 360;
}

export function dialHandover(): DialHandoverGeom {
  const { from, to } = DIAL_ENGAGEMENT;
  return {
    inner: dialCirclePath(DIAL_TRACK),
    outer: dialArcPath(DIAL_OUTER, from, to),
    bare: dialArcPath(DIAL_OUTER, to, from),
    cap: seg("cap", to, DIAL_OUTER + 9, DIAL_OUTER - 9, "stub"),
    node: dialFraction(to, DIAL_OUTER),
    label: dialFraction(to, DIAL_OUTER),
    arcLabel: dialFraction(midBearing(from, to), 96.5),
  };
}

/* ── The guard's own reader ────────────────────────────────────────── */

/** Every point this module draws, for the fit test's containment walk. */
export function dialPoints(): readonly { id: string; x: number; y: number }[] {
  const out: { id: string; x: number; y: number }[] = [];
  for (const r of DIAL_RINGS) {
    out.push({ id: `${r.id}-n`, x: 0, y: -r.r }, { id: `${r.id}-s`, x: 0, y: r.r });
    out.push({ id: `${r.id}-e`, x: r.r, y: 0 }, { id: `${r.id}-w`, x: -r.r, y: 0 });
  }
  for (const s of [...dialTicks(), ...dialStubs(), ...dialSpokes(), dialHandover().cap]) {
    out.push({ id: `${s.id}-a`, x: s.x1, y: s.y1 }, { id: `${s.id}-b`, x: s.x2, y: s.y2 });
  }
  return out;
}
