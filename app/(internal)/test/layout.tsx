"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

/**
 * Layout for /test/* routes.
 * Gates all test pages behind admin authentication.
 * Redirects to /admin for login if not authenticated as the allowed user.
 */
export default function TestLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;

    // In development, allow access for easier testing
    if (process.env.NODE_ENV === "development") return;

    // If not the allowed user, redirect to admin login
    if (!isAllowedUserEmail(user?.email)) {
      router.replace("/admin");
    }
  }, [user, isLoading, router]);

  // Show nothing while loading or checking auth
  if (isLoading) {
    return null;
  }

  // In development, always render
  if (process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  // Only render if allowed user
  if (!isAllowedUserEmail(user?.email)) {
    return null;
  }

  return <>{children}</>;
}
