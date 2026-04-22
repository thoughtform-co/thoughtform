"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParticleCanvasV2 } from "@/components/particles/ParticleCanvasV2";
import { ThoughtformSigil } from "@/components/particles/ThoughtformSigil";
import { DEFAULT_CONFIG, ParticleSystemConfig } from "@/lib/particle-config";
import { supabase } from "@/lib/supabase";
import { CelestialAuthShell } from "@/components/auth/CelestialAuthShell";
import { SessionActiveShell } from "@/components/auth/SessionActiveShell";
import "@/components/auth/celestial-auth.css";
import "./admin-styles.css";

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

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user && !isLoading && !supabase) {
    return (
      <div className="cel-login">
        <div className="cel-login__particles">
          <ParticleCanvasV2 scrollProgress={0.15} config={DEFAULT_CONFIG} />
        </div>
        <div className="cel-login__terminal">
          <div className="cel-auth">
            <div className="cel-auth__frame">
              <div className="cel-auth__body">
                <div className="cel-auth__error">
                  <span className="cel-auth__error-marker">!</span>
                  FATAL — Navigation system offline. Supabase not configured.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isReady = !isLoading;

  return (
    <div className="cel-login">
      {/* Layer 0 — living particle field */}
      <div className="cel-login__particles">
        <ParticleCanvasV2 scrollProgress={0.15} config={ADMIN_CONFIG} />
      </div>

      {/* Layer 1 — sigil glow */}
      <div className="cel-login__sigil">
        <ThoughtformSigil
          size={600}
          color="202, 165, 84"
          particleCount={600}
          scrollProgress={1}
          particleSize={1.5}
          opacity={0.7}
          wanderStrength={0.8}
        />
      </div>

      {/* Layer 2 — atmospheric washes */}
      <div className="cel-login__wash" aria-hidden="true" />

      {/* Layer 3 — decorative HUD rail (left) */}
      <aside className="cel-login__rail cel-login__rail--left" aria-hidden="true">
        <div className="cel-login__rail-guide" />
        {Array.from({ length: 21 }).map((_, i) => (
          <div
            key={i}
            className={`cel-login__tick ${i % 5 === 0 ? "cel-login__tick--major" : ""}`}
            style={{ top: `${(i / 20) * 100}%` }}
          />
        ))}
      </aside>

      {/* Layer 3 — decorative HUD rail (right) */}
      <aside className="cel-login__rail cel-login__rail--right" aria-hidden="true">
        <div className="cel-login__rail-guide" />
        {Array.from({ length: 21 }).map((_, i) => (
          <div
            key={i}
            className={`cel-login__tick ${i % 5 === 0 ? "cel-login__tick--major" : ""}`}
            style={{ top: `${(i / 20) * 100}%` }}
          />
        ))}
      </aside>

      {/* Layer 4 — celestial diagram */}
      <div className="cel-login__diagram" aria-hidden="true">
        <svg viewBox="0 0 280 280" className="cel-login__diagram-svg">
          {/* Outer orbital ring */}
          <circle cx="140" cy="140" r="130" fill="none" stroke="var(--gold-10)" strokeWidth="0.5" />
          {/* Inner orbital ring */}
          <circle
            cx="140"
            cy="140"
            r="90"
            fill="none"
            stroke="var(--gold-15)"
            strokeWidth="0.5"
            strokeDasharray="6 4"
          />
          {/* Mid ring */}
          <circle cx="140" cy="140" r="50" fill="none" stroke="var(--gold-10)" strokeWidth="0.5" />
          {/* Rotated square frame */}
          <rect
            x="100"
            y="100"
            width="80"
            height="80"
            fill="none"
            stroke="var(--gold-15)"
            strokeWidth="0.5"
            transform="rotate(45 140 140)"
          />
          {/* Cross meridians */}
          <line x1="140" y1="10" x2="140" y2="270" stroke="var(--gold-08)" strokeWidth="0.5" />
          <line x1="10" y1="140" x2="270" y2="140" stroke="var(--gold-08)" strokeWidth="0.5" />
          {/* Bearing ticks on meridians */}
          {[30, 60, 90, 120, 180, 210, 240, 250].map((y) => (
            <line
              key={`h-${y}`}
              x1="136"
              y1={y}
              x2="144"
              y2={y}
              stroke="var(--gold-15)"
              strokeWidth="0.5"
            />
          ))}
          {[30, 60, 90, 120, 180, 210, 240, 250].map((x) => (
            <line
              key={`v-${x}`}
              x1={x}
              y1="136"
              x2={x}
              y2="144"
              stroke="var(--gold-15)"
              strokeWidth="0.5"
            />
          ))}
          {/* Compass diamond */}
          <rect
            x="135"
            y="135"
            width="10"
            height="10"
            fill="var(--gold-20)"
            stroke="var(--gold-40)"
            strokeWidth="0.5"
            transform="rotate(45 140 140)"
          />
          {/* Orbital markers */}
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 140 + Math.cos(rad) * 90;
            const cy = 140 + Math.sin(rad) * 90;
            return (
              <circle
                key={deg}
                cx={cx}
                cy={cy}
                r="2"
                fill="none"
                stroke="var(--gold-30)"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Layer 5 — corner brackets */}
      <div className="cel-login__corner cel-login__corner--tl" aria-hidden="true" />
      <div className="cel-login__corner cel-login__corner--tr" aria-hidden="true" />
      <div className="cel-login__corner cel-login__corner--bl" aria-hidden="true" />
      <div className="cel-login__corner cel-login__corner--br" aria-hidden="true" />

      {/* Telemetry labels */}
      <div className="cel-login__telemetry cel-login__telemetry--tl" aria-hidden="true">
        <span className="cel-login__tele-rule" />
        <span className="cel-login__tele-label">Sector 01</span>
      </div>
      <div className="cel-login__telemetry cel-login__telemetry--br" aria-hidden="true">
        <span className="cel-login__tele-label">Auth Terminal</span>
        <span className="cel-login__tele-rule" />
      </div>

      {/* Layer 10 — terminal content */}
      <div className="cel-login__terminal">
        {!isReady ? (
          <div className="cel-auth">
            <div className="cel-auth__frame">
              <div className="cel-auth__body">
                <p className="cel-auth__sent-msg">Initializing navigation systems...</p>
              </div>
            </div>
          </div>
        ) : user ? (
          <SessionActiveShell
            user={user}
            onNavigateHome={() => router.push("/")}
            onSignOut={handleSignOut}
          />
        ) : (
          <CelestialAuthShell variant="full" />
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="cel-login">
          <div className="cel-login__terminal">
            <div className="cel-auth">
              <div className="cel-auth__frame">
                <div className="cel-auth__body">
                  <p className="cel-auth__sent-msg">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
