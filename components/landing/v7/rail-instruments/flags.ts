/**
 * Feature flag for the RAIL INSTRUMENTS (ADR-059, 2026-08-02).
 *
 * The frame's two rails shipped as "a ruler with nothing on it" — a 13-tick
 * ladder on the left, and a right rail empty since ADR-044 retired
 * `ServicesRailRegister`. This lights both, plus the two working corners,
 * with the journey's own state.
 *
 * What it mounts when ON:
 *   - the JOURNEY row, top-left — Home · Thesis · Arc · Proof · Services ·
 *     About, replacing that corner's bracket;
 *   - the EXIT mark, bottom-right — `contact`, inboard of the settings
 *     controls, which replace that corner's bracket (ADR-059 Update 3;
 *     the theme switch is the outboard anchor and stays last);
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
 * ADR-058 slot. The exit mark is gated on THIS flag inside
 * `SettingsCluster` for that reason: it is a journey mark, and turning the
 * instruments off must take it without taking the theme switch.
 */
export const RAIL_INSTRUMENTS = true;

/* ⚠ `SETTINGS_CLUSTER` IS DELETED (2026-09-01, pre-launch audit ST-2) — it
   was a DEAD FLAG WITH A FALSE ROLLBACK PROMISE. Nothing ever read it:
   `LandingPage.tsx` gates `<SettingsCluster />` on `THEME_TOGGLE`, and
   `SettingsCluster`'s exit marks gate on `RAIL_INSTRUMENTS`. Its docblock
   told an operator that flipping it restores `<LightModeToggle />`, which
   would have changed NOTHING on a launch night — the one thing a rollback
   lever must never do. The real levers: `THEME_TOGGLE` (the cluster and the
   theme bootstrap) and `RAIL_INSTRUMENTS` (the journey marks). */
