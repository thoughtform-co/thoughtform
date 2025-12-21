import { NextRequest } from "next/server";

/**
 * Get the authenticated user from the server-side request
 * Returns null if not authenticated or email doesn't match allowed email
 *
 * Note: This is a simplified version. For production, you should:
 * 1. Use Next.js middleware to verify Supabase sessions
 * 2. Or implement proper cookie-based session checking
 */
export async function getServerUser(request?: NextRequest) {
  // In development, allow all (for easier testing)
  const isLocalDev = process.env.NODE_ENV === "development";

  if (isLocalDev) {
    // Return a mock user in dev mode
    return { email: process.env.NEXT_PUBLIC_ALLOWED_EMAIL || "dev@example.com" } as any;
  }

  // In production, we'd check the session from cookies/headers
  // For now, this is a placeholder - you can enhance it with proper middleware
  // The client-side AuthProvider handles the actual auth, and API routes
  // can trust the client in dev mode. For production, add proper middleware.
  return null;
}

/**
 * Check if the current request is from an authorized user
 *
 * For now, this allows all requests in dev mode.
 * In production, you should implement proper server-side session verification.
 */
export async function isAuthorized(request?: NextRequest): Promise<boolean> {
  const isLocalDev = process.env.NODE_ENV === "development";

  // In dev, allow all (for easier testing)
  if (isLocalDev) {
    return true;
  }

  // In production, for now we rely on client-side checks
  // TODO: Implement proper server-side session checking with Next.js middleware
  // This would verify Supabase session cookies/headers
  return false;
}
