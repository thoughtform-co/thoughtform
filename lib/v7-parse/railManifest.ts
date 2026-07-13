/**
 * Rail Manifest — parse-time skeleton builder (ADR-031, Update 3).
 *
 * The `hudTicks.ts` twin: the prototype HTML ships an empty
 * `<nav id="railManifest" data-rail-manifest-root>` shell inside
 * `.hud__rail--l`; this module builds the manifest's rolodex at parse
 * time so the rail paints its section list on first load with no
 * client-side reflow. The client `RailManifestController` then MUTATES
 * this markup (reel detent, states, active-row text) — it never
 * re-renders it. Never `createRoot` into `[data-rail-manifest-root]`:
 * that would clobber this server skeleton (ADR-031 guardrail).
 *
 * Rolodex treatment (owner redirect, 2026-07-12; curated 2026-07-13;
 * terminal pass 2026-07-13): a masked window anchored at mid-rail holds
 * a flow-stacked reel of the three brand-pillar rows — Arc / Services /
 * Products (`RAIL_ROWS`, the `glyph:"stack"` entries) — NOT the full
 * journey; the controller slides the reel so the active/last-reached
 * pillar sits at the anchor. Names are baked here for a real first
 * paint. The rows carry NO glyph any more — the active pillar is marked
 * by a filled terminal selection bar (CSS-driven, `.rail-manifest__name`
 * inverse-video), so the left rail reads as a terminal list rather than
 * an icon menu (owner, 2026-07-13; retired the folded-card-ring glyph).
 */

import { RAIL_ROWS } from "../rail-manifest/entries";

/** Build the rolodex (window → reel → the three brand-pillar rows) as a
 *  single HTML string. Only `RAIL_ROWS` (Arc / Services / Products) are
 *  rendered — the full journey still drives resolution, but the rail
 *  displays just the pillars (owner, 2026-07-13). Each row is a bare
 *  name button; the active row's terminal highlight is pure CSS. */
export function buildRailManifestHtml(): string {
  let rows = "";
  RAIL_ROWS.forEach((entry, i) => {
    // First paint = hero (activeIdx 0): no pillar is active yet, so every
    // row starts `upcoming` (the window is dormant on hero anyway).
    const aria = `${entry.name} — pillar ${i + 1} of ${RAIL_ROWS.length}`;
    rows +=
      `<button type="button" class="rail-manifest__entry" data-entry-id="${entry.id}"` +
      ` data-state="upcoming" data-target="#${entry.targetId}"` +
      ` aria-label="${aria}">` +
      `<span class="rail-manifest__name">${entry.name}</span>` +
      "</button>";
  });
  return `<div class="rail-manifest__window"><div class="rail-manifest__reel">${rows}</div></div>`;
}
