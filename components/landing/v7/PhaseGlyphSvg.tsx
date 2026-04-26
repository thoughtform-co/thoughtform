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

// All practice glyphs are composed inside an annulus around the
// brandmark. INNER_R covers the .approach__orbit__mark footprint at
// every clamp size; OUTER_R keeps geometry inside the orbit's outer
// guide ring without crowding the bearing ticks. Every primitive in
// the three glyphs respects this exclusion so the brandmark always
// reads cleanly at the center.
const INNER_R = 64;
const OUTER_R = 112;

/** Constellation field + guide reticle — Navigate. */
export function NavigateGlyph() {
  const rand = mulberry32(90210);
  const stars: Array<{ cx: number; cy: number; r: number; o: number }> = [];
  // Distribute stars uniformly by area in the annulus. We use a
  // square-root remap on the radial term so stars don't clump near
  // INNER_R; this gives an even halo around the brandmark.
  const targetStars = 28;
  while (stars.length < targetStars) {
    const angle = rand() * Math.PI * 2;
    const t = rand();
    const inner2 = INNER_R * INNER_R;
    const outer2 = OUTER_R * OUTER_R;
    const dist = Math.sqrt(inner2 + t * (outer2 - inner2));
    const cx = Math.cos(angle) * dist;
    const cy = Math.sin(angle) * dist;
    const radius = 0.6 + rand() * 1.85;
    const opacity = 0.22 + rand() * 0.62;
    stars.push({ cx, cy, r: radius, o: opacity });
  }
  // Local proximity edges only — connect each star to its nearest
  // neighbour, but skip pairs whose midpoint falls inside the
  // brandmark exclusion so no chord cuts across the center.
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < stars.length; i++) {
    let bestJ = -1;
    let bestD = Infinity;
    for (let j = 0; j < stars.length; j++) {
      if (j === i) continue;
      const a = stars[i]!;
      const b = stars[j]!;
      const d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      const mx = (a.cx + b.cx) / 2;
      const my = (a.cy + b.cy) / 2;
      if (Math.hypot(mx, my) < INNER_R + 4) continue;
      if (d < bestD && d < 46) {
        bestD = d;
        bestJ = j;
      }
    }
    if (bestJ > i) edges.push([i, bestJ]);
  }
  // Guide reticle on the Navigate compass position. Practice orbit
  // labels Navigate at (-100, -100) in orbit space; mapped to glyph
  // space (240/360 = 2/3) that's ~(-67, -67).
  const guideX = -68;
  const guideY = -68;
  return (
    <svg viewBox={VB} className="phase-glyph-svg" aria-hidden="true">
      <g fill="var(--gold, #caa554)" stroke="none">
        {stars.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} opacity={s.o} />
        ))}
      </g>
      <g stroke="var(--gold, #caa554)" strokeWidth={0.35} opacity={0.4} fill="none">
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

