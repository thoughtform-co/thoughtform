/**
 * lib/auth/ownerPassClient — the browser's half of the owner's pass (ADR-117).
 *
 * The pass rides the Supabase session: minted for the allowlisted email when
 * a session exists, cleared when it ends. `AuthProvider` imports this module
 * LAZILY and only once a session exists, so a visitor with no session never
 * fetches it (the landing-performance doctrine's invariant 3).
 *
 * ⚠ FETCH ONLY. It never imports `ownerPass.ts` (which is `node:crypto`) and
 * never the arcs registry — the cookie is HttpOnly, so the browser cannot
 * read it anyway; what it knows about the pass is the expiry the mint route
 * returned, mirrored in localStorage.
 *
 * ⚠ THE MIRROR CAN LIE, AND THE 404 IS WHAT CORRECTS IT. A cleared cookie
 * leaves a fresh-looking mirror behind; the owner then lands on the overview's
 * 404, and there this module mints REGARDLESS of the mirror and reloads once
 * per tab — which is also how an expired pass, or a rotated key, heals.
 */

import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

/** Re-mint below half the pass's life. Pinned to `OWNER_PASS_TTL_S / 2` by
 *  `tests/lib/owner-pass.test.ts` — restated here, because importing the
 *  constant would pull `node:crypto` into the browser. */
export const OWNER_PASS_REMINT_BELOW_S = 3.5 * 24 * 60 * 60;

const MIRROR_KEY = "tf-owner-pass-exp";
const RELOADED_KEY = "tf-owner-pass-reloaded";
const GATED_PATH = "/arcs";

interface SessionLike {
  access_token: string;
  user?: { email?: string | null } | null;
}

let inflight: Promise<boolean> | null = null;

const nowSec = () => Math.floor(Date.now() / 1000);

function readMirror(): number {
  try {
    return Number(localStorage.getItem(MIRROR_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeMirror(exp: number): void {
  try {
    localStorage.setItem(MIRROR_KEY, String(exp));
  } catch {
    /* storage unavailable — the 404 path still heals */
  }
}

function onGatedPath(): boolean {
  return location.pathname.replace(/\/+$/, "") === GATED_PATH;
}

/** The overview answered with the not-found page, for want of a pass. */
function onGatedNotFound(): boolean {
  return onGatedPath() && document.querySelector("[data-tf-404]") !== null;
}

async function mint(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch("/api/owner-pass", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { exp?: unknown };
    if (typeof body.exp === "number") writeMirror(body.exp);
    return true;
  } catch {
    return false;
  }
}

/** Mint when the pass is missing or past half its life; on the overview's
 *  404, mint unconditionally and reload once. `reload` is injectable for
 *  tests only — jsdom's `location.reload` cannot be observed. */
export async function syncOwnerPass(
  session: SessionLike | null,
  { reload = () => location.reload() }: { reload?: () => void } = {}
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!session?.access_token || !isAllowedUserEmail(session.user?.email)) return;

  const gated = onGatedNotFound();
  if (!gated && onGatedPath()) {
    // The overview rendered: re-arm the one reload for the next expiry.
    try {
      sessionStorage.removeItem(RELOADED_KEY);
    } catch {
      /* no session storage — nothing to re-arm */
    }
  }
  if (!gated && readMirror() - nowSec() > OWNER_PASS_REMINT_BELOW_S) return;

  inflight ??= mint(session.access_token).finally(() => {
    inflight = null;
  });
  const minted = await inflight;
  if (!minted || !gated) return;

  let reloadedAlready = true;
  try {
    reloadedAlready = sessionStorage.getItem(RELOADED_KEY) === "1";
    if (!reloadedAlready) sessionStorage.setItem(RELOADED_KEY, "1");
  } catch {
    /* without session storage a reload could loop, so do not reload */
  }
  if (!reloadedAlready) reload();
}

/** The pass ends with the session. */
export async function clearOwnerPass(): Promise<void> {
  try {
    localStorage.removeItem(MIRROR_KEY);
  } catch {
    /* storage unavailable */
  }
  try {
    await fetch("/api/owner-pass", {
      method: "DELETE",
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    /* offline — the pass expires on its own */
  }
}
