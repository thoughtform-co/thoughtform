/**
 * The look-dev directions (ADR-140, round two): new compositions for the
 * workshop's three figures, derived from the owner's references, drawn through
 * the one renderer. The lab mounts them side by side; the owner picks.
 */

import { curveRelief } from "./curveRelief";
import { curveTrace } from "./curveTrace";
import type { StageView } from "../stageFit";
import type { Direction } from "./shared";
import { spectrumGauge } from "./spectrumGauge";
import { spectrumPoles } from "./spectrumPoles";
import { stagesDischarge } from "./stagesDischarge";
import { stagesOrbits } from "./stagesOrbits";

export type { Direction, DirLabel } from "./shared";

export const DIRECTIONS: Record<string, (view?: StageView) => Direction> = {
  orbits: stagesOrbits,
  discharge: stagesDischarge,
  relief: curveRelief,
  trace: curveTrace,
  gauge: spectrumGauge,
  poles: spectrumPoles,
};

export const DIRECTION_IDS = Object.keys(DIRECTIONS);
