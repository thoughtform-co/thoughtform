import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/map-phone-lab — look-dev for the last proof card's field on a phone
 * ("We built the layer the agents run on"). Owner, 2026-09-25: "on mobile it
 * just looks like a lot of text and a lot of frames … a super simplified,
 * mobile-friendly version of our work, configuration and layer."
 *
 * Three directions beside production, each drawing all three readings in the
 * bay the phone actually gives the card, with no inner scroll:
 *
 *   pick   ONE STREAM — the estate as state tiles, one stream as a spine,
 *          five bars by Skill count
 *   rows   READOUT ROWS — framed keys, values set right, nothing else
 *   deck   SWIPE DECK — one object per swipe, a travelling segment for the
 *          position
 *
 * Nothing on the landing changes; no ADR until a direction wins. Dev-only:
 * `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Map phone lab",
  robots: { index: false, follow: false },
};

export default function MapPhoneLabLayout({ children }: { children: ReactNode }) {
  return children;
}
