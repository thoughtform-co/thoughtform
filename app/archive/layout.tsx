"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
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

  if (!isAllowedUserEmail(user?.email)) return null;

  return <>{children}</>;
}
