/**
 * Centralized allowlist utilities for admin access control.
 * Used across client components and server-side API routes.
 */

/**
 * Get the allowed admin email from environment variable.
 * Returns lowercase email or null if not configured.
 */
export const getAllowedEmail = (): string | null =>
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.toLowerCase() ?? null;

/**
 * Check if the given email matches the allowed admin email.
 * @param email - Email to check (case-insensitive)
 * @returns true if email matches the allowed email
 */
export const isAllowedUserEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const allowed = getAllowedEmail();
  if (!allowed) return false;
  return email.toLowerCase() === allowed;
};
