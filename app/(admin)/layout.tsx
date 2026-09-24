"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

const PUBLIC_ADMIN_PATHS = ["/admin", "/admin/callback"];

/**
 * Layout for all admin-tier routes: /admin, /orrery, /astrogation.
 * The /admin login page itself is public (avoids redirect loop).
 * Other routes redirect anyone but the allowlisted user to the /admin login —
 * in every environment. (The development pass-through went with the server's
 * bypass, ADR-003 amendment 2026-09-24: a dev server on the LAN with the
 * production key is the production database.)
 */
export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_ADMIN_PATHS.includes(pathname);

  useEffect(() => {
    if (isLoading || isPublicPath) return;

    if (!isAllowedUserEmail(user?.email)) {
      router.replace("/admin");
    }
  }, [user, isLoading, router, isPublicPath]);

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (isLoading) return null;

  if (!isAllowedUserEmail(user?.email)) {
    return null;
  }

  return <>{children}</>;
}
