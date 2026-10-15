/* The three sketches, by the letter the lab's bar and its address use. */

import { altitude } from "./altitude";
import type { Geom, Sketch } from "./core";
import { lanes } from "./lanes";
import { pattern } from "./pattern";

export type SketchId = "a" | "b" | "c";
export const SKETCHES: readonly { id: SketchId; name: string; build: (G: Geom) => Sketch }[] = [
  { id: "a", name: "Lanes", build: lanes },
  { id: "b", name: "Altitude", build: altitude },
  { id: "c", name: "Pattern", build: pattern },
];
export const sketchOf = (id: SketchId) => SKETCHES.find((s) => s.id === id) ?? SKETCHES[0];
