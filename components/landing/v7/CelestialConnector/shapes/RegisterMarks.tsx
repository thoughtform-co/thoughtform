interface RegisterMarksProps {
  radius?: number;
}

export function RegisterMarks({ radius = 62 }: RegisterMarksProps) {
  const r = radius;
  const ext = r + 6;
  return (
    <g stroke="var(--gold)" strokeOpacity="0.7" strokeWidth="0.6" fill="none">
      <path d={`M${-ext} ${-r} L${-r + 6} ${-r} M${-r} ${-ext} L${-r} ${-r + 6}`} />
      <path d={`M${ext} ${-r} L${r - 6} ${-r} M${r} ${-ext} L${r} ${-r + 6}`} />
      <path d={`M${-ext} ${r} L${-r + 6} ${r} M${-r} ${ext} L${-r} ${r - 6}`} />
      <path d={`M${ext} ${r} L${r - 6} ${r} M${r} ${ext} L${r} ${r - 6}`} />
    </g>
  );
}
