import { Evidence, type Job, Key, Said, resultLabel, two, workstreamOf } from "./parts";
import { PRACTICE, type Practice } from "./practice";

/**
 * Four directions on one IA: the brief on the left (the ask, what Claude
 * did), the evidence in the middle, the return on the right (the saving,
 * what it now allows), the gate across the foot. Each direction is read off
 * one reference, decoded from the live site rather than from a summary:
 *
 *   A · Window   Unsiloed's hero panels: one housing, columns as cells with
 *                shared hairlines, the evidence in a titled window
 *                ("[ RAW INPUT ]"), corner squares on the title bar.
 *   B · Extract  Unsiloed's Extract panel: three detached windows, the steps
 *                wired into the evidence and the evidence wired into the
 *                return, a square node at every weld.
 *   C · Stack    Hex's Tensorlake code panels: tabbed boxes stacked down a
 *                rail with arrows between them, everything on a fine grid,
 *                the figure's label set vertical along its edge.
 *   D · Spec     Unsiloed's stat and feature cells: a strict grid of cells,
 *                each with its key at the top left and its [index] at the
 *                top right, the figure's caption in a lifted cell under it.
 */

const total = 4;

export function DirectionA({ job }: { job: Job }) {
  return (
    <article className="pk-card pk-a" aria-label={job.title}>
      <header className="pk-a__head">
        <div>
          <p className="pk-meta">
            <span>{job.client}</span>
            <span>{workstreamOf(job)}</span>
          </p>
          <h2 className="pk-title">{job.title}</h2>
        </div>
        <p className="pk-a__index">
          [ {two(job.n)} / {two(total)} ]
        </p>
      </header>
      <div className="pk-a__body">
        <section className="pk-a__cell pk-a__spec">
          <Key>The ask</Key>
          <p className="pk-lede">{job.ask}</p>
          <Key>Claude did</Key>
          <ol className="pk-a__did">
            {job.did.map((d, i) => (
              <li key={d}>
                <span>[{two(i + 1)}]</span>
                {d}
              </li>
            ))}
          </ol>
        </section>
        <figure className="pk-a__cell pk-a__fig">
          <div className="pk-win" data-figure={job.figure.kind}>
            <p className="pk-win__bar">
              <i aria-hidden="true" />[ Fig. {two(job.n)} · {job.figure.caption} ]
              <i aria-hidden="true" />
            </p>
            <div className="pk-win__body">
              <Evidence job={job} />
            </div>
          </div>
        </figure>
        <section className="pk-a__cell pk-a__ret">
          <div>
            <Key>{resultLabel(job)}</Key>
            <p className="pk-said">
              <Said title={job.result.said} />
            </p>
          </div>
          <div className="pk-a__allows">
            <Key>What it now allows</Key>
            <p className="pk-body">{job.result.allows}</p>
          </div>
        </section>
      </div>
      <Gate job={job} />
    </article>
  );
}

export function DirectionB({ job }: { job: Job }) {
  return (
    <article className="pk-card pk-b" aria-label={job.title}>
      <header className="pk-b__head">
        <h2 className="pk-title">{job.title}</h2>
        <p className="pk-b__status">
          <span className="pk-b__sq" aria-hidden="true" />
          {job.client} · {workstreamOf(job)}
          <span className="pk-b__prog" aria-hidden="true" />
        </p>
      </header>
      <div className="pk-b__body">
        <section className="pk-b__win pk-b__in">
          <p className="pk-b__bar">[ The brief ]</p>
          <div className="pk-b__pad">
            <Key>The ask</Key>
            <p className="pk-lede">{job.ask}</p>
            <Key>Claude did</Key>
            <ol className="pk-b__did">
              {job.did.map((d, i) => (
                <li key={d}>
                  <span>{two(i + 1)}</span>
                  {d}
                </li>
              ))}
            </ol>
          </div>
        </section>
        <figure className="pk-b__win pk-b__fig" data-figure={job.figure.kind}>
          <p className="pk-b__bar">
            [ Fig. {two(job.n)} · {job.figure.caption} ]
          </p>
          <div className="pk-b__ev">
            <Evidence job={job} />
          </div>
        </figure>
        <section className="pk-b__win pk-b__out">
          <p className="pk-b__bar">[ The return ]</p>
          <div className="pk-b__pad">
            <div className="pk-b__said">
              <Key>{resultLabel(job)}</Key>
              <p className="pk-said">
                <Said title={job.result.said} />
              </p>
            </div>
            <div className="pk-b__allows">
              <Key>What it now allows</Key>
              <p className="pk-body">{job.result.allows}</p>
            </div>
          </div>
        </section>
      </div>
      <Gate job={job} />
    </article>
  );
}

export function DirectionC({ job }: { job: Job }) {
  return (
    <article className="pk-card pk-c" aria-label={job.title}>
      <header className="pk-c__head">
        <h2 className="pk-title">{job.title}</h2>
        <p className="pk-c__chips">
          <span>{job.client}</span>
          <span>{workstreamOf(job)}</span>
        </p>
      </header>
      <div className="pk-c__body">
        <section className="pk-c__spec">
          <div className="pk-c__box pk-c__ask">
            <p className="pk-c__tab">The ask</p>
            <p className="pk-lede">{job.ask}</p>
          </div>
          <ol className="pk-c__steps" aria-label="Claude did">
            {job.did.map((d, i) => (
              <li key={d} className="pk-c__box">
                <p className="pk-c__tab">Claude · {two(i + 1)}</p>
                <p className="pk-body">{d}</p>
              </li>
            ))}
          </ol>
        </section>
        <figure className="pk-c__fig" data-figure={job.figure.kind}>
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
        <section className="pk-c__ret">
          <div className="pk-c__box pk-c__box--lit">
            <p className="pk-c__tab">{resultLabel(job)}</p>
            <p className="pk-said">
              <Said title={job.result.said} />
            </p>
          </div>
          <div className="pk-c__box">
            <p className="pk-c__tab">What it now allows</p>
            <p className="pk-body">{job.result.allows}</p>
          </div>
        </section>
      </div>
      <Gate job={job} />
    </article>
  );
}

