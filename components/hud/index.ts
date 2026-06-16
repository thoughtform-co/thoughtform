// HUD navigation & chrome — feature-scoped barrel.
//
// Cross-feature re-exports (ParticleCanvasV2, ThoughtformSigil,
// ImageParticleGateway, ThreeGateway, KeyVisualPortal) were retired
// in 2026-06-16 (Homepage Refactor And Hardening Plan, Phase 4) —
// no consumer imports those symbols from `@/components/hud` anymore.
// Import particles from `@/components/particles/*` and the gateway
// surfaces from `@/components/gateway/*` directly.

export { HUDFrame } from "./HUDFrame";
export { NavigationBar } from "./NavigationBar";
export { Wordmark } from "./Wordmark";
export { WordmarkSans } from "./WordmarkSans";
export { GlitchText } from "./GlitchText";
export { NavigationCockpitV2 } from "./NavigationCockpitV2";
export { CanvasErrorBoundary } from "./CanvasErrorBoundary";
export { StatusBar } from "./StatusBar";
export { PanelGlow } from "./PanelGlow";
