// ═══════════════════════════════════════════════════════════════
// HISTORICAL BARREL — compatibility layer only (see ADR-004)
//
// Do NOT add new exports here. Import from feature barrels:
//   @/components/hud      — HUD navigation & chrome
//   @/components/gateway   — Gateway visuals (ImageParticle, ThreeGateway)
//   @/components/particles — Particle system (Canvas, Sigil, Morph)
//   @/components/landing/v7 — V7 landing page + celestial connectors
//   @/components/admin     — Admin overlays (CelestialEditor, AdminGate)
//   @/components/auth      — AuthProvider
//   @/components/ui        — Shared UI primitives
// ═══════════════════════════════════════════════════════════════

// ── Legacy exports kept for backward compatibility ────────────

// UI Components
export { Button } from "./ui/Button";
export { SectionHeader } from "./ui/SectionHeader";
export { Navigation } from "./ui/Navigation";
export { FlowNode } from "./ui/FlowNode";

// Parallax Components
export {
  ParallaxLayer,
  ParallaxContainer,
  FadeInOnScroll,
  ScaleOnScroll,
} from "./parallax/ParallaxLayer";

// ═══════════════════════════════════════════════════════════════
// LEGACY COMPONENTS - Archived per ADR-004
// The following components have been moved to legacy/:
// - components/sections/* → legacy/sections/
// - components/editor/* → legacy/editor/
// - components/canvas/* → legacy/canvas/
// - store/* → legacy/store/
// - app/v2/* → legacy/landing-v2/
// - app/v3/* → legacy/landing-v3/
// - app/v4/* + components/hud/r3f/* + lib/v4/* → legacy/landing-v4/
//
// These are kept for reference but not actively compiled.
// Import directly from legacy/ if needed for testing.
// ═══════════════════════════════════════════════════════════════
