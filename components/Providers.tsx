"use client";

import { AuthProvider } from "./auth/AuthProvider";
import { KeyboardShortcutsProvider } from "./editor/KeyboardShortcutsProvider";
import { UserStatus } from "./auth/UserStatus";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <KeyboardShortcutsProvider>
        <UserStatus />
        {children}
      </KeyboardShortcutsProvider>
    </AuthProvider>
  );
}
