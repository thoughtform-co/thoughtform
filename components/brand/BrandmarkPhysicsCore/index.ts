/**
 * BrandmarkPhysicsCore — public surface of the GPGPU-driven 3D
 * particle core for the corridor brandmark (ADR-023).
 *
 *     import { BrandmarkPhysicsCore } from "@/components/brand/BrandmarkPhysicsCore";
 *
 * See `/test/brandmark-physics-core` for live tuning. Production
 * integration is in `DepthGatewayScene/index.tsx`, which mounts the
 * core alongside `BrandmarkAccretionShell` and drives `ignite` from
 * the corridor's dolly-release gate.
 */

export {
  BrandmarkPhysicsCore,
  BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  BRANDMARK_PHYSICS_CORE_COUNT_MOBILE,
} from "./BrandmarkPhysicsCore";

export type {
  BrandmarkPhysicsCoreProps,
  BrandmarkPhysicsCoreForces,
  BrandmarkPhysicsCoreForceOverrides,
  BrandmarkCoreShape,
  BrandmarkCoreGlyph,
  BrandmarkCoreBlending,
} from "./BrandmarkPhysicsCore";

// Re-export the basis type from the sampler so consumers (the lab,
// production actor) can use one import for the full appearance API.
export type { BrandmarkBasis } from "@/lib/brandmark/sampleBrandmarkParticles";
