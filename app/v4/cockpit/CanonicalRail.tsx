"use client";

import { ThoughtformSigil } from "@/components/hud/ThoughtformSigil";

/**
 * Canonical Thoughtform HUD rails — WEBSITE mode.
 *
 * Adapted from `hud-frame-implementation.md` (Brand Codex Figma
 * XO8yGN90SfxiG1hmYPGYXn → canvas "Grid (New)" 1610:584).
 *
 * The canonical spec was authored for presentations (chapter/pagination in
 * the top/bottom-right corners). For editorial web surfaces we drop those
 * slide-deck anchors and keep only the atmospheric chrome:
 *   - vertical guides with outward ticks (10 left / 11 right, 2 majors each)
 *   - diamond + compass line at top-left
 *   - brandmark + 30px tick at bottom-left
 *
 * Tick Y positions are percentages of rail height, derived from the
 * 1920×1080 reference coordinates in the skill.
 */

interface Tick {
  y: number;
  major: boolean;
}

// Derived from skill §2: rail top y=115, bottom y=965 (850px tall)
// Each tick's y position converted to (y - 115) / 850 as %
const LEFT_TICKS: Tick[] = [
  { y: 16.6, major: false },
  { y: 24.9, major: false },
  { y: 33.3, major: true },
  { y: 41.6, major: false },
  { y: 49.9, major: false },
  { y: 58.2, major: false },
  { y: 66.6, major: true },
  { y: 74.9, major: false },
  { y: 83.2, major: false },
  { y: 91.5, major: false },
];

// Right rail mirrors left plus one additional minor tick near the top (y=185.6 → 8.3%)
const RIGHT_TICKS: Tick[] = [{ y: 8.3, major: false }, ...LEFT_TICKS];

export function CanonicalRail() {
  return (
    <div className="canonical-rail" aria-hidden="true">
      {/* ── Left rail ── */}
      <aside className="canonical-rail__side canonical-rail__side--left">
        <div className="canonical-rail__guide" />

        {/* Top-left diamond + compass line */}
        <div className="canonical-rail__anchor canonical-rail__anchor--top-left">
          <div className="canonical-rail__diamond" />
          <div className="canonical-rail__compass-line" />
        </div>

        {/* Ticks */}
        {LEFT_TICKS.map((t, i) => (
          <div
            key={`l-${i}`}
            className={`canonical-rail__tick canonical-rail__tick--left${
              t.major ? " canonical-rail__tick--major" : ""
            }`}
            style={{ top: `${t.y}%` }}
          />
        ))}

        {/* Bottom-left brandmark + tick below */}
        <div className="canonical-rail__anchor canonical-rail__anchor--bottom-left">
          <div className="canonical-rail__brandmark">
            <ThoughtformSigil size={40} color="var(--gold)" particleCount={0} />
          </div>
          <div className="canonical-rail__bottom-tick" />
        </div>
      </aside>

      {/* ── Right rail ──
           Website mode: no chapter/pagination anchors — those are deck chrome. */}
      <aside className="canonical-rail__side canonical-rail__side--right">
        <div className="canonical-rail__guide" />

        {RIGHT_TICKS.map((t, i) => (
          <div
            key={`r-${i}`}
            className={`canonical-rail__tick canonical-rail__tick--right${
              t.major ? " canonical-rail__tick--major" : ""
            }`}
            style={{ top: `${t.y}%` }}
          />
        ))}
      </aside>
    </div>
  );
}
