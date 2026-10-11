import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf, ArcVisionFigure as VisionDef } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { Glyph } from "./ArcLeverage";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import { phaseRows, teamFigure } from "./visionFigure";
import type { VisCallout, VisMark } from "./visionFigure";

const two = (n: number) => String(n).padStart(2, "0");
const at = (c: VisCallout) => ({ "--ax": c.ax, "--at": c.at, "--ay": c.ay }) as CSSProperties;
const crop = (vb: { w: number; h: number }) =>
  ({ "--vis-w": vb.w, "--vis-h": vb.h, "--vis-aspect": `${vb.w} / ${vb.h}` }) as CSSProperties;

interface ArcVisionProps {
  section: ArcSectionOf<"leverage">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcVision — the vision in another route (the proposal system lab,
 * 2026-10-11; the owner: the console's IA and its 2×2 stay, the models tier
 * goes, "what's missing is THE TEAM"). Two drawings, both the stack's own
 * object in the framing's one projection (`visionFigure`):
 *
 *   team    the console as it ships (the head strip, the 5/7 split, the
 *           readout foot), its stack three tiers: the host, the lit layer,
 *           the four workstreams standing on it as a team, a green diamond
 *           on each; the three levels lettered beside it on leaders; the
 *           2×2 with the owner's role under each workstream.
 *   phases  one housing cut into three rows that share edges, a mono rail
 *           at the left of each, the same slab at a crop in each (the deck
 *           with its people, the layer with its courses, the host with its
 *           connectors), one sentence at the right, a flow leader down.
 *
 * ⚠ THE SVG LETTERS NOTHING. Every word is DOM on a seat the geometry
 * computes; a leader is a DOM line. ⚠ SERVER, NO STATE, DOM ONLY.
 */
export function ArcVision({ section, index, motion = "reveal" }: ArcVisionProps) {
  const figure = section.figure;
  if (!figure) return null;
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
        {figure.kind === "team" ? (
          <TeamConsole section={section} figure={figure} motion={motion} />
        ) : (
          <PhasesHousing section={section} figure={figure} motion={motion} />
        )}
      </div>
    </ArcBeat>
  );
}

/** The console's head strip, the vision's own. */
function Bar({ con }: { con: { name: string; status: string } }) {
  return (
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
  );
}

/** The marks of one crop; the lit plate's hatch takes the instance's pattern. */
function Marks({ marks, hatch }: { marks: readonly VisMark[]; hatch: string }) {
  return (
    <>
      {marks.map((m, i) => (
        <path
          key={`${m.cls}-${i}`}
          className={`vis__m-${m.cls}`}
          d={m.d}
          fill={m.cls === "hatch" ? `url(#${hatch})` : undefined}
        />
      ))}
    </>
  );
}

function Hatch({ id }: { id: string }) {
  /* 16 units a pitch: at a third of a pixel a unit the house's 6 would be a
     wash, and this hatch is hairlines (the owner, on the rows: crisp). */
  return (
    <defs>
      <pattern
        id={id}
        width="16"
        height="16"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="16" className="vis__hatch-line" />
      </pattern>
    </defs>
  );
}

/** The two leaders of a word block: the run to the vertex's x, and the
 *  vertical to the vertex where the block sits off its level. */
function Leads() {
  return (
    <>
      <span className="vis__lead" />
      <span className="vis__lead-v" />
    </>
  );
}

interface RouteProps {
  section: ArcSectionOf<"leverage">;
  figure: VisionDef;
  motion: ArcMotion;
}

