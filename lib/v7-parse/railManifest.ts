/**
 * Rail Manifest — parse-time skeleton builder (ADR-031, Update 9).
 *
 * The `hudTicks.ts` twin: the prototype HTML ships an empty
 * `<nav id="railManifest" data-rail-manifest-root>` shell inside
 * `.hud__rail--l`; this module fills it at parse time so the rail paints on
 * first load with no client reflow. The client `RailManifestController` then
 * MUTATES this markup (detent position, title text, aria) — it never
 * re-renders it. Never `createRoot` into `[data-rail-manifest-root]`: that
 * would clobber this server skeleton (ADR-031 guardrail).
 *
 * Update 9 (2026-07-16) — the three-pillar rolodex of section titles is
 * replaced by ONE gold detent diamond that snaps to a per-section detent
 * (spaced by real scroll distance) over the WHOLE journey, plus a hidden
 * title chip the controller reveals on hover / focus. The skeleton is
 * therefore just the diamond button + the (empty) title span; positions,
 * titles, and aria are written live by the controller. `MANIFEST_ENTRIES`,
 * `resolveActiveIdx`, and `clickToNavigate` are unchanged.
 */

/**
 * Build the rail marker skeleton: a single diamond `<button>` (real button
 * for keyboard focus + diegetic click) plus a hidden title chip. Position is
 * the CSS var `--rail-diamond-top` (fallback `0%` = the hero detent), written
 * live by the controller — NOT an inline `top`, which would override the
 * stylesheet. The diamond stays hidden until the controller flips
 * `data-ready`, so it appears at its measured detent with no slide-from-hero.
 */
export function buildRailManifestHtml(): string {
  return (
    `<button type="button" class="rail-manifest__diamond" data-rail-manifest-diamond` +
    ` aria-label="Journey position"></button>` +
    `<span class="rail-manifest__title" data-rail-manifest-title aria-hidden="true"></span>`
  );
}
