/**
 * NavigationCockpitV2 transition hooks
 *
 * These hooks encapsulate the scroll-driven transition logic,
 * making the main component cleaner and the math easier to test/modify.
 */

export { useHeroToDefTransition } from "./useHeroToDefTransition";
export { useDefToManifestoTransition } from "./useDefToManifestoTransition";
export { useManifestoProgress } from "./useManifestoProgress";
export { useActiveSection } from "./useActiveSection";
export { useScrollCapture } from "./useScrollCapture";

// Shared utilities
export { easeInOutCubic, easeOutCubic, lerp } from "./easing";
