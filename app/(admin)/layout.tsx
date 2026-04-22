"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

const PUBLIC_ADMIN_PATHS = ["/admin", "/admin/callback"];

/**
 * Layout for all admin-tier routes: /admin, /orrery, /astrogation.
 * The /admin login page itself is public (avoids redirect loop).
 * Other routes redirect unauthenticated visitors to /admin login in production.
 * In development, all routes pass through for easier local testing.
 */
export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_ADMIN_PATHS.includes(pathname);

  useEffect(() => {
    if (isLoading || isPublicPath) return;
    if (process.env.NODE_ENV === "development") return;

    if (!isAllowedUserEmail(user?.email)) {
      router.replace("/admin");
    }
  }, [user, isLoading, router, isPublicPath]);

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (isLoading) return null;

  if (process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  if (!isAllowedUserEmail(user?.email)) {
    return null;
  }

  return <>{children}</>;
}
