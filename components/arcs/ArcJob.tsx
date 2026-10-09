import type { CSSProperties } from "react";

import type { ArcJobBucket, ArcLeverageUse, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { BREAKDOWN_KEPT, BREAKDOWN_REJECTED } from "./ArcBreakdown";
import { ArcClipLoop } from "./ArcClipLoop";
import { Glyph } from "./ArcLeverage";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

/** Chrome, never content: the bucket's word and the leverage glyph it shares
 *  with the vision's 2×2, so a bucket reads the same everywhere it is drawn. */
export const JOB_BUCKETS: Record<ArcJobBucket, { word: string; glyph: ArcLeverageUse["glyph"] }> = {
  strategy: { word: "Strategy", glyph: "brief" },
  production: { word: "Production", glyph: "frame" },
  ops: { word: "Ops", glyph: "flow" },
  review: { word: "Review", glyph: "check" },
};

const two = (n: number) => String(n).padStart(2, "0");

/**
 * ArcJob — one real piece of client work on one screen (ADR-153 U1), in the
 * leverage's console so every case reads as one grammar.
 *
 *   strip   "JOB 0N" and the job's name; the bucket on the right, the one lit
 *           object (gold ring and wash), with the glyph the vision's 2×2 gave
 *           it.
 *   spec    ruled rows: the ask, what Claude did (01 · 02 · 03), the gate:
 *           the person who decided, by role, with the person's green diamond.
 *   fig     the evidence on a dot ground with corner ticks, "Fig. 0N" under
 *           it: a silent loop, a kept and a sent-back still, or a ledger.
 *   cells   three measured numbers, large, each under its mono key; the
 *           longest value's length rides the column (`--case-len`), so the
 *           three are set at one size, as large as the column allows.
 *   foot    client · made in · date.
 *
 * ⚠ SERVER, NO STATE, DOM ONLY; the loop is the house's one autoplaying
 * picture (`ArcClipLoop`: muted, plays only in view, never under reduced
 * motion). Attributes `data-job-*`; classes `.arc-case__*`, because
 * `.arc-job__*` is the breakdown's.
 */
export function ArcJob({
  section,
  index,
  motion = "reveal",
}: {
  section: ArcSectionOf<"job">;
  index: number;
  motion?: ArcMotion;
}) {
  const { n, name, bucket, ask, did, gate, figure, cells } = section;
  const b = JOB_BUCKETS[bucket];
  const longest = Math.max(...cells.map((c) => c.value.length));
  return (
    <ArcBeat
      id={section.id}
      kind="job"
      className="arc-section arc-sec arc-sec--job"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="job"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <article
          className="arc-lev arc-case arc-plate arc-reveal"
          data-job-bucket={bucket}
          {...rung(motion, 0.14)}
        >
          <div className="arc-lev__bar">
            <p className="arc-lev__sys">
              <span className="arc-lev__sys-key">Job {two(n)}</span>
              {name}
            </p>
            <p className="arc-case__bucket">
              <Glyph kind={b.glyph} />
              {b.word}
            </p>
          </div>
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
              <div className="arc-case__row" data-job-gate="">
                <dt>The gate</dt>
                <dd>
                  <span className="arc-case__who">{gate.who}</span>
                  {gate.line}
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
            <dl className="arc-case__cells" style={{ "--case-len": longest } as CSSProperties}>
              {cells.map((c) => (
                <div key={c.key} className="arc-case__cell">
                  <dt>{c.key}</dt>
                  <dd>{c.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <dl className="arc-lev__readout">
            <div className="arc-lev__read">
              <dt>Client</dt>
              <dd>{section.client}</dd>
            </div>
            <div className="arc-lev__read">
              <dt>Made in</dt>
              <dd>{section.madeIn}</dd>
            </div>
            <div className="arc-lev__read">
              <dt>Date</dt>
              <dd>{section.date}</dd>
            </div>
          </dl>
        </article>
      </div>
    </ArcBeat>
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
