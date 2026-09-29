import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcPathProps {
  section: ArcSectionOf<"path">;
  index: number;
  motion?: ArcMotion;
}

/** How many frames a stage sets side by side: a pair stacks, a handful
 *  goes two across, a wide sweep five. */
export function pathCols(count: number): number {
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 5;
}

/**
 * ArcPath — how a world was found (ADR-134).
 *
 * An exploration as a row of dated stages, left to right, each a column of
 * the frames that stage actually produced: wide, then narrowing to what was
 * kept. A record, never a metaphor (ADR-078 U1): every frame is on file and
 * every stage carries its date.
 *
 * ⚠ A SET IS CUT TO ONE CELL SHAPE (3:2), a single frame keeps its own:
 * frames of four aspects in one grid read as a mess, and the set is the
 * reading there, while the one frame a stage ends on is the thing looked at.
 *
 * ⚠ THE FRAMES CARRY NO CAPTION. The stage's head says what they are; a
 * caption under every frame is the card grid again, and the owner's complaint
 * about the page this replaced was that every section had the same structure.
 *
 * ⚠ ONE RAIL, HORIZONTAL, through the stage nodes. No vertical divider
 * between the columns: the rails are the page's verticals.
 *
 * Server, no state, no listener; attributes are `data-path-*`.
 */
export function ArcPath({ section, index, motion = "reveal" }: ArcPathProps) {
  const cols = section.stages.map((s) => pathCols(s.images.length));
  return (
    <ArcBeat
      id={section.id}
      kind="path"
      className="arc-section arc-sec arc-sec--path"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="path"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <figure
          className="arc-path arc-reveal"
          style={{
            gridTemplateColumns: section.stages
              .map((s, i) => `minmax(0, ${s.weight ?? cols[i]}fr)`)
              .join(" "),
          }}
          {...rung(motion, 0.12, 0)}
        >
          {section.stages.map((s, i) => (
            <div
              key={s.id}
              className="arc-path__stage"
              data-path-stage={s.id}
              data-path-last={i === section.stages.length - 1 ? "" : undefined}
              {...rung(motion, ladder(0.16, 0.06, i, 0.4), 0, 12)}
            >
              <div className="arc-path__head">
                <span className="arc-path__node" aria-hidden="true" />
                <span className="arc-path__date">{s.date}</span>
                <span className="arc-path__label">{s.label}</span>
                <span className="arc-path__name">{s.name}</span>
              </div>
              <div
                className="arc-path__frames"
                data-path-set={s.images.length > 1 ? "" : undefined}
                style={{ "--path-cols": cols[i] } as CSSProperties}
              >
                {s.images.map((img) => (
                  <span
                    key={img.src}
                    className="arc-path__frame"
                    style={
                      s.images.length > 1
                        ? undefined
                        : { aspectRatio: `${img.width} / ${img.height}` }
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- the arc plates' rule: a plain img, the file already web weight */}
                    <img
                      src={img.src}
                      alt={img.alt}
                      width={img.width}
                      height={img.height}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                ))}
              </div>
              {s.line ? <p className="arc-path__line">{s.line}</p> : null}
            </div>
          ))}
        </figure>
        {section.note ? <p className="arc-path__note">{section.note}</p> : null}
      </div>
    </ArcBeat>
  );
}
