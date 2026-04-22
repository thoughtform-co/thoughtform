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
 * Orbital instrument surrounding the terminal — mirrors the Voidwalker
 * orbit grammar from the landing page about section.
 */
function OrbitalInstrument() {
  return (
    <div className="cel-login__orbit" aria-hidden="true">
      <svg
        className="cel-login__orbit-svg"
        viewBox="-200 -200 400 400"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* concentric rings */}
        <g fill="none" strokeWidth="0.7">
          <circle r="192" stroke="var(--dawn-15)" strokeDasharray="1 7" />
          <circle r="172" stroke="var(--dawn-08)" />
          <circle r="150" stroke="var(--gold)" strokeOpacity="0.18" strokeDasharray="2 8" />
          <circle r="124" stroke="var(--gold)" strokeOpacity="0.3" />
          <circle r="104" stroke="var(--gold)" strokeOpacity="0.15" strokeDasharray="1 3" />
          <circle r="82" stroke="var(--dawn-30)" strokeDasharray="1 4" />
        </g>

        {/* cardinal bearing ticks */}
        <g stroke="var(--dawn-50)" strokeWidth="0.8">
          <path d="M0 -192 L0 -178" />
          <path d="M0 192 L0 178" />
          <path d="M-192 0 L-178 0" />
          <path d="M192 0 L178 0" />
        </g>

        {/* fine bearing ticks */}
        <g stroke="var(--dawn-30)" strokeWidth="0.5">
          {[
            15, 30, 45, 60, 75, 105, 120, 135, 150, 165, 195, 210, 225, 240, 255, 285, 300, 315,
            330, 345,
          ].map((deg) => (
            <path key={deg} d="M0 -192 L0 -184" transform={`rotate(${deg})`} />
          ))}
        </g>

        {/* radial spokes */}
        <g stroke="var(--gold)" strokeOpacity="0.22" strokeWidth="0.5">
          <path d="M0 -150 L0 -82" />
          <path d="M0 150 L0 82" />
          <path d="M-150 0 L-82 0" />
          <path d="M150 0 L82 0" />
        </g>

        {/* rotating orbit nodes */}
        <g className="cel-login__orbit-rot cel-login__orbit-rot--slow">
          <circle cx="0" cy="-150" r="3.5" fill="var(--gold)" />
          <rect
            x="-3"
            y="147"
            width="6"
            height="6"
            fill="var(--gold)"
            transform="rotate(45 0 150)"
          />
        </g>
        <g className="cel-login__orbit-rot cel-login__orbit-rot--rev">
          <circle cx="172" cy="0" r="1.8" fill="var(--dawn)" opacity="0.6" />
          <circle cx="-172" cy="0" r="1.4" fill="var(--dawn)" opacity="0.4" />
        </g>
        <g className="cel-login__orbit-rot cel-login__orbit-rot--slowest">
          <circle cx="124" cy="0" r="1.6" fill="var(--gold)" opacity="0.7" />
        </g>

        {/* bearing labels */}
        <g
          fontFamily="var(--font-mono)"
          fontSize="8"
          fill="var(--dawn-50)"
          textAnchor="middle"
          letterSpacing="1.5"
        >
          <text x="0" y="-198">
            N · 000
          </text>
          <text x="198" y="3" textAnchor="start">
            090
          </text>
          <text x="0" y="205">
            180
          </text>
          <text x="-198" y="3" textAnchor="end">
            270
          </text>
        </g>

        {/* edge notes */}
        <g fontFamily="var(--font-mono)" fontSize="6" fill="var(--dawn-30)" letterSpacing="1.2">
          <text x="-188" y="-156">
            FIG · 04a
          </text>
          <text x="120" y="-172">
            AUTH · FIELD MAP
          </text>
          <text x="-188" y="178">
            CH · 01 / TERMINAL
          </text>
          <text x="120" y="188">
            ∂ · 0.001
          </text>
        </g>
      </svg>

      {/* static particle halo, sigil grammar */}
      <div className="cel-login__orbit-halo" aria-hidden="true">
        <span style={{ "--a": "12deg", "--r": "46%", "--o": 0.8 } as React.CSSProperties} />
        <span className="d" style={{ "--a": "38deg", "--r": "42%" } as React.CSSProperties} />
        <span style={{ "--a": "68deg", "--r": "48%", "--o": 0.6 } as React.CSSProperties} />
        <span className="d" style={{ "--a": "96deg", "--r": "40%" } as React.CSSProperties} />
        <span style={{ "--a": "126deg", "--r": "45%", "--o": 0.7 } as React.CSSProperties} />
        <span className="d" style={{ "--a": "158deg", "--r": "43%" } as React.CSSProperties} />
        <span style={{ "--a": "192deg", "--r": "47%", "--o": 0.9 } as React.CSSProperties} />
        <span className="d" style={{ "--a": "224deg", "--r": "41%" } as React.CSSProperties} />
        <span style={{ "--a": "256deg", "--r": "46%", "--o": 0.6 } as React.CSSProperties} />
        <span className="d" style={{ "--a": "288deg", "--r": "44%" } as React.CSSProperties} />
        <span style={{ "--a": "318deg", "--r": "48%", "--o": 0.75 } as React.CSSProperties} />
        <span className="d" style={{ "--a": "348deg", "--r": "42%" } as React.CSSProperties} />
      </div>

      {/* corner readouts */}
      <div className="cel-login__readout cel-login__readout--tl">
        <span className="k">SUBJECT</span>
        <br />
        AUTH · 0001
      </div>
      <div className="cel-login__readout cel-login__readout--tr">
        <span className="k">BEARING</span>
        <br />N · 000 · lock
      </div>
      <div className="cel-login__readout cel-login__readout--bl">
        <span className="k">FIELD</span>
        <br />
        TERMINAL
      </div>
      <div className="cel-login__readout cel-login__readout--br">
        <span className="k">MODE</span>
        <br />
        navigate
      </div>
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
      {/* Layer 0 — living particle field */}
      <div className="cel-login__particles">
        <ParticleCanvasV2 scrollProgress={0.15} config={ADMIN_CONFIG} />
      </div>

      {/* Layer 1 — atmospheric wash */}
      <div className="cel-login__wash" aria-hidden="true" />

      {/* Layer 10 — centered stage with orbital instrument around the terminal */}
      <div className="cel-login__stage">
        <div className="cel-login__instrument">
          <OrbitalInstrument />
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
