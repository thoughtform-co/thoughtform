import { clsx, type ClassValue } from "clsx";

/**
 * Utility for merging class names conditionally
 * Uses clsx under the hood for conditional class handling
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Snap a value to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATION & MATH UTILITIES
// Extracted from the retired NavigationCockpitV2 HUD (deleted 2026-07,
// Phase 5 cleanup) for reuse across components
// ═══════════════════════════════════════════════════════════════════

/**
 * Cubic ease-in-out interpolation
 * Produces smooth acceleration/deceleration curves for scroll animations
 * @param t Progress value from 0 to 1
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * `lerp` (linear interpolation) and `clamp` are re-exported from the
 * canonical `@/lib/math` (Phase-5 consolidation, 2026-07-14).
 */
export { clamp, lerp } from "@/lib/math";