/** Data field + scan arcs + crystal facets — Encode. */
export function EncodeGlyph() {
  const dots: Array<{ cx: number; cy: number }> = [];
  // 11x11 dot lattice spanning the annulus. The radial filter drops
  // every dot inside the brandmark exclusion, leaving a halo of
  // gridded telemetry around the mark.
  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 11; col++) {
      const cx = -100 + col * 20;
      const cy = -100 + row * 20;
      const r = Math.hypot(cx, cy);
      if (r < INNER_R + 4 || r > OUTER_R + 4) continue;
      dots.push({ cx, cy });
    }
  }
  // Tick readouts at eight compass headings around the annulus rim;
  // labels sit just outside the dot lattice so they read as outer
  // measurements rather than competing with the center.
  const ticks = [
    { x: 0, y: -104, label: "12.4" },
    { x: 76, y: -76, label: "0xAF" },
    { x: 104, y: 0, label: "δ.07" },
    { x: 76, y: 76, label: "−01" },
    { x: 0, y: 104, label: "7E3" },
    { x: -76, y: 76, label: "φ2" },
    { x: -104, y: 0, label: "004" },
    { x: -76, y: -76, label: "9.81" },
  ];
  // Crystal facet diamonds at the four cardinal ordinals — small
  // gold pips that sit on the inner annulus boundary, signalling
  // crystallisation pulled around the mark.
  const facets: Array<[number, number]> = [
    [0, -78],
    [78, 0],
    [0, 78],
    [-78, 0],
  ];
  return (
    <svg viewBox={VB} className="phase-glyph-svg" aria-hidden="true">
      <g fill="var(--gold, #caa554)" opacity={0.22}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={1} />
        ))}
      </g>
      {/* Concentric scan arcs replace the centre-crossing scanlines
          so the data field is sampled around the brandmark. */}
      <g stroke="var(--gold, #caa554)" strokeWidth={0.35} fill="none">
        <circle cx={0} cy={0} r={INNER_R + 12} strokeDasharray="14 8" opacity={0.32} />
        <circle cx={0} cy={0} r={INNER_R + 30} strokeDasharray="3 6" opacity={0.28} />
      </g>
      <g
        fontFamily="var(--font-pt-mono, ui-monospace, monospace)"
        fontSize={6}
        fill="var(--dawn-70, rgba(232,228,216,0.55))"
      >
        {ticks.map((t, i) => (
          <text key={i} x={t.x} y={t.y} textAnchor="middle">
            {t.label}
          </text>
        ))}
      </g>
      <g stroke="var(--gold, #caa554)" strokeWidth={0.4} opacity={0.55} fill="none">
        {/* Tick marks pointing inward from each label toward the
            annulus, anchoring the labels to the data field. */}
        {ticks.map((t, i) => {
          const len = 6;
          const r = Math.hypot(t.x, t.y) || 1;
          const ux = t.x / r;
          const uy = t.y / r;
          return (
            <line
              key={`k${i}`}
              x1={t.x - ux * 4}
              y1={t.y - uy * 4}
              x2={t.x - ux * (4 + len)}
              y2={t.y - uy * (4 + len)}
            />
          );
        })}
      </g>
      <g
        fill="var(--gold, #caa554)"
        fillOpacity={0.85}
        stroke="var(--gold, #caa554)"
        strokeWidth={0.35}
      >
        {facets.map(([x, y], i) => (
          <path key={`f${i}`} d={`M${x} ${y - 5} L${x + 5} ${y} L${x} ${y + 5} L${x - 5} ${y} Z`} />
        ))}
      </g>
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

/** Annular circuit lattice — Build. */
export function BuildGlyph() {
  const gridDots: Array<{ cx: number; cy: number }> = [];
  for (let y = -110; y <= 110; y += 10) {
    for (let x = -110; x <= 110; x += 10) {
      const r = Math.hypot(x, y);
      if (r < INNER_R + 4 || r > OUTER_R + 6) continue;
      gridDots.push({ cx: x, cy: y });
    }
  }
  // Traces emerge from the inner perimeter (r ~ 66) and route
  // outward through orthogonal segments to circuit pads on the
  // annulus rim. Every vertex is outside the brandmark exclusion.
  const traces = [
    "M0 -66 L0 -88 L40 -88 L40 -104",
    "M48 -48 L72 -72 L102 -72",
    "M66 0 L88 0 L88 32 L108 32",
    "M48 48 L72 72 L72 104",
    "M0 66 L0 90 L-40 90 L-40 108",
    "M-48 48 L-72 72 L-104 72",
    "M-66 0 L-88 0 L-88 -28 L-108 -28",
    "M-48 -48 L-72 -72 L-72 -104",
  ];
  // Bend joints — small rotated squares at every interior corner
  // along the traces.
  const bends: Array<[number, number]> = [
    [0, -88],
    [40, -88],
    [72, -72],
    [88, 0],
    [88, 32],
    [72, 72],
    [0, 90],
    [-40, 90],
    [-72, 72],
    [-88, 0],
    [-88, -28],
    [-72, -72],
  ];
  // Terminal pads at each trace end, on the outer annulus rim.
  const pads: Array<[number, number]> = [
    [40, -104],
    [102, -72],
    [108, 32],
    [72, 104],
    [-40, 108],
    [-104, 72],
    [-108, -28],
    [-72, -104],
  ];
  return (
    <svg viewBox={VB} className="phase-glyph-svg" aria-hidden="true">
      <g fill="var(--gold, #caa554)" opacity={0.18}>
        {gridDots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={0.5} />
        ))}
      </g>
      {/* Inner perimeter ring — replaces the central rotated square
          with a subtle circuit boundary just outside the brandmark. */}
      <circle
        cx={0}
        cy={0}
        r={INNER_R + 2}
        fill="none"
        stroke="var(--gold, #caa554)"
        strokeWidth={0.5}
        strokeOpacity={0.55}
        strokeDasharray="2 4"
      />
      <g fill="none" stroke="var(--gold, #caa554)" strokeWidth={0.55} strokeOpacity={0.6}>
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
          opacity={0.7}
        />
      ))}
    </svg>
  );
}

export function PhaseGlyphSvg({ phase }: { phase: PracticePhaseGlyph }) {
  if (phase === "navigate") return <NavigateGlyph />;
  if (phase === "encode") return <EncodeGlyph />;
  return <BuildGlyph />;
}
