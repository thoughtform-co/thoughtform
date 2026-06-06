/**
 * shared — constants used by every outer-shell variant so they are
 * directly comparable (same radius, same colour, same port count).
 */

/** Outer-shell base radius. Matches the home page's
 *  `SURFACES_OUTER_RADIUS` exactly so the lab read is a true preview
 *  of how the shape lands in the corridor. */
export const OUTER_SHELL_RADIUS = 1.85;

/** Y-axis tilt applied to the outer shell so its ports / equator
 *  don't sit on a primary axis. Matches the home page's
 *  `SURFACES_PORT_TILT_Y`. */
export const OUTER_SHELL_TILT_Y = (12 * Math.PI) / 180;

/** Number of port pips around the shell rim. Six matches the home's
 *  `SURFACES_PORT_COUNT` so the variants all carry the same semantic
 *  "headless surfaces" register. */
export const OUTER_PORT_COUNT = 6;

/** Pip diamond half-extent. Matches the home page's
 *  `SURFACES_PORT_SIZE`. */
export const OUTER_PORT_SIZE = 0.085;

/** Slow counter-rotation rate applied to the outer shell (rad/s).
 *  Matches the home page's `SURFACES_SPIN_RATE`. */
export const OUTER_SHELL_SPIN_RATE = -0.09;

/** Per-port stagger overlap inside the surfaces reveal window. */
export const OUTER_PORT_OVERLAP = 0.55;
