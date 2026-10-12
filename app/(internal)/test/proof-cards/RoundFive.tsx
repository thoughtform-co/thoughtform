import { Glyph } from "@/components/arcs/ArcLeverage";
import { disciplineOf } from "@/lib/arcs/content/shared/disciplines";

import { Evidence, type Job, resultLabel, two } from "./parts";
import { PRACTICE } from "./practice";

/**
 * Round five (owner, 2026-10-12): 3C rebuilt with ONLY the changes he named,
 * starting from 3C's own markup and spacing rather than from later rounds.
 *
 *   the top bar   3C's, no keys, one face in capitals: the client framed, the
 *                 brief's name, the workstream with the vision's glyph
 *   the frame     one notch, top right
 *   left          3C's ask box, now the brief: one paragraph stating the
 *                 problem; then 3C's tabbed boxes, now Embed, Claude 1 to 3
 *                 (one box, three lines) and Empower: 3C's three boxes, on 3C's rail, in Tensor Gold, every line
 *                 welded to the brief box above
 *   right         one flow, as 3C's: what it now allows, level with the brief
 *                 and boxed the same, then the time saved as the bars, no
 *                 sentence
 *
 * The air is 3C's. Where five steps do not fit one screen at 1280, the card
 * grows taller rather than the spacing shrinking (the stage is content-high).
 */
export function DirectionH({ job }: { job: Job }) {
  const p = PRACTICE[job.id];
  const d = disciplineOf(job.bucket);

  return (
    <article className="pk-card pk-c pk-h" aria-label={p.name}>
      <header className="pk-c__head pk-h__head">
        <span className="pk-h__client">{job.client}</span>
        <span className="pk-h__name">{p.name}</span>
        <span className="pk-h__ws">
          <Glyph kind={d.glyph} />
          {d.long}
        </span>
      </header>
      <div className="pk-c__body pk-h__body">
        <div className="pk-c__box pk-h__brief">
          <p className="pk-c__tab">The brief</p>
          <p className="pk-lede">{p.problem}</p>
        </div>
        <ol className="pk-c__steps pk-h__steps" aria-label="The work">
          <li className="pk-c__box">
            <p className="pk-c__tab">Embed</p>
            <p className="pk-body">{p.embed}</p>
          </li>
          <li className="pk-c__box">
            <p className="pk-c__tab">Claude did</p>
            <ol className="pk-h__did">
              {job.did.map((t, i) => (
                <li key={t}>
                  <span>{two(i + 1)}</span>
                  {t}
                </li>
              ))}
            </ol>
          </li>
          <li className="pk-c__box">
            <p className="pk-c__tab">Empower</p>
            <p className="pk-body">{p.empower}</p>
          </li>
        </ol>
        <figure className="pk-c__fig pk-h__fig" data-figure={job.figure.kind}>
          <p className="pk-c__vert">
            Fig. {two(job.n)} · {job.figure.caption}
          </p>
          <div className="pk-c__ev">
            <i className="pk-c__x pk-c__x--tl" aria-hidden="true" />
            <i className="pk-c__x pk-c__x--tr" aria-hidden="true" />
            <i className="pk-c__x pk-c__x--bl" aria-hidden="true" />
            <i className="pk-c__x pk-c__x--br" aria-hidden="true" />
            <Evidence job={job} />
          </div>
        </figure>
        <div className="pk-c__box pk-c__box--lit pk-h__allows">
          <p className="pk-c__tab">What it now allows</p>
          <p className="pk-lede">{job.result.allows}</p>
        </div>
        <div className="pk-c__box pk-h__saved">
          <p className="pk-c__tab">
            {resultLabel(job)}
            {job.result.label === "The return" ? null : " · estimated"}
          </p>
          <div className="pk-bars">
            <div className="pk-bars__row">
              <span className="pk-bars__k">Before</span>
              <i className="pk-bars__bar" data-w="long" aria-hidden="true" />
              <span className="pk-bars__v">{p.before}</span>
            </div>
            <div className="pk-bars__row" data-lit="true">
              <span className="pk-bars__k">Now</span>
              <i className="pk-bars__bar" data-w="short" aria-hidden="true" />
              <span className="pk-bars__v">{p.now}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="pk-gate">
        <span className="pk-gate__key">The gate</span>
        <span className="pk-gate__who">{job.gate.who}</span>
        {job.gate.line ? <span className="pk-gate__line">{job.gate.line}</span> : null}
      </p>
    </article>
  );
}
