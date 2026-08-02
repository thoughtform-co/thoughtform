"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

import { ThemeToggleButton } from "../LightModeToggle";

/**
 * The BOTTOM-RIGHT corner: settings (ADR-059 Update 1).
 *
 * The four corners each carry one idea now — journey top-left, nav
 * top-right, brand bottom-left, settings bottom-right. This is the last of
 * them, and it is why the journey's destination marks moved up to join the
 * approach in a single row.
 *
 * ⚠ ITS OWN FIXED OVERLAY, OUTSIDE `.hud` — the ADR-058 constraint, and it
 * has not gone away just because the corner's contents changed. `.hud__rail`
 * and `.hud__corner--*` carry the ADR-031 U16 hero-curtain `clip-path`, so a
 * control hosted in either is invisible for the whole hero and then pops in
 * as the curtain lifts. Settings must be reachable on the first screen.
 * `.hud-nav-overlay` at z 60 is the precedent both follow.
 *
 * ⚠ THE AUTH SUBSCRIPTION LIVES IN THE `SessionMark` LEAF, not here.
 * `useAuth` resolves asynchronously and re-renders whatever reads it; this
 * component is rendered by `LandingPage`, which owns a
 * `dangerouslySetInnerHTML` body with nested roots inside it. Reading auth
 * at this level would re-render the cluster on session resolve — harmless
 * here today, but it is one refactor away from being read as "LandingPage
 * may subscribe to auth", which is the regression `CelestialEditorGate`
 * documents. Keep the subscription at the leaf.
 */

/**
 * Visible ONLY to a signed-in allowlisted user (owner, 2026-08-02).
 *
 * A login affordance on a public marketing page tells every visitor there
 * is an admin surface and where it is, for the benefit of exactly one
 * person who already knows. So there is no "sign in" control: the door is
 * `/admin` by URL, and this mark appears once you are through it — as a way
 * back to the tools, and as the frame admitting it knows who you are.
 *
 * `process.env.NODE_ENV` is deliberately NOT an escape hatch here, unlike
 * `CelestialEditorGate`: that gate opens an editing overlay that is useful
 * in local dev, whereas this is a link that works for nobody who is not
 * allowlisted anyway.
 */
function SessionMark() {
  const { user } = useAuth();
  if (!isAllowedUserEmail(user?.email)) return null;

  return (
    <Link
      href="/admin"
      className="rin-session"
      aria-label="Admin tools — signed in"
      title={`Signed in as ${user?.email ?? "admin"}`}
    >
      {/* Brackets closing on a diamond. Deliberately the `encode` glyph's
          vocabulary — that mark is registration brackets around a lattice —
          so the settings corner reads as the same instrument family as the
          journey row rather than as a borrowed UI icon. */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
        focusable="false"
      >
        <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" />
        <path fill="currentColor" stroke="none" d="M12 8.4 15.6 12 12 15.6 8.4 12Z" />
      </svg>
    </Link>
  );
}

export function SettingsCluster() {
  return (
    <div className="rin-settings" data-rin-settings>
      <SessionMark />
      <ThemeToggleButton />
    </div>
  );
}
