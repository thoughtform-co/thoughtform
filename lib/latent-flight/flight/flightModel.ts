/**
 * lib/latent-flight/flight/flightModel — the vessel on rails, three-free.
 *
 * The ship is CONSTRAINED to the course: throttle moves it along `s`, and the
 * stick moves it inside the lattice's cross-section (x across, y up) with a
 * damped return to centre when released — the rail-shooter model, which is
 * what "flying on the site's rails" means literally. Throttle ramps, never
 * jumps; speed follows throttle with a little inertia; lateral motion
 * returns to centre exponentially, so it can never overshoot.
 *
 * Pure and deterministic: the same inputs at the same `dt` give the same
 * state, which is what the unit tests pin.
 */

export interface ShipState {
  /** Course parameter, 0 … 1. */
  s: number;
  /** Speed along the course, world units per second. */
  v: number;
  /** Actual throttle, 0 … 1. */
  throttle: number;
  /** Lateral offsets inside the lattice, world units. */
  x: number;
  y: number;
}

export interface FlightInput {
  /** Commanded throttle, 0 … 1. */
  throttleCmd: number;
  /** Stick across, −1 … 1 (right positive). */
  lateral: number;
  /** Stick up, −1 … 1 (up positive). */
  vertical: number;
}

export interface FlightBounds {
  /** Half extents of the lattice cross-section, world units. */
  x: number;
  y: number;
}

export const SHIP = {
  /** Top speed along the course, units per second. */
  vMax: 26,
  /** Throttle slew, per second. */
  throttleRate: 1.4,
  /** Speed's own time constant toward throttle × vMax, seconds. */
  speedTau: 0.45,
  /** Lateral stick speed, units per second, at the lattice's half extent. */
  latRate: 1.6,
  /** Return-to-centre time constant when the stick is released, seconds. */
  latTau: 0.55,
  /** How much of the lattice's half extent the ship may use. */
  latUse: 0.7,
} as const;

export const SHIP_AT_REST: ShipState = { s: 0, v: 0, throttle: 0, x: 0, y: 0 };

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function integrateShip(
  prev: ShipState,
  input: FlightInput,
  dt: number,
  courseLength: number,
  bounds: FlightBounds
): ShipState {
  const step = Math.max(0, dt);
  // Throttle slews toward the command.
  const cmd = clamp(input.throttleCmd, 0, 1);
  const dThr = clamp(cmd - prev.throttle, -SHIP.throttleRate * step, SHIP.throttleRate * step);
  const throttle = clamp(prev.throttle + dThr, 0, 1);
  // Speed follows throttle with inertia.
  const k = 1 - Math.exp(-step / SHIP.speedTau);
  let v = prev.v + (throttle * SHIP.vMax - prev.v) * k;
  // Advance along the course; the far end is a wall.
  let s = prev.s + (v * step) / Math.max(1e-6, courseLength);
  if (s >= 1) {
    s = 1;
    v = 0;
  }
  if (s <= 0) {
    s = 0;
    v = Math.max(0, v);
  }
  // Lateral: driven while the stick is held, exponential return otherwise.
  const maxX = bounds.x * SHIP.latUse;
  const maxY = bounds.y * SHIP.latUse;
  const relax = Math.exp(-step / SHIP.latTau);
  const lat = clamp(input.lateral, -1, 1);
  const vert = clamp(input.vertical, -1, 1);
  const x = lat !== 0 ? clamp(prev.x + lat * SHIP.latRate * bounds.x * step, -maxX, maxX) : prev.x * relax;
  const y = vert !== 0 ? clamp(prev.y + vert * SHIP.latRate * bounds.y * step, -maxY, maxY) : prev.y * relax;
  return { s, v, throttle: v === 0 && s >= 1 ? 0 : throttle, x, y };
}

/** Normalised range along the course from `s` to a waypoint's `sWp`. */
export function rangeAlong(s: number, sWp: number): number {
  return Math.abs(sWp - s);
}

/** The autopilot: a throttle command that flies the course to a target and
 *  eases into it. Returns null once the target is reached. */
export const AUTOPILOT = {
  cruise: 0.75,
  approachRange: 0.12,
  approachThrottle: 0.28,
  arriveRange: 0.004,
} as const;

export function autopilotThrottle(s: number, sTarget: number): number | null {
  const r = sTarget - s;
  if (r <= AUTOPILOT.arriveRange) return null;
  if (r < AUTOPILOT.approachRange) {
    // Ease from approach throttle down toward a crawl at the mark.
    const k = r / AUTOPILOT.approachRange;
    return Math.max(0.08, AUTOPILOT.approachThrottle * k);
  }
  return AUTOPILOT.cruise;
}
