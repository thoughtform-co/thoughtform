"use client";

import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

/**
 * Provider component that activates keyboard shortcuts for the editor
 */
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  // This hook registers all keyboard shortcuts when in edit mode
  useKeyboardShortcuts();

  return <>{children}</>;
}

export default KeyboardShortcutsProvider;
