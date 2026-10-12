import type { CSSProperties } from "react";

import { DISCIPLINES, disciplineOf } from "@/lib/arcs/content/shared/disciplines";
import type {
  ArcJobBucket,
  ArcJobFigure,
  ArcLeverageUse,
  ArcMotion,
  ArcSectionOf,
} from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { BREAKDOWN_KEPT, BREAKDOWN_REJECTED } from "./ArcBreakdown";
import { ArcClipLoop } from "./ArcClipLoop";
import { Glyph } from "./ArcLeverage";
import { Tally } from "./ArcReturn";
import { rung } from "./arcMotion";
import { ArcTitleText } from "./chrome";
import { crewSeed } from "./crewParticles";
import { type MapCallout, jobMap } from "./jobMap";

/** Chrome, never content: the four workstreams in the order the page runs
 *  them, with the vision's own glyph for each (U4: the card shows its own
 *  workstream alone, drawn as the vision draws it). ONE record since the
 *  proposal system (`shared/disciplines.ts`); the word is the owner's long
 *  name, "Creative production". */
export const JOB_BUCKETS: readonly {
  id: ArcJobBucket;
  word: string;
  glyph: ArcLeverageUse["glyph"];
}[] = DISCIPLINES.map((d) => ({ id: d.id, word: d.long, glyph: d.glyph }));

const two = (n: number) => String(n).padStart(2, "0");
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Chrome, never content: the return reads in two steps (U4), the saving and
 *  then what it now allows. A job may name its own saving (`result.label`). */
export const RESULT_LABEL = "Time saved";
export const ALLOWS_LABEL = "What it now allows";

/**
 * ArcJob — one real piece of client work on one screen (ADR-153 U1 → U7), in
 * the leverage's housing. No head above it: the frame carries everything.
 *
 *   band    the title over one mono line on a Tensor Gold band, the proof
 *           cards' head grammar in the arcs' own wash (U4, owner: "part of
 *           the same visual language"). ⚠ U7 (owner, 2026-10-11: "Made in
 *           Claude, nobody cares. 6 October, nobody cares. The client is
 *           important"): the line is the CLIENT, then the workstream's long
 *           name, and nothing else; `madeIn` and `date` stay on the record
 *           and are drawn only by the `mark` head (the proposal system,
 *           ADR-155, a lab direction: that workstream FIRST, over the title,
 *           with the mono line on the right). On the right of the band the
 *           workstream's GLYPH alone, centred, since the line already names
 *           it (U7: the glyph-and-word pair "doesn't look clean").
 *   spec    the ask, then what Claude did (01 · 02 · 03), on one rail.
 *   fig     the evidence on a dot ground with corner ticks, "Fig. 0N" under
 *           it: a silent loop, a kept and a rejected still, a logged record,
 *           or a mapped collection drawn as a grain field (`jobMap.ts`).
 *   result  what it saved as ONE SENTENCE a decision maker reads, the figure
 *           lit as its `em` (U7: a big numeral over a small line "breaks the
 *           sentence and gives one part a big font"), under its mono kicker;
 *           then what it now allows. A job without `said` still draws the
 *           numeral and its line (U3).
 *   foot    the gate: the person who decided, by role, with the green
 *           diamond, and what that person decides when the record says so.
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
  const mark = section.top === "mark";
  const titleId = `${section.id}-title`;
  const ws = JOB_BUCKETS.find((b) => b.id === bucket) ?? JOB_BUCKETS[0];
  const saved = result.label ?? RESULT_LABEL;
  if (section.top === "stack") return <JobStack section={section} motion={motion} />;
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
          data-job-head={section.top}
          aria-labelledby={titleId}
          {...rung(motion, 0.1)}
        >
          {mark ? (
            <header className="arc-case__top">
              <div className="arc-case__lead">
                <p className="arc-case__mark">
                  <Glyph kind={disciplineOf(bucket).glyph} />
                  <span className="arc-case__mark-word">{disciplineOf(bucket).long}</span>
                </p>
                <h2 className="arc-case__title" id={titleId}>
                  {title}
                </h2>
              </div>
              <p className="arc-case__meta-line">
                <span>{section.client}</span>
                <span>{section.madeIn}</span>
                <span>{section.date}</span>
              </p>
            </header>
          ) : (
            <header className="arc-case__top">
              <div className="arc-case__lead">
                <h2 className="arc-case__title" id={titleId}>
                  {title}
                </h2>
                <p className="arc-case__meta">
                  <span>{section.client}</span>
                  <span>{ws.word}</span>
                </p>
              </div>
              <p className="arc-case__ws" aria-hidden="true">
                <Glyph kind={ws.glyph} />
              </p>
            </header>
          )}
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
                <Evidence figure={figure} seed={crewSeed(section.id)} />
              </div>
              <figcaption className="arc-case__caption">
                <span className="arc-case__fig-n">Fig. {two(n)}</span>
                {figure.caption}
              </figcaption>
            </figure>
            <section
              className="arc-case__result"
              aria-label={saved}
              style={{ "--case-len": (result.value ?? "").length } as CSSProperties}
            >
              <div className="arc-case__saved">
                <p className="arc-case__result-label">{saved}</p>
                {result.said ? (
                  <p className="arc-case__said">
                    <ArcTitleText title={result.said} />
                  </p>
                ) : (
                  <>
                    <p className="arc-case__num">{result.value}</p>
                    <p className="arc-case__result-line">{result.line}</p>
                  </>
                )}
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
            {gate.line ? <span className="arc-case__gate-line">{gate.line}</span> : null}
          </p>
        </article>
      </div>
    </ArcBeat>
  );
}

/**
 * THE STACK CARD (owner, 2026-10-12, /test/proof-cards block 19): every word
 * on the left as one flow, the one figure on the right, a vertical rule
 * between them. The top bar is the client framed, the job's name and its
 * workstream with the vision's glyph, in one mono face in capitals. The
 * left reads the Arc (owner, 2026-10-12, /test/card-skins 12): 01
 * Navigate (the brief, the problem), 02 Encode (with the team), 03 Build
 * (what Claude did), each a framed box with its tab in the top-left corner,
 * one text size, centre lines between them, and the last line onto a dashed
 * group holding the tools it plugs into (after Hex's Tensorlake diagram). Under both panels the result as a band (block 23 of
 * the lab, after Dispatch's and Atomic Tessellator's stat rows): the time
 * saved as two bars and what it now allows, two cards on a soft gold
 * ground. No gate row: the record keeps it.
 */
