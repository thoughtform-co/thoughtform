"use client";

import { TrinnyBeats } from "./TrinnyBeats";
import { TRINNY_OFFER_SECTIONS } from "./offerSections";

/**
 * The offer's beats, mounted into `#offer` (ADR-094 U9).
 *
 * `startIndex: 1` because the configuration is beat one on this page and
 * lives in its own root two stations up (ADR-099) — see `TrinnyBeats`.
 */
export default function TrinnyOffer() {
  return <TrinnyBeats sections={TRINNY_OFFER_SECTIONS} startIndex={1} className="tl-offer__root" />;
}
