"use client";

import { TrinnyBeats } from "./TrinnyBeats";
import { TRINNY_SCENE } from "./offerSections";

/**
 * The scene, mounted into `#proposition` (ADR-099 → ADR-100 → ADR-102): the
 * configuration drawn as THE BOARD, with the offer's PHASES seated absolutely
 * over it inside one pinned stage.
 *
 * Its own root because the two stations are two elements apart and a React
 * portal cannot span from one into the other — but the same renderer, so the
 * beats are identical in kind to the seven below them. Beats one and two of
 * the proposal: `startIndex` defaults to 0, and `#offer` counts on from 2.
 *
 * ⚠ THE PHASES ARE HERE BECAUSE OF THE CHIP (ADR-102). The board's one lit
 * object travels to the far left and becomes the three plates' head bands one
 * after another, each plate unrolling out of the band that arrived, and the
 * whole of that has to happen in a frame that is NOT MOVING — a carrier posed
 * by a main-thread writer against a compositor-scrolled page lands a frame
 * behind it on every wheel step. So the slot is the sticky stage, the phases
 * beat is `position: absolute; inset: 0` over the board beat (route CSS, keyed
 * on the writer's `data-tl-scene` stamp), and the chip, the heads and the
 * carrier are all stationary while the scene clock runs. (The file and the
 * slot keep their names: the slot is the station's, the record is the beats'.)
 */
export default function TrinnyConfiguration() {
  return <TrinnyBeats sections={TRINNY_SCENE} className="tl-prop__root" />;
}
