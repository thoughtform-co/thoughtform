"use client";

export type PracticePhaseGlyph = "navigate" | "encode" | "build";

/** Deterministic PRNG for star scatter (mulberry32). */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VB = "-120 -120 240 240";

/** Constellation field + guide burst — Navigate. */
export function NavigateGlyph() {
  const rand = mulberry32(90210);
  const stars: Array<{ cx: number; cy: number; r: number; o: number }> = [];
  for (let i = 0; i < 26; i++) {
    const u = rand() * 0.55 - 0.28;
    const v = rand() * 0.55 - 0.35;
    const cx = u * 200 - 18;
    const cy = v * 200 - 28;
    const r = 0.6 + rand() * 1.85;
    const o = 0.22 + rand() * 0.62;
    stars.push({ cx, cy, r, o });
  }
  const edges = [
    [0, 4],
    [4, 9],
    [9, 14],
    [14, 7],
    [7, 2],
    [2, 11],
    [11, 19],
  ];
  const guideX = -52;
  const guideY = -58;
  return (
    <svg viewBox={VB} className="phase-glyph-svg" aria-hidden="true">
      <g fill="var(--gold, #caa554)" stroke="none">
        {stars.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} opacity={s.o} />
        ))}
      </g>
      <g stroke="var(--gold, #caa554)" strokeWidth={0.35} opacity={0.38} fill="none">
        {edges.map(([a, b], i) => (
          <line key={i} x1={stars[a]!.cx} y1={stars[a]!.cy} x2={stars[b]!.cx} y2={stars[b]!.cy} />
        ))}
      </g>
      <g stroke="var(--gold, #caa554)" strokeWidth={0.45} opacity={0.85} fill="none">
        <line x1={guideX - 10} y1={guideY} x2={guideX + 10} y2={guideY} />
        <line x1={guideX} y1={guideY - 10} x2={guideX} y2={guideY + 10} />
      </g>
      <circle cx={guideX} cy={guideY} r={2.2} fill="var(--gold, #caa554)" opacity={0.95} />
    </svg>
  );
}

/** Data field + scanlines + ticks — Encode. */
export function EncodeGlyph() {
  const dots: Array<{ cx: number; cy: number }> = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cx = -80 + col * 20;
      const cy = -80 + row * 20;
      dots.push({ cx, cy });
    }
  }
  const ticks = [
    { x: 0, y: -92, label: "12.4" },
    { x: 62, y: -40, label: "0xAF" },
    { x: 78, y: 28, label: "δ.07" },
    { x: 44, y: 72, label: "−01" },
    { x: -48, y: 70, label: "7E3" },
    { x: -86, y: 22, label: "φ2" },
    { x: -70, y: -52, label: "004" },
    { x: 22, y: -68, label: "9.81" },
    { x: -22, y: 8, label: "0.02" },
    { x: 52, y: 8, label: "11μ" },
    { x: -8, y: -36, label: "τ" },
    { x: -92, y: -8, label: "3F0" },
  ];
  return (
    <svg viewBox={VB} className="phase-glyph-svg" aria-hidden="true">
      <g fill="var(--gold, #caa554)" opacity={0.2}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={1} />
        ))}
      </g>
      <g stroke="var(--gold, #caa554)" strokeWidth={0.35} opacity={0.22} fill="none">
        <line x1={-100} y1={-36} x2={100} y2={-36} />
        <line x1={-100} y1={4} x2={100} y2={4} />
        <line x1={-100} y1={44} x2={100} y2={44} />
      </g>
      <g
        fontFamily="var(--font-pt-mono, ui-monospace, monospace)"
        fontSize={7}
        fill="var(--dawn-70, rgba(232,228,216,0.55))"
      >
        {ticks.map((t, i) => (
          <text key={i} x={t.x} y={t.y} textAnchor="middle">
            {t.label}
          </text>
        ))}
      </g>
      <g stroke="var(--gold, #caa554)" strokeWidth={0.4} opacity={0.55} fill="none">
        {ticks.map((t, i) => (
          <line key={`k${i}`} x1={t.x} y1={t.y + 4} x2={t.x} y2={t.y + 10} />
        ))}
      </g>
      <path
        d="M0 -9 L9 0 L0 9 L-9 0 Z"
        fill="var(--gold, #caa554)"
        fillOpacity={0.85}
        stroke="var(--gold, #caa554)"
        strokeWidth={0.35}
      />
      <g
        stroke="var(--dawn-30, rgba(232,228,216,0.25))"
        strokeWidth={0.45}
        fill="none"
        opacity={0.9}
      >
        <path d="M-108 -108 L-98 -108 M-108 -108 L-108 -98" />
        <path d="M108 -108 L98 -108 M108 -108 L108 -98" />
        <path d="M-108 108 L-98 108 M-108 108 L-108 98" />
        <path d="M108 108 L98 108 M108 108 L108 98" />
      </g>
    </svg>
  );
}

