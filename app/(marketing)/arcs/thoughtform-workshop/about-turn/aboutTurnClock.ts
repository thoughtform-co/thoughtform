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
/** The orbit's rings and particle halo close in onto the card, finishing
 *  before it is edge-on so nothing is left to vanish at once. */
export const RING_CLOSE: TurnWindow = [0.15, 0.35];
/** The portrait turns 0° → 90°, edge-on. */
export const FLIP_FRONT: TurnWindow = [0.2, 0.4];
/** The brandmark on the card's back turns −90° → the live mark's tilt and
 *  settles onto the live mark's rect. */
export const FLIP_BACK: TurnWindow = [0.4, 0.6];
/** The square aperture in About's ground opens from the mark's centre. */
export const GATE_OPEN: TurnWindow = [0.5, 0.85];
/** The thesis title scrambles in on the live copy's own lines. */
export const B_TITLE_IN: TurnWindow = [0.35, 0.65];
/** The two thesis paragraphs type in. */
export const B_BODY_IN: TurnWindow = [0.5, 0.8];
/** The live "Enter the arc" button opens on the centre-out aperture. */
export const CTA_OPEN: TurnWindow = [0.8, 0.92];
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

/**
 * The rings' and the particle halo's clip radius at `u`: from the orbit's
 * own half-diagonal (clips nothing) to zero, so they close in onto the card
 * and are gone behind it before it turns edge-on. The card itself is never
 * in this clip — it has its own turn.
 */
export function ringRadius(u: number, orbitHalfDiag: number): number {
  return orbitHalfDiag * (1 - easedWindow(u, RING_CLOSE));
}

/** A centre-out aperture's open fraction → the `inset()` side, in percent
 *  (50 = shut to a centre slit, 0 = open). */
export function apertureInset(open: number): number {
  return 50 * (1 - clamp01(open));
}
