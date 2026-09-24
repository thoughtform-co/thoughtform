/**
 * lib/auth/authParams — is a URL carrying auth material? Zero imports, pure.
 *
 * `AuthProvider` decides whether to load the Supabase client off this (plus a
 * persisted session and the auth bridge); the anonymous path fetches zero
 * supabase chunks and makes zero `supabase.co` calls (landing-performance,
 * invariant 3). ⚠ EXACT KEYS, NOT SUBSTRINGS: the first cut tested
 * `search.includes("code=")`, so `?promocode=LOOP`, `?zipcode=` or a UTM value
 * with `code=` in it pulled the ~34 kB client and a `getSession()` for a
 * visitor with no session. A magic link returns its token in the HASH
 * (`#access_token=…`, the implicit flow this site uses); `?code=` is the PKCE
 * return, kept for when the flow changes.
 */
export function hasAuthParams(search: string, hash: string): boolean {
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return fragment.has("access_token") || query.has("code");
}