function JobStack({ section, motion }: { section: ArcSectionOf<"job">; motion: ArcMotion }) {
  const { n, title, bucket, ask, did, figure, result, client } = section;
  const titleId = `${section.id}-title`;
  const ws = disciplineOf(bucket);
  const saved = result.label ?? RESULT_LABEL;
  const estimated = saved === RESULT_LABEL;
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
          className="arc-lev arc-case arc-plate arc-reveal arc-jstack"
          data-job-bucket={bucket}
          data-job-head="stack"
          aria-labelledby={titleId}
          {...rung(motion, 0.1)}
        >
          <header className="arc-jstack__top">
            <span className="arc-jstack__client">{client}</span>
            <h2 className="arc-jstack__name" id={titleId}>
              {title}
            </h2>
            <span className="arc-jstack__ws">
              <Glyph kind={ws.glyph} />
              {ws.long}
            </span>
          </header>
          <div className="arc-jstack__body">
            <div className="arc-jstack__words arc-jstack__words--arc">
              <div className="arc-jstack__box arc-jstack__step">
                <p className="arc-jstack__tab">01 · Navigate</p>
                <p className="arc-jstack__text">{ask}</p>
              </div>
              <div className="arc-jstack__box arc-jstack__step">
                <p className="arc-jstack__tab">02 · Encode</p>
                <p className="arc-jstack__text">{section.embed}</p>
              </div>
              <div className="arc-jstack__box arc-jstack__step">
                <p className="arc-jstack__tab">03 · Build</p>
                <ol className="arc-jstack__steps" aria-label="Claude did">
                  {did.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ol>
              </div>
              {section.scale?.tools.length ? (
                <ul className="arc-jstack__dash" aria-label="Plugs into">
                  {section.scale.tools.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <figure className="arc-case__fig arc-jstack__fig" data-job-figure={figure.kind}>
              <div className="arc-case__frame arc-jstack__frame">
                {(["tl", "tr", "bl", "br"] as const).map((c) => (
                  <i key={c} className="arc-jstack__x" data-corner={c} aria-hidden="true" />
                ))}
                <Evidence figure={figure} seed={crewSeed(section.id)} />
              </div>
              <figcaption className="arc-case__caption">
                <span className="arc-case__fig-n">Fig. {two(n)}</span>
                {figure.caption}
              </figcaption>
            </figure>
          </div>
          <div className="arc-jstack__band">
            <p className="arc-jstack__band-head" aria-hidden="true">
              <i />
              The result
              <span />
            </p>
            <section className="arc-jstack__card">
              <Glyph kind="clock" />
              <p className="arc-jstack__card-k">
                {saved}
                {estimated ? " · estimated" : null}
              </p>
              <div className="arc-jstack__bars">
                <p className="arc-jstack__bar-row">
                  <span className="arc-jstack__bar-k">Before</span>
                  <i className="arc-jstack__bar" data-w="long" aria-hidden="true" />
                  <span className="arc-jstack__bar-v">{result.before}</span>
                </p>
                <p className="arc-jstack__bar-row" data-lit="true">
                  <span className="arc-jstack__bar-k">Now</span>
                  <i className="arc-jstack__bar" data-w="short" aria-hidden="true" />
                  <span className="arc-jstack__bar-v">{result.now}</span>
                </p>
              </div>
            </section>
            <section className="arc-jstack__card">
              <Glyph kind={ws.glyph} />
              <p className="arc-jstack__card-k">{ALLOWS_LABEL}</p>
              <p className="arc-jstack__card-v">{result.allows}</p>
            </section>
          </div>
        </article>
      </div>
    </ArcBeat>
  );
}

function Evidence({ figure, seed }: { figure: ArcJobFigure; seed: number }) {
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
  if (figure.kind === "map") {
    return <JobMap figure={figure} seed={seed} />;
  }
  if (figure.kind === "flow") {
    return <JobFlow figure={figure} />;
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

/** A callout's seat as the DOM label's inline position: the corner edges the
 *  leader meets are the ones set, so the rendered text's width never moves
 *  the weld (`jobMap.ts`). */
function seat(c: MapCallout): CSSProperties {
  const style: CSSProperties = {};
  if (c.anchor === "start") style.left = `${c.ax * 100}%`;
  else style.right = `${(1 - c.ax) * 100}%`;
  if (c.vAlign === "top") style.top = `${c.at * 100}%`;
  else style.bottom = `${(1 - c.at) * 100}%`;
  return style;
}

/**
 * The map as the house's grain field: one grain per sample point in the
 * gold's ramp by density, the named groups called out from the corners on
 * dawn hairlines. The SVG letters nothing; the words are DOM, seated over
 * it. The whole is one image to a screen reader, its label the record.
 */
function JobMap({
  figure,
  seed,
}: {
  figure: Extract<ArcJobFigure, { kind: "map" }>;
  seed: number;
}) {
  const d = jobMap(figure.map, figure.labels ?? [], seed);
  const named = d.callouts.map((c) => c.text.toLowerCase());
  const label =
    `${thousands(figure.map.total)} items in ${figure.map.clusters.length} groups, one grain each` +
    (named.length ? `; the largest groups named: ${named.join(", ")}.` : ".");
  return (
    <div className="arc-case__map" role="img" aria-label={label}>
      <svg
        className="arc-case__map-svg"
        viewBox={`0 0 ${d.vb} ${d.vb}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        {d.tiers.map((t) =>
          t.paths.map((p) => (
            <path
              key={`${t.tier}-${p.a}`}
              className="arc-case__map-grain"
              data-map-tier={t.tier}
              fillOpacity={p.a}
              d={p.d}
            />
          ))
        )}
        {d.callouts.map((c) => (
          <g key={c.id}>
            <path className="arc-case__map-leader" d={c.leader} />
            <path className="arc-case__map-node" d={c.node} />
          </g>
        ))}
      </svg>
      {d.callouts.map((c) => (
        <p
          key={c.id}
          className="arc-case__map-label"
          data-map-seat={c.id}
          style={seat(c)}
          aria-hidden="true"
        >
          {c.text}
        </p>
      ))}
    </div>
  );
}

/**
 * A run as a flowchart (owner, 2026-10-12, after Tensorlake's diagrams):
 * the steps down one line, each a mono key over its notes, one step lit in
 * gold, the check hanging off its step to the side on a dashed leader. DOM
 * only; the connectors are borders, so they stay crisp at any size.
 */
function JobFlow({ figure }: { figure: Extract<ArcJobFigure, { kind: "flow" }> }) {
  const label = figure.steps.map((s) => s.key).join(", then ");
  return (
    <ol className="arc-case__flow" aria-label={label}>
      {figure.steps.map((s, i) => (
        <li key={s.key} className="arc-case__flow-step" data-lit={s.lit ? true : undefined}>
          <p className="arc-case__flow-key">
            <span>{two(i + 1)}</span>
            {s.key}
          </p>
          <ul className="arc-case__flow-notes">
            {s.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          {figure.check && figure.check.at === i ? (
            <p className="arc-case__flow-check">
              <b>{figure.check.key}</b>
              {figure.check.note}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
