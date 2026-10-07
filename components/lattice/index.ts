// The lattice (ADR-149) — the recipes' three server components and the lab's
// overlay. The classes they emit are the contract; `lattice.css` (imported by
// the consumer's route, never from here) is the recipe.

export { Frame } from "./Frame";
export type { FrameProps, FrameCut, FrameCh, FrameLine, FrameGround } from "./Frame";
export { Section } from "./Section";
export type {
  SectionProps,
  SectionSeat,
  SectionBand,
  SectionHead,
  SectionArrangement,
  SectionRatio,
  SectionN,
} from "./Section";
export { Grid } from "./Grid";
export type { GridProps } from "./Grid";
export { LatticeOverlay } from "./LatticeOverlay";
