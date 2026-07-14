/**
 * authBridge — a tiny, dependency-free signal between the login flows
 * (`lib/auth.ts`, which imports the Supabase client directly) and the
 * lazily-initialized `AuthProvider`.
 *
 * Why: AuthProvider no longer loads @supabase/supabase-js for anonymous
 * visitors (2026-07-14 perf pass — the client was ~34 kB gzip in every
 * route's First Load JS). It initializes only when a persisted session
 * token exists, when the URL carries auth params, or when THIS signal
 * fires — the same-tab password sign-in case, where no reload happens
 * and localStorage was empty at AuthProvider mount.
 */

type Callback = () => void;

const callbacks = new Set<Callback>();

/** Fired by the login flows after a session is established same-tab. */
export function notifyAuthSessionStarted(): void {
  callbacks.forEach((cb) => cb());
}

/** AuthProvider subscribes; returns an unsubscribe. */
export function onAuthSessionStarted(cb: Callback): () => void {
  callbacks.add(cb);
  return () => {
    callbacks.delete(cb);
  };
}
