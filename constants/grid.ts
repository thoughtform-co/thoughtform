// ═══════════════════════════════════════════════════════════════════
// GRID CONSTANTS - Grid snap options and sizing
// ═══════════════════════════════════════════════════════════════════

// Grid snap options
export const GRID_SIZES = [8, 16, 24, 32] as const;
export type GridSize = (typeof GRID_SIZES)[number];
