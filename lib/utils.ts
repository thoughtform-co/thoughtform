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
// Extracted from NavigationCockpitV2 for reuse across components
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
 * Linear interpolation between two values
 * @param a Start value
 * @param b End value
 * @param t Progress from 0 (a) to 1 (b)
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
