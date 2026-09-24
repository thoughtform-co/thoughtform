import { getSession } from "@/lib/auth";

/**
 * lib/auth/adminFetch — `fetch` with the admin's session token attached.
 *
 * ⚠ THE ADMIN API HAS NO DEVELOPMENT BYPASS (ADR-003, amendment 2026-09-24).
 * Until then `isAuthorized` trusted every caller under `next dev`, and fourteen
 * admin-UI fetches — the orrery's presets, the astrogation Figma bridge, the
 * reference match, a segment delete, the gateway bake upload — never sent a
 * token at all: they worked on the dev server by accident and answered 401 in
 * production, unnoticed. They go through here now.
 *
 * The token is read at call time from the browser client's own session
 * (`getSession`), so a module-level store with no React context (the bridge)
 * can use it exactly as a component can. A caller that already set an
 * `Authorization` header keeps it. No token → the request is sent bare and
 * the route answers 401, which is the truth of the matter rather than a
 * silent pass. Callers keep their own `.json()` and error handling.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Authorization")) {
    const session = await getSession();
    if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
