import { brainIsoSvg } from "@/components/arcs/figures/foundation/brainIso";
import type { MindDirection } from "./types";

/** The brain as the act draws it now, for reference. */
export const today: MindDirection = {
  id: "today",
  name: "Today",
  line: "The brain as the keynote draws it now: nineteen extruded plates a hemisphere, the machine on the crowns.",
  svg: ({ view, only, light, tones }) => brainIsoSvg({ base: "tendrils", view, only, light, ...tones }),
};
