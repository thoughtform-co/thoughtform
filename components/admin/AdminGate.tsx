"use client";

import { useEffect, useState } from "react";

interface AdminGateProps {
  children: React.ReactNode;
}

/**
 * AdminGate component that only renders children for authenticated admin users.
 * 
 * In development: Always shows admin panel
 * In production: Checks for Vercel authentication
 * 
 * Note: Full Vercel Auth integration requires:
 * 1. Enable Vercel Authentication in project settings
 * 2. Configure which paths require auth
 * 3. Vercel automatically sets auth headers for authenticated users
 */
export function AdminGate({ children }: AdminGateProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      // In development, always show admin panel
      if (process.env.NODE_ENV === "development") {
        setIsAdmin(true);
        setIsChecking(false);
        return;
      }

      // In production, check for admin cookie/header
      // This is set by Vercel Auth when a team member is logged in
      try {
        // Check if user has admin access by trying to access the config endpoint
        // The endpoint will return 401 if not authorized
        const response = await fetch("/api/particles/config", {
          method: "HEAD",
        });
        
        // If we can access it, user is authorized
        // Note: In production, you might want a dedicated auth check endpoint
        setIsAdmin(response.ok);
      } catch {
        setIsAdmin(false);
      }
      
      setIsChecking(false);
    }

    checkAdmin();
  }, []);

  // Don't render anything while checking
  if (isChecking) {
    return null;
  }

  // Only render children if user is admin
  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Alternative: Simple local dev-only gate
 * Only shows admin panel in development mode
 */
export function DevOnlyGate({ children }: AdminGateProps) {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === "development");
  }, []);

  if (!isDev) {
    return null;
  }

  return <>{children}</>;
}

