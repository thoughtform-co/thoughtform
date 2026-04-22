import type { TickDensity } from "@/lib/celestial/schema";

interface BearingTicksProps {
  density: TickDensity;
  radius?: number;
  tickLen?: number;
}

export function BearingTicks({ density, radius = 110, tickLen = 8 }: BearingTicksProps) {
  if (density === 0) return null;
  const ticks: JSX.Element[] = [];
  const step = 360 / density;
  for (let i = 0; i < density; i++) {
    const angle = i * step;
    ticks.push(
      <path
        key={angle}
        d={`M0 ${-radius} L0 ${-(radius - tickLen)}`}
        transform={`rotate(${angle})`}
      />
    );
  }
  return (
    <g stroke="var(--dawn-30)" strokeWidth="0.5">
      {ticks}
    </g>
  );
}
