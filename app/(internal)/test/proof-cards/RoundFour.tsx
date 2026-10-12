import type { ReactNode } from "react";

import { Glyph } from "@/components/arcs/ArcLeverage";
import { disciplineOf } from "@/lib/arcs/content/shared/disciplines";
import { SAMAKO_AUTUMN_FILM } from "@/lib/arcs/content/shared/samakoWork";

import { Evidence, type Job, KEPT, SENT_BACK, resultLabel, two } from "./parts";
import { PRACTICE, type Practice } from "./practice";

/**
 * Round four (owner, 2026-10-12, on 9): the content recentred with air; the
 * gold rail welded to the brief box above it, as 3C's was to the ask; the
 * top bar with no keys, one face in capitals: the client framed, the brief,
 * the workstream with the vision's own glyph. Then the same card with every
 * word on the left (brief, process, what it allows, time saved) and the
 * visual widened on the right, and that wide visual as before and after, or
 * as the two films where there were two.
 *
 *   mid      9, recentred
 *   left     words left, one wide visual right
 *   left-ba  words left, before and after (or the alternatives) right
 */

export type Layout = "mid" | "left" | "left-ba";

export function DirectionG({ job, layout }: { job: Job; layout: Layout }) {
  const p = PRACTICE[job.id];
  const d = disciplineOf(job.bucket);
  const steps = [
    { key: "embed", tab: "Embed", text: p.embed, human: true },
    ...job.did.map((t, i) => ({ key: t, tab: `Claude ${i + 1}`, text: t, human: false })),
    { key: "empower", tab: "Empower", text: p.empower, human: true },
  ];
  const brief = (
    <div className="pk-f__box pk-f__brief pk-g__brief">
      <p className="pk-f__tab">The brief</p>
      <p className="pk-f__para">{p.problem}</p>
    </div>
  );
  const process = (
    <ol className="pk-f__steps pk-g__steps" aria-label="The work">
      {steps.map((st) => (
        <li key={st.key} className="pk-f__step" data-human={st.human || undefined}>
          <span className="pk-f__step-tab">{st.tab}</span>
          <span className="pk-f__step-text">{st.text}</span>
        </li>
      ))}
    </ol>
  );
  const allows = (
    <div className="pk-f__box pk-f__allows pk-g__allows">
      <p className="pk-f__tab">What it now allows</p>
      <p className="pk-f__para">{job.result.allows}</p>
    </div>
  );
  const saved = (
    <div className="pk-f__box pk-f__saved pk-g__saved">
      <p className="pk-f__tab pk-f__tab--quiet">
        {resultLabel(job)}
        {job.result.label === "The return" ? null : " · estimated"}
      </p>
      <Bars p={p} />
    </div>
  );
  return (
    <article className="pk-card pk-e pk-f pk-g" data-layout={layout} aria-label={p.name}>
      <header className="pk-g__head">
        <span className="pk-g__client">{job.client}</span>
        <span className="pk-g__name">{p.name}</span>
        <span className="pk-g__ws">
          <Glyph kind={d.glyph} />
          {d.long}
        </span>
      </header>
      {layout === "mid" ? (
        <div className="pk-g__body pk-g__body--mid">
          {brief}
          {process}
          <Figure job={job} wide={false} ba={false} />
          {allows}
          {saved}
        </div>
      ) : (
        <div className="pk-g__body pk-g__body--left">
          <div className="pk-g__words">
            {brief}
            {process}
            <div className="pk-g__pair">
              {allows}
              {saved}
            </div>
          </div>
          <Figure job={job} wide ba={layout === "left-ba"} />
        </div>
      )}
      <p className="pk-gate">
        <span className="pk-gate__key">The gate</span>
        <span className="pk-gate__who">{job.gate.who}</span>
        {job.gate.line ? <span className="pk-gate__line">{job.gate.line}</span> : null}
      </p>
    </article>
  );
}

