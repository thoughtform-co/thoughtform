"use client";

import { useState, useRef, useEffect } from "react";
import { signInWithEmail, signInWithMagicLink } from "@/lib/auth";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import { TerminalReveal } from "@/components/ui/TerminalReveal";

type AuthMode = "password" | "magic-link";
type AuthStatus = "idle" | "authenticating" | "magic-link-sent" | "error";

interface CelestialAuthShellProps {
  variant?: "full" | "compact";
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function CelestialAuthShell({
  variant = "full",
  onSuccess,
  onCancel,
  className = "",
}: CelestialAuthShellProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && emailRef.current) {
      emailRef.current.focus();
    }
  }, [mounted, authMode]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return;

    if (!isAllowedUserEmail(email)) {
      setError("ACCESS DENIED — Unauthorized frequency");
      return;
    }

    if (!password.trim()) return;

    setStatus("authenticating");

    try {
      await signInWithEmail(email, password);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
      setStatus("error");
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return;

    if (!isAllowedUserEmail(email)) {
      setError("ACCESS DENIED — Unauthorized frequency");
      return;
    }

    setStatus("authenticating");

    try {
      await signInWithMagicLink(email);
      setStatus("magic-link-sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transmission failed";
      setError(msg);
      setStatus("error");
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError(null);
    setPassword("");
    setStatus("idle");
  };

  const isCompact = variant === "compact";

  if (status === "magic-link-sent") {
    return (
      <div className={`cel-auth ${isCompact ? "cel-auth--compact" : ""} ${className}`}>
        <div className="cel-auth__frame">
          <span className="cel-auth__corner cel-auth__corner--tl" />
          <span className="cel-auth__corner cel-auth__corner--tr" />
          <span className="cel-auth__corner cel-auth__corner--bl" />
          <span className="cel-auth__corner cel-auth__corner--br" />

          <div className="cel-auth__header">
            <span className="cel-auth__rule" />
            <span className="cel-auth__title">Transmission Sent</span>
            <span className="cel-auth__rule" />
          </div>

          <div className="cel-auth__divider" aria-hidden="true">
            {"· ".repeat(24).trim()}
          </div>

          <div className="cel-auth__body">
            <div className="cel-auth__beacon">
              <svg viewBox="0 0 48 48" className="cel-auth__beacon-icon" aria-hidden="true">
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  stroke="var(--gold-30)"
                  strokeWidth="1"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="10"
                  fill="none"
                  stroke="var(--gold-50)"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
                <circle cx="24" cy="24" r="3" fill="var(--gold)" />
              </svg>
            </div>
            <p className="cel-auth__sent-msg">
              <TerminalReveal
                text={`Navigation beacon transmitted to ${email}. Check your inbox and follow the link to establish a session.`}
                triggered={true}
                speed={18}
                iterations={1}
              />
            </p>
            <button
              type="button"
              className="cel-auth__btn cel-auth__btn--ghost"
              onClick={() => {
                setStatus("idle");
                setAuthMode("password");
              }}
            >
              [Return to Terminal]
            </button>
          </div>

          <div className="cel-auth__divider cel-auth__divider--bottom" aria-hidden="true">
            {"· ".repeat(24).trim()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cel-auth ${isCompact ? "cel-auth--compact" : ""} ${className}`}>
      <div className="cel-auth__frame">
        <span className="cel-auth__corner cel-auth__corner--tl" />
        <span className="cel-auth__corner cel-auth__corner--tr" />
        <span className="cel-auth__corner cel-auth__corner--bl" />
        <span className="cel-auth__corner cel-auth__corner--br" />

        <div className="cel-auth__scanlines" />

        <div className="cel-auth__header">
          <span className="cel-auth__rule" />
          <span className="cel-auth__title">
            {authMode === "password" ? "Credential Terminal" : "Beacon Request"}
          </span>
          <span className="cel-auth__rule" />
        </div>

        <div className="cel-auth__mode-switch">
          <button
            type="button"
            className={`cel-auth__mode-btn ${authMode === "password" ? "cel-auth__mode-btn--active" : ""}`}
            onClick={() => switchMode("password")}
          >
            Password
          </button>
          <span className="cel-auth__mode-sep">/</span>
          <button
            type="button"
            className={`cel-auth__mode-btn ${authMode === "magic-link" ? "cel-auth__mode-btn--active" : ""}`}
            onClick={() => switchMode("magic-link")}
          >
            Magic Link
          </button>
        </div>

        <div className="cel-auth__divider" aria-hidden="true">
          {"· ".repeat(24).trim()}
        </div>

        <div className="cel-auth__body">
          <form
            onSubmit={authMode === "password" ? handlePasswordLogin : handleMagicLink}
            className="cel-auth__form"
          >
            <div className="cel-auth__field">
              <label className="cel-auth__label">Ident</label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="navigator@example.com"
                className="cel-auth__input"
                autoComplete="email"
                disabled={status === "authenticating"}
              />
            </div>

            {authMode === "password" && (
              <div className="cel-auth__field">
                <label className="cel-auth__label">Cipher</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="cel-auth__input"
                  autoComplete="current-password"
                  disabled={status === "authenticating"}
                />
              </div>
            )}

            {error && (
              <div className="cel-auth__error">
                <span className="cel-auth__error-marker">!</span>
                {error}
              </div>
            )}

            <div className="cel-auth__actions">
              {onCancel && (
                <button
                  type="button"
                  className="cel-auth__btn cel-auth__btn--ghost"
                  onClick={onCancel}
                >
                  [Cancel]
                </button>
              )}
              <button
                type="submit"
                className="cel-auth__btn cel-auth__btn--primary"
                disabled={status === "authenticating"}
              >
                {status === "authenticating"
                  ? "[Transmitting...]"
                  : authMode === "password"
                    ? "[Authenticate]"
                    : "[Send Beacon]"}
              </button>
            </div>
          </form>
        </div>

        <div className="cel-auth__divider cel-auth__divider--bottom" aria-hidden="true">
          {"· ".repeat(24).trim()}
        </div>
      </div>
    </div>
  );
}
