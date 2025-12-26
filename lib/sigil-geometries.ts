// ═══════════════════════════════════════════════════════════════════
// SIGIL GEOMETRY GENERATORS
// Generates point arrays for various sigil shapes
// Uses the shared particle-geometry library for 3D-aware generation
// ═══════════════════════════════════════════════════════════════════

import {
  getAllShapeIds,
  getShapeLabels,
  getShapeGenerator,
  resolveShapeId,
  isValidShape,
  toSigilPoints,
  DEFAULT_SIGIL_SHAPE,
  getSigilShapeOptions,
  type SigilPoint,
  type Vec3,
} from "./particle-geometry";

// ─── Types ───

/**
 * All valid sigil shape IDs
 * Now uses the shared particle-geometry registry
 */
export type SigilShape = string;

/**
 * Get the current default sigil shape
 */
export const getDefaultSigilShape = (): string => DEFAULT_SIGIL_SHAPE;

/**
 * All available sigil shapes (from registry)
 */
export const SIGIL_SHAPES: string[] = getAllShapeIds();

/**
 * Labels for each shape (from registry)
 */
export const SIGIL_SHAPE_LABELS: Record<string, string> = getShapeLabels();

/**
 * Re-export for UI components
 */
export { getSigilShapeOptions };

// ─── Point Interface ───

export interface Point {
  x: number;
  y: number;
  z?: number; // Optional depth for 3D shapes
  alpha?: number; // Optional per-point alpha
}

export interface GeometryOptions {
  size: number; // Canvas size
  particleCount: number;
  seed?: number; // For deterministic randomness
}

// ─── Shape Resolution ───

/**
 * Resolve a shape ID to a valid shape, handling legacy shapes
 */
export function resolveSigilShape(shape: string): string {
  return resolveShapeId(shape);
}

/**
 * Check if a shape is valid (exists in registry)
 */
export function isValidSigilShape(shape: string): boolean {
  return isValidShape(shape);
}

// ─── Main Generator ───

/**
 * Generate sigil points for a given shape
 * Now uses the shared particle-geometry library with 3D support
 */
export function generateSigilPoints(shape: SigilShape, options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;

  // Resolve the shape (handles legacy → new mapping)
  const resolvedShape = resolveShapeId(shape);

  // Get the generator from the registry
  const generator = getShapeGenerator(resolvedShape);

  // Generate 3D points
  const points3D: Vec3[] = generator({
    seed,
    pointCount: particleCount,
    size,
  });

  // Convert to sigil points with projection
  const sigilPoints = toSigilPoints(points3D, size, {
    rotationX: 0.3, // Slight tilt for depth perception
    rotationY: 0.2,
    scale: 0.38, // Scale to fit canvas
  });

  // Convert to legacy Point format
  return sigilPoints.map((p: SigilPoint) => ({
    x: p.x,
    y: p.y,
    z: p.z,
    alpha: p.alpha,
  }));
}

// ─── Legacy Compatibility ───

/**
 * Legacy shape IDs that have been removed
 * Maps to new Thoughtform shapes
 */
export const LEGACY_SHAPES: Record<string, string> = {
  star4: "tf_filamentField",
  star5: "tf_vortexBloom",
  star6: "tf_twistedRibbon",
  star8: "tf_constellationMesh",
  spiral: "tf_foldedFlow",
  concentricRings: "tf_trefoilKnot",
};

/**
 * Check if a shape is a legacy (removed) shape
 */
export function isLegacySigilShape(shape: string): boolean {
  return shape in LEGACY_SHAPES;
}
