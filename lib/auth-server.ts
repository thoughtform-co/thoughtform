import { createServerClient } from "./supabase";
import { isAllowedUserEmail } from "./auth/allowed-user";

/**
 * Get the authenticated user from a Bearer token in the Authorization header.
 * Returns the user object if valid, null otherwise.
 *
 * @param request - The incoming request with Authorization header
 */
export async function getServerUser(request: Request) {
  // In development, allow all (for easier testing)
  if (process.env.NODE_ENV === "development") {
    return { email: process.env.NEXT_PUBLIC_ALLOWED_EMAIL || "dev@example.com" };
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const supabase = createServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Check if the current request is from an authorized admin user.
 * Validates the Bearer token and checks the user's email against the allowlist.
 *
 * @param request - The incoming request with Authorization header
 * @returns true if the request is from the allowed admin user
 */
export async function isAuthorized(request: Request): Promise<boolean> {
  // In development, allow all (for easier testing)
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7);
  const supabase = createServerClient();
  if (!supabase) {
    return false;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return false;
  }

  return isAllowedUserEmail(user.email);
}
