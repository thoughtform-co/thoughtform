import { createServerClient } from "./supabase";
import { isAllowedUserEmail } from "./auth/allowed-user";

/**
 * Get the authenticated user from a Bearer token in the Authorization header.
 * Returns the user object if valid, null otherwise — in EVERY environment.
 * (Until 2026-09-24 a missing token under `next dev` returned a made-up user
 * with the allowlisted email; see `verifyAllowlistedBearer` for why that went.)
 *
 * @param request - The incoming request with Authorization header
 */
export async function getServerUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!bearerToken) return null;
  const token = bearerToken;
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
 * THE check: a Bearer token that resolves to a real Supabase user whose email
 * is the allowlisted one. There is one check and it runs the same in every
 * environment.
 *
 * ⚠ THERE IS NO DEVELOPMENT BYPASS, AND THERE WAS ONE UNTIL 2026-09-24
 * (ADR-003, amendment). `isAuthorized` returned `true` for every caller under
 * `NODE_ENV=development` "for easier testing" — on a dev server that `next
 * dev` binds to EVERY interface by default (`-H 0.0.0.0`) and that runs with
 * the PRODUCTION service-role key. Twenty-nine admin routes — storage and
 * database writes, and eight that spend Anthropic, Replicate, Voyage and
 * Figma keys — were open to anyone on the same Wi-Fi, no token needed, with
 * the writes landing on the live project. The owner's pass (ADR-117) had
 * already refused the shortcut for its own route because a pass minted that
 * way would be valid in production; the rest of the API now refuses it for
 * the same reason. Dev signs in exactly as production does, and the admin UI
 * sends its token through `lib/auth/adminFetch.ts`.
 * `tests/lib/no-dev-auth-bypass.test.ts` walks the routes and the gates for a
 * `NODE_ENV === "development"` that came back.
 */
export async function verifyAllowlistedBearer(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7);
  if (!token) {
    return false;
  }
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

/**
 * Is this request from the allowlisted admin? The same verifier as above, in
 * every environment; kept as a name because twenty-nine routes call it.
 *
 * @param request - The incoming request with Authorization header
 * @returns true if the request is from the allowed admin user
 */
export async function isAuthorized(request: Request): Promise<boolean> {
  return verifyAllowlistedBearer(request);
}
