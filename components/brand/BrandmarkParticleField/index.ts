/**
 * BrandmarkParticleField — public surface of the brandmark
 * atmosphere artifact.
 *
 * Vector-first refactor: the field no longer paints the brandmark
 * shape (that's `BrandmarkVectorActor`'s job). The R3F canvas paints
 * atmospheric grain — luminous gold dust that lives around and
 * inside the vector mark, intensifying during transits as motion
 * exhaust and during the substrate window as constellation dust.
 *
 * The `BrandmarkAtmosphere` exports below are aliases for the
 * underlying canvas/station — the file paths stay stable (no
 * churn for downstream imports) but the names declare the new
 * role honestly.
 *
 *     import { BrandmarkAtmosphereCanvas } from "@/components/brand/BrandmarkParticleField";
 */

export { BrandmarkParticleCanvas } from "./BrandmarkParticleCanvas";
export { BrandmarkParticleCanvas as BrandmarkAtmosphereCanvas } from "./BrandmarkParticleCanvas";
export type { BrandmarkParticleCanvasProps } from "./BrandmarkParticleCanvas";
export type { BrandmarkParticleCanvasProps as BrandmarkAtmosphereCanvasProps } from "./BrandmarkParticleCanvas";
export { BrandmarkParticleStation } from "./BrandmarkParticleStation";
export { BrandmarkParticleStation as BrandmarkAtmosphere } from "./BrandmarkParticleStation";
export { brandmarkVertexShader, brandmarkFragmentShader } from "./shaders";
