import type { SquareConfig } from "@/lib/celestial/schema";

interface RotatedSquareProps {
  config: SquareConfig;
}

export function RotatedSquare({ config }: RotatedSquareProps) {
  return (
    <>
      {config.rotated && (
        <rect
          x={-84}
          y={-84}
          width={168}
          height={168}
          stroke="var(--gold)"
          strokeOpacity="0.3"
          strokeDasharray="2 6"
          strokeWidth="0.6"
          fill="none"
          transform="rotate(45)"
        />
      )}
      <rect
        x={-62}
        y={-62}
        width={124}
        height={124}
        stroke="var(--gold)"
        strokeOpacity="0.4"
        strokeWidth="0.6"
        fill="none"
      />
      {config.nested && (
        <circle
          r={32}
          stroke="var(--gold)"
          strokeOpacity="0.2"
          strokeDasharray="1 3"
          strokeWidth="0.6"
          fill="none"
        />
      )}
      {config.registerMarks && (
        <g stroke="var(--gold)" strokeOpacity="0.7" strokeWidth="0.6" fill="none">
          <path d="M-68 -62 L-56 -62 M-62 -68 L-62 -56" />
          <path d="M68 -62 L56 -62 M62 -68 L62 -56" />
          <path d="M-68 62 L-56 62 M-62 68 L-62 56" />
          <path d="M68 62 L56 62 M62 68 L62 56" />
        </g>
      )}
    </>
  );
}
