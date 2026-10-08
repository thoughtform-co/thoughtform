import type { ArcLeverageUse, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcLeverageProps {
  section: ArcSectionOf<"leverage">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcLeverage — how intelligence should take part in the work (ADR-153), on
 * Tensorlake's split: the idea in ONE wide cell, where it applies in a 2×2.
 *
 *   left   three plates, top to bottom: the team's own layer, lit; then the
 *          two everyone shares, dimmed. A label and one sentence under them.
 *   right  four cells, each a glyph, a mono label and one line.
 *
 * ⚠ SERVER, NO STATE, DOM ONLY. Nothing moves but the house reveal; every
 * string is in the markup, so it reads whole without JS.
 */
export function ArcLeverage({ section, index, motion = "reveal" }: ArcLeverageProps) {
  const { stack, note, uses } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="leverage"
      className="arc-section arc-sec arc-sec--leverage"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="leverage"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-lev arc-reveal" {...rung(motion, 0.14)}>
          <div className="arc-lev__idea">
            <ol className="arc-lev__stack">
              {stack.map((p) => (
                <li key={p.id} className="arc-lev__plate" data-lev-own={p.own ? "" : undefined}>
                  <span className="arc-lev__plate-label">{p.label}</span>
                  <span className="arc-lev__plate-line">{p.line}</span>
                  <span className="arc-lev__chip">{p.chip}</span>
                </li>
              ))}
            </ol>
            <div className="arc-lev__note">
              <p className="arc-lev__label">{note.label}</p>
              <p className="arc-lev__line">{note.line}</p>
            </div>
          </div>
          <div className="arc-lev__uses">
            <p className="arc-lev__uses-label">{uses.label}</p>
            <ul className="arc-lev__grid">
              {uses.items.map((u) => (
                <li key={u.id} className="arc-lev__cell">
                  <Glyph kind={u.glyph} />
                  <p className="arc-lev__label">{u.label}</p>
                  <p className="arc-lev__line">{u.line}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}

/** Four small drawings on one 120×64 grid, hairline, gold where it acts. */
function Glyph({ kind }: { kind: ArcLeverageUse["glyph"] }) {
  return (
    <svg className="arc-lev__glyph" viewBox="0 0 120 64" aria-hidden="true">
      <g className="arc-lev__glyph-grid">
        {[16, 32, 48].map((y) => (
          <line key={`h${y}`} x1="0" x2="120" y1={y} y2={y} />
        ))}
        {[20, 40, 60, 80, 100].map((x) => (
          <line key={`v${x}`} x1={x} x2={x} y1="0" y2="64" />
        ))}
      </g>
      {kind === "brief" && (
        <g>
          <rect className="arc-lev__glyph-ink" x="20" y="8" width="44" height="48" />
          <line className="arc-lev__glyph-ink" x1="28" x2="56" y1="20" y2="20" />
          <line className="arc-lev__glyph-ink" x1="28" x2="50" y1="30" y2="30" />
          <line className="arc-lev__glyph-ink" x1="28" x2="44" y1="40" y2="40" />
          <path
            className="arc-lev__glyph-act"
            d="M64 32 H80 M80 20 H100 M80 32 H100 M80 44 H100 M80 20 V44"
          />
        </g>
      )}
      {kind === "frame" && (
        <g>
          <rect className="arc-lev__glyph-ink" x="20" y="8" width="40" height="48" />
          <rect className="arc-lev__glyph-ink" x="66" y="8" width="16" height="20" />
          <rect className="arc-lev__glyph-ink" x="86" y="8" width="16" height="20" />
          <rect className="arc-lev__glyph-ink" x="66" y="36" width="16" height="20" />
          <rect className="arc-lev__glyph-act" x="86" y="36" width="16" height="20" />
        </g>
      )}
      {kind === "flow" && (
        <g>
          <path className="arc-lev__glyph-act" d="M20 48 V32 H50 V20 H80 V12 H100" />
          <rect className="arc-lev__glyph-dot" x="16" y="44" width="8" height="8" />
          <rect className="arc-lev__glyph-dot" x="96" y="8" width="8" height="8" />
        </g>
      )}
      {kind === "check" && (
        <g>
          <rect className="arc-lev__glyph-ink" x="20" y="8" width="40" height="48" />
          <rect
            className="arc-lev__glyph-act arc-lev__glyph-dash"
            x="30"
            y="18"
            width="20"
            height="16"
          />
          <path className="arc-lev__glyph-act" d="M72 34 L82 44 L102 20" />
        </g>
      )}
    </svg>
  );
}
