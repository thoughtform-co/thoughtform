/**
 * Development-only logger utility
 *
 * In development: logs all messages
 * In production: only logs errors
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.log('Something happened');
 *   logger.error('Something went wrong');
 *   logger.warn('Warning message');
 */

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  /**
   * Log info messages (development only)
   */
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log warning messages (development only)
   */
  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log error messages (always logged)
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  /**
   * Log debug messages (development only, with [DEBUG] prefix)
   */
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.log("[DEBUG]", ...args);
    }
  },

  /**
   * Log success messages (development only, with ✓ prefix)
   */
  success: (...args: unknown[]): void => {
    if (isDev) {
      console.log("✓", ...args);
    }
  },
};

export default logger;
