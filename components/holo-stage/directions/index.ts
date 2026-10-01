/**
 * The look-dev directions (ADR-140): new compositions for the workshop's
 * three figures, derived from the owner's references, drawn through the one
 * renderer. Round four re-cuts round three's compositions as INSTRUMENT
 * PLATES (`instrument.ts`: the bed, the density, the life) and is listed
 * first; round three stays for the comparison, round two's wire
 * compositions behind it. The lab mounts them side by side; the owner picks.
 */

import { curveGraph } from "./curveGraph";
import { curveInstrument } from "./curveInstrument";
import { curveRelief } from "./curveRelief";
import { curveTrace } from "./curveTrace";
import type { StageView } from "../stageFit";
import type { Direction } from "./shared";
import { spectrumDissolve } from "./spectrumDissolve";
import { spectrumGauge } from "./spectrumGauge";
import { spectrumInstrument } from "./spectrumInstrument";
import { spectrumPoles } from "./spectrumPoles";
import { stagesDischarge } from "./stagesDischarge";
import { stagesInstrument } from "./stagesInstrument";
import { stagesOrbits } from "./stagesOrbits";
import { stagesSphere } from "./stagesSphere";

export type { Direction, DirLabel } from "./shared";

export const DIRECTIONS: Record<string, (view?: StageView) => Direction> = {
  /* Round four — instrument plates: the bed, the Arc sphere's density, the life. */
  "stages-instrument": stagesInstrument,
  "curve-instrument": curveInstrument,
  "spectrum-instrument": spectrumInstrument,
  /* Round three — the material is particles (`stageParticles`), the vantage the stage. */
  sphere: stagesSphere,
  graph: curveGraph,
  dissolve: spectrumDissolve,
  /* Round two — wire compositions at their own vantages, kept for the comparison. */
  orbits: stagesOrbits,
  discharge: stagesDischarge,
  relief: curveRelief,
  trace: curveTrace,
  gauge: spectrumGauge,
  poles: spectrumPoles,
};

export const DIRECTION_IDS = Object.keys(DIRECTIONS);

/** The round-four plates, in figure order. */
export const ROUND_FOUR_IDS = [
  "stages-instrument",
  "curve-instrument",
  "spectrum-instrument",
] as const;
