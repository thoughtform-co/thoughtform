// Class name utility
// =============================================================================

import { clsx, type ClassValue } from "clsx";

/**
 * Merge class names with clsx
 * Similar to shadcn/ui pattern
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
