"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParticleCanvasV2 } from "@/components/particles/ParticleCanvasV2";
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

/**
 * Reticle instrument — rotated square + crosshair + bearing arc.
 * Distinct from the Voidwalker orbit; reads as a targeting / auth lock
 * rather than an orbital portrait.
 */
function ReticleInstrument() {
  return (
    <div className="cel-reticle" aria-hidden="true">
      <svg
        className="cel-reticle__svg"
        viewBox="-200 -200 400 400"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* rotated square (diamond) — the primary frame */}
        <g transform="rotate(45)">
          <rect
            x="-125"
            y="-125"
            width="250"
            height="250"
            stroke="var(--gold)"
            strokeOpacity="0.22"
            strokeWidth="0.8"
            fill="none"
          />
          <rect
            x="-145"
            y="-145"
            width="290"
            height="290"
            stroke="var(--dawn-08)"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="2 6"
          />
        </g>

        {/* crosshair — horizontal + vertical meridians */}
        <g stroke="var(--gold)" strokeOpacity="0.25" strokeWidth="0.5">
          <line x1="-195" y1="0" x2="-140" y2="0" />
          <line x1="140" y1="0" x2="195" y2="0" />
          <line x1="0" y1="-195" x2="0" y2="-140" />
          <line x1="0" y1="140" x2="0" y2="195" />
        </g>

        {/* inner dawn crosshair close to terminal edges */}
        <g stroke="var(--dawn-30)" strokeWidth="0.5">
          <line x1="-130" y1="0" x2="-108" y2="0" />
          <line x1="108" y1="0" x2="130" y2="0" />
          <line x1="0" y1="-130" x2="0" y2="-108" />
          <line x1="0" y1="108" x2="0" y2="130" />
        </g>

        {/* bearing arc — top */}
        <g stroke="var(--gold)" strokeOpacity="0.3" strokeWidth="0.6">
          <path d="M -160 -100 A 188 188 0 0 1 160 -100" fill="none" />
        </g>
        <g stroke="var(--dawn-50)" strokeWidth="0.5">
          {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const r1 = 188;
            const r2 = deg % 30 === 0 ? 176 : 182;
            return (
              <line
                key={deg}
                x1={Math.cos(rad) * r1}
                y1={Math.sin(rad) * r1}
                x2={Math.cos(rad) * r2}
                y2={Math.sin(rad) * r2}
              />
            );
          })}
        </g>

        {/* bearing labels on arc */}
        <g
          fontFamily="var(--font-mono)"
          fontSize="7"
          fill="var(--dawn-40)"
          textAnchor="middle"
          letterSpacing="1.2"
        >
          <text x="0" y="-164">
            N · 000
          </text>
          <text x="-93" y="-138">
            330
          </text>
          <text x="93" y="-138">
            030
          </text>
        </g>

        {/* measurement ticks — bottom linear gauge */}
        <g stroke="var(--gold)" strokeOpacity="0.3" strokeWidth="0.5">
          <line x1="-140" y1="175" x2="140" y2="175" />
          {Array.from({ length: 21 }).map((_, i) => {
            const x = -140 + (i / 20) * 280;
            const isMajor = i % 5 === 0;
            return (
              <line
                key={i}
                x1={x}
                y1="175"
                x2={x}
                y2={isMajor ? 183 : 179}
                strokeOpacity={isMajor ? 0.5 : 0.25}
              />
            );
          })}
        </g>

        {/* diamond corner markers — gold ticks at the rotated square points */}
        <g fill="var(--gold)" fillOpacity="0.7">
          <circle cx="0" cy="-176" r="2" />
          <circle cx="176" cy="0" r="2" />
          <circle cx="0" cy="176" r="2" />
          <circle cx="-176" cy="0" r="2" />
        </g>

        {/* rotating drift mark — single slow pulse along the diamond */}
        <g className="cel-reticle__rotor">
          <rect
            x="-3"
            y="-179"
            width="6"
            height="6"
            fill="var(--gold)"
            transform="rotate(45 0 -176)"
          />
        </g>
      </svg>
    </div>
  );
}

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
        <div className="cel-login__stage">
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
      {/* Layer 0 — particle field */}
      <div className="cel-login__particles">
        <ParticleCanvasV2 scrollProgress={0.15} config={ADMIN_CONFIG} />
      </div>

      {/* Layer 1 — atmospheric wash */}
      <div className="cel-login__wash" aria-hidden="true" />

      {/* Viewport-anchored telemetry readouts (outside the instrument) */}
      <div className="cel-login__readout cel-login__readout--tl" aria-hidden="true">
        <span className="k">SUBJECT</span>
        <span className="v">AUTH · 0001</span>
      </div>
      <div className="cel-login__readout cel-login__readout--tr" aria-hidden="true">
        <span className="k">BEARING</span>
        <span className="v">N · 000 · LOCK</span>
      </div>
      <div className="cel-login__readout cel-login__readout--bl" aria-hidden="true">
        <span className="k">FIELD</span>
        <span className="v">TERMINAL</span>
      </div>
      <div className="cel-login__readout cel-login__readout--br" aria-hidden="true">
        <span className="k">MODE</span>
        <span className="v">NAVIGATE</span>
      </div>

      {/* Stage — reticle + terminal */}
      <div className="cel-login__stage">
        <div className="cel-login__instrument">
          <ReticleInstrument />
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
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="cel-login">
          <div className="cel-login__stage">
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
