"use client";

import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";

import { PHONE_STAGE_MEDIA } from "./stageClock";

/** Whether a section that opted in plays its phone stage here (ADR-160).
 *  Never on the server: the first paint is the static phone layout's box
 *  only where the CSS gate disagrees, and the CSS gate is the same query. */
export function usePhoneStage(optIn: boolean): boolean {
  const matches = useMediaQuery(PHONE_STAGE_MEDIA);
  return optIn && matches;
}

/** Where a pinned band stands in its runway, read from the element that
 *  follows it in flow (the travel spacer): the band is sticky, so its own box
 *  says only where it is pinned, never where the flow puts it.
 *
 *  - `top`: the band's top in flow, px from the viewport's top (≤ 0 once it
 *    has pinned);
 *  - `travelled`: svh scrolled since it pinned, clamped to the travel;
 *  - `arrival`: 0 while the band's top is at the fold, 1 when it pins;
 *  - `onScreen`: whether any of the runway is in view.
 *
 *  Every length is the layout viewport's (ADR-113): an svh runway divided by
 *  `innerHeight` moves while the thumb is still. */
export function readBand(band: HTMLElement, travel: HTMLElement) {
  const vh = layoutViewportHeight();
  const svh = vh / 100;
  const t = travel.getBoundingClientRect();
  const top = t.top - band.offsetHeight;
  const travelPx = t.height;
  return {
    vh,
    top,
    travelled: Math.min(Math.max(-top, 0), travelPx) / svh,
    arrival: Math.min(1, Math.max(0, 1 - top / vh)),
    onScreen: top < vh && t.bottom > -vh,
  };
}
