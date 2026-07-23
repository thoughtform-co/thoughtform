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
// RETIRED COMPONENTS - archived per ADR-004, DELETED 2026-07-23
// These trees were archived under `legacy/` and have now been
// removed from the working tree entirely (ADR-004 Update 1):
//   components/sections|editor|canvas/*, store/*,
//   app/v2|v3|v4/*, components/hud/r3f/*, lib/v4/*
//
// Git history is the archive — recover any of them with
// `git log --diff-filter=D -- legacy/<path>`.
// ═══════════════════════════════════════════════════════════════
