/**
 * BrandmarkVectorActor — public surface of the vector-first brandmark
 * painter (ADR successor to ADR-013).
 *
 * Consumers should import from this barrel rather than the individual
 * files so the package's internals can move without churn.
 *
 *     import { BrandmarkVectorActor } from "@/components/brand/BrandmarkVectorActor";
 */

export { BrandmarkVectorActor } from "./BrandmarkVectorActor";
export { BrandmarkRingGlyph } from "./BrandmarkRingGlyph";
export type { BrandmarkRingGlyphProps } from "./BrandmarkRingGlyph";
