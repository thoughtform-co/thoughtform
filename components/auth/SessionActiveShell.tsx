"use client";

import type { User } from "@supabase/supabase-js";

interface SessionActiveShellProps {
  user: User;
  onNavigateHome: () => void;
  onSignOut: () => void;
  className?: string;
}

export function SessionActiveShell({
  user,
  onNavigateHome,
  onSignOut,
  className = "",
}: SessionActiveShellProps) {
  return (
    <div className={`cel-auth ${className}`}>
      <div className="cel-auth__frame">
        <span className="cel-auth__corner cel-auth__corner--tl" />
        <span className="cel-auth__corner cel-auth__corner--tr" />
        <span className="cel-auth__corner cel-auth__corner--bl" />
        <span className="cel-auth__corner cel-auth__corner--br" />

        <div className="cel-auth__header">
          <span className="cel-auth__rule" />
          <span className="cel-auth__title">Session Active</span>
          <span className="cel-auth__rule" />
        </div>

        <div className="cel-auth__divider" aria-hidden="true">
          {"· ".repeat(24).trim()}
        </div>

        <div className="cel-auth__body">
          <div className="cel-session">
            <div className="cel-session__row">
              <span className="cel-session__key">Status</span>
              <span className="cel-session__val cel-session__val--ok">Authenticated</span>
            </div>
            <div className="cel-session__row">
              <span className="cel-session__key">Ident</span>
              <span className="cel-session__val">{user.email}</span>
            </div>
          </div>

          <div className="cel-auth__actions" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="cel-auth__btn cel-auth__btn--primary"
              onClick={onNavigateHome}
            >
              [Navigate Home]
            </button>
            <button
              type="button"
              className="cel-auth__btn cel-auth__btn--ghost"
              onClick={onSignOut}
            >
              [Terminate Session]
            </button>
          </div>
        </div>

        <div className="cel-auth__divider cel-auth__divider--bottom" aria-hidden="true">
          {"· ".repeat(24).trim()}
        </div>
      </div>
    </div>
  );
}
