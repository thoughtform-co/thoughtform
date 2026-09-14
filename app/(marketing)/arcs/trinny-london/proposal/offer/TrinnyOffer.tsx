"use client";

import { TrinnyBeats } from "./TrinnyBeats";
import { TRINNY_OFFER_SECTIONS } from "./offerSections";

/**
 * The offer's beats, mounted into `#offer` (ADR-094 U9).
 *
 * `startIndex: 2` because the configuration AND the phases are beats one and
 * two on this page and live in their own root two stations up (ADR-099, then
 * ADR-102 took the phases into the scene) — see `TrinnyBeats`. The flow opens
 * this station now.
 */
export default function TrinnyOffer() {
  return <TrinnyBeats sections={TRINNY_OFFER_SECTIONS} startIndex={2} className="tl-offer__root" />;
}
