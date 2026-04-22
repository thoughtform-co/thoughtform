import type { RingsConfig } from "@/lib/celestial/schema";

const RING_RADII = [110, 92, 74, 56, 38];
const RING_STYLES: Array<{ stroke: string; opacity?: number; dash?: string }> = [
  { stroke: "var(--dawn-15)", dash: "1 5" },
  { stroke: "var(--dawn-08)" },
  { stroke: "var(--gold)", opacity: 0.22, dash: "2 6" },
  { stroke: "var(--gold)", opacity: 0.35 },
  { stroke: "var(--gold)", opacity: 0.15, dash: "1 3" },
];

interface RingsProps {
  config: RingsConfig;
}

export function Rings({ config }: RingsProps) {
  const count = Math.min(config.count, RING_RADII.length);
  return (
    <g strokeWidth="0.6" fill="none">
      {RING_RADII.slice(0, count).map((r, i) => {
        const s = RING_STYLES[i];
        return (
          <circle
            key={r}
            r={r}
            stroke={s.stroke}
            strokeOpacity={s.opacity}
            strokeDasharray={s.dash}
          />
        );
      })}
    </g>
  );
}
