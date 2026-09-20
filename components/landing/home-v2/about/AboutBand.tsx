"use client";

import { useAboutBandScroll } from "./useAboutBandScroll";

/**
 * AboutBand — the phone's about band's controller (ADR-115). Renders nothing:
 * the band IS the authored `.voidwalker` block in the prototype HTML, restyled
 * by about-band.css once `useAboutBandScroll` stamps `data-about-band="on"`,
 * so the no-JS page and every rung below the ring's keep the static about.
 * Mounted by `AboutStage` in the nested `[data-about-root]` root — the same
 * root the desktop stage uses, one component either way.
 */
export function AboutBand({ active }: { active: boolean }) {
  useAboutBandScroll(active);
  return null;
}
