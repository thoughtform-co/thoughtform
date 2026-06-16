import { join } from "path";

import { parseV7Html } from "./parseBody";
import { captureSections } from "./stationOps";
import type { V7Slice } from "./types";

/**
 * sliceV7Sections — extract the HUD chrome plus a subset of station
 * sections from the v7 prototype HTML.
 *
 * Powers v2-style routes (e.g. `/test/home-v2`) that want to render
 * the production HUD + a handful of stations without paying for the
 * full v7 LandingPage scroll machinery. The slice runs through the
 * same parse pipeline as `getV7Content` (script-strip, asset paths
 * rewritten to public/, brandmark `<img>` placeholders removed, hud
 * depth ticks injected) so the markup is drop-in renderable.
 *
 * Walks the body twice:
 *   1. Splits at `<main class="stations">` to take everything before
 *      as hudHtml.
 *   2. For each requested station id, scans forward from the matching
 *      `<section ... id="...">` opener, counting balanced
 *      `<section>` / `</section>` pairs so nested sections (the
 *      intelligence-layer chambers) are preserved intact.
 *
 * Sections are concatenated in source order so DOM order matches the
 * prototype — important for any later mounting of v7 hooks that
 * walk by querySelectorAll.
 */
export function sliceV7Sections(sectionIds: readonly string[]): V7Slice {
  const htmlPath = join(process.cwd(), "public/prototypes/v7/landing-v7-motion.html");
  const tokensPath = join(process.cwd(), "public/prototypes/v7/tokens.css");
  const { bodyHtml, bodyClass } = parseV7Html(htmlPath, tokensPath);

  const stationsMarker = '<main class="stations">';
  const stationsStart = bodyHtml.indexOf(stationsMarker);
  if (stationsStart < 0) {
    return { hudHtml: bodyHtml, sections: [], sectionsHtml: "", bodyClass };
  }

  const hudHtml = bodyHtml.slice(0, stationsStart);
  const stationsBody = bodyHtml.slice(stationsStart + stationsMarker.length);

  const captured = captureSections(stationsBody, sectionIds);
  const sections = captured.map(({ id, html }) => ({ id, html }));
  const sectionsHtml = sections.map((s) => s.html).join("\n");

  return { hudHtml, sections, sectionsHtml, bodyClass };
}
