interface CompassRoseProps {
  radius?: number;
}

export function CompassRose({ radius = 56 }: CompassRoseProps) {
  return (
    <>
      <g stroke="var(--gold)" strokeOpacity="0.5" strokeWidth="0.6">
        <path d={`M0 0 L0 ${-radius}`} transform="rotate(-60)" />
        <path d={`M0 0 L0 ${-radius}`} transform="rotate(60)" />
        <path d={`M0 0 L0 ${-radius}`} transform="rotate(180)" />
      </g>
      <g
        fontFamily="var(--font-pt-mono)"
        fontSize="8"
        fill="var(--gold)"
        textAnchor="middle"
        letterSpacing="2"
      >
        <text x={-48} y={-22}>
          A
        </text>
        <text x={48} y={-22}>
          E
        </text>
        <text x={0} y={62}>
          B
        </text>
      </g>
    </>
  );
}