function TeamConsole({ section, figure, motion }: RouteProps) {
  const { uses, readout } = section;
  const d = teamFigure(figure.tiles.length);
  const hatch = `${section.id}-vis-hatch`;
  const roleOf = (id: string) => figure.tiles.find((t) => t.id === id)?.role;
  return (
    <div className="arc-lev arc-plate arc-reveal vis vis--team" {...rung(motion, 0.14)}>
      <Bar con={section.console} />
      <div className="arc-lev__split">
        <div className="arc-lev__idea vis__idea">
          <figure className="vis__fig" role="img" aria-label={figure.alt} style={crop(d.vb)}>
            <div className="vis__in">
              <div className="vis__plot">
                <svg
                  className="vis__svg"
                  viewBox={`0 0 ${d.vb.w} ${d.vb.h}`}
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                  focusable="false"
                >
                  <Hatch id={hatch} />
                  <Marks marks={d.marks} hatch={hatch} />
                </svg>
              </div>
              <div className="vis__words" aria-hidden="true">
                <div className="vis__callout" data-vis-level="team" style={at(d.callouts.team)}>
                  <Leads />
                  <p className="vis__label">{figure.levels.team}</p>
                  <ul className="vis__names">
                    {figure.tiles.map((t) => (
                      <li key={t.id} className="vis__name">
                        <span className="vis__person-mark" />
                        {t.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="vis__callout"
                  data-vis-level="layer"
                  data-vis-lit=""
                  style={at(d.callouts.layer)}
                >
                  <Leads />
                  <p className="vis__label">{figure.levels.layer}</p>
                  <p className="vis__layer-line">{figure.layerLine}</p>
                </div>
                <div className="vis__callout" data-vis-level="host" style={at(d.callouts.host)}>
                  <Leads />
                  <p className="vis__label">{figure.levels.host}</p>
                  <ul className="vis__links">
                    {figure.connectors.map((c) => (
                      <li key={c} className="vis__link">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </figure>
        </div>
        <div className="arc-lev__uses">
          <p className="arc-lev__uses-label">{uses.label}</p>
          <ul className="arc-lev__grid">
            {uses.items.map((u, i) => {
              const role = roleOf(u.id);
              return (
                <li key={u.id} className="arc-lev__cell vis__cell">
                  <p className="arc-lev__index">{two(i + 1)}</p>
                  <Glyph kind={u.glyph} />
                  <p className="arc-lev__title">{u.label}</p>
                  <p className="arc-lev__line">{u.line}</p>
                  {role ? (
                    <p className="vis__role">
                      <span className="vis__person-mark" aria-hidden="true" />
                      {role}
                    </p>
                  ) : null}
                </li>
              );
            })}
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
  );
}

function PhasesHousing({ section, figure, motion }: RouteProps) {
  const rows = phaseRows(figure.tiles.length, {
    skills: figure.courses.skills.length,
    evals: figure.courses.evals.length,
  });
  const levels = [figure.levels.team, figure.levels.layer, figure.levels.host];
  const hatch = `${section.id}-vis-hatch`;
  return (
    <div className="arc-lev arc-plate arc-reveal vis vis--phases" {...rung(motion, 0.14)}>
      <Bar con={section.console} />
      <ol className="vis__rows" aria-label={figure.alt}>
        {rows.map((row, i) => (
          <li
            key={levels[i]}
            className="vis__row"
            data-vis-row={i}
            data-vis-lit={i === 1 ? "" : undefined}
            style={
              {
                ...crop(row.vb),
                "--fx": row.flow.fx,
                "--fb": row.flow.fb,
                "--fa": rows[i + 1]?.flow.fa ?? 0,
              } as CSSProperties
            }
          >
            <p className="vis__rail">
              <span className="vis__rail-n">{two(i + 1)}</span>
              {levels[i]}
            </p>
            <figure
              className="vis__fig"
              role="img"
              aria-label={`${levels[i]}: ${figure.lines?.[i] ?? ""}`}
            >
              <div className="vis__in">
                <div className="vis__plot">
                  <svg
                    className="vis__svg"
                    viewBox={`0 0 ${row.vb.w} ${row.vb.h}`}
                    preserveAspectRatio="xMidYMid meet"
                    aria-hidden="true"
                    focusable="false"
                  >
                    {i === 1 ? <Hatch id={hatch} /> : null}
                    <Marks marks={row.marks} hatch={hatch} />
                  </svg>
                  {i < rows.length - 1 ? <span className="vis__flow" aria-hidden="true" /> : null}
                </div>
                <div className="vis__words" aria-hidden="true">
                  <div
                    className="vis__callout"
                    data-vis-level={i === 0 ? "team" : i === 1 ? "layer" : "host"}
                    data-vis-lit={i === 1 ? "" : undefined}
                    style={at(row.callout)}
                  >
                    <Leads />
                    {i === 0 ? (
                      <ul className="vis__names">
                        {figure.tiles.map((t) => (
                          <li key={t.id} className="vis__name">
                            <span className="vis__person-mark" />
                            {t.name}
                          </li>
                        ))}
                      </ul>
                    ) : i === 1 ? (
                      <ul className="vis__courses">
                        {figure.courses.skills.map((c) => (
                          <li key={c} data-vis-course="skill">
                            {c}
                          </li>
                        ))}
                        {figure.courses.evals.map((c) => (
                          <li key={c} data-vis-course="eval">
                            {c}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="vis__links">
                        {figure.connectors.map((c) => (
                          <li key={c} className="vis__link">
                            {c}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </figure>
            <p className="vis__line">{figure.lines?.[i]}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
