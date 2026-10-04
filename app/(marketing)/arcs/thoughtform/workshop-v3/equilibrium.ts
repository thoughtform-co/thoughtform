/**
 * The third cut's opener (ADR-143 U7): a station between the hero and the
 * About, written into the shared prototype at parse time, on the server.
 *
 *   hero → THE THOUGHTFORM EQUILIBRIUM → about → the eras → the corridor
 *
 * ⚠ AN EXCEPTION TO ADR-139's SHARE RULE, RECORDED. That rule says the day a
 * cut's STRUCTURE diverges, the prototype, the route sheet and `.tw-root`
 * fork together. One station before the About is the whole divergence, so
 * it is spliced in here instead: v1, v2 and the AP lecture read the
 * prototype untouched, and every rule for it is scoped
 * `.tw-root[data-tw-cut="v3"]` in this route's own sheet. The fork is still
 * the answer the day the corridor itself diverges.
 *
 * The station carries everything a reader without WebGL needs, rendered here
 * from the record and the object's own geometry (`equilibriumGeom.ts`): the
 * copy, the static drawing (the object projected through its rest camera)
 * and the three words at their seats. The live hologram mounts into
 * `[data-tw-eq-canvas]` (`WorkshopPortals` → `EquilibriumMount`), framed by
 * the same camera, so at rest the swap moves nothing.
 *
 * ⚠ IT THROWS ON A MISS, as `hero.ts` and `about.ts` do: no `#hero`, a hero
 * not followed by `#about`, or an `#equilibrium` already in the body.
 * ⚠ NO HTML COMMENTS IN THE MARKUP — the parse strips them before this runs,
 * and nothing after it would.
 */

import {
  EQ_FRAME,
  EQ_WORD_SEATS,
  eqContentSpan,
  eqSvgMarkup,
  seatWords,
} from "@/components/holo-program/equilibriumGeom";
import type { WorkshopIntro } from "@/lib/arcs/content/shared/workshopIntro";

export const EQUILIBRIUM_STATION_ID = "equilibrium";

const HERO_SECTION = /<section\b[^>]*\bid="hero"[^>]*>[\s\S]*?<\/section>/i;
const NEXT_SECTION = /<section\b[^>]*>/i;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

/** The station's markup, from the record and the object. */
export function equilibriumStationHtml(copy: WorkshopIntro["equilibrium"]): string {
  const { w, h } = EQ_FRAME;
  const span = eqContentSpan();
  const words = seatWords()
    .map(({ id, ax, at }) => {
      const word = copy.labels[id];
      const seat = EQ_WORD_SEATS[id];
      const style = [`--ax:${f3(ax)}`, `--at:${f3(at)}`, `--dx:${seat.dx}`].join(";");
      return (
        `<li class="tw-eq__word" data-word="${id}" data-anchor="${seat.anchor}"` +
        `${id === "encode" ? " data-lit" : ""} style="${style}">` +
        `<span class="tw-eq__key">${esc(word.key)}</span>` +
        `<span class="tw-eq__val">${esc(word.text)}</span></li>`
      );
    })
    .join("");
  return (
    `<section class="station tw-eq" id="${EQUILIBRIUM_STATION_ID}" data-station="${EQUILIBRIUM_STATION_ID}" aria-labelledby="tw-eq-title">` +
    `<div class="tw-eq__stage">` +
    `<header class="tw-eq__head">` +
    `<p class="tw-eq__eyebrow">${esc(copy.eyebrow)}</p>` +
    `<h2 class="tw-eq__title" id="tw-eq-title">${esc(copy.title)}</h2>` +
    `<p class="tw-eq__sub">${esc(copy.sub)}</p>` +
    `</header>` +
    `<figure class="tw-eq__figure" style="--eq-w:${w};--eq-h:${h};--eq-x0:${f3(span.x0)};--eq-x1:${f3(span.x1)}">` +
    eqSvgMarkup("tw-eq__svg") +
    `<div class="tw-eq__canvas" data-tw-eq-canvas></div>` +
    `<ul class="tw-eq__words">${words}</ul>` +
    `</figure>` +
    `</div>` +
    `</section>`
  );
}

export function insertEquilibriumStation(
  bodyHtml: string,
  copy: WorkshopIntro["equilibrium"]
): string {
  if (new RegExp(`\\bid="${EQUILIBRIUM_STATION_ID}"`).test(bodyHtml)) {
    throw new Error("[workshop-v3 equilibrium] the body already has an #equilibrium");
  }
  const hero = HERO_SECTION.exec(bodyHtml);
  if (!hero) throw new Error("[workshop-v3 equilibrium] no #hero section in the prototype");
  const at = hero.index + hero[0].length;
  const next = NEXT_SECTION.exec(bodyHtml.slice(at));
  if (!next || !/\bid="about"/.test(next[0])) {
    throw new Error("[workshop-v3 equilibrium] the section after #hero is not #about");
  }
  return bodyHtml.slice(0, at) + equilibriumStationHtml(copy) + bodyHtml.slice(at);
}
