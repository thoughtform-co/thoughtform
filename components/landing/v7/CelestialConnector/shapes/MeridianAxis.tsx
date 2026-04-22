interface MeridianAxisProps {
  innerRadius?: number;
  showLabels?: boolean;
}

export function MeridianAxis({ innerRadius = 74, showLabels = true }: MeridianAxisProps) {
  return (
    <>
      <g stroke="var(--gold)" strokeOpacity="0.5" strokeWidth="0.6">
        <path d={`M0 ${-innerRadius} L0 ${innerRadius}`} />
      </g>
      {showLabels && (
        <g
          fontFamily="var(--font-pt-mono)"
          fontSize="8"
          fill="var(--gold)"
          textAnchor="middle"
          letterSpacing="2"
        >
          <text x={-innerRadius} y="4">
            N
          </text>
          <text x={innerRadius} y="4">
            S
          </text>
        </g>
      )}
    </>
  );
}
