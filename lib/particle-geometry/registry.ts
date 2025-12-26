// ═══════════════════════════════════════════════════════════════════
// SHAPE REGISTRY
// Central registry for all shape generators
// ═══════════════════════════════════════════════════════════════════

import type { ShapeDefinition, ShapeGenerator, ShapeCategory } from "./shapes/types";
import {
  generateFilamentField,
  generateFoldedFlow,
  generateVortexBloom,
  generateTrefoilKnot,
  generateTwistedRibbon,
  generateConstellationMesh,
  generateFractureSpire,
  generateContinuumFold,
} from "./shapes/thoughtform";
import {
  generateRing,
  generateTorus,
  generateGateway,
  generateSquareGrid,
  generateTriangle,
  generateDiamond,
  generateHexagon,
  generateCross,
  generateAbstractBlob,
  generateBrandmark,
  generateManifoldSlice,
} from "./shapes/geometric";

// ─── Registry Storage ───

const registry = new Map<string, ShapeDefinition>();

// ─── Thoughtform Shapes (new, 3D-topological) ───

register({
  id: "tf_filamentField",
  label: "Filament Field",
  category: "thoughtform",
  generate: generateFilamentField,
  has3DDepth: true,
});

register({
  id: "tf_foldedFlow",
  label: "Folded Flow",
  category: "thoughtform",
  generate: generateFoldedFlow,
  has3DDepth: true,
});

register({
  id: "tf_vortexBloom",
  label: "Vortex Bloom",
  category: "thoughtform",
  generate: generateVortexBloom,
  has3DDepth: true,
});

register({
  id: "tf_trefoilKnot",
  label: "Trefoil Knot",
  category: "thoughtform",
  generate: generateTrefoilKnot,
  has3DDepth: true,
});

register({
  id: "tf_twistedRibbon",
  label: "Twisted Ribbon",
  category: "thoughtform",
  generate: generateTwistedRibbon,
  has3DDepth: true,
});

register({
  id: "tf_constellationMesh",
  label: "Constellation Mesh",
  category: "thoughtform",
  generate: generateConstellationMesh,
  has3DDepth: true,
});

register({
  id: "tf_fractureSpire",
  label: "Fracture Spire",
  category: "thoughtform",
  generate: generateFractureSpire,
  has3DDepth: true,
});

register({
  id: "tf_continuumFold",
  label: "Continuum Fold",
  category: "thoughtform",
  generate: generateContinuumFold,
  has3DDepth: true,
});

// ─── Geometric Shapes (retained from legacy, with 3D depth added) ───

register({
  id: "ring",
  label: "Ring",
  category: "geometric",
  generate: generateRing,
  has3DDepth: true,
});

register({
  id: "torus",
  label: "Torus",
  category: "geometric",
  generate: generateTorus,
  has3DDepth: true,
});

register({
  id: "gateway",
  label: "Gateway",
  category: "geometric",
  generate: generateGateway,
  has3DDepth: true,
});

register({
  id: "squareGrid",
  label: "Square Grid",
  category: "geometric",
  generate: generateSquareGrid,
  has3DDepth: true,
});

register({
  id: "triangle",
  label: "Triangle",
  category: "geometric",
  generate: generateTriangle,
  has3DDepth: true,
});

register({
  id: "diamond",
  label: "Diamond",
  category: "geometric",
  generate: generateDiamond,
  has3DDepth: true,
});

register({
  id: "hexagon",
  label: "Hexagon",
  category: "geometric",
  generate: generateHexagon,
  has3DDepth: true,
});

register({
  id: "cross",
  label: "Cross",
  category: "geometric",
  generate: generateCross,
  has3DDepth: true,
});

register({
  id: "abstractBlob",
  label: "Abstract Blob",
  category: "geometric",
  generate: generateAbstractBlob,
  has3DDepth: true,
});

register({
  id: "brandmark",
  label: "Brandmark",
  category: "geometric",
  generate: generateBrandmark,
  has3DDepth: true,
});

register({
  id: "manifoldSlice",
  label: "Manifold Slice",
  category: "geometric",
  generate: generateManifoldSlice,
  has3DDepth: true,
});

// ─── Registry Functions ───

function register(definition: ShapeDefinition): void {
  registry.set(definition.id, definition);
}

/**
 * Get a shape definition by ID
 */
export function getShape(id: string): ShapeDefinition | undefined {
  return registry.get(id);
}

/**
 * Get a shape generator by ID with fallback
 */
export function getShapeGenerator(id: string): ShapeGenerator {
  const shape = registry.get(id);
  if (shape) return shape.generate;
  // Fallback to first Thoughtform shape
  return generateFilamentField;
}

/**
 * Check if a shape ID is valid
 */
export function isValidShape(id: string): boolean {
  return registry.has(id);
}

/**
 * Get all registered shapes
 */
export function getAllShapes(): ShapeDefinition[] {
  return Array.from(registry.values());
}

/**
 * Get shapes by category
 */
export function getShapesByCategory(category: ShapeCategory): ShapeDefinition[] {
  return Array.from(registry.values()).filter((s) => s.category === category);
}

/**
 * Get all shape IDs
 */
export function getAllShapeIds(): string[] {
  return Array.from(registry.keys());
}

/**
 * Get shape labels map (id → label)
 */
export function getShapeLabels(): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [id, def] of registry) {
    labels[id] = def.label;
  }
  return labels;
}

/**
 * Default sigil shape ID (for fallback)
 */
export const DEFAULT_SIGIL_SHAPE = "tf_filamentField";

/**
 * Default landmark shape ID
 */
export const DEFAULT_LANDMARK_SHAPE = "tf_fractureSpire";

// ─── Legacy Shape Mapping (for migration) ───

/**
 * Map legacy shape IDs to new ones (for database migration / fallback)
 */
const LEGACY_SHAPE_MAP: Record<string, string> = {
  // Removed shapes → new Thoughtform shapes
  star4: "tf_filamentField",
  star5: "tf_vortexBloom",
  star6: "tf_twistedRibbon",
  star8: "tf_constellationMesh",
  spiral: "tf_foldedFlow",
  concentricRings: "tf_trefoilKnot",
};

/**
 * Resolve a shape ID, handling legacy shapes
 */
export function resolveShapeId(id: string): string {
  if (registry.has(id)) return id;
  if (id in LEGACY_SHAPE_MAP) return LEGACY_SHAPE_MAP[id];
  return DEFAULT_SIGIL_SHAPE;
}

/**
 * Check if a shape ID is a legacy (removed) shape
 */
export function isLegacyShape(id: string): boolean {
  return id in LEGACY_SHAPE_MAP;
}

// ─── Sigil-Specific Exports ───

/**
 * Get all valid sigil shape IDs (for sigil system)
 */
export function getSigilShapeIds(): string[] {
  return getAllShapeIds();
}

/**
 * Get sigil shape options for UI (id, label, category)
 */
export function getSigilShapeOptions(): Array<{
  id: string;
  label: string;
  category: ShapeCategory;
}> {
  return getAllShapes().map((s) => ({
    id: s.id,
    label: s.label,
    category: s.category,
  }));
}
