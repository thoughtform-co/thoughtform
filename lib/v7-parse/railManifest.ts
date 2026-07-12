/**
 * Rail Manifest — parse-time skeleton builder (ADR-031).
 *
 * The `hudTicks.ts` twin: the prototype HTML ships an empty
 * `<nav id="railManifest" data-rail-manifest-root>` shell inside
 * `.hud__rail--l`; this module builds the manifest's entry buttons at
 * parse time so the rail paints its sockets on first load with no
 * client-side reflow. The client `RailManifestController` then MUTATES
 * this markup (states, scramble text, garnish) — it never re-renders
 * it. Never `createRoot` into `[data-rail-manifest-root]`: that would
 * clobber this server skeleton (ADR-031 guardrail).
 *
 * Marker treatment: "bracketed slots" (owner pick, 2026-07-12 lab) —
 * register brackets `[ · ]` read as bays in a backplane; a seated
 * module is a chip in its bay. The services bay carries the
 * layered-stack glyph (the docked card ring), painted only while
 * seated (CSS-gated).
 */

import { MANIFEST_ENTRIES, SLOT_TOP_PCT } from "../rail-manifest/entries";

/** The services module glyph — four layered planes (the collapsed card ring). */
const STACK_GLYPH_SVG =
  '<svg class="rail-manifest__glyph" viewBox="0 0 14 14" aria-hidden="true">' +
  '<rect x="0.5" y="5.5" width="8" height="8"></rect>' +
  '<rect x="2.17" y="3.83" width="8" height="8"></rect>' +
  '<rect x="3.83" y="2.17" width="8" height="8"></rect>' +
  '<rect x="5.5" y="0.5" width="8" height="8" class="rail-manifest__glyph-front"></rect>' +
  "</svg>";

/** Build the manifest entry buttons as a single HTML string. */
export function buildRailManifestHtml(): string {
  let html = "";
  MANIFEST_ENTRIES.forEach((entry, i) => {
    // Scroll-0 first paint: hero powered, everything else a socket.
    const state = i === 0 ? "active" : "upcoming";
    const top = SLOT_TOP_PCT(i).toFixed(4);
    // Positional count for assistive tech — deliberately NOT the
    // authored label (visible text is marker-only; the sequence read
    // aloud should be monotonic).
    const aria = `${entry.name} — section ${i + 1} of ${MANIFEST_ENTRIES.length}`;
    html +=
      `<button type="button" class="rail-manifest__entry" data-entry-id="${entry.id}"` +
      ` data-state="${state}" data-target="#${entry.targetId}" style="top:${top}%"` +
      ` aria-label="${aria}">` +
      `<i class="rail-manifest__marker" aria-hidden="true">${entry.glyph === "stack" ? STACK_GLYPH_SVG : ""}</i>` +
      '<span class="rail-manifest__label"></span>' +
      '<span class="rail-manifest__name"></span>' +
      "</button>";
  });
  return html;
}