/** Right-angle circuit lattice — Build. */
export function BuildGlyph() {
  const gridDots: Array<{ cx: number; cy: number }> = [];
  for (let y = -110; y <= 110; y += 10) {
    for (let x = -110; x <= 110; x += 10) {
      gridDots.push({ cx: x, cy: y });
    }
  }
  const traces = [
    "M0,0 L0,-52 L48,-52 L48,-28 L88,-28",
    "M0,0 L38,0 L38,44 L-12,44 L-12,72",
    "M0,0 L-44,0 L-44,-36 L-78,-36",
    "M0,0 L0,58 L64,58 L64,24 L96,24",
    "M0,0 L-28,28 L-60,28 L-60,68",
    "M0,0 L52,0 L52,32 L20,32 L20,-40",
  ];
  const bends: Array<[number, number]> = [
    [0, -52],
    [48, -52],
    [48, -28],
    [88, -28],
    [38, 0],
    [38, 44],
    [-12, 44],
    [-12, 72],
    [-44, 0],
    [-44, -36],
    [-78, -36],
    [0, 58],
    [64, 58],
    [64, 24],
    [96, 24],
    [-28, 28],
    [-60, 28],
    [-60, 68],
    [52, 0],
    [52, 32],
    [20, 32],
    [20, -40],
  ];
  const pads = [
    [-2, -56],
    [90, -30],
    [-14, 74],
    [98, 24],
  ];
  return (
    <svg viewBox={VB} className="phase-glyph-svg" aria-hidden="true">
      <g fill="var(--gold, #caa554)" opacity={0.15}>
        {gridDots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={0.5} />
        ))}
      </g>
      <g fill="none" stroke="var(--gold, #caa554)" strokeWidth={0.55} strokeOpacity={0.55}>
        {traces.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {bends.map(([x, y], i) => (
        <rect
          key={`b${i}`}
          x={x - 1.5}
          y={y - 1.5}
          width={3}
          height={3}
          transform={`rotate(45 ${x} ${y})`}
          fill="var(--gold, #caa554)"
          stroke="none"
          opacity={0.9}
        />
      ))}
      {pads.map(([x, y], i) => (
        <rect
          key={`p${i}`}
          x={x - 3}
          y={y - 3}
          width={6}
          height={6}
          fill="none"
          stroke="var(--gold, #caa554)"
          strokeWidth={0.45}
          opacity={0.65}
        />
      ))}
      <g transform="rotate(45)">
        <rect
          x={-12}
          y={-12}
          width={24}
          height={24}
          fill="none"
          stroke="var(--gold, #caa554)"
          strokeWidth={0.85}
          opacity={0.92}
        />
      </g>
    </svg>
  );
}

export function PhaseGlyphSvg({ phase }: { phase: PracticePhaseGlyph }) {
  if (phase === "navigate") return <NavigateGlyph />;
  if (phase === "encode") return <EncodeGlyph />;
  return <BuildGlyph />;
}
