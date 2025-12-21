"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { signInWithMagicLink, signOut } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParticleCanvasV2 } from "@/components/hud/ParticleCanvasV2";
import { DEFAULT_CONFIG } from "@/lib/particle-config";
import { supabase } from "@/lib/supabase";
import "./admin-styles.css";

// Separate component that uses searchParams to avoid blocking Suspense
function AdminPageWithParams() {
  const searchParams = useSearchParams();
  return <AdminPageContent searchParams={searchParams} />;
}

function AdminPageContent({ searchParams }: { searchParams: URLSearchParams | null }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.toLowerCase();

  // Ensure we're mounted (client-side only)
  useEffect(() => {
    setMounted(true);
    console.log("[Admin] Page mounted, supabase configured:", !!supabase);
    console.log("[Admin] Auth state - isLoading:", isLoading, "user:", !!user);
  }, [isLoading, user]);

  // Handle Supabase auth callback (magic link redirects with hash fragments)
  useEffect(() => {
    if (!mounted || !supabase) return;

    try {
      // Check for hash fragments from Supabase redirect
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const error = hashParams.get("error");
      const errorDescription = hashParams.get("error_description");

      if (error) {
        setError(errorDescription || "Authentication failed. Please try again.");
        // Clean up URL
        window.history.replaceState({}, document.title, "/admin");
        return;
      }

      if (accessToken) {
        // Supabase will automatically handle the session via the client
        // Just wait for AuthProvider to update
        // Clean up URL
        window.history.replaceState({}, document.title, "/admin");
      }

      // Check for error in URL params (from server redirect)
      const urlError = searchParams?.get("error");
      if (urlError === "auth") {
        setError("Authentication failed. Please try again.");
      } else if (urlError === "config") {
        setError("Configuration error. Please check your environment variables.");
      }
    } catch (err) {
      console.error("[Admin] Error processing auth callback:", err);
    }
  }, [mounted, searchParams]);

  // Enforce allowed email; stay on page instead of redirecting
  useEffect(() => {
    if (mounted && !isLoading && user) {
      const userEmail = user.email?.toLowerCase();
      if (allowedEmail && userEmail && userEmail !== allowedEmail && !signingOut) {
        console.log("[Admin] User email not allowed, signing out", userEmail);
        setSigningOut(true);
        signOut()
          .catch((err) => console.error("[Admin] Sign out failed:", err))
          .finally(() => {
            setSigningOut(false);
            setError("Access restricted. Please sign in with an authorized email.");
          });
        return;
      }
      console.log("[Admin] User is logged in and allowed", user.email);
    } else {
      console.log(
        "[Admin] Not redirecting - mounted:",
        mounted,
        "isLoading:",
        isLoading,
        "user:",
        !!user
      );
    }
  }, [mounted, user, isLoading, router, allowedEmail, signingOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSending(true);

    try {
      await signInWithMagicLink(email);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setIsSending(false);
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
          <div className="admin-header">
            <div className="admin-label">{`// Configuration Error`}</div>
            <h1 className="admin-title">Setup Required</h1>
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
          <div className="admin-header">
            <div className="admin-label">{`// Admin Access`}</div>
            <h1 className="admin-title">Signed In</h1>
          </div>
          <div className="space-y-4">
            <div className="font-mono text-sm text-dawn">You are signed in as {user?.email}</div>
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
      {/* Manifold background in the distance */}
      <div className="absolute inset-0 z-0" style={{ opacity: 0.8 }}>
        <ParticleCanvasV2 scrollProgress={0.2} config={DEFAULT_CONFIG} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="admin-login-card">
          {/* Header */}
          <div className="admin-header">
            <div className="admin-label">{`// Admin Access`}</div>
            <h1 className="admin-title">Sign In</h1>
          </div>

          {emailSent ? (
            <div className="email-sent-content space-y-4">
              <div>
                <div className="email-sent-title">Check your email</div>
                <p className="email-sent-text">
                  We sent a magic link to <strong>{email}</strong>
                </p>
                <p className="email-sent-hint">Click the link in the email to sign in.</p>
              </div>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="btn-secondary w-full"
              >
                Use Different Email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              {/* Error */}
              {error && <div className="error-message">{error}</div>}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSending} className="btn-primary flex-1">
                  {isSending ? "Sending..." : "Send Magic Link"}
                </button>
              </div>
            </form>
          )}
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
      <AdminPageWithParams />
    </Suspense>
  );
}
