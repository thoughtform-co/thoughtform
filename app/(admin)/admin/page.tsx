"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, signOut } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParticleCanvasV2 } from "@/components/particles/ParticleCanvasV2";
import { ThoughtformSigil } from "@/components/particles/ThoughtformSigil";
import { DEFAULT_CONFIG, ParticleSystemConfig } from "@/lib/particle-config";
import { supabase } from "@/lib/supabase";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import "./admin-styles.css";

// Custom config for admin page - manifold only, no Lorenz attractor
const ADMIN_CONFIG: ParticleSystemConfig = {
  ...DEFAULT_CONFIG,
  landmarks: DEFAULT_CONFIG.landmarks.map((landmark) => ({
    ...landmark,
    enabled: false,
  })),
};

function AdminPageContent() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user && emailRef.current) {
      emailRef.current.focus();
    }
  }, [mounted, isLoading, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return;

    if (!isAllowedUserEmail(email)) {
      setError("ACCESS DENIED: Unauthorized user");
      return;
    }

    if (!password.trim()) return;

    setIsAuthenticating(true);

    try {
      await signInWithEmail(email, password);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMsg);
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setEmail("");
    setPassword("");
  };

  // Loading state
  if (!mounted || isLoading) {
    return (
      <div className="admin-container">
        <div className="admin-background">
          <ParticleCanvasV2 scrollProgress={0.15} config={ADMIN_CONFIG} />
        </div>
        <div className="admin-sigil">
          <ThoughtformSigil
            size={600}
            color="202, 165, 84"
            particleCount={600}
            scrollProgress={1}
            particleSize={1.5}
            opacity={0.8}
            wanderStrength={0.8}
          />
        </div>
        <div className="login-panel">
          <div className="panel-content">
            <div className="status-text">Initializing</div>
          </div>
        </div>
      </div>
    );
  }

  // No Supabase configured
  if (!supabase) {
    return (
      <div className="admin-container">
        <div className="admin-background">
          <ParticleCanvasV2 scrollProgress={0.15} config={DEFAULT_CONFIG} />
        </div>
        <div className="login-panel">
          <div className="panel-content">
            <div className="error-text">FATAL: Supabase not configured</div>
          </div>
        </div>
      </div>
    );
  }

  // Logged in state
  if (user) {
    return (
      <div className="admin-container">
        <div className="admin-background">
          <ParticleCanvasV2 scrollProgress={0.15} config={ADMIN_CONFIG} />
        </div>
        <div className="admin-sigil">
          <ThoughtformSigil
            size={600}
            color="202, 165, 84"
            particleCount={600}
            scrollProgress={1}
            particleSize={1.5}
            opacity={0.8}
            wanderStrength={0.8}
          />
        </div>
        <div className="login-panel">
          <div className="corner corner-tl" />
          <div className="corner corner-tr" />
          <div className="corner corner-bl" />
          <div className="corner corner-br" />

          <div className="panel-header">
            <span className="header-line" />
            <span className="header-title">Session Active</span>
            <span className="header-line" />
          </div>

          <div className="decorative-row">■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■</div>

          <div className="panel-content">
            <div className="welcome-text">
              <strong>Welcome back</strong> — Authenticated as {user.email}
            </div>

            <div className="action-buttons">
              <button onClick={() => router.push("/")} className="panel-button">
                [Home]
              </button>
              <button onClick={handleSignOut} className="panel-button">
                [Sign Out]
              </button>
            </div>
          </div>

          <div className="decorative-row bottom">■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■</div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="admin-container">
      <div className="admin-background">
        <ParticleCanvasV2 scrollProgress={0.15} config={ADMIN_CONFIG} />
      </div>

      <div className="admin-sigil">
        <ThoughtformSigil
          size={600}
          color="202, 165, 84"
          particleCount={600}
          scrollProgress={1}
          particleSize={1.5}
          opacity={0.8}
          wanderStrength={0.8}
        />
      </div>

      <div className="login-panel">
        <div className="corner corner-tl" />
        <div className="corner corner-tr" />
        <div className="corner corner-bl" />
        <div className="corner corner-br" />

        {/* Header */}
        <div className="panel-header">
          <span className="header-line" />
          <span className="header-title">Connection Established</span>
          <span className="header-line" />
        </div>

        {/* Top decorative row */}
        <div className="decorative-row">■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■</div>

        {/* Main content */}
        <div className="panel-content">
          <div className="welcome-text">
            <strong>Welcome to Thoughtform</strong> — Enter your credentials to access the admin
            console.
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-row">
              <label className="form-label">Login:</label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="form-input"
                autoComplete="email"
                disabled={isAuthenticating}
              />
            </div>

            <div className="form-row">
              <label className="form-label">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                autoComplete="current-password"
                disabled={isAuthenticating}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={isAuthenticating}>
              {isAuthenticating ? "[Authenticating...]" : "[Login]"}
            </button>
          </form>
        </div>

        {/* Bottom decorative row */}
        <div className="decorative-row bottom">■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-container">
          <div className="login-panel">
            <div className="panel-content">
              <div className="status-text">Loading...</div>
            </div>
          </div>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
