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
 * Rolodex treatment (owner redirect, 2026-07-12): a masked window
 * anchored at mid-rail holds a flow-stacked reel of every journey
 * entry; the controller slides the reel so the ACTIVE row always sits
 * at the fixed anchor. Names are baked here for a real first paint;
 * the authored station number rides only the active row (the
 * controller morphs "SERVICES" ↔ "08 SERVICES"). The three brand-pillar
 * rows (Arc / Services / Tools) carry the layered-stack module glyph
 * (the folded card ring) as a "most important elements" marker — always
 * shown, filled by row state (CSS-driven; ADR-031 Update 5).
 */

import { MANIFEST_ENTRIES } from "../rail-manifest/entries";

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

/** Build the manifest rolodex (window → reel → entry rows) as a single HTML string. */
export function buildRailManifestHtml(): string {
  let rows = "";
  MANIFEST_ENTRIES.forEach((entry, i) => {
    // Scroll-0 first paint: hero active (the window is dormant there —
    // hero canon shows no rail title), everything else upcoming,
    // distances measured from hero.
    const state = i === 0 ? "active" : "upcoming";
    const dist = Math.min(i, 4);
    // Positional count for assistive tech — deliberately NOT the
    // authored label (the sequence read aloud should stay monotonic
    // even though the authored numbers are not).
    const aria = `${entry.name} — section ${i + 1} of ${MANIFEST_ENTRIES.length}`;
    rows +=
      `<button type="button" class="rail-manifest__entry" data-entry-id="${entry.id}"` +
      ` data-state="${state}" data-dist="${dist}" data-target="#${entry.targetId}"` +
      ` aria-label="${aria}">` +
      `<span class="rail-manifest__name">${entry.name}</span>` +
      (entry.glyph === "stack" ? STACK_GLYPH_SVG : "") +
      "</button>";
  });
  return `<div class="rail-manifest__window"><div class="rail-manifest__reel">${rows}</div></div>`;
}
