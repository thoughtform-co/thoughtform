import { dieStack } from "./dieStack";
import { floorplan } from "./floorplan";
import { glassHousing } from "./glassHousing";
import { laminate } from "./laminate";
import { layeredSilica } from "./layeredSilica";
import { layeredTrace } from "./layeredTrace";
import { routedBoards } from "./routedBoards";
import { sand } from "./sand";
import { signalField } from "./signalField";
import { silica } from "./silica";
import { today } from "./today";
import { traceCortex } from "./traceCortex";
import { waferTerraces } from "./waferTerraces";
import type { MindDirection } from "./types";

export type { MindDirection, MindLive, MindOptions } from "./types";

/** Every direction, the newest round first, then today's brain for
    reference. Each lives in its own module; nothing else in the lab names
    one. */
export const DIRECTIONS: readonly MindDirection[] = [
  waferTerraces,
  routedBoards,
  dieStack,
  layeredTrace,
  layeredSilica,
  laminate,
  traceCortex,
  floorplan,
  glassHousing,
  silica,
  sand,
  signalField,
  today,
];

export const directionOf = (id: string) => DIRECTIONS.find((d) => d.id === id);

/** The newest round drawn. */
export const LATEST = Math.max(...DIRECTIONS.map((d) => d.round ?? 0));
