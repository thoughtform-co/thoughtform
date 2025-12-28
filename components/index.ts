// ═══════════════════════════════════════════════════════════════
// ACTIVE COMPONENTS - Used by the main landing page
// ═══════════════════════════════════════════════════════════════

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
//
// These are kept for reference but not actively compiled.
// Import directly from legacy/ if needed for testing.
// ═══════════════════════════════════════════════════════════════
