"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signInWithEmail, signOut } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParticleCanvasV2 } from "@/components/hud/ParticleCanvasV2";
import { DEFAULT_CONFIG } from "@/lib/particle-config";
import { supabase } from "@/lib/supabase";
import "./admin-styles.css";

function AdminPageContent() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.toLowerCase();

  // Ensure we're mounted (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Enforce allowed email; stay on page instead of redirecting
  useEffect(() => {
    if (mounted && !isLoading && user) {
      const userEmail = user.email?.toLowerCase();
      if (allowedEmail && userEmail && userEmail !== allowedEmail && !signingOut) {
        setSigningOut(true);
        signOut()
          .catch((err) => console.error("[Admin] Sign out failed:", err))
          .finally(() => {
            setSigningOut(false);
            setError("Access restricted. Only authorized users can sign in.");
          });
      }
    }
  }, [mounted, user, isLoading, allowedEmail, signingOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Check allowed email before attempting login
      if (allowedEmail && email.toLowerCase() !== allowedEmail) {
        throw new Error("Access restricted. Only authorized users can sign in.");
      }
      await signInWithEmail(email, password);
      // Auth state will update via AuthProvider
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth or not mounted
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="font-mono text-dawn-50">Loading...</div>
      </div>
    );
  }

  // Check if Supabase is configured
  if (!supabase) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="admin-login-card">
          <div className="terminal-corner-br" />
          <div className="admin-header">
            <div className="admin-label">CONFIGURATION ERROR</div>
            <h1 className="admin-title">SETUP REQUIRED</h1>
          </div>
          <div className="error-message">
            Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.
          </div>
        </div>
      </div>
    );
  }

  const renderSignedIn = () => (
    <div className="min-h-screen bg-void relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0" style={{ opacity: 0.8 }}>
        <ParticleCanvasV2 scrollProgress={0.2} config={DEFAULT_CONFIG} />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="admin-login-card">
          <div className="terminal-corner-br" />
          <div className="admin-header">
            <div className="admin-label">ADMIN ACCESS</div>
            <h1 className="admin-title">AUTHENTICATION SUCCESSFUL</h1>
          </div>
          <div className="space-y-4">
            <div className="terminal-status">You are signed in as {user?.email}</div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.push("/")} className="btn-primary flex-1">
                Go to Site
              </button>
              <button
                type="button"
                onClick={() => {
                  setSigningOut(true);
                  signOut()
                    .catch((err) => console.error("[Admin] Sign out failed:", err))
                    .finally(() => setSigningOut(false));
                }}
                className="btn-secondary flex-1"
                disabled={signingOut}
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen bg-void relative flex items-center justify-center p-4 overflow-hidden">
      {/* Manifold background */}
      <div className="absolute inset-0 z-0" style={{ opacity: 0.8 }}>
        <ParticleCanvasV2 scrollProgress={0.2} config={DEFAULT_CONFIG} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="admin-login-card">
          <div className="terminal-corner-br" />
          <div className="admin-header">
            <div className="admin-label">ADMIN ACCESS</div>
            <h1 className="admin-title">AUTHENTICATION REQUIRED</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@domain.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );

  // Render signed-in view or login view
  if (user) {
    return renderSignedIn();
  }
  return renderLogin();
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-void flex items-center justify-center">
          <div className="font-mono text-dawn-50">Loading...</div>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
