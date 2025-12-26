// ═══════════════════════════════════════════════════════════════════
// SHAPE TYPES & INTERFACES
// Common types for all shape generators
// ═══════════════════════════════════════════════════════════════════

import type { Vec3 } from "../math";
import type { SigilPoint } from "../projection";

/**
 * Base options for all shape generators
 */
export interface ShapeOptions {
  /** Random seed for deterministic generation */
  seed: number;
  /** Number of points to generate */
  pointCount: number;
  /** Output size (for sigil mode) */
  size?: number;
}

/**
 * A shape generator function
 */
export type ShapeGenerator = (options: ShapeOptions) => Vec3[];

/**
 * A sigil shape generator (returns 2D points with optional depth)
 */
export type SigilShapeGenerator = (options: ShapeOptions) => SigilPoint[];

/**
 * Shape category for organization in UI
 */
export type ShapeCategory =
  | "thoughtform" // New Thoughtform-specific shapes
  | "geometric" // Basic geometric shapes (ring, torus, etc.)
  | "attractor" // Strange attractors (for landmarks)
  | "topological"; // Knots, ribbons, etc.

/**
 * Shape definition in the registry
 */
export interface ShapeDefinition {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Category for grouping */
  category: ShapeCategory;
  /** Generator function (returns 3D points) */
  generate: ShapeGenerator;
  /** Default parameters */
  defaultParams?: Record<string, number>;
  /** Whether this shape has meaningful 3D depth */
  has3DDepth: boolean;
}

/**
 * Extended point with optional metadata
 */
export interface ShapePoint extends Vec3 {
  /** Optional alpha override */
  alpha?: number;
  /** Optional size override */
  size?: number;
  /** Optional color index for multi-colored shapes */
  colorIndex?: number;
}
