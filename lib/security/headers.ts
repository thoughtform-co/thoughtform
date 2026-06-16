/**
 * Typed wrapper around the `.mjs` security-headers module so
 * runtime callers and tests get full TypeScript types. The actual
 * implementation lives in `headers.mjs` because `next.config.mjs`
 * imports the module at build time and cannot transpile TypeScript
 * directly.
 */

export {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  THOUGHTFORM_SECURITY_HEADERS,
} from "./headers.mjs";

export interface ResponseHeader {
  key: string;
  value: string;
}

export interface BuildSecurityHeadersOptions {
  /** Tune script-src for fast-refresh / HMR (development only). */
  isDevelopment?: boolean;
  /**
   * Force CSP into enforced mode (sets `Content-Security-Policy`
   * instead of `Content-Security-Policy-Report-Only`).
   */
  enforceCsp?: boolean;
}
