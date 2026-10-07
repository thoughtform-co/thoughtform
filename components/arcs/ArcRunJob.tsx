import type { ArcMotion, ArcRunJob as ArcRunJobRecord, ArcRunJobBeat } from "@/lib/arcs/types";

import { ArcClipLoop } from "./ArcClipLoop";
import { rung } from "./arcMotion";

/** Chrome, never content. */
export const RUN_JOB_KEPT = "Kept";
export const RUN_JOB_REJECTED = "Sent back";

/**
 * ArcRunJob — a real job under a skill run (ADR-148 U4): the film as
 * delivered beside its facts, then the method in a few beats, each a line on
 * the left and its evidence on the right (stills, rows or measured numbers).
 *
 * ⚠ SERVER, NO STATE; the film is the house's one silent loop
 * (`ArcClipLoop`: muted, plays only in view, never under reduced motion).
 * `data-run-*` only. The stills are square-cornered children of the workshop
 * frame and take a 1px edge, never the notch: one notched object per box.
 */
export function ArcRunJob({
  job,
  motion = "reveal",
}: {
  job: ArcRunJobRecord;
  motion?: ArcMotion;
}) {
  return (
    <div className="arc-job" data-run-job="">
      <div className="arc-job__top arc-reveal" {...rung(motion, 0.1)}>
        <figure className="arc-job__film">
          <ArcClipLoop clip={job.film} />
        </figure>
        <div className="arc-job__head">
          <p className="arc-job__eyebrow">{job.eyebrow}</p>
          <h3 className="arc-job__title">
            {job.title.pre} <em>{job.title.em}</em>
          </h3>
          <p className="arc-job__sub">{job.sub}</p>
          <dl className="arc-job__facts">
            {job.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <ol className="arc-job__beats">
        {job.beats.map((beat, i) => (
          <li
            key={beat.id}
            className="arc-job__beat arc-reveal"
            data-run-beat={beat.id}
            {...rung(motion, 0.1)}
          >
            <div className="arc-job__text">
              <span className="arc-job__key">
                {i + 1} · {beat.key}
              </span>
              <h4 className="arc-job__beat-title">{beat.title}</h4>
              <p className="arc-job__line">{beat.line}</p>
            </div>
            <JobEvidence beat={beat} />
          </li>
        ))}
      </ol>
      {job.foot ? <p className="arc-job__foot">{job.foot}</p> : null}
    </div>
  );
}

function JobEvidence({ beat }: { beat: ArcRunJobBeat }) {
  if (beat.frames) {
    return (
      <div className="arc-job__frames" data-run-frames={beat.frames[0].ratio}>
        {beat.frames.map((f) => (
          <figure key={f.src} className="arc-job__frame" data-run-verdict={f.verdict}>
            {/* eslint-disable-next-line @next/next/no-img-element -- self-hosted stills at their own size, the arcs' idiom */}
            <img src={f.src} alt={f.alt} loading="lazy" decoding="async" />
            <figcaption>
              {f.verdict ? <b>{f.verdict === "kept" ? RUN_JOB_KEPT : RUN_JOB_REJECTED}</b> : null}
              {f.label}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }
  if (beat.figures) {
    return (
      <dl className="arc-job__figures">
        {beat.figures.map((f) => (
          <div key={f.label}>
            <dt>{f.value}</dt>
            <dd>{f.label}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className="arc-job__rows">
      {(beat.rows ?? []).map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
