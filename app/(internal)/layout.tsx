"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

/**
 * Layout for internal/dev routes: /test/*, /archive/*.
 * In production, blocks all traffic (redirects to /admin).
 * In development, passes through for local testing.
 */
export default function InternalGroupLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (process.env.NODE_ENV === "development") return;

    if (!isAllowedUserEmail(user?.email)) {
      router.replace("/admin");
    }
  }, [user, isLoading, router]);

  if (isLoading) return null;

  if (process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  if (!isAllowedUserEmail(user?.email)) {
    return null;
  }

  return <>{children}</>;
}
