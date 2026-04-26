"use client";

import { useMemo } from "react";

interface LatentTopologyProps {
  /** 0..1 fade-in for the whole layer */
  emerge: number;
  /** 0..1 cycle for slow drift */
  drift: number;
  reduceMotion: boolean;
}

interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
}

// Deterministic LCG so the starfield is stable across renders / SSR.
function generateStars(count: number, seed: number): Star[] {
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const stars: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: next() * 1600,
      y: next() * 900,
      r: 0.4 + next() * 1.5,
      o: 0.18 + next() * 0.55,
    });
  }
  return stars;
}

const RINGS = [120, 200, 300, 420, 560, 720, 900];
const RING_OPACITIES = [0.28, 0.22, 0.18, 0.14, 0.1, 0.07, 0.04];
const SPOKE_ANGLES = [
  0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5,
];

const CONSTELLATIONS = [
  "M 220 210 L 360 270 L 510 230 L 680 320 L 820 280",
  "M 1080 180 L 1220 250 L 1360 200 L 1480 290",
  "M 200 700 L 360 650 L 500 720 L 640 670 L 800 740",
  "M 1100 720 L 1260 680 L 1380 740",
];

const ORBITAL_MARKERS = [
  { x: 380, y: 320, r: 2.2 },
  { x: 1180, y: 360, r: 1.8 },
  { x: 520, y: 620, r: 2.0 },
  { x: 1080, y: 600, r: 2.4 },
  { x: 720, y: 240, r: 1.4 },
  { x: 920, y: 660, r: 1.6 },
];

export function LatentTopology({ emerge, drift, reduceMotion }: LatentTopologyProps) {
  const stars = useMemo(() => generateStars(160, 12345), []);
  const fineStars = useMemo(() => generateStars(220, 9876), []);

  const driftDeg = reduceMotion ? 0 : (drift - 0.5) * 12;
  const driftPx = reduceMotion ? 0 : (drift - 0.5) * 24;

  return (
    <div
      className="latent-topology"
      style={{
        opacity: emerge,
      }}
      aria-hidden="true"
    >
      {/* Far starfield — slow drift opposite to mid layer for depth parallax */}
      <svg
        className="latent-topology__layer latent-topology__layer--far"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ transform: `translate3d(${-driftPx * 0.4}px, ${-driftPx * 0.2}px, 0)` }}
      >
        <g fill="var(--dawn)">
          {fineStars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.55} opacity={s.o * 0.45} />
          ))}
        </g>
      </svg>

      {/* Mid layer — perspective rings + spokes + starfield */}
      <svg
        className="latent-topology__layer latent-topology__layer--mid"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ transform: `rotate(${driftDeg * 0.1}deg) translate3d(${driftPx * 0.6}px, 0, 0)` }}
      >
        {/* Concentric perspective rings (ellipses suggesting depth) */}
        <g fill="none" stroke="var(--dawn)" strokeWidth="0.5">
          {RINGS.map((r, i) => (
            <ellipse
              key={r}
              cx="800"
              cy="450"
              rx={r}
              ry={r * 0.42}
              opacity={RING_OPACITIES[i]}
              strokeDasharray={i % 2 === 0 ? "1 6" : undefined}
            />
          ))}
        </g>

        {/* Gold accent ring at the “horizon” depth */}
        <ellipse
          cx="800"
          cy="450"
          rx={420}
          ry={420 * 0.42}
          fill="none"
          stroke="var(--gold)"
          strokeOpacity="0.22"
          strokeWidth="0.7"
          strokeDasharray="2 8"
        />

        {/* Radial spokes converging to vanishing point */}
        <g stroke="var(--dawn)" strokeOpacity="0.05" strokeWidth="0.4">
          {SPOKE_ANGLES.map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const r = 900;
            const x2 = 800 + Math.cos(rad) * r;
            const y2 = 450 + Math.sin(rad) * r * 0.42;
            return <line key={angle} x1="800" y1="450" x2={x2} y2={y2} />;
          })}
        </g>

        {/* Compass cardinal lines */}
        <g stroke="var(--gold)" strokeOpacity="0.18" strokeWidth="0.6">
          <line x1="0" y1="450" x2="1600" y2="450" />
          <line x1="800" y1="0" x2="800" y2="900" />
        </g>

        {/* Starfield */}
        <g fill="var(--dawn)">
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
          ))}
        </g>

        {/* Orbital markers — small diamonds suggesting moving probes */}
        <g fill="var(--gold)" fillOpacity="0.55">
          {ORBITAL_MARKERS.map((m, i) => (
            <rect
              key={i}
              x={m.x - m.r}
              y={m.y - m.r}
              width={m.r * 2}
              height={m.r * 2}
              transform={`rotate(45 ${m.x} ${m.y})`}
            />
          ))}
        </g>

        {/* Constellation lines */}
        <g
          stroke="var(--gold)"
          strokeOpacity="0.18"
          strokeWidth="0.5"
          fill="none"
          strokeLinecap="round"
        >
          {CONSTELLATIONS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* Connection nodes on constellation paths */}
        <g fill="var(--dawn)" fillOpacity="0.55">
          <circle cx="220" cy="210" r="1.6" />
          <circle cx="510" cy="230" r="1.4" />
          <circle cx="820" cy="280" r="1.6" />
          <circle cx="1080" cy="180" r="1.4" />
          <circle cx="1360" cy="200" r="1.6" />
          <circle cx="200" cy="700" r="1.4" />
          <circle cx="500" cy="720" r="1.6" />
          <circle cx="800" cy="740" r="1.4" />
          <circle cx="1100" cy="720" r="1.6" />
        </g>
      </svg>

      {/* Foreground HUD-style trace lines */}
      <svg
        className="latent-topology__layer latent-topology__layer--near"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ transform: `translate3d(${driftPx * 1.3}px, 0, 0)` }}
      >
        <g stroke="var(--dawn)" strokeOpacity="0.08" strokeWidth="0.35" fill="none">
          <path d="M 60 80 L 60 200 L 220 200" />
          <path d="M 1540 80 L 1540 200 L 1380 200" />
          <path d="M 60 820 L 60 700 L 220 700" />
          <path d="M 1540 820 L 1540 700 L 1380 700" />
        </g>

        {/* Crosshair tick marks at the corners */}
        <g stroke="var(--gold)" strokeOpacity="0.35" strokeWidth="0.6">
          <line x1="60" y1="60" x2="86" y2="60" />
          <line x1="60" y1="60" x2="60" y2="86" />
          <line x1="1540" y1="60" x2="1514" y2="60" />
          <line x1="1540" y1="60" x2="1540" y2="86" />
          <line x1="60" y1="840" x2="86" y2="840" />
          <line x1="60" y1="840" x2="60" y2="814" />
          <line x1="1540" y1="840" x2="1514" y2="840" />
          <line x1="1540" y1="840" x2="1540" y2="814" />
        </g>
      </svg>
    </div>
  );
}
