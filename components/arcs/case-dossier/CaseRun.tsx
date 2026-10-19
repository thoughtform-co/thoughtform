"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { Glyph, type GlyphName, workstreamGlyph } from "./Glyph";
import type { Intro, Result, Tint } from "./types";

/** What the held column says while one figure is in the middle. The first is
 *  the case's header: the result and its facts; the rest are its steps, one
 *  sentence each. */
export interface Words {
  /** The anchor of this figure's panel. */
  id: string;
  /** The step's number and its figure's (01 = the header). */
  n: number;
  kick: string;
  /** The step's title; the result has none (the project says it). */
  title?: readonly [string, string];
  lede?: string;
  points?: readonly { text: string; person?: boolean }[];
  result?: Result;
  stats?: readonly { value: string; label: string }[];
}

/** One case, as the run draws it. */
export interface Run {
  /** The case's id ("loop") and its anchor ("case-loop"). */
  key: string;
  id: string;
  ordinal: string;
  client: string;
  project: string;
  glyph: GlyphName;
  workstream: string;
  logo: { src: string; ratio: string; mark?: boolean };
  tint: Tint;
  intro: Intro;
  words: readonly Words[];
  figures: readonly ReactNode[];
}

const two = (n: number) => String(n).padStart(2, "0");

/**
 * One case, in the Loop story's grammar (`components/arcs/ArcProofStory.tsx`),
 * which the owner came back to on 2026-10-17, with his round-07 notes: "the
 * title of what we did here … and then the department … should be sticky.
 * Then the actual numbers … only … in the first section before you start
 * scrolling because that's basically the header … then you scroll down and
 * see the different steps."
 *
 *   left   one group in the middle of the screen, held:
 *          the case: the client's logo, what was made, the department; it
 *            holds for the whole case;
 *          the words of the figure in view, which change as it reaches the
 *            middle: on the first, the header (the result: before and now,
 *            what it now allows, its facts); on every other, the step (its
 *            label and one sentence, nothing under it: owner, 2026-10-19,
 *            "can't we simplify it so we just have one text");
 *          a dash a figure, the one in view lit.
 *   right  the figures, one after the other; they scroll, the words stay.
 *
 * Below 960px the case opens the run and the words sit above their figures.
 */
