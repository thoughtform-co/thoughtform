"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

// Admin-only editor, split out of the marketing bundle. Imported
// straight from the component file (not the CelestialEditor barrel,
// which would drag CelestialEditorModal back into this chunk) and
// mounted only for dev / allowlisted users, so anonymous visitors
// never fetch the editor chunk.
const CelestialEditorOverlay = dynamic(
  () => import("./CelestialEditorOverlay").then((m) => m.CelestialEditorOverlay),
  { ssr: false }
);

/**
 * Auth-gated mount point for the celestial editor overlay.
 *
 * IMPORTANT: this lives in its own leaf component ON PURPOSE. `useAuth`
 * updates asynchronously when the Supabase session resolves, which
 * triggers a re-render of whatever component reads it. `LandingPage`
 * renders the parsed prototype markup via `dangerouslySetInnerHTML`
 * and then mounts nested React roots (ServicesPortal,
 * ServicesRailRegisterPortal; BuildCasesPortal until ADR-033 retired
 * it) into placeholder nodes INSIDE that markup. If `LandingPage`
 * itself subscribes to `useAuth`, the auth-resolve re-render replaces
 * the innerHTML nodes and orphans those nested roots — their content
 * silently vanishes (regression fixed 2026-07-06).
 *
 * Keeping the subscription in this leaf means only THIS component
 * re-renders on auth changes; `LandingPage` stays render-stable and
 * the nested-root slots survive.
 */
export function CelestialEditorGate() {
  const { user } = useAuth();
  const editorEnabled = process.env.NODE_ENV === "development" || isAllowedUserEmail(user?.email);
  return editorEnabled ? <CelestialEditorOverlay /> : null;
}
