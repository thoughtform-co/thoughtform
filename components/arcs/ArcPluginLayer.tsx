import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { JOB_BUCKETS } from "./ArcJob";
import { Glyph } from "./ArcLeverage";
import { rung } from "./arcMotion";
import { pluginLayer } from "./pluginLayer";
import type { PlugDrawing, PlugLead, PlugSeat } from "./pluginLayer";

const two = (n: number) => String(n).padStart(2, "0");
const at = (s: PlugSeat) => ({ "--ax": s.ax, "--at": s.at }) as CSSProperties;
const lead = (l: PlugLead) =>
  ({ "--ax": l.ax, "--at": l.at, "--aw": l.aw, "--ah": l.ah }) as CSSProperties;

/**
 * ArcPluginLayer — the plugin, drawn as the layer opened (ADR-153 U6, owner
 * 2026-10-10: "Layer opened"). The vision console's housing, header and
 * ruled field; in the field, the gold slab the team writes drawn large, one
 * lane per skill on its top carrying the figure its workstream's lane draws
 * on the Loop return, the client's Claude Enterprise as a plain slab under
 * it, its connectors running in from below. One label column on the right:
 * the workstream, the skill and who keeps it.
 *
 * ⚠ THE WORDS ARE THE RECORD'S (`record.org`), the drawing is the section's
 * (`face`): the instrument record keeps every reader it had.
 * ⚠ THE SVG LETTERS NOTHING; every word is DOM on a seat `pluginLayer`
 * computes, never on a projected face.
 * ⚠ SERVER, NO STATE, NO SCRIPT. `data-plug-*` only.
 *
 * The figure is `PlugFigure`, shared since 2026-10-11 with the approach's
 * `opened` lab direction (`ArcApproachOpened`), which mounts the same
 * drawing with one lane lit; this beat's markup is byte-identical to what
 * it was before the split.
 */
