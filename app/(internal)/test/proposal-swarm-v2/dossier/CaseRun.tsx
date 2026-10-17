"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { Glyph, type GlyphName, workstreamGlyph } from "./Glyph";

/** One short line under a step, with its icon (a person's call takes the
 *  green diamond). */
export interface Claim {
  text: string;
  glyph?: GlyphName;
  person?: boolean;
}

/** What the held column says while one figure is in the middle. The first is
 *  the case's header: its numbers and its briefing; the rest are its steps. */
export interface Words {
  /** The anchor of this figure's panel. */
  id: string;
  /** The step's number and its figure's (01 = the header). */
  n: number;
  kick: string;
  title: readonly [string, string];
  lede?: string;
  claims?: readonly Claim[];
  stats?: readonly { value: string; label: string }[];
  brief?: { who: string; text: string };
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
 *            middle: on the first, the header (its numbers, its briefing);
 *            on every other, the step (its label, its line, one sentence,
 *            up to four short claims);
 *          a dash a figure, the one in view lit.
 *   right  the figures, one after the other; they scroll, the words stay.
 *
 * Below 960px the case opens the run and the words sit above their figures.
 */
export function CaseRun({
  run,
  next,
}: {
  run: Run;
  /** The next case, offered at the foot of this one. */
  next?: { run: Run; go: () => void };
}) {
  const [at, setAt] = useState(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const tail = useRef<HTMLButtonElement | null>(null);

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
    /* past the last figure, the way on keeps the last step's words */
    if (tail.current) io.observe(tail.current);
    return () => io.disconnect();
  }, []);

  return (
    <article
      id={run.id}
      className="csd-run"
      data-cs-at={at}
      aria-label={`${run.client}: ${run.project}`}
    >
      <div className="csd-run__words">
        <div className="csd-run__stick">
          <CaseHead run={run} />
          <div className="csd-story__stack">
            {run.words.map((w, i) => (
              <StoryWords key={w.id} w={w} on={i === at} />
            ))}
          </div>
          <ol className="csd-story__dashes" aria-hidden="true">
            {run.words.map((w, i) => (
              <li key={w.id} data-on={i === at ? "" : undefined} />
            ))}
          </ol>
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
        {next ? (
          <button
            ref={tail}
            type="button"
            className="csd-next"
            data-cs-i={run.figures.length - 1}
            onClick={next.go}
          >
            <span className="csd-next__k">Next case</span>
            <Logo run={next.run} />
            <span className="csd-next__kind">
              <span>{next.run.project}</span>
              <span>
                <Glyph name={workstreamGlyph(next.run.workstream)} />
                {next.run.workstream}
              </span>
            </span>
          </button>
        ) : null}
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

/** The case, held for its whole length: who, what was made, which team. */
function CaseHead({ run, flow = false }: { run: Run; flow?: boolean }) {
  return (
    <header className={flow ? "csd-case csd-case--flow" : "csd-case"}>
      <Logo run={run} />
      <p className="csd-case__what">
        <span className="csd-case__project">{run.project}</span>
        <span className="csd-case__dept">
          <Glyph name={workstreamGlyph(run.workstream)} />
          {run.workstream}
        </span>
      </p>
    </header>
  );
}

/** The words of one figure: the header (numbers, briefing) or a step. */
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
      <h3 className="csd-story__title">
        {w.title[0]} <span className="csd-story__em">{w.title[1]}</span>
      </h3>
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
      {w.brief ? (
        <figure className="csd-brief">
          <figcaption>
            <i className="csd-dia" aria-hidden="true" />
            {w.brief.who}
          </figcaption>
          <blockquote>{w.brief.text}</blockquote>
        </figure>
      ) : null}
      {w.lede ? <p className="csd-story__lede">{w.lede}</p> : null}
      {w.claims?.length ? (
        <ul className="csd-story__claims">
          {w.claims.map((c) => (
            <li key={c.text} data-person={c.person ? "" : undefined}>
              <span className="csd-story__icon" aria-hidden="true">
                {c.person ? <i className="csd-dia" /> : <Glyph name={c.glyph ?? "model"} />}
              </span>
              {c.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
