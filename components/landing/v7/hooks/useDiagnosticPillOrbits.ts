"use client";

/**
 * useDiagnosticPillOrbits — DEPRECATED (kept as a no-op for now).
 *
 * The diagnostic pill labels in #missing-layer used to slowly orbit
 * along their host ellipses (10–13 minutes per revolution) driven by
 * a per-frame rAF loop that wrote `--x-pct` / `--y-pct` onto each
 * label and `cx` / `cy` onto each anchor pip. Once the labels grew
 * from 3-word tags ("Brief handoff") into full diagnostic sentences
 * ("Creative briefs arrive without the thinking."), the orbital
 * drift made every sentence a moving target the reader couldn't
 * settle on — the section asked for steady reading, not motion.
 *
 * The orbital READ is now provided by the four CSS-`offset-path`
 * particles (`.miss__particle--01..04`), which travel their host
 * orbits on their own — the user still sees four small bodies in
 * motion against four static labels, which is the celestial register
 * the diagnostic section was always after.
 *
 * Hook kept as a no-op (instead of deleted) so any prototype HTML or
 * call site that still imports it doesn't break. Safe to remove
 * entirely once no caller references `useDiagnosticPillOrbits`.
 */

export function useDiagnosticPillOrbits(): void {
  // No-op. See module-level comment above.
}
