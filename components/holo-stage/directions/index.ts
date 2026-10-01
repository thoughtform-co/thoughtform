/**
 * The look-dev directions (ADR-140): new compositions for the workshop's
 * three figures, derived from the owner's references, drawn through the one
 * renderer. Round three is made of PARTICLES on the stage basis (the Arc
 * sphere's own material); round two's wire compositions stay beside them
 * for the comparison. The lab mounts them side by side; the owner picks.
 */

import { curveGraph } from "./curveGraph";
import { curveRelief } from "./curveRelief";
import { curveTrace } from "./curveTrace";
import type { StageView } from "../stageFit";
import type { Direction } from "./shared";
import { spectrumDissolve } from "./spectrumDissolve";
import { spectrumGauge } from "./spectrumGauge";
import { spectrumPoles } from "./spectrumPoles";
import { stagesDischarge } from "./stagesDischarge";
import { stagesOrbits } from "./stagesOrbits";
import { stagesSphere } from "./stagesSphere";

export type { Direction, DirLabel } from "./shared";

export const DIRECTIONS: Record<string, (view?: StageView) => Direction> = {
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
