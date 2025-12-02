"use client";

import { AuthProvider } from "./auth/AuthProvider";
import { KeyboardShortcutsProvider } from "./editor/KeyboardShortcutsProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <KeyboardShortcutsProvider>
        {children}
      </KeyboardShortcutsProvider>
    </AuthProvider>
  );
}

