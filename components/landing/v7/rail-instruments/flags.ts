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
 * The bottom-right corner is SETTINGS (ADR-059 Update 1).
 *
 * `SettingsCluster` replaces the standalone `LightModeToggle` on the
 * landing route, carrying the theme switch plus a session mark that only an
 * allowlisted signed-in user ever sees. `/arcs` still mounts the standalone
 * toggle — it has no cluster to join.
 *
 * The short-lived `THEME_TOGGLE_DOCKS_LEFT` is gone with it: the toggle
 * moved left only while the journey's destination marks held this corner,
 * and those have since merged into the top-left row.
 */
export const SETTINGS_CLUSTER = true;
