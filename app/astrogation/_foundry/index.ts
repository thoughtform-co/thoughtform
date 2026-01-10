// ═══════════════════════════════════════════════════════════════
// FOUNDRY MODULE EXPORTS
// StyleSpace engine for Mosaic-inspired design system derivation
// ═══════════════════════════════════════════════════════════════

export {
  // Types
  type StyleParams,
  type StyleSignature,
  type StyleVariant,
  type MotifPrimitive,
  // Vectorization
  styleParamsToVector,
  vectorToStyleParams,
  // Mixing & Interpolation
  mixStyleVectors,
  lerpStyleVectors,
  // Variant Generation
  sampleVariants,
  generateVariantName,
  describeVariant,
  // Style Vars
  styleParamsToVars,
  // Motif Utilities
  suggestMotifsForStyle,
  filterMotifsForStyle,
  motifToOverlayVars,
} from "./styleSpace";
