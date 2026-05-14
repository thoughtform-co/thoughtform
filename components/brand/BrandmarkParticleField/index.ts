/**
 * BrandmarkParticleField — public surface of the brandmark particle
 * artifact. See `sentinel/decisions/011-brandmark-particle-artifact.md`
 * for the architecture, density tiers, and shape-registry rationale.
 *
 * Consumers should import from this barrel rather than the individual
 * files so the package's internals can move without churn.
 *
 *     import { BrandmarkParticleCanvas } from "@/components/brand/BrandmarkParticleField";
 */

export { BrandmarkParticleCanvas } from "./BrandmarkParticleCanvas";
export type { BrandmarkParticleCanvasProps } from "./BrandmarkParticleCanvas";
export { BrandmarkParticleStation } from "./BrandmarkParticleStation";
export type { BrandmarkParticleStationProps } from "./BrandmarkParticleStation";
export { brandmarkVertexShader, brandmarkFragmentShader } from "./shaders";
