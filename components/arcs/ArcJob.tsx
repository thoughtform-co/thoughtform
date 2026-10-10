import type { CSSProperties } from "react";

import type {
  ArcJobBucket,
  ArcJobTally,
  ArcLeverageUse,
  ArcMotion,
  ArcSectionOf,
} from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { BREAKDOWN_KEPT, BREAKDOWN_REJECTED } from "./ArcBreakdown";
import { ArcClipLoop } from "./ArcClipLoop";
import { Glyph } from "./ArcLeverage";
import { rung } from "./arcMotion";

/** Chrome, never content: the four workstreams in the order the page runs
 *  them, with the vision's own glyph for each (U4: the card shows its own
 *  workstream alone, drawn as the vision draws it). */
export const JOB_BUCKETS: readonly {
  id: ArcJobBucket;
  word: string;
  glyph: ArcLeverageUse["glyph"];
}[] = [
  { id: "production", word: "Creative production", glyph: "frame" },
  { id: "ops", word: "Creative ops", glyph: "flow" },
  { id: "review", word: "Creative review", glyph: "check" },
  { id: "strategy", word: "Creative strategy", glyph: "brief" },
];

const two = (n: number) => String(n).padStart(2, "0");

/** Chrome, never content: the return reads in two steps (U4), the saving and
 *  then what it now allows. A job may name its own saving (`result.label`). */
export const RESULT_LABEL = "Time saved";
export const ALLOWS_LABEL = "What it now allows";

/**
 * ArcJob — one real piece of client work on one screen (ADR-153 U1 → U4), in
 * the leverage's housing. No head above it: the frame carries everything.
 *
 *   band    the title and one mono line (client · where it ran · when) on a
 *           Tensor Gold band, the proof cards' head grammar in the arcs' own
 *           wash (U4, owner: "part of the same visual language"); the card's
 *           ONE workstream on the right, glyph and word as the vision draws it.
 *   spec    the ask, then what Claude did (01 · 02 · 03), on one rail.
 *   fig     the evidence on a dot ground with corner ticks, "Fig. 0N" under
 *           it: a silent loop, a kept and a rejected still, or a logged record.
 *   result  what it saved, then what it now allows: two steps, the line never
 *           restating the number (registry-guarded).
 *   foot    the gate: the person who decided, by role, with the green diamond.
 *
 * ⚠ SERVER, NO STATE, DOM ONLY; the loop is the house's one autoplaying
 * picture (`ArcClipLoop`). Attributes `data-job-*`; classes `.arc-case__*`,
 * because `.arc-job__*` is the breakdown's.
 */
export function ArcJob({
  section,
  motion = "reveal",
}: {
  section: ArcSectionOf<"job">;
  index: number;
  motion?: ArcMotion;
}) {
  const { n, title, bucket, ask, did, gate, figure, result } = section;
  const titleId = `${section.id}-title`;
  const ws = JOB_BUCKETS.find((b) => b.id === bucket) ?? JOB_BUCKETS[0];
  const saved = result.label ?? RESULT_LABEL;
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
              <h2 className="arc-case__title" id={titleId}>
                {title}
              </h2>
              <p className="arc-case__meta">
                <span>{section.client}</span>
                <span>Made in {section.madeIn}</span>
                <span>{section.date}</span>
              </p>
            </div>
            <p className="arc-case__ws">
              <Glyph kind={ws.glyph} />
              <span className="arc-case__ws-word">{ws.word}</span>
            </p>
          </header>
          <div className="arc-case__split">
            <div className="arc-case__spec">
              <div className="arc-case__rail">
                <p className="arc-case__key">The ask</p>
                <p className="arc-case__ask">{ask}</p>
                <p className="arc-case__key">Claude did</p>
                <ol className="arc-case__did">
                  {did.map((d, i) => (
                    <li key={d}>
                      <span className="arc-case__did-n">{two(i + 1)}</span>
                      {d}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <figure className="arc-case__fig" data-job-figure={figure.kind}>
              <div className="arc-case__frame">
                <Evidence figure={figure} />
              </div>
              <figcaption className="arc-case__caption">
                <span className="arc-case__fig-n">Fig. {two(n)}</span>
                {figure.caption}
              </figcaption>
            </figure>
            <section
              className="arc-case__result"
              aria-label={saved}
              style={{ "--case-len": result.value.length } as CSSProperties}
            >
              <div className="arc-case__saved">
                <p className="arc-case__result-label">{saved}</p>
                <p className="arc-case__num">{result.value}</p>
                <p className="arc-case__result-line">{result.line}</p>
                {result.tally ? <Tally groups={result.tally} /> : null}
              </div>
              <div className="arc-case__allows">
                <p className="arc-case__result-label">{ALLOWS_LABEL}</p>
                <p className="arc-case__allows-line">{result.allows}</p>
              </div>
            </section>
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

/** A count drawn as segments, the counted ones in gold. Each group's width
 *  follows its count, so a segment is one width across groups. */
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
