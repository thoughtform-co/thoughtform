"use client";

import { TrinnyBeats } from "./TrinnyBeats";
import { TRINNY_OFFER_SECTIONS } from "./offerSections";

/**
 * The offer's beats, mounted into `#offer` (ADR-094 U9).
 *
 * `startIndex: 3` because the configuration, the phases AND the outcomes are
 * beats one to three on this page and live in their own root two stations up
 * (ADR-099, then ADR-102 took the phases into the scene, then ADR-103 the
 * outcomes) — see `TrinnyBeats`. The flow opens this station.
 */
export default function TrinnyOffer() {
  return <TrinnyBeats sections={TRINNY_OFFER_SECTIONS} startIndex={3} className="tl-offer__root" />;
}
