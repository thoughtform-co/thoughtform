"use client";

import { AuthProvider } from "./auth/AuthProvider";
import { UserStatus } from "./auth/UserStatus";
import { DevEnvBanner } from "./dev/DevEnvBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserStatus />
      {/* NODE_ENV gate here (not only inside the component) so the
          banner module is dead-code-eliminated from prod bundles. */}
      {process.env.NODE_ENV === "development" && <DevEnvBanner />}
      {children}
    </AuthProvider>
  );
}
