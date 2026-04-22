interface DiagramLabelsProps {
  topLeft?: string;
  bottomRight?: string;
}

export function DiagramLabels({ topLeft, bottomRight }: DiagramLabelsProps) {
  return (
    <g fontFamily="var(--font-pt-mono)" fontSize="6" fill="var(--dawn-50)" letterSpacing="1.5">
      {topLeft && (
        <text x={-108} y={-106}>
          {topLeft}
        </text>
      )}
      {bottomRight && (
        <text x={108} y={112} textAnchor="end">
          {bottomRight}
        </text>
      )}
    </g>
  );
}
