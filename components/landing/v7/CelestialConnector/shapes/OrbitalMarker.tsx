import type { OrbitalConfig } from "@/lib/celestial/schema";

const ORBIT_RADIUS: Record<string, number> = { sm: 56, md: 74, lg: 92 };
const NODE_RADIUS: Record<string, number> = { sm: 2.4, md: 3.2, lg: 4 };

interface OrbitalMarkerProps {
  config: OrbitalConfig;
}

export function OrbitalMarker({ config }: OrbitalMarkerProps) {
  const orbitR = ORBIT_RADIUS[config.size] ?? 74;
  const nodeR = NODE_RADIUS[config.size] ?? 3.2;
  const duration = 18 + orbitR / 10;
  const revDuration = duration * 1.5;

  return (
    <>
      <g style={{ transformOrigin: "0 0", animation: `rotate ${duration}s linear infinite` }}>
        <circle cx={0} cy={-orbitR} r={nodeR} fill="var(--gold)" />
      </g>
      <g style={{ transformOrigin: "0 0", animation: `rotateRev ${revDuration}s linear infinite` }}>
        <circle cx={0} cy={-ORBIT_RADIUS.lg} r={1.6} fill="var(--dawn)" opacity={0.7} />
      </g>
    </>
  );
}
