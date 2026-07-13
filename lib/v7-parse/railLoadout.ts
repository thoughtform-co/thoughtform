/**
 * Resource Loadout — parse-time skeleton builder (ADR-031 follow-up).
 *
 * The `railManifest.ts` twin: the prototype HTML ships an empty
 * `<nav id="railLoadout" data-rail-loadout-root>` shell at the foot of
 * `.hud__rail--l`; this module bakes the three resource sockets + the
 * charge gauge at parse time so the loadout paints (faded, empty
 * sockets) on first load with no client reflow. The client
 * `RailLoadoutController` then MUTATES this markup (per-socket
 * `data-state` + `aria-label`, the `--loadout-charge` property) — it
 * never re-renders it. Never `createRoot` into `[data-rail-loadout-root]`
 * (it would clobber this server skeleton — ADR-031 guardrail).
 *
 * First paint = hero (activeIdx 0): all three sockets `upcoming`, charge
 * 0 (the CSS reads `var(--loadout-charge, 0)`).
 */

import { LOADOUT_RESOURCES, loadoutState, loadoutStatusWord } from "../rail-manifest/loadout";
import { buildStackGlyphSvg } from "./railManifest";

/** The loadout module glyph — the folded card ring, loadout-scoped styling. */
const LOADOUT_GLYPH_SVG = buildStackGlyphSvg("rail-loadout");

/** Build the loadout (sockets row → charge gauge) as a single HTML string. */
export function buildRailLoadoutHtml(): string {
  let sockets = "";
  LOADOUT_RESOURCES.forEach((resource) => {
    // Scroll-0 first paint: hero active → every resource upcoming.
    const state = loadoutState(resource.manifestIdx, 0);
    const status = loadoutStatusWord(state);
    sockets +=
      `<button type="button" class="rail-loadout__socket" data-entry-id="${resource.entry.id}"` +
      ` data-target="#${resource.entry.targetId}" data-state="${state}"` +
      ` aria-label="${resource.name} — ${status}">` +
      LOADOUT_GLYPH_SVG +
      `<span class="rail-loadout__name">${resource.name}</span>` +
      "</button>";
  });
  return (
    `<div class="rail-loadout__sockets">${sockets}</div>` +
    '<div class="rail-loadout__gauge" aria-hidden="true"></div>'
  );
}
