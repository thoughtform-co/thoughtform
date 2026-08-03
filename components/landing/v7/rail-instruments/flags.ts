/**
 * Feature flag for the RAIL INSTRUMENTS (ADR-059, 2026-08-02).
 *
 * The frame's two rails shipped as "a ruler with nothing on it" — a 13-tick
 * ladder on the left, and a right rail empty since ADR-044 retired
 * `ServicesRailRegister`. This lights both, plus the two working corners,
 * with the journey's own state.
 *
 * What it mounts when ON:
 *   - the APPROACH row, top-left — the five corridor beats as marks,
 *     replacing that corner's bracket;
 *   - the DESTINATION row, bottom-right — the five remaining sections,
 *     replacing that corner's bracket and sharing its line with the
 *     settings controls (ADR-059 Update 2);
 *   - the right rail's TELEMETRY (bearing / sector / local) and the active
 *     section's name set vertically.
 *
 * Selected in `/test/hud-instruments-lab` as route `r4` plus `rTelemetry`,
 * `rName` and `cBr`; the left rail's station roster was tried there and NOT
 * taken (owner, 2026-08-02 — the ladder stays a ladder, and the approach
 * cluster is the left side's whole contribution).
 *
 * OFF restores the frame byte-identically: no host is created,
 * `data-rail-instruments` is never set, and every selector keyed on it goes
 * unmatched — both bracket suppressions, both widened clips, and the
 * bottom-right row's outboard anchor, which returns the theme switch to its
 * ADR-058 slot. The destination marks are gated on THIS flag inside
 * `SettingsCluster` for that reason: they are journey marks, and turning
 * the instruments off must take them without taking the theme switch.
 */
export const RAIL_INSTRUMENTS = true;

/**
 * The bottom-right corner carries SETTINGS (ADR-059 Update 1, reshaped by
 * Update 2 — it now carries the destination marks too).
 *
 * `SettingsCluster` replaces the standalone `LightModeToggle` on the
 * landing route, carrying the theme switch plus a session mark that only an
 * allowlisted signed-in user ever sees. `/arcs` still mounts the standalone
 * toggle — it has no cluster to join, and it keeps its `--br` bracket, so
 * its control stays in the ADR-058 slot inboard of that bracket.
 *
 * ⚠ Separate from `RAIL_INSTRUMENTS` on purpose, and it must stay separate:
 * the theme switch is a shipped control that predates these instruments, so
 * turning the journey marks off must never take the site's only theme
 * affordance with it. Flipping THIS one back means restoring
 * `<LightModeToggle />` in `LandingPage`.
 */
export const SETTINGS_CLUSTER = true;