export function CaseRun({
  run,
  index,
  place,
}: {
  run: Run;
  /** Every case, for the quiet index beside the dashes. */
  index: readonly { id: string; ordinal: string; client: string }[];
  /** This case's place in it. */
  place: number;
}) {
  const [at, setAt] = useState(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setAt(Number((e.target as HTMLElement).dataset.csI));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    for (const el of panels.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article
      id={run.id}
      className="csd-run"
      data-cs-at={at}
      aria-label={`${run.client}: ${run.project}`}
      style={{ "--tint-dots": run.tint.dots } as CSSProperties}
    >
      {/* the client's field, held while this case scrolls and carried off
          with its last figure, so the next case brings its own */}
      <div
        className="csd-field-bg"
        data-pattern={run.tint.pattern}
        aria-hidden="true"
        style={{ "--tint-dots": run.tint.dots, "--tint-glow": run.tint.glow } as CSSProperties}
      />
      <div className="csd-run__words">
        <div className="csd-run__stick">
          <CaseHead run={run} />
          <div className="csd-story__stack">
            {run.words.map((w, i) => (
              <StoryWords key={w.id} w={w} on={i === at} />
            ))}
          </div>
          <div className="csd-story__foot">
            <ol className="csd-story__dashes" aria-hidden="true">
              {run.words.map((w, i) => (
                <li key={w.id} data-on={i === at ? "" : undefined} />
              ))}
            </ol>
            <nav className="csd-index" aria-label="The cases">
              {index.map((c, i) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  title={c.client}
                  aria-current={i === place ? "true" : undefined}
                >
                  {c.ordinal.replace(/[[\]]/g, "")}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="csd-run__figs">
        {run.figures.map((fig, i) => (
          <div
            key={run.words[i].id}
            id={run.words[i].id}
            className="csd-panel"
            data-cs-i={i}
            ref={(el) => {
              panels.current[i] = el;
            }}
          >
            {/* the phone: the case opens the run, the words sit above their figure */}
            {i === 0 ? <CaseHead run={run} flow /> : null}
            <StoryWords w={run.words[i]} on flow />
            {fig}
          </div>
        ))}
      </div>
    </article>
  );
}

/** The client's logo, a white file tinted to the ink; a mark carries the
 *  client's name beside it, a wordmark is the name. */
function Logo({ run }: { run: Run }) {
  return (
    <span className="csd-logo" data-mark={run.logo.mark ? "" : undefined}>
      <span
        className="csd-logo__img"
        role="img"
        aria-label={run.client}
        style={
          {
            "--logo": `url("${run.logo.src}")`,
            "--r": run.logo.ratio.replace("/", " / "),
          } as CSSProperties
        }
      />
      {run.logo.mark ? <span className="csd-logo__name">{run.client}</span> : null}
    </span>
  );
}

/** The case, held for its whole length: who, what was made, which team. One
 *  markup for the four type options (`.csd[data-head]` in the sheet): three
 *  rows, each with a key that only the rows option shows. */
function CaseHead({ run, flow = false }: { run: Run; flow?: boolean }) {
  return (
    <header className={flow ? "csd-case csd-case--flow" : "csd-case"}>
      <p className="csd-case__row" data-row="client">
        <span className="csd-case__key">Client</span>
        <Logo run={run} />
      </p>
      <p className="csd-case__row" data-row="project">
        <span className="csd-case__key">Project</span>
        <span className="csd-case__project">{run.project}</span>
      </p>
      <p className="csd-case__row" data-row="team">
        <span className="csd-case__key">Team</span>
        <span className="csd-case__dept" data-ws={workstreamGlyph(run.workstream)}>
          <Glyph name={workstreamGlyph(run.workstream)} />
          {run.workstream}
        </span>
      </p>
    </header>
  );
}

/** The words of one figure: the header (the result, its numbers) or a step. */
function StoryWords({ w, on, flow = false }: { w: Words; on: boolean; flow?: boolean }) {
  return (
    <div
      className={flow ? "csd-story csd-story--flow" : "csd-story"}
      data-on={on ? "" : undefined}
      data-header={w.stats ? "" : undefined}
      aria-hidden={flow || on ? undefined : true}
    >
      <p className="csd-story__label">
        {two(w.n)} · {w.kick}
      </p>
      {w.title ? (
        <h3 className="csd-story__title">
          {w.title[0]} <span className="csd-story__em">{w.title[1]}</span>
        </h3>
      ) : null}
      {w.lede ? <p className="csd-story__lede">{w.lede}</p> : null}
      {w.points?.length ? (
        <ul className="csd-story__claims">
          {w.points.map((c) => (
            <li key={c.text} data-person={c.person ? "" : undefined}>
              <span className="csd-story__icon" aria-hidden="true">
                {c.person ? <i className="csd-dia" /> : <Glyph name="model" />}
              </span>
              {c.text}
            </li>
          ))}
        </ul>
      ) : null}
      {w.result ? (
        <dl className="csd-result">
          <div className="csd-result__row">
            <dt className="csd-result__k">Before</dt>
            <dd className="csd-result__v">{w.result.before}</dd>
          </div>
          <div className="csd-result__row" data-now="">
            <dt className="csd-result__k">What it now allows</dt>
            <dd className="csd-result__v">{w.result.allows}</dd>
          </div>
        </dl>
      ) : null}
      {w.stats ? (
        <dl className="csd-stats">
          {w.stats.map((s) => (
            <div key={s.label}>
              <dt>{s.value}</dt>
              <dd>{s.label}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/**
 * The panel before a case: its number, the client and the type of work,
 * then the challenge in one sentence (or the client's own words) and the
 * facts that make it one. One screen, the case's own field behind it.
 */
export function CaseIntro({ run }: { run: Run }) {
  const { intro } = run;
  const quoted = Boolean(intro.who);
  return (
    <section
      id={`${run.id}-intro`}
      className="csd-intro"
      aria-label={`${run.client}: the challenge`}
      data-quote={quoted ? "" : undefined}
      style={{ "--tint-dots": run.tint.dots, "--tint-glow": run.tint.glow } as CSSProperties}
    >
      <div className="csd-intro__in">
        <p className="csd-intro__meta">
          <span className="csd-intro__n">Case {run.ordinal.replace(/[[\]]/g, "")}</span>
          <i aria-hidden="true" />
          <Logo run={run} />
          <span className="csd-case__dept" data-ws={workstreamGlyph(run.workstream)}>
            <Glyph name={workstreamGlyph(run.workstream)} />
            {run.workstream}
          </span>
        </p>
        {quoted ? (
          <blockquote className="csd-intro__quote">
            <p className="csd-intro__line">
              “{intro.line[0]} <span className="csd-intro__em">{intro.line[1]}</span>”
            </p>
            <footer className="csd-intro__who">{intro.who}</footer>
          </blockquote>
        ) : (
          <h3 className="csd-intro__line">
            {intro.line[0]} <span className="csd-intro__em">{intro.line[1]}</span>
          </h3>
        )}
        {intro.facts?.length ? (
          <dl className="csd-intro__facts">
            {intro.facts.map((f, i) => (
              <div key={f.label} data-last={i === intro.facts!.length - 1 ? "" : undefined}>
                <dt>{f.value}</dt>
                <dd>{f.label}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
