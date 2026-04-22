import type { GlyphRingConfig } from "@/lib/celestial/schema";
import { seededRandom } from "./seededRandom";

interface GlyphRingProps {
  config: GlyphRingConfig;
}

const GLYPH_RADIUS: Record<string, number> = { sm: 60, md: 78, lg: 96 };
const POSITIONS = 12;

/**
 * Twelve glyph marks around a ring — minimal rune-like symbols.
 * Seed determines which glyph lands at each position.
 */
export function GlyphRing({ config }: GlyphRingProps) {
  const { seed, radius: sizeKey } = config;
  const rng = seededRandom(seed);
  const r = GLYPH_RADIUS[sizeKey] ?? 78;

  const glyphs: Array<{ x: number; y: number; idx: number }> = [];
  for (let i = 0; i < POSITIONS; i++) {
    const angle = (i / POSITIONS) * Math.PI * 2 - Math.PI / 2;
    glyphs.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      idx: Math.floor(rng() * GLYPH_FNS.length),
    });
  }

  return (
    <g>
      {/* Guide ring */}
      <circle r={r} stroke="var(--dawn-08)" strokeWidth="0.5" fill="none" strokeDasharray="1 5" />
      {/* Glyphs */}
      {glyphs.map((g, i) => (
        <g key={i} transform={`translate(${g.x},${g.y})`}>
          {GLYPH_FNS[g.idx]}
        </g>
      ))}
    </g>
  );
}

const gs = "var(--gold)";
const gso = "0.6";
const sw = "0.6";

const GLYPH_FNS = [
  // Arrow up
  <g key="arrow" stroke={gs} strokeOpacity={gso} strokeWidth={sw} fill="none">
    <line x1="0" y1="4" x2="0" y2="-4" />
    <line x1="-2.5" y1="-1.5" x2="0" y2="-4" />
    <line x1="2.5" y1="-1.5" x2="0" y2="-4" />
  </g>,
  // Bracket pair
  <g key="bracket" stroke={gs} strokeOpacity={gso} strokeWidth={sw} fill="none">
    <path d="M-3,-4 L-5,-4 L-5,4 L-3,4" />
    <path d="M3,-4 L5,-4 L5,4 L3,4" />
  </g>,
  // Slash
  <line
    key="slash"
    x1="-3"
    y1="4"
    x2="3"
    y2="-4"
    stroke={gs}
    strokeOpacity={gso}
    strokeWidth={sw}
  />,
  // Triple dot
  <g key="dots" fill={gs} fillOpacity={gso}>
    <circle cx="-3" cy="0" r="0.8" />
    <circle cx="0" cy="0" r="0.8" />
    <circle cx="3" cy="0" r="0.8" />
  </g>,
  // Asterisk
  <g key="asterisk" stroke={gs} strokeOpacity={gso} strokeWidth={sw}>
    <line x1="0" y1="-3.5" x2="0" y2="3.5" />
    <line x1="-3" y1="-1.8" x2="3" y2="1.8" />
    <line x1="-3" y1="1.8" x2="3" y2="-1.8" />
  </g>,
  // Chevron
  <g key="chevron" stroke={gs} strokeOpacity={gso} strokeWidth={sw} fill="none">
    <path d="M-3,2 L0,-2 L3,2" />
  </g>,
  // Open circle
  <circle
    key="ring"
    cx="0"
    cy="0"
    r="3"
    stroke={gs}
    strokeOpacity={gso}
    strokeWidth={sw}
    fill="none"
  />,
  // Crosshair plus
  <g key="plus" stroke={gs} strokeOpacity={gso} strokeWidth={sw}>
    <line x1="-4" y1="0" x2="4" y2="0" />
    <line x1="0" y1="-4" x2="0" y2="4" />
    <circle cx="0" cy="0" r="1.5" fill="none" />
  </g>,
];
