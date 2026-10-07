import type { LatKnobs } from "@/lib/lattice/variants";

/**
 * The knobs, narrowed to the component contract (`components/lattice`). The
 * registry's strings are the URL's; the components take the union. Every
 * board passes these — a still must be traceable to its knobs, so a board
 * that hard-codes a cut is a board the stamp lies about.
 */
export type FrameCut = "tr-bl" | "tr" | "bl" | "none";
export type FrameLine = "seam" | "lip" | "lip-lit" | "rule";
export type HeadKind = "strip" | "bare";

export const cutOf = (knobs: LatKnobs): FrameCut => (knobs.cut === "tr" ? "tr" : "tr-bl");
export const lineOf = (knobs: LatKnobs): FrameLine => (knobs.line === "seam" ? "seam" : "lip");
export const headOf = (knobs: LatKnobs): HeadKind => (knobs.head === "bare" ? "bare" : "strip");
