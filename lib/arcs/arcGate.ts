/**
 * lib/arcs/arcGate — the arcs' password (ADR-135). Pure and edge-safe: no
 * Node built-ins, Web Crypto only, so `proxy.ts` and the unlock route share
 * one definition of the key, the password and the token.
 *
 * Every page under `/arcs/<…>` sits behind a password (owner, 2026-09-29:
 * "put all the arcs under a password, which I will set in Vercel … we need a
 * password specifically for the Pandora proposal"). The password for a page
 * is read from the environment, most specific first:
 *
 *   ARC_PASSWORD_<KEY>   the page's own, e.g. ARC_PASSWORD_PANDORA_PROPOSAL
 *   ARCS_PASSWORD        every other arc page
 *
 * ⚠ FAILS OPEN WHEN NEITHER IS SET. A deploy before the variables exist, and
 * every local dev server, serves the arcs as before; the gate arms the moment
 * a variable is set. That is deliberate — failing closed would lock every
 * forwarded link on the push — and it is stated wherever the gate is.
 * ⚠ `/arcs` ITSELF IS NOT GATED HERE: the overview is the owner's page and has
 * its own gate (`assertOwner`, ADR-117). ⚠ STATIC FILES UNDER `/arcs/` ARE NOT
 * GATED: the homepage's own pictures live in `public/arcs/`, and a path with a
 * file extension is an asset, never a page.
 */

export const ARC_UNLOCK_PATH = "/unlock";
export const ARC_PASS_TTL_S = 60 * 60 * 24 * 30;

/**
 * The page a request reaches, as the router will read it. ADR-117 found the
 * two ways a path check leaks, and both are closed here rather than hoped
 * away: a prerendered page also answers under its RSC payloads
 * (`/arcs/x.rsc`, `/arcs/x.segments/…/__PAGE__.segment.rsc`), and the router
 * decodes a percent-escape the proxy sees raw (`/%61rcs/x` IS `/arcs/x`).
 * Repeated slashes collapse the same way. A path that will not decode is
 * returned as it came, and the router refuses it too.
 */
export function arcPagePath(pathname: string): string {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
  return path
    .replace(/\/{2,}/g, "/")
    .replace(/\.segments\/.*$/, "")
    .replace(/\.rsc$/, "");
}

/**
 * The page's key: its path under `/arcs/`, in the environment's own shape
 * (`/arcs/pandora/proposal` → `PANDORA_PROPOSAL`,
 * `/arcs/trinny-london/proposal` → `TRINNY_LONDON_PROPOSAL`). `null` for
 * anything the gate does not cover.
 */
export function arcGateKey(rawPathname: string): string | null {
  const pathname = arcPagePath(rawPathname);
  if (!pathname.startsWith("/arcs/")) return null;
  const rest = pathname.slice("/arcs/".length).replace(/\/+$/, "");
  if (!rest) return null;
  const segments = rest.split("/");
  // An asset (`/arcs/vince-portrait.png`, `/arcs/studio-line/a.webp`).
  if (segments[segments.length - 1].includes(".")) return null;
  if (!segments.every((s) => /^[a-z0-9-]+$/.test(s))) return null;
  return segments.join("_").replace(/-/g, "_").toUpperCase();
}

type Env = Record<string, string | undefined>;

/** The password for a key, most specific first; `null` when none is set. */
export function arcPasswordFor(key: string, env: Env): string | null {
  const own = env[`ARC_PASSWORD_${key}`];
  if (own) return own;
  return env.ARCS_PASSWORD || null;
}

/** The cookie a key's pass lives in. */
export const arcPassCookieName = (key: string) => `tf_arc_${key.toLowerCase()}`;

/** The pass: a SHA-256 of the key and the password, never the password. */
export async function arcPassToken(key: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`thoughtform-arc:${key}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** A return path the unlock route may send the reader back to. */
export function safeArcNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/arcs/") || next.startsWith("//")) return null;
  return arcGateKey(next.split(/[?#]/)[0]) ? next : null;
}
