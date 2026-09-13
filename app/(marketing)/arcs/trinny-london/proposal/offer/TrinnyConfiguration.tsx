"use client";

import { TrinnyBeats } from "./TrinnyBeats";
import { TRINNY_BOARD } from "./offerSections";

/**
 * The configuration, mounted into `#proposition` (ADR-099) — drawn as THE
 * BOARD since ADR-100: the same beat, the same slot, a different kind.
 *
 * Its own root because the two stations are two elements apart and a React
 * portal cannot span from one into the other — but the same renderer, so the
 * beat is identical in kind to the seven below it. Beat one of the proposal:
 * `startIndex` defaults to 0. (The file and the slot keep their names: the
 * slot is the station's, the record is the beat's.)
 */
export default function TrinnyConfiguration() {
  return <TrinnyBeats sections={[TRINNY_BOARD]} className="tl-prop__root" />;
}