export function DirectionD({ job }: { job: Job }) {
  return (
    <article className="pk-card pk-d" aria-label={job.title}>
      <header className="pk-d__head">
        <div className="pk-d__lead">
          <h2 className="pk-title">{job.title}</h2>
          <p className="pk-meta">
            <span>{job.client}</span>
            <span>{workstreamOf(job)}</span>
          </p>
        </div>
        <p className="pk-d__count">
          <b>{two(job.n)}</b>/{two(total)}
        </p>
      </header>
      <div className="pk-d__body">
        <section className="pk-d__cell pk-d__spec">
          <p className="pk-d__strip">
            <span>The ask</span>
            <span>[1]</span>
          </p>
          <p className="pk-lede">{job.ask}</p>
          <p className="pk-d__sub">Claude did</p>
          <ol className="pk-d__did">
            {job.did.map((d, i) => (
              <li key={d}>
                <span>{two(i + 1)}</span>
                {d}
              </li>
            ))}
          </ol>
        </section>
        <figure className="pk-d__cell pk-d__fig" data-figure={job.figure.kind}>
          <div className="pk-d__ev">
            <Evidence job={job} />
          </div>
          <figcaption className="pk-d__cap">
            <span>Fig. {two(job.n)}</span>
            {job.figure.caption}
          </figcaption>
        </figure>
        <section className="pk-d__ret">
          <div className="pk-d__cell">
            <p className="pk-d__strip">
              <span>{resultLabel(job)}</span>
              <span>[2]</span>
            </p>
            <p className="pk-said">
              <Said title={job.result.said} />
            </p>
          </div>
          <div className="pk-d__cell">
            <p className="pk-d__strip">
              <span>What it now allows</span>
              <span>[3]</span>
            </p>
            <p className="pk-body">{job.result.allows}</p>
          </div>
        </section>
      </div>
      <Gate job={job} />
    </article>
  );
}

function Gate({ job }: { job: Job }) {
  return (
    <p className="pk-gate">
      <span className="pk-gate__key">The gate</span>
      <span className="pk-gate__who">{job.gate.who}</span>
      {job.gate.line ? <span className="pk-gate__line">{job.gate.line}</span> : null}
    </p>
  );
}

/* ── Round two (owner, 2026-10-12, on 3C) ─────────────────────────────
   3C's stack, its rails and tabs in Tensor Gold; no title, so the left
   column opens on the client, the brief and the workstream; one notch top
   right; the right column split at its centre (4D's divider), what it now
   allows on top and the time saved below, drawn as the job in practice.
   Three ways to draw that half: */

export type PracticeViz = "chain" | "bars" | "split";

export function DirectionE({ job, viz }: { job: Job; viz: PracticeViz }) {
  const p = PRACTICE[job.id];
  return (
    <article className="pk-card pk-e" data-viz={viz} aria-label={p.brief}>
      <div className="pk-e__body">
        <section className="pk-e__spec">
          <dl className="pk-e__id">
            <div>
              <dt>Client</dt>
              <dd className="pk-e__client">{job.client}</dd>
            </div>
            <div>
              <dt>The brief</dt>
              <dd className="pk-e__brief">{p.brief}</dd>
            </div>
            <div>
              <dt>Workstream</dt>
              <dd className="pk-e__ws">{workstreamOf(job)}</dd>
            </div>
          </dl>
          <ol className="pk-e__steps" aria-label="Claude did">
            {job.did.map((d, i) => (
              <li key={d} className="pk-e__box">
                <p className="pk-e__tab">Claude · {two(i + 1)}</p>
                <p className="pk-body">{d}</p>
              </li>
            ))}
          </ol>
        </section>
        <figure className="pk-c__fig pk-e__fig" data-figure={job.figure.kind}>
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
        <section className="pk-e__ret">
          <div className="pk-e__half pk-e__allows">
            <p className="pk-e__tab pk-e__tab--flat">What it now allows</p>
            <p className="pk-said">{job.result.allows}</p>
          </div>
          <div className="pk-e__half pk-e__saved">
            <p className="pk-e__tab pk-e__tab--flat">{resultLabel(job)}</p>
            <PracticeDrawing p={p} viz={viz} />
            <p className="pk-e__said">
              <Said title={job.result.said} />
            </p>
          </div>
        </section>
      </div>
      <Gate job={job} />
    </article>
  );
}

function PracticeDrawing({ p, viz }: { p: Practice; viz: PracticeViz }) {
  if (viz === "chain") {
    return (
      <ol className="pk-flow" aria-label="Upstream, the job, downstream">
        <li>
          <span>Upstream</span>
          {p.up}
        </li>
        <li data-lit="true">
          <span>The job</span>
          {p.job}
        </li>
        <li>
          <span>Downstream</span>
          {p.down}
        </li>
      </ol>
    );
  }
  if (viz === "bars") {
    return (
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
    );
  }
  return (
    <div className="pk-split">
      <div className="pk-split__side">
        <span>Before</span>
        {p.before}
      </div>
      <i className="pk-split__arrow" aria-hidden="true" />
      <div className="pk-split__side" data-lit="true">
        <span>Now</span>
        {p.now}
      </div>
    </div>
  );
}
