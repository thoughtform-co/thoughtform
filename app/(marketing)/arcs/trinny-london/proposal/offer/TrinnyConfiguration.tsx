"use client";

import { TrinnyBeats } from "./TrinnyBeats";
import { TRINNY_CONFIGURATION } from "./offerSections";

/**
 * The configuration, mounted into `#proposition` (ADR-099).
 *
 * Its own root because the two stations are two elements apart and a React
 * portal cannot span from one into the other — but the same renderer, so the
 * beat is identical in kind to the seven below it and to `/arcs/suri-proposal`.
 * Beat one of the proposal: `startIndex` defaults to 0.
 */
export default function TrinnyConfiguration() {
  return <TrinnyBeats sections={[TRINNY_CONFIGURATION]} className="tl-prop__root" />;
}
