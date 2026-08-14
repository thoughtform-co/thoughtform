"use client";

import { AuthProvider } from "./auth/AuthProvider";
import { DevEnvBanner } from "./dev/DevEnvBanner";

/**
 * ⚠ NO IDENTITY READOUT HERE (owner, 2026-08-14). `UserStatus` used to
 * mount at this level — a `fixed top-5 right-…` overlay on EVERY route,
 * naming the signed-in user and holding the only log-out control outside
 * `/admin`. It is gone: the landing's bottom-right settings corner already
 * carried a session mark (ADR-059 Update 3), and that mark now opens the
 * panel it should always have had (`rail-instruments/SettingsCluster`).
 *
 * The corner it vacated is the NAV's (ADR-059) — a second overlay claiming
 * it was the defect, not the readout itself. Sign-out away from the landing
 * is `/admin`'s own `SessionActiveShell`, which is where every admin route
 * routes back to anyway.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* NODE_ENV gate here (not only inside the component) so the
          banner module is dead-code-eliminated from prod bundles. */}
      {process.env.NODE_ENV === "development" && <DevEnvBanner />}
      {children}
    </AuthProvider>
  );
}
