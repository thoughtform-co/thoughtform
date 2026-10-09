import type { ArcLeverageUse, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { Slab } from "@/components/instrument/Slab";

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
 * ⚠ SERVER, NO STATE, DOM ONLY; the SVGs letter nothing. Nothing idles
 * (ADR-080): the status light is lit, not pulsing.
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
                    <Slab
                      tier={p.own ? "own" : i === stack.length - 1 ? "shared" : "host"}
                      id={`${section.id}-lev-${p.id}`}
                      className="arc-lev__slab"
                      faceClass="arc-lev__slab-top"
                      sideClass="arc-lev__slab-side"
                      hatchClass="arc-lev__hatch"
                    />
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

/** Four data glyphs on one 120×64 box, hairline, gold where it acts. */
export function Glyph({ kind }: { kind: ArcLeverageUse["glyph"] }) {
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
      {kind === "ratio" && (
        <g>
          <path className="arc-lev__glyph-grid" d="M0 56 H120" />
          <rect className="arc-lev__glyph-ink" x="20" y="44" width="24" height="12" />
          <rect className="arc-lev__glyph-act" x="64" y="10" width="24" height="46" />
          <path className="arc-lev__glyph-ink" d="M50 50 L58 50 M54 46 L58 50 L54 54" />
        </g>
      )}
      {kind === "spread" && (
        <g>
          {Array.from({ length: 24 }, (_, i) => (
            <rect
              key={i}
              className={
                [3, 8, 13, 17, 22].includes(i) ? "arc-lev__glyph-dot" : "arc-lev__glyph-ink"
              }
              x={8 + (i % 8) * 14}
              y={10 + Math.floor(i / 8) * 16}
              width="8"
              height="8"
            />
          ))}
        </g>
      )}
      {kind === "clock" && (
        <g>
          <path className="arc-lev__glyph-grid" d="M8 32 H112" />
          {[8, 34, 60, 86, 112].map((x) => (
            <path key={x} className="arc-lev__glyph-ink" d={`M${x} 26 V38`} />
          ))}
          <path className="arc-lev__glyph-act" d="M8 32 H46" />
          <rect className="arc-lev__glyph-dot" x="4" y="28" width="8" height="8" />
          <path className="arc-lev__glyph-act" d="M46 24 L54 32 L46 40 L38 32 Z" />
        </g>
      )}
      {kind === "meter" && (
        <g>
          <rect className="arc-lev__glyph-ink" x="8" y="22" width="104" height="20" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <path
              key={i}
              className={i < 7 ? "arc-lev__glyph-act" : "arc-lev__glyph-ink"}
              d={`M${14 + i * 8} 26 V38`}
            />
          ))}
          <path className="arc-lev__glyph-ink" d="M8 50 V54 M60 50 V54 M112 50 V54" />
        </g>
      )}
    </svg>
  );
}
