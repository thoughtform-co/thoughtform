import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { JOB_BUCKETS } from "./ArcJob";
import { Glyph } from "./ArcLeverage";
import { rung } from "./arcMotion";
import { pluginLayer } from "./pluginLayer";
import type { PlugSeat } from "./pluginLayer";

const two = (n: number) => String(n).padStart(2, "0");
const at = (s: PlugSeat) => ({ "--ax": s.ax, "--at": s.at }) as CSSProperties;

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
        <figure className="arc-plug__fig">
          <div className="arc-plug__stage">
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
            </svg>
            <p className="arc-plug__tag" data-plug-tag="layer" style={at(d.seats.layer)}>
              {face.layer}
            </p>
            <p className="arc-plug__tag" data-plug-tag="host" style={at(d.seats.host)}>
              {face.host}
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
              <p
                key={face.connectors[i]}
                className="arc-plug__tag"
                data-plug-tag="link"
                style={at(s)}
              >
                {face.connectors[i]}
              </p>
            ))}
          </div>
          <figcaption className="visually-hidden">{section.record.alt.org}</figcaption>
        </figure>
        <div className="arc-plug__list">
          <p className="arc-lev__uses-label">{face.label}</p>
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
