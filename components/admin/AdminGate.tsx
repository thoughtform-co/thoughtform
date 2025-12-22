"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

interface AdminGateProps {
  children: React.ReactNode;
}

/**
 * AdminGate component that only renders children for authenticated admin users.
 *
 * Uses the centralized allowlist check from lib/auth/allowed-user.ts.
 * In development: Always shows admin panel for faster iteration.
 * In production: Only shows for the allowed email configured in NEXT_PUBLIC_ALLOWED_EMAIL.
 */
export function AdminGate({ children }: AdminGateProps) {
  const { user, isLoading } = useAuth();

  // In development, always show admin panel for easier testing
  if (process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  // Don't render anything while checking auth state
  if (isLoading) {
    return null;
  }

  // Only render children if user is the allowed admin
  if (!isAllowedUserEmail(user?.email)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Alternative: Simple local dev-only gate
 * Only shows admin panel in development mode
 */
export function DevOnlyGate({ children }: AdminGateProps) {
  // Check at render time - no need for state since NODE_ENV is static
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return <>{children}</>;
}
