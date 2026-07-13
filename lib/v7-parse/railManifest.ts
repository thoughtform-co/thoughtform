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
 * Rolodex treatment (owner redirect, 2026-07-12; curated 2026-07-13): a
 * masked window anchored at mid-rail holds a flow-stacked reel of the
 * three brand-pillar rows — Arc / Services / Products (`RAIL_ROWS`, the
 * `glyph:"stack"` entries) — NOT the full journey; the controller slides
 * the reel so the active/last-reached pillar sits at the anchor. Names
 * are baked here for a real first paint. Each row carries the
 * layered-stack module glyph (the folded card ring), always shown and
 * filled by row state (CSS-driven; ADR-031 Updates 5–6).
 */

import { RAIL_ROWS } from "../rail-manifest/entries";

/**
 * The module glyph — four layered planes (the folded card ring) — that
 * marks the three brand-pillar rows (Arc / Services / Tools) in the
 * rolodex. Kept as a prefix-parameterised builder;
 * `buildStackGlyphSvg("rail-manifest")` produces the folded-card-ring
 * markup the `.rail-manifest__glyph` CSS styles by row state.
 */
export function buildStackGlyphSvg(prefix: string): string {
  return (
    `<svg class="${prefix}__glyph" viewBox="0 0 14 14" aria-hidden="true">` +
    '<rect x="0.5" y="5.5" width="8" height="8"></rect>' +
    '<rect x="2.17" y="3.83" width="8" height="8"></rect>' +
    '<rect x="3.83" y="2.17" width="8" height="8"></rect>' +
    `<rect x="5.5" y="0.5" width="8" height="8" class="${prefix}__glyph-front"></rect>` +
    "</svg>"
  );
}

const STACK_GLYPH_SVG = buildStackGlyphSvg("rail-manifest");

/** Build the rolodex (window → reel → the three brand-pillar rows) as a
 *  single HTML string. Only `RAIL_ROWS` (Arc / Services / Products) are
 *  rendered — the full journey still drives resolution, but the rail
 *  displays just the pillars (owner, 2026-07-13). */
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
      (entry.glyph === "stack" ? STACK_GLYPH_SVG : "") +
      "</button>";
  });
  return `<div class="rail-manifest__window"><div class="rail-manifest__reel">${rows}</div></div>`;
}
