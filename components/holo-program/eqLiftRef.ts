/**
 * eqLiftRef — how far the equilibrium's mark has lifted out of its gate, 0 to
 * 1 (the X-Bionic proposal, 2026-10-11: on the way down "that middle part
 * then plugs into the wider stack"). One writer, the proposal's carrier,
 * which draws the mark from here on; one reader, the scene, which stops
 * drawing its own mark once the carrier has taken it. Everywhere else it
 * stays 0 and the scene is unchanged.
 *
 * ⚠ THREE-FREE, a plain mutable record (the `journeyScalars` transport
 * pattern), so the carrier can write it without importing the scene.
 */
export const eqLiftRef = { current: 0 };
