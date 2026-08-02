/**
 * Feature flag for the RAIL INSTRUMENTS (ADR-059, 2026-08-02).
 *
 * The frame's two rails shipped as "a ruler with nothing on it" — a 13-tick
 * ladder on the left, and a right rail empty since ADR-044 retired
 * `ServicesRailRegister`. This lights both, plus the two working corners,
 * with the journey's own state.
 *
 * What it mounts when ON:
 *   - the APPROACH cluster, top-left — the five corridor beats as marks,
 *     replacing that corner's bracket;
 *   - the DOCK cluster, bottom-right — the five destinations, replacing
 *     that corner's bracket;
 *   - the right rail's TELEMETRY (bearing / sector / local / range) and the
 *     active section's name set vertically.
 *
 * Selected in `/test/hud-instruments-lab` as route `r4` plus `rTelemetry`,
 * `rName` and `cBr`; the left rail's station roster was tried there and NOT
 * taken (owner, 2026-08-02 — the ladder stays a ladder, and the approach
 * cluster is the left side's whole contribution).
 *
 * OFF restores the frame byte-identically: nothing mounts, no portal host
 * is created, and every `rail-instruments.css` selector is unmatched. The
 * one thing that does NOT revert with it is the ADR-058 toggle's position —
 * see `THEME_TOGGLE_DOCKS_LEFT` below.
 */
export const RAIL_INSTRUMENTS = true;

/**
 * The ADR-058 light/dark toggle moves to the BOTTOM-LEFT band, inboard of
 * the wordmark.
 *
 * Not a preference — a geometric consequence. The dock cluster is placed by
 * the approach row's rule read upside down (its bottom edge on the bottom
 * margin line), which is the only placement that makes the two corners
 * mirror. That lands it in the strip the toggle occupied, and the strip
 * between the right rail's terminus and the toggle is ~26px against a
 * ~36px glyph-plus-label row — so the corner cannot hold both.
 *
 * Bottom-left keeps ADR-058's own reasoning intact ("one chrome band, a
 * mark at each end"); the band now reads wordmark + toggle at one end,
 * dock cluster at the other.
 *
 * Kept as its own const because it must survive `RAIL_INSTRUMENTS = false`:
 * flipping the instruments off should not silently move a shipped control
 * back under a cluster that is no longer there to justify it. Set this to
 * false only if the toggle is being put back deliberately.
 */
export const THEME_TOGGLE_DOCKS_LEFT = true;
