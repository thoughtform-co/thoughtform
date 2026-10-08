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
 * ArcLeverage — how intelligence should take part in the work (ADR-153), as
 * ONE instrument: the arcs' own chamfered plate, a head strip with the
 * console's name and a live status, a readout foot, and inside it
 * Tensorlake's split.
 *
 *   left   three isometric slabs, top to bottom: the team's own layer (gold,
 *          hatched), then Claude (ruled), then the models (dashed), each with
 *          its label, one line and a chip; one sentence under the stack.
 *   right  a 2×2 on a dot ground: an index, a data glyph, a title, a line.
 *
 * ⚠ SERVER, NO STATE, DOM ONLY; the SVGs letter nothing. The only motion is
 * the status dot's pulse, which reduced motion stops.
 */
export function ArcLeverage({ section, index, motion = "reveal" }: ArcLeverageProps) {
  const { stack, note, uses, console: con, readout } = section;
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
        <div className="arc-lev arc-plate arc-reveal" {...rung(motion, 0.14)}>
          <div className="arc-lev__bar">
            <p className="arc-lev__sys">
              <span className="arc-lev__sys-key">SYS</span>
              {con.name}
            </p>
            <p className="arc-lev__status">
              <span className="arc-lev__pulse" aria-hidden="true" />
              {con.status}
            </p>
          </div>
          <div className="arc-lev__split">
            <div className="arc-lev__idea">
              <ol className="arc-lev__stack">
                {stack.map((p, i) => (
                  <li key={p.id} className="arc-lev__plate" data-lev-own={p.own ? "" : undefined}>
                    <Slab tier={p.own ? "own" : i === stack.length - 1 ? "shared" : "host"} />
                    <div className="arc-lev__plate-copy">
                      <span className="arc-lev__plate-label">
                        {p.label}
                        <span className="arc-lev__chip">{p.chip}</span>
                      </span>
                      <span className="arc-lev__plate-line">{p.line}</span>
                    </div>
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
                {uses.items.map((u, i) => (
                  <li key={u.id} className="arc-lev__cell">
                    <p className="arc-lev__index">{String(i + 1).padStart(2, "0")}</p>
                    <Glyph kind={u.glyph} />
                    <p className="arc-lev__title">{u.label}</p>
                    <p className="arc-lev__line">{u.line}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <dl className="arc-lev__readout">
            {readout.map((r) => (
              <div key={r.label} className="arc-lev__read">
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </ArcBeat>
  );
}

/** One isometric slab: a top face and two side faces, on a 120×56 box. */
function Slab({ tier }: { tier: "own" | "host" | "shared" }) {
  return (
    <svg className="arc-lev__slab" data-tier={tier} viewBox="0 0 120 56" aria-hidden="true">
      <defs>
        <pattern
          id={`lev-hatch-${tier}`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" className="arc-lev__hatch" />
        </pattern>
      </defs>
      <path className="arc-lev__slab-side" d="M4 22 L60 44 L60 52 L4 30 Z" />
      <path className="arc-lev__slab-side" d="M116 22 L60 44 L60 52 L116 30 Z" />
      <path className="arc-lev__slab-top" d="M4 22 L60 2 L116 22 L60 44 Z" />
      {tier === "own" && <path d="M4 22 L60 2 L116 22 L60 44 Z" fill={`url(#lev-hatch-${tier})`} />}
    </svg>
  );
}

/** Four data glyphs on one 120×64 box, hairline, gold where it acts. */
function Glyph({ kind }: { kind: ArcLeverageUse["glyph"] }) {
  return (
    <svg className="arc-lev__glyph" viewBox="0 0 120 64" aria-hidden="true">
      {kind === "brief" && (
        <g>
          {[8, 20, 32, 44].map((y, i) => (
            <line
              key={y}
              className={i === 1 ? "arc-lev__glyph-act" : "arc-lev__glyph-ink"}
              x1="8"
              x2={i === 1 ? 92 : 64 - i * 8}
              y1={y + 6}
              y2={y + 6}
            />
          ))}
          <rect className="arc-lev__glyph-dot" x="100" y="22" width="8" height="8" />
        </g>
      )}
      {kind === "frame" && (
        <g>
          {Array.from({ length: 28 }, (_, i) => (
            <line
              key={i}
              className={i >= 16 && i < 22 ? "arc-lev__glyph-act" : "arc-lev__glyph-ink"}
              x1={6 + i * 4}
              x2={6 + i * 4}
              y1={i % 3 === 0 ? 8 : 18}
              y2="56"
            />
          ))}
        </g>
      )}
      {kind === "flow" && (
        <g>
          <path
            className="arc-lev__glyph-grid"
            d="M0 16 H120 M0 32 H120 M0 48 H120 M30 0 V64 M60 0 V64 M90 0 V64"
          />
          <path className="arc-lev__glyph-act" d="M12 52 V40 H44 V26 H76 V12 H108" />
          <rect className="arc-lev__glyph-dot" x="8" y="48" width="8" height="8" />
          <rect className="arc-lev__glyph-dot" x="104" y="8" width="8" height="8" />
        </g>
      )}
      {kind === "check" && (
        <g>
          <rect className="arc-lev__glyph-ink" x="8" y="6" width="44" height="52" />
          <rect
            className="arc-lev__glyph-act arc-lev__glyph-dash"
            x="18"
            y="16"
            width="24"
            height="18"
          />
          <path className="arc-lev__glyph-ink" d="M60 32 H72" />
          <path className="arc-lev__glyph-act" d="M78 34 L90 46 L112 18" />
        </g>
      )}
    </svg>
  );
}