function Bars({ p }: { p: Practice }) {
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

export function Figure({ job, wide, ba }: { job: Job; wide: boolean; ba: boolean }) {
  return (
    <figure
      className="pk-c__fig pk-e__fig pk-g__fig"
      data-figure={job.figure.kind}
      data-wide={wide || undefined}
    >
      <p className="pk-c__vert">
        Fig. {two(job.n)} · {job.figure.caption}
      </p>
      <div className="pk-c__ev">
        <i className="pk-c__x pk-c__x--tl" aria-hidden="true" />
        <i className="pk-c__x pk-c__x--tr" aria-hidden="true" />
        <i className="pk-c__x pk-c__x--bl" aria-hidden="true" />
        <i className="pk-c__x pk-c__x--br" aria-hidden="true" />
        {ba ? <BeforeAfter job={job} /> : <Evidence job={job} />}
      </div>
    </figure>
  );
}

/**
 * The wide visual as two panes. Only what the record holds: the motion ad's
 * two films (the round offered two); the review's kept and sent-back shots;
 * the Drive as the same items unsorted in folders beside the map; the brief
 * as the one-line ask beside the brief the skill wrote.
 */
function BeforeAfter({ job }: { job: Job }) {
  const f = job.figure;
  const p = PRACTICE[job.id];
  if (f.kind === "clip") {
    const a = SAMAKO_AUTUMN_FILM.film ?? f.clip;
    return (
      <div className="pk-ev pk-ba">
        <Pane label="Film A">
          <video
            src={a.src}
            poster={a.poster}
            aria-label={a.alt}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </Pane>
        <Pane label="Film B" lit>
          <video
            src={f.clip.src}
            poster={f.clip.poster}
            aria-label={f.clip.alt}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </Pane>
      </div>
    );
  }
  if (f.kind === "pair") {
    return (
      <div className="pk-ev pk-ba">
        <Pane label={SENT_BACK} note={f.b.label}>
          {/* eslint-disable-next-line @next/next/no-img-element -- lab, self-hosted stills */}
          <img src={f.b.src} alt={f.b.alt} />
        </Pane>
        <Pane label={KEPT} note={f.a.label} lit>
          {/* eslint-disable-next-line @next/next/no-img-element -- lab, self-hosted stills */}
          <img src={f.a.src} alt={f.a.alt} />
        </Pane>
      </div>
    );
  }
  if (f.kind === "map") {
    return (
      <div className="pk-ev pk-ba">
        <Pane label="Before · in folders">
          <Folders />
        </Pane>
        <Pane label="After · by what each file shows" lit>
          <div className="pk-ba__map">
            <Evidence job={job} />
          </div>
        </Pane>
      </div>
    );
  }
  return (
    <div className="pk-ev pk-ba">
      <Pane label="Before · the ask">
        <p className="pk-ba__ask">{p.up}</p>
      </Pane>
      <Pane label="After · the brief" lit>
        <div className="pk-ba__map">
          <Evidence job={job} />
        </div>
      </Pane>
    </div>
  );
}

function Pane({
  label,
  note,
  lit,
  children,
}: {
  label: string;
  note?: string;
  lit?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="pk-ba__pane" data-lit={lit || undefined}>
      <div className="pk-ba__media">{children}</div>
      <p className="pk-ba__label">
        <b>{label}</b>
        {note ? <span>{note}</span> : null}
      </p>
    </div>
  );
}

/** The Drive before the map: the same kind of grain, filed in folders, in
 *  no order a search can use. An illustration, not data: it says so. */
function Folders() {
  const folders = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg
      className="pk-ba__folders"
      viewBox="0 0 240 240"
      role="img"
      aria-label="Files in folders, unsorted"
    >
      {folders.map((i) => {
        const x = 12 + (i % 3) * 76;
        const y = 14 + Math.floor(i / 3) * 56;
        const n = 9 + ((i * 7) % 12);
        return (
          <g key={i}>
            <path className="pk-ba__folder" d={`M${x} ${y + 6} h22 l4 -6 h40 v44 h-66 z`} />
            {Array.from({ length: n }, (_, k) => (
              <rect
                key={k}
                className="pk-ba__file"
                x={x + 5 + (k % 7) * 8.4}
                y={y + 12 + Math.floor(k / 7) * 8}
                width="4"
                height="4"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
