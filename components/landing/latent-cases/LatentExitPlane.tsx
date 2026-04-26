"use client";

/**
 * Centered “latent dock” plane — appears at the far end of the wormhole before
 * case cards fan into orbit. Purely decorative SVG (no pointer events).
 */
interface LatentExitPlaneProps {
  /** 0..1 — opacity / line weight of the plane graphic */
  intensity: number;
  reduceMotion: boolean;
}

export function LatentExitPlane({ intensity, reduceMotion }: LatentExitPlaneProps) {
  const o = Math.max(0, Math.min(1, intensity));

  return (
    <div
      className={`latent-exit-plane${reduceMotion ? " latent-exit-plane--static" : ""}`}
      style={{ opacity: o }}
      aria-hidden="true"
    >
      <svg
        className="latent-exit-plane__svg"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="latentExitPlaneGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.14" />
            <stop offset="70%" stopColor="var(--dawn)" stopOpacity="0.02" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="800" cy="450" rx="340" ry="200" fill="url(#latentExitPlaneGlow)" />

        <g stroke="var(--dawn)" strokeOpacity={0.06 + o * 0.1} strokeWidth="0.45" fill="none">
          {[-280, -200, -120, -60, 0, 60, 120, 200, 280].map((dx) => {
            const x1 = 800 + dx;
            return <line key={`v-${dx}`} x1={x1} y1="120" x2="800" y2="450" />;
          })}
          {[180, 240, 300, 360, 420, 480, 540, 600, 660].map((y) => (
            <line key={`h-${y}`} x1="200" y1={y} x2="1400" y2={y} strokeDasharray="2 10" />
          ))}
        </g>

        <ellipse
          cx="800"
          cy="450"
          rx={260 + o * 20}
          ry={125 + o * 10}
          fill="none"
          stroke="var(--gold)"
          strokeOpacity={0.12 + o * 0.28}
          strokeWidth="1.2"
          strokeDasharray="4 10"
        />
        <ellipse
          cx="800"
          cy="450"
          rx={220}
          ry={105}
          fill="none"
          stroke="var(--dawn)"
          strokeOpacity={0.08 + o * 0.12}
          strokeWidth="0.5"
        />

        {[
          { x: 800, y: 450, rot: 0 },
          { x: 620, y: 455, rot: -12 },
          { x: 980, y: 455, rot: 12 },
          { x: 800, y: 560, rot: 0 },
        ].map((m, i) => (
          <g key={i} transform={`translate(${m.x} ${m.y}) rotate(${m.rot})`}>
            <rect
              x="-5"
              y="-5"
              width="10"
              height="10"
              fill="none"
              stroke="var(--gold)"
              strokeOpacity={0.2 + o * 0.45}
              strokeWidth="0.6"
              transform="rotate(45)"
            />
            <line
              x1="-14"
              y1="0"
              x2="14"
              y2="0"
              stroke="var(--dawn)"
              strokeOpacity={0.12}
              strokeWidth="0.35"
            />
            <line
              x1="0"
              y1="-14"
              x2="0"
              y2="14"
              stroke="var(--dawn)"
              strokeOpacity={0.12}
              strokeWidth="0.35"
            />
          </g>
        ))}

        <g stroke="var(--gold)" strokeOpacity={0.15 + o * 0.2} strokeWidth="0.7" fill="none">
          <path d="M 680 380 L 680 360 L 700 360" />
          <path d="M 920 380 L 920 360 L 900 360" />
          <path d="M 680 520 L 680 540 L 700 540" />
          <path d="M 920 520 L 920 540 L 900 540" />
        </g>
      </svg>
    </div>
  );
}
