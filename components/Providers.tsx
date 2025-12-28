"use client";

import { AuthProvider } from "./auth/AuthProvider";
import { UserStatus } from "./auth/UserStatus";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserStatus />
      {children}
    </AuthProvider>
  );
}