export function ArcPluginLayer({
  section,
  motion,
}: {
  section: ArcSectionOf<"instrument">;
  motion: ArcMotion;
}) {
  const face = section.face;
  const org = section.record.org;
  if (!face || !org) return null;
  const d = pluginLayer(face.lanes, face.connectors.length);
  return (
    <div className="arc-lev arc-plug arc-plate arc-reveal" {...rung(motion, 0.14)}>
      <div className="arc-lev__bar">
        <p className="arc-lev__sys">
          <span className="arc-lev__sys-key">SYS</span>
          {face.console.name}
        </p>
        <p className="arc-lev__status">
          <span className="arc-lev__pulse" aria-hidden="true" />
          {face.console.status}
        </p>
      </div>
      <div className="arc-plug__split">
        <PlugFigure
          d={d}
          layer={face.layer}
          host={face.host}
          connectors={face.connectors}
          alt={section.record.alt.org}
        />
        <div className="arc-plug__list">
          <ol className="arc-plug__rows">
            {org.workstreams.map((w, i) => {
              const b = JOB_BUCKETS.find((x) => x.id === w.id);
              return (
                <li key={w.id} className="arc-plug__row" data-plug-row={w.id}>
                  <p className="arc-lev__index">{two(i + 1)}</p>
                  <p className="arc-case__ws">
                    {b ? <Glyph kind={b.glyph} /> : null}
                    <span className="arc-case__ws-word">{w.bucket ?? b?.word}</span>
                  </p>
                  <p className="arc-plug__skill">{w.name}</p>
                  {w.line ? (
                    <p className="arc-plug__keeper">
                      <span className="arc-plug__mark" aria-hidden="true" />
                      {w.line}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

export interface PlugFigureProps {
  d: PlugDrawing;
  layer: string;
  host: string;
  connectors: readonly string[];
  /** The drawing's accessible name, the figure's hidden caption. */
  alt?: string;
  /**
   * The lane opened (the approach's lab direction): the lit lane's skill
   * past its end, the three passes' tags on their marks' leaders, and a
   * visible caption after the hidden one. Absent, the figure is the plugin
   * beat's, byte-identical.
   */
  opened?: {
    skill: string;
    caption: { n: string; text: string };
  };
}

/** The opened layer's figure: the svg, which letters nothing, and its DOM
 *  tags, each on a seat the geometry computes. */
export function PlugFigure({ d, layer, host, connectors, alt, opened }: PlugFigureProps) {
  const o = d.opened;
  const stageStyle = o ? ({ "--plug-w": d.vb.w, "--plug-h": d.vb.h } as CSSProperties) : undefined;
  return (
    <figure className="arc-plug__fig">
      <div className="arc-plug__stage" style={stageStyle}>
        <svg
          className="arc-plug__svg"
          viewBox={`${d.vb.x} ${d.vb.y} ${d.vb.w} ${d.vb.h}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          {d.host.sides.map((p) => (
            <path key={p} className="arc-plug__host-side" d={p} />
          ))}
          <path className="arc-plug__host-top" d={d.host.top} />
          <path className="arc-plug__link" d={d.connectors} />
          {d.layer.sides.map((p) => (
            <path key={p} className="arc-plug__layer-side" d={p} />
          ))}
          <path className="arc-plug__layer-top" d={d.layer.top} />
          <path className="arc-plug__seam" d={d.seams} />
          {d.lanes.map((l) => (
            <g key={l.id} data-plug-lane={l.id}>
              {l.traces ? <path className="arc-case__trace" d={l.traces} /> : null}
              {l.grains.map((g) => (
                <path key={g.a} className="arc-case__grain" fillOpacity={g.a} d={g.d} />
              ))}
              {l.people.map((p) => (
                <path key={p} className="arc-case__person" d={p} />
              ))}
            </g>
          ))}
          {o ? (
            <g className="apr__opened" data-plug-lane={o.lane} data-plug-lit="">
              {o.dim.map((p) => (
                <path key={p} className="apr__lane-dim" d={p} />
              ))}
              <path className="apr__lane-face" d={o.face} />
              <path className="apr__spine" d={o.spine} />
              {o.adopted.map((g) => (
                <path key={g.a} className="apr__bead" data-apr-quiet="" fillOpacity={g.a} d={g.d} />
              ))}
              {o.courses.map((c) => (
                <path key={c.d} className="apr__course" data-apr-course={c.kind} d={c.d} />
              ))}
              {o.beads.map((g) => (
                <path key={g.a} className="apr__bead" fillOpacity={g.a} d={g.d} />
              ))}
              <path className="apr__person" d={o.head} />
              <path className="apr__person" data-apr-ask="" d={o.end} />
            </g>
          ) : null}
        </svg>
        <p className="arc-plug__tag" data-plug-tag="layer" style={at(d.seats.layer)}>
          {layer}
        </p>
        <p className="arc-plug__tag" data-plug-tag="host" style={at(d.seats.host)}>
          {host}
        </p>
        {d.seats.index.map((s, i) => (
          <p
            key={two(i + 1)}
            className="arc-plug__tag"
            data-plug-tag="index"
            style={at(s)}
            aria-hidden="true"
          >
            {two(i + 1)}
          </p>
        ))}
        {d.seats.connectors.map((s, i) => (
          <p key={connectors[i]} className="arc-plug__tag" data-plug-tag="link" style={at(s)}>
            {connectors[i]}
          </p>
        ))}
        {o && opened ? (
          <>
            <p className="arc-plug__tag" data-plug-tag="skill" style={at(o.seats.skill)}>
              {opened.skill}
            </p>
            {o.leads.map((l, i) => (
              <span key={`lead-${i}`} className="apr__lead" style={lead(l)} aria-hidden="true" />
            ))}
            {o.seats.passes.map((s, i) => (
              <p
                key={two(i + 1)}
                className="arc-plug__tag"
                data-plug-tag="pass"
                data-apr-anchor={i === 0 ? "end" : "middle"}
                style={at(s)}
                aria-hidden="true"
              >
                {two(i + 1)}
              </p>
            ))}
          </>
        ) : null}
      </div>
      {opened ? (
        <figcaption className="apr__caption">
          <span className="visually-hidden">{alt}</span>
          <span className="apr__fig-n">Fig. {opened.caption.n}</span>
          {opened.caption.text}
        </figcaption>
      ) : (
        <figcaption className="visually-hidden">{alt}</figcaption>
      )}
    </figure>
  );
}
