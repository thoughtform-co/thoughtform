/**
 * aboutTurnClock — the About → Arc turn on /arcs/thoughtform-workshop, as
 * pure arithmetic (ADR-137 U2).
 *
 * Owner, 2026-09-30: "flip the profile picture in the about section to then
 * reveal the brandmark gateway … the text on the left to glitch transform
 * into the text on the left of [the Arc's first frame] + the button. So
 * instead of boringly scrolling from the second to the third section, we use
 * a cool transition before we enter our arc."
 *
 * THE RUNWAY. `#about` is `100svh + DWELL + RUN` tall on the capable rung and
 * its stage is sticky, so the stage pins for DWELL + RUN of scroll. The
 * corridor mount is welded up under the station's last viewport by WELD, so
 * the About unpins on exactly the frame the corridor pins (mount top 0), and
 * the corridor is ARMED — painting its parked frame at paintProgress 0 — for
 * the whole of RUN. That is why `WELD === RUN`: the destination this turn
 * lands on is only measurable while the corridor is armed, and the corridor
 * is armed only while its mount's top is inside the viewport, which is one
 * viewport of scroll.
 *
 * ⚠ THE CSS DECLARES THE SAME THREE NUMBERS (`--tw-turn-dwell` /
 * `--tw-turn-run` / `--tw-turn-weld` in thoughtform-workshop.css) and the
 * CSS is the one that must exist before hydration. The lockstep test pins
 * them equal.
 *
 * Every channel below is a pure function of `u`, which is a pure function of
 * `#about`'s rect, so scrolling back unwinds the turn exactly. No clock, no
 * latch.
 */

/** Pinned scroll spent reading the bio before anything moves (owner: "a
 *  short read first"), in svh. */
export const TURN_DWELL_SVH = 50;
/** Pinned scroll the turn itself takes, in svh. */
export const TURN_RUN_SVH = 100;
/** How far the corridor mount is pulled up under `#about`, in svh. It MUST
 *  equal the run: see the header. */
export const TURN_WELD_SVH = TURN_RUN_SVH;

/** A window of the turn clock `[start, end]`. */
export type TurnWindow = readonly [number, number];

/** The bio, the name, the role and the fact row leave. */
export const A_OUT: TurnWindow = [0, 0.3];
/** The fact row and the links close on the centre-out aperture, inside A_OUT. */
export const A_BOX_OUT: TurnWindow = [0.05, 0.3];
/** The orbit's small SVG lettering (bearings, edge notes) scrambles out. */
export const SVG_TEXT_OUT: TurnWindow = [0.08, 0.28];
/** The portrait turns 0° → 90°, edge-on. */
export const FLIP_FRONT: TurnWindow = [0.15, 0.3];
/** The brandmark on the card's back turns −90° → the live mark's tilt and
 *  settles onto the live mark's rect. */
export const FLIP_BACK: TurnWindow = [0.3, 0.5];
/** The particle halo gathers into the mark's centre, turning as it goes. */
export const PARTICLES_IN: TurnWindow = [0.1, 0.4];

/* ── The diagram morph (ADR-137 U3) ────────────────────────────────────
   The About orbit's drawing BECOMES the compass gate: four rings square up
   into the gate's four portal loops (turning as they go), the two left over
   and the spokes draw in to the mark's centre, the ticks slide onto the
   gate's bearings, the orbit nodes spiral onto its phase and orbit dots,
   the corner readouts decode into NAVIGATE · ENCODE · BUILD, and the
   connectors draw on. Everything lands before the ground opens, because the
   opening is the seam where the drawing hands over to the live gate. */
export const RINGS_MORPH: TurnWindow = [0.2, 0.6];
export const CORE_IN: TurnWindow = [0.2, 0.45];
export const TICKS_MORPH: TurnWindow = [0.2, 0.58];
export const NODES_MORPH: TurnWindow = [0.22, 0.6];
export const LABELS_GLIDE: TurnWindow = [0.3, 0.6];
export const CONNECTORS_DRAW: TurnWindow = [0.58, 0.64];
/** The orbit has nothing left to show from here: the card is edge-on, the
 *  halo gathered, the lettering gone, the drawing handed to the morph. */
export const ORBIT_OUT_AT = 0.4;

/** The square aperture in About's ground opens from the mark's centre —
 *  and it is the SEAM: the morphed drawing shows outside it, the live gate
 *  inside it, so the hand-over sweeps out with the opening. */
