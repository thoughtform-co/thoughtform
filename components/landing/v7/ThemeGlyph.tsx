/**
 * ThemeGlyph — the light/dark toggle's mark (ADR-058).
 *
 * A procedurally placed pixel constellation, ported from Sigil's
 * `ParticleIcon` (`components/ui/ParticleIcon.tsx` there) and trimmed to
 * the two theme glyphs. Squares on a 3px grid, never circles — the HUD
 * chrome law — and the two constellations read as sun (a sparse ring)
 * vs. night (a denser ring with an outer scatter and a solid core).
 *
 * One deliberate change from the Sigil original: the rects paint
 * `currentColor` at a per-dot `opacity` instead of baking rgb triples in
 * JS. That is what lets the button's own CSS own hover / focus / theme
 * color (`.theme-toggle { color: var(--dawn-70) }` → `var(--gold)`) with
 * no prop plumbing, and it means the glyph cannot drift from the tokens
 * the way Sigil's hardcoded copies did.
 *
 * The glyph shows the theme you would GET, not the one you are in —
 * the button's aria-label says so explicitly.
 */

import type { ThemeMode } from "@/lib/theme/themeModeRef";

const SIZE = 18;
const GRID = 3;

type Pixel = { x: number; y: number; alpha: number };

function snap(v: number): number {
  return Math.round(v / GRID) * GRID;
}

function themePixels(target: ThemeMode): Pixel[] {
  const c = SIZE / 2;
  const r = Math.floor(SIZE * 0.22);
  const pts: Pixel[] = [];

  if (target === "light") {
    // Sun: a sparse six-point ring with a faint core.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      pts.push({ x: snap(c + Math.cos(a) * r), y: snap(c + Math.sin(a) * r), alpha: 0.8 });
    }
    pts.push({ x: snap(c), y: snap(c), alpha: 0.5 });
    return pts;
  }

  // Night: eight-point ring + a four-point outer scatter + a solid core.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: snap(c + Math.cos(a) * r), y: snap(c + Math.sin(a) * r), alpha: 0.85 });
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    pts.push({
      x: snap(c + Math.cos(a) * (r + GRID)),
      y: snap(c + Math.sin(a) * (r + GRID)),
      alpha: 0.5,
    });
  }
  pts.push({ x: snap(c), y: snap(c), alpha: 1 });
  return pts;
}

/** `target` is the theme the click would switch TO. */
export function ThemeGlyph({ target }: { target: ThemeMode }) {
  const pixels = themePixels(target);
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", imageRendering: "pixelated" }}
    >
      {pixels.map((p, i) => (
        <rect
          key={`${p.x}-${p.y}-${i}`}
          x={p.x}
          y={p.y}
          width={GRID - 1}
          height={GRID - 1}
          fill="currentColor"
          opacity={p.alpha}
        />
      ))}
    </svg>
  );
}
