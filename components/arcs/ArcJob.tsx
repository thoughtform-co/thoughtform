import type { CSSProperties } from "react";

import type { ArcJobBucket, ArcJobTally, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { BREAKDOWN_KEPT, BREAKDOWN_REJECTED } from "./ArcBreakdown";
import { ArcClipLoop } from "./ArcClipLoop";
import { rung } from "./arcMotion";

/** Chrome, never content: the four buckets in the order the page runs them,
 *  the vision's 2×2 and the engine's workstreams in the same words. */
export const JOB_BUCKETS: readonly { id: ArcJobBucket; word: string }[] = [
  { id: "strategy", word: "Strategy" },
  { id: "production", word: "Production" },
  { id: "ops", word: "Ops" },
  { id: "review", word: "Review" },
];

const two = (n: number) => String(n).padStart(2, "0");

/**
 * ArcJob — one real piece of client work on one screen (ADR-153 U1, U2), in
 * the leverage's housing. No head above it: the frame carries everything, as
 * Tensorlake's frames do (owner, 2026-10-09: "can't we just put all the
 * information in the frame").
 *
 *   top     the four buckets, this one marked with the gold square
 *           (Tensorlake's "■ METRICS"); the concrete title; the client, where
 *           it ran and the date as a key-value block on the right.
 *   spec    the ask, then what Claude did (01 · 02 · 03).
 *   fig     the evidence on a dot ground with corner ticks, "Fig. 0N" under
 *           it: a silent loop, a kept and a sent-back still, or the record as
 *           a log with dot leaders.
 *   cells   three measured numbers, neutral, each drawn as a tally in the
 *           gold's tints (Tensorlake's bar codes): the gold is the data. The
 *           longest value's length rides the column (`--case-len`), so the
 *           three are set at one size, as large as the column allows.
 *   foot    the gate: the person who decided, by role, with the person's
 *           green diamond, and what they decided.
 *
 * ⚠ SERVER, NO STATE, DOM ONLY; the loop is the house's one autoplaying
 * picture (`ArcClipLoop`: muted, plays only in view, never under reduced
 * motion). Attributes `data-job-*`; classes `.arc-case__*`, because
 * `.arc-job__*` is the breakdown's.
 */
export function ArcJob({
  section,
  motion = "reveal",
}: {
  section: ArcSectionOf<"job">;
  index: number;
  motion?: ArcMotion;
}) {
  const { n, title, bucket, ask, did, gate, figure, cells } = section;
  const titleId = `${section.id}-title`;
  const longest = Math.max(...cells.map((c) => c.value.length));
  return (
    <ArcBeat
      id={section.id}
      kind="job"
      className="arc-section arc-sec arc-sec--job"
      ariaLabel={section.ariaLabel ?? title}
      motion={motion}
    >
      <div className="arc-band">
        <article
          className="arc-lev arc-case arc-plate arc-reveal"
          data-job-bucket={bucket}
          aria-labelledby={titleId}
          {...rung(motion, 0.1)}
        >
          <header className="arc-case__top">
            <div className="arc-case__lead">
              <ol className="arc-case__buckets">
                {JOB_BUCKETS.map((b) => (
                  <li
                    key={b.id}
                    data-job-on={b.id === bucket ? "" : undefined}
                    aria-current={b.id === bucket ? "true" : undefined}
                  >
                    {b.word}
                  </li>
                ))}
              </ol>
              <h2 className="arc-case__title" id={titleId}>
                {title}
              </h2>
            </div>
            <dl className="arc-case__meta">
              <div>
                <dt>Client</dt>
                <dd>{section.client}</dd>
              </div>
              <div>
                <dt>Made in</dt>
                <dd>{section.madeIn}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{section.date}</dd>
              </div>
            </dl>
          </header>
          <div className="arc-case__split">
            <dl className="arc-case__spec">
              <div className="arc-case__row">
                <dt>Ask</dt>
                <dd>{ask}</dd>
              </div>
              <div className="arc-case__row">
                <dt>Claude did</dt>
                <dd>
                  <ol className="arc-case__did">
                    {did.map((d, i) => (
                      <li key={d}>
                        <span className="arc-case__did-n">{two(i + 1)}</span>
                        {d}
                      </li>
                    ))}
                  </ol>
                </dd>
              </div>
            </dl>
            <figure className="arc-case__fig" data-job-figure={figure.kind}>
              <div className="arc-case__frame">
                <Evidence figure={figure} />
              </div>
              <figcaption className="arc-case__caption">
                <span className="arc-case__fig-n">Fig. {two(n)}</span>
                {figure.caption}
              </figcaption>
            </figure>
            <ul className="arc-case__cells" style={{ "--case-len": longest } as CSSProperties}>
              {cells.map((c) => (
                <li key={c.key} className="arc-case__cell">
                  <span className="arc-case__num">{c.value}</span>
                  <span className="arc-case__key">{c.key}</span>
                  {c.tally ? <Tally groups={c.tally} /> : null}
                </li>
              ))}
            </ul>
          </div>
          <p className="arc-case__gate">
            <span className="arc-case__gate-key">The gate</span>
            <span className="arc-case__who">{gate.who}</span>
            <span className="arc-case__gate-line">{gate.line}</span>
          </p>
        </article>
      </div>
    </ArcBeat>
  );
}

/** A count as Tensorlake draws one: segments, the counted ones in gold. Each
 *  group's width follows its count, so a segment is one width across groups. */
function Tally({ groups }: { groups: readonly ArcJobTally[] }) {
  return (
    <span className="arc-case__tally" aria-hidden="true">
      {groups.map((g, gi) => (
        <span
          key={gi}
          className="arc-case__tally-group"
          data-job-dim={g.dim ? "" : undefined}
          style={{ "--case-of": g.of } as CSSProperties}
        >
          {Array.from({ length: g.of }, (_, i) => (
            <i key={i} data-job-lit={i < g.lit ? "" : undefined} />
          ))}
        </span>
      ))}
    </span>
  );
}

function Evidence({ figure }: { figure: ArcSectionOf<"job">["figure"] }) {
  if (figure.kind === "clip") {
    return (
      <div className="arc-case__clip">
        <ArcClipLoop clip={figure.clip} />
      </div>
    );
  }
  if (figure.kind === "pair") {
    return (
      <div className="arc-case__pair" data-job-ratio={figure.ratio}>
        {[figure.a, figure.b].map((f) => (
          <div key={f.src} className="arc-case__still" data-job-verdict={f.verdict}>
            {/* eslint-disable-next-line @next/next/no-img-element -- self-hosted stills at their own size, the arcs' idiom */}
            <img src={f.src} alt={f.alt} loading="lazy" decoding="async" />
            <p className="arc-case__verdict">
              <b>{f.verdict === "kept" ? BREAKDOWN_KEPT : BREAKDOWN_REJECTED}</b>
              {f.label}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <dl className="arc-case__ledger">
      {figure.rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
