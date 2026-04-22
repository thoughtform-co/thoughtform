import type { PhaseConfig } from "@/lib/celestial/schema";
import { seededRandom } from "./seededRandom";

interface PhaseDiskProps {
  config: PhaseConfig;
}

/**
 * Lunar/tidal phase disk — crescent / gibbous silhouette.
 * A void circle masked by a second offset circle.
 */
export function PhaseDisk({ config }: PhaseDiskProps) {
  const { seed, coverage } = config;
  const rng = seededRandom(seed);
  const r = 32;
  const maskId = `phase-mask-${seed}`;

  // Coverage 0 = new (fully dark), 1 = full (fully lit)
  // Offset controls the crescent shape
  const clampedCoverage = Math.max(0.05, Math.min(0.95, coverage));
  const offsetX = (1 - clampedCoverage) * r * 1.6 - r * 0.4;

  // Terminator orbit dot
  const dotAngle = rng() * Math.PI * 2;
  const dotR = r + 8;

  return (
    <g>
      <defs>
        <mask id={maskId}>
          <circle cx="0" cy="0" r={r} fill="white" />
          <circle cx={offsetX} cy="0" r={r * 0.92} fill="black" />
        </mask>
      </defs>

      {/* Outer outline */}
      <circle cx="0" cy="0" r={r} stroke="var(--dawn-20)" strokeWidth="0.5" fill="none" />

      {/* Illuminated crescent */}
      <circle cx="0" cy="0" r={r} fill="var(--gold)" fillOpacity="0.15" mask={`url(#${maskId})`} />

      {/* Terminator line suggestion */}
      <ellipse
        cx={offsetX * 0.3}
        cy="0"
        rx={r * 0.15}
        ry={r * 0.85}
        stroke="var(--gold)"
        strokeOpacity="0.2"
        strokeWidth="0.5"
        fill="none"
      />

      {/* Orbit dot */}
      <circle
        cx={Math.cos(dotAngle) * dotR}
        cy={Math.sin(dotAngle) * dotR}
        r="2"
        fill="var(--gold)"
        fillOpacity="0.7"
      />
    </g>
  );
}