export const GATE_OPEN: TurnWindow = [0.64, 0.9];
/** The thesis title scrambles in on the live copy's own lines. */
export const B_TITLE_IN: TurnWindow = [0.35, 0.65];
/** The two thesis paragraphs type in. */
export const B_BODY_IN: TurnWindow = [0.5, 0.8];
/** The live "Enter the arc" button opens on the centre-out aperture, once
 *  the opening has passed it. */
export const CTA_OPEN: TurnWindow = [0.82, 0.93];
/** From here every stand-in is identical to what it stands for, and the
 *  live frame takes over. */
export const HANDOFF_AT = 0.96;

export type TurnState = "hold" | "run" | "done";

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);

/** ADR-097 U12's curve: exactly half-way at the midpoint, readable end to end. */
export function easeInOutCubic(x: number): number {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Linear progress through a window, clamped. */
export function windowOf(u: number, [a, b]: TurnWindow): number {
  if (!(b > a)) return u >= b ? 1 : 0;
  return clamp01((u - a) / (b - a));
}

/** Eased progress through a window. */
export function easedWindow(u: number, w: TurnWindow): number {
  return easeInOutCubic(windowOf(u, w));
}

/**
 * The turn clock from `#about`'s viewport top. `vh` is the layout viewport
 * (svh on a desktop, where the three units agree). Unclamped below 0 and
 * above 1 so the state can tell the dwell from the run.
 */
export function turnU(aboutTop: number, vh: number): number {
  if (!(vh > 0)) return 0;
  const pinned = -aboutTop;
  const dwell = (TURN_DWELL_SVH / 100) * vh;
  const run = (TURN_RUN_SVH / 100) * vh;
  return (pinned - dwell) / run;
}

export function turnState(u: number): TurnState {
  if (!(u > 0)) return "hold";
  return u >= HANDOFF_AT ? "done" : "run";
}

/** The portrait's front-half turn, degrees (0 → 90). */
export function flipFrontDeg(u: number): number {
  return 90 * easedWindow(u, FLIP_FRONT);
}

/** The back face's turn, degrees: −90 (edge-on) → `restDeg`, the live mark's
 *  own Y tilt, so the stand-in lands on the live mark's pose, not on zero. */
export function flipBackDeg(u: number, restDeg: number): number {
  const e = easedWindow(u, FLIP_BACK);
  return -90 + (restDeg + 90) * e;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Linear interpolation between two rects. */
export function lerpRect(a: Rect, b: Rect, e: number): Rect {
  const t = clamp01(e);
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    w: a.w + (b.w - a.w) * t,
    h: a.h + (b.h - a.h) * t,
  };
}

/**
 * Where the back face starts: a square the portrait's HEIGHT on a side,
 * centred on the portrait. At −90° the face is a vertical line, so what the
 * eye carries over from the front is the card's height at its centre; a
 * square of that height continues it exactly.
 */
export function backFaceStart(portrait: Rect): Rect {
  const side = portrait.h;
  return {
    x: portrait.x + portrait.w / 2 - side / 2,
    y: portrait.y + portrait.h / 2 - side / 2,
    w: side,
    h: side,
  };
}

/**
 * The half-size a square aperture centred on `(cx, cy)` needs to clear a
 * `w × h` frame — its Chebyshev distance to the farthest corner, plus a
 * margin so the edge is off-frame at 1, never on it.
 */
export function gateHalfMax(cx: number, cy: number, w: number, h: number, margin = 8): number {
  return Math.max(cx, w - cx, cy, h - cy) + margin;
}

/** The aperture's half-size at `u`. */
export function gateHalf(u: number, max: number): number {
  return max * easedWindow(u, GATE_OPEN);
}

/** A centre-out aperture's open fraction → the `inset()` side, in percent
 *  (50 = shut to a centre slit, 0 = open). */
export function apertureInset(open: number): number {
  return 50 * (1 - clamp01(open));
}

/* ── Morph geometry (pure) ─────────────────────────────────────────── */

export type Pt = readonly [number, number];

/** The shortest signed turn from `a` to `b`, radians, in (−π, π]. */
export function angleDelta(a: number, b: number): number {
  let d = (b - a) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * One point travelling on a SPIRAL from `p0` (around centre `c0`) to `p1`
 * (around centre `c1`): the centre glides, and the point's radius and angle
 * about it interpolate, so the drawing turns and scales rather than
 * straight-lining across the frame. `twist` is extra turn the point carries
 * at the start and sheds by the end. Exact at both ends: `e = 1` returns
 * `p1` to the float.
 */
export function spiralPoint(
  c0: Pt,
  p0: Pt,
  c1: Pt,
  p1: Pt,
  e: number,
  twist = 0
): [number, number] {
  if (e <= 0) return [p0[0], p0[1]];
  if (e >= 1) return [p1[0], p1[1]];
  const r0 = Math.hypot(p0[0] - c0[0], p0[1] - c0[1]);
  const r1 = Math.hypot(p1[0] - c1[0], p1[1] - c1[1]);
  const a1 = Math.atan2(p1[1] - c1[1], p1[0] - c1[0]);
  const a0 = r0 > 1e-6 ? Math.atan2(p0[1] - c0[1], p0[0] - c0[0]) : a1;
  const a = a0 + (angleDelta(a0, a1) + twist) * e - twist * e * e;
  const r = r0 + (r1 - r0) * e;
  const cx = c0[0] + (c1[0] - c0[0]) * e;
  const cy = c0[1] + (c1[1] - c0[1]) * e;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/**
 * A quad's perimeter (TL, TR, BR, BL as 8 numbers) sampled `perEdge` points
 * an edge, clockwise on screen FROM THE TOP-LEFT CORNER — the order and the
 * start the gate's WebGL loop draws in, so a dash pattern laid along this
 * path starts where the gate's does.
 */
export function sampleQuad(q: readonly number[], perEdge: number): [number, number][] {
  const out: [number, number][] = [];
  for (let e = 0; e < 4; e++) {
    const ax = q[e * 2]!;
    const ay = q[e * 2 + 1]!;
    const bx = q[((e + 1) % 4) * 2]!;
    const by = q[((e + 1) % 4) * 2 + 1]!;
    for (let i = 0; i < perEdge; i++) {
      const t = i / perEdge;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
    }
  }
  return out;
}

/** The centre of a quad of 8 numbers. */
export function quadCentre(q: readonly number[]): [number, number] {
  return [(q[0]! + q[2]! + q[4]! + q[6]!) / 4, (q[1]! + q[3]! + q[5]! + q[7]!) / 4];
}

/**
 * The circle the ring starts as, sampled at the SAME angles (about its own
 * centre) as each end point sits about the quad's centre — so point k of the
 * circle is the point that becomes point k of the square, and the morph is a
 * pure radial squaring, never a crossing.
 */
export function circleAtAngles(
  centre: Pt,
  radius: number,
  ends: readonly Pt[],
  endCentre: Pt,
  twist = 0
): [number, number][] {
  return ends.map((p) => {
    /* `twist` sets the circle's points that much BEHIND their square
       counterparts, so the ring turns forward by exactly `twist` as it
       squares up — invisible at the start, where a circle is symmetric. */
    const a = Math.atan2(p[1] - endCentre[1], p[0] - endCentre[0]) - twist;
    return [centre[0] + radius * Math.cos(a), centre[1] + radius * Math.sin(a)];
  });
}

/** A closed polyline as an SVG path `d`. */
export function closedPath(points: readonly Pt[]): string {
  if (!points.length) return "";
  let d = `M${points[0]![0].toFixed(2)} ${points[0]![1].toFixed(2)}`;
  for (let i = 1; i < points.length; i++)
    d += `L${points[i]![0].toFixed(2)} ${points[i]![1].toFixed(2)}`;
  return `${d}Z`;
}

/**
 * The same closed polyline, re-started `frac` of the way round its own
 * perimeter (a point inserted there). A dashed loop's pattern restarts at its
 * start, so moving the start moves the one place its dashes wrap — which is
 * how a ring can carry an SVG circle's seam (3 o'clock) at the start of the
 * morph and the gate's seam (its top-left corner) at the end.
 */
export function reseat(points: readonly Pt[], frac: number): [number, number][] {
  const n = points.length;
  if (n < 2) return points.map((p) => [p[0], p[1]]);
  const f = ((frac % 1) + 1) % 1;
  const cum: number[] = [0];
  for (let i = 0; i < n; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    cum.push(cum[i]! + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const target = f * cum[n]!;
  let i = 0;
  while (i < n - 1 && cum[i + 1]! <= target) i++;
  const a = points[i]!;
  const b = points[(i + 1) % n]!;
  const seg = cum[i + 1]! - cum[i]!;
  const t = seg > 0 ? (target - cum[i]!) / seg : 0;
  const out: [number, number][] = [[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]];
  for (let k = 1; k <= n; k++) {
    const p = points[(i + k) % n]!;
    out.push([p[0], p[1]]);
  }
  return out;
}
