import type { ArcMotion, ArcSectionOf, CrewRow } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ALLOWS_LABEL, JOB_BUCKETS } from "./ArcJob";
import { Glyph } from "./ArcLeverage";
import { rung } from "./arcMotion";
import { PARTICLE_VB, crewParticles, crewSeed, grainPaths, personPath } from "./crewParticles";

/** Chrome, never content: the key the lanes add to the job card's
 *  vocabulary. The last column says the job card's own "what it now allows"
 *  (`ALLOWS_LABEL`), so the two cards read as one return. */
const RUNS_LABEL = "What runs now";

/** True when `text` already says `word`: a lane prints nothing twice (the
 *  strategy lane's role IS its workstream's name; the review lane's work is
 *  its workstream's last word). */
const says = (text: string, word: string) => text.toLowerCase().includes(word.toLowerCase());

/**
 * ArcCrewCase — what it returned at Loop, in the jobs' own housing (ADR-153
 * U5, owner 2026-10-10: the return "looks different from the other sections
 * … redesign what it returned at Loop … so they match the examples from
 * Samako and Suri").
 *
 *   band   the job card's: a title and one mono line on the Tensor Gold
 *          wash. No workstream on the right: every lane carries its own.
 *   lanes  one per workstream, read left to right on shared columns: the
 *          people (the vision's glyph and word, then who), the figure (the
 *          quantity as particles, on the job card's dot ground and corner
 *          ticks), what runs now (Loop's work and the record's line), and
 *          what it now allows (where the people's time goes).
 *
 * ⚠ THE COLUMNS ARE ONE GRID AND THE LANES ARE ITS SUBGRID ROWS, so the four
 * figures share one dot ground and one frame, as the job card's single figure
 * does, and every lane's text lines up across lanes without a measurement.
 * The column keys are drawn once, `aria-hidden`; each lane carries its own
 * keys for a screen reader and for the phone, where the grid unwinds.
 *
 * ⚠ SERVER, NO STATE, NO SCRIPT. The record is the shared `LOOP_RETURN`;
 * Pandora's page draws the same rows as the circuit (`ArcCrew`), unchanged.
 */
export function ArcCrewCase({
  section,
  motion = "reveal",
}: {
  section: ArcSectionOf<"crew">;
  index: number;
  motion?: ArcMotion;
}) {
  const card = section.card;
  if (!card) return null;
  const titleId = `${section.id}-title`;
  return (
    <ArcBeat
      id={section.id}
      kind="crew"
      className="arc-section arc-sec arc-sec--return"
      ariaLabel={section.ariaLabel ?? card.title}
      motion={motion}
    >
      <div className="arc-band">
        <article
          className="arc-lev arc-case arc-case--return arc-plate arc-reveal"
          aria-labelledby={titleId}
          {...rung(motion, 0.1)}
        >
          <header className="arc-case__top">
            <div className="arc-case__lead">
              <h2 className="arc-case__title" id={titleId}>
                {card.title}
              </h2>
              <p className="arc-case__meta">
                {card.meta.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </p>
            </div>
          </header>
          <div className="arc-case__lanes">
            <i className="arc-case__lanes-fig" aria-hidden="true" />
            <i className="arc-case__lanes-frame" aria-hidden="true" />
            <p className="arc-case__lanes-key" data-crew-col="runs" aria-hidden="true">
              {RUNS_LABEL}
            </p>
            <p className="arc-case__lanes-key" data-crew-col="allows" aria-hidden="true">
              {ALLOWS_LABEL}
            </p>
            <ol className="arc-case__lanes-list">
              {section.rows.map((r) => (
                <Lane key={r.id} row={r} />
              ))}
            </ol>
          </div>
        </article>
      </div>
    </ArcBeat>
  );
}

function Lane({ row }: { row: CrewRow }) {
  const ws = JOB_BUCKETS.find((b) => b.id === row.bucket) ?? JOB_BUCKETS[0];
  const p = crewParticles(row.output, crewSeed(row.id));
  return (
    <li className="arc-case__lane" data-crew-bucket={ws.id}>
      <div className="arc-case__lane-who">
        <p className="arc-case__ws">
          <Glyph kind={ws.glyph} />
          <span className="arc-case__ws-word">{ws.word}</span>
        </p>
        {says(ws.word, row.who) ? null : <p className="arc-case__lane-role">{row.who}</p>}
      </div>
      <div className="arc-case__lane-fig">
        <svg
          className="arc-case__particles"
          viewBox={`0 0 ${PARTICLE_VB.w} ${PARTICLE_VB.h}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          {p.traces.length ? <path className="arc-case__trace" d={p.traces.join("")} /> : null}
          {grainPaths(p.grains).map((g) => (
            <path key={g.a} className="arc-case__grain" fillOpacity={g.a} d={g.d} />
          ))}
          {p.people.map((q) => (
            <path key={`${q.cx}-${q.cy}`} className="arc-case__person" d={personPath(q)} />
          ))}
        </svg>
      </div>
      <div className="arc-case__lane-runs">
        <p className="arc-case__lane-key" data-crew-key="runs">
          {RUNS_LABEL}
        </p>
        {says(ws.word, row.work) ? null : <p className="arc-case__lane-work">{row.work}</p>}
        <p className="arc-case__lane-line">{row.line}</p>
      </div>
      <div className="arc-case__lane-allows">
        <p className="arc-case__lane-key" data-crew-key="allows">
          {ALLOWS_LABEL}
        </p>
        <p className="arc-case__lane-line">{row.allows}</p>
      </div>
    </li>
  );
}
