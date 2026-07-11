// Gateway Motion — plate-preserving treatments for the Gateway key visuals
// (lab: app/(internal)/test/gateway-motion). Distinct from the particle
// family (ThreeGateway / ImageParticleGateway): these keep the Midjourney
// plate photographic and add life via depth, procedural overlays, and
// scroll-scrubbed sequences. See sentinel/decisions/027-gateway-motion-lab.md.

export { GatewayStage } from "./GatewayStage";
export { KenBurnsGateway, KENBURNS_DEFAULTS, type KenBurnsConfig } from "./KenBurnsGateway";
export {
  DepthParallaxGateway,
  PARALLAX_DEFAULTS,
  type ParallaxConfig,
} from "./DepthParallaxGateway";
export { DepthMeshGateway, MESH_DEFAULTS, type MeshConfig } from "./DepthMeshGateway";
export { LivingPlateOverlay, LIVING_DEFAULTS, type LivingConfig } from "./LivingPlateOverlay";
export { ScrubSequenceGateway } from "./ScrubSequenceGateway";
export { FpsMeter } from "./FpsMeter";
export { useOnScreen } from "./useOnScreen";
export { usePointerLerp, type PointerLerpRef } from "./usePointerLerp";
export { useScrollProgressRef, readProgress, type ScrollProgressRef } from "./useScrollProgressRef";
