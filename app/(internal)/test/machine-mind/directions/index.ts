import { floorplan } from "./floorplan";
import { glassHousing } from "./glassHousing";
import { sand } from "./sand";
import { signalField } from "./signalField";
import { silica } from "./silica";
import { today } from "./today";
import { traceCortex } from "./traceCortex";
import type { MindDirection } from "./types";

export type { MindDirection, MindLive, MindOptions } from "./types";

/** The six directions in order, then today's brain for reference. Each lives
    in its own module; nothing else in the lab names one. */
export const DIRECTIONS: readonly MindDirection[] = [traceCortex, floorplan, glassHousing, silica, sand, signalField, today];

export const directionOf = (id: string) => DIRECTIONS.find((d) => d.id === id);
