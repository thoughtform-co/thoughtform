"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Glyph, type GlyphName, workstreamGlyph } from "./Glyph";

/** One step of the case: one figure's number, name and two short lines. */
export interface Words {
  /** The anchor of this figure's panel. */
  id: string;
  /** The step's number and its figure's (01 = the piece). */
  n: number;
  kick: string;
  title: readonly [string, string];
}

/** What a case saved, as the job panels' result. */
export interface Saved {
  label: string;
  before?: string;
  now: string;
  estimated?: boolean;
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
  saved: Saved;
  words: readonly Words[];
  figures: readonly ReactNode[];
}

const two = (n: number) => String(n).padStart(2, "0");

/**
 * One case: a simple held column, the figures scrolling on the right. Three
 * things on the left and no more (owner, 2026-10-17: "simple, with steps,
 * what we've saved … We don't have to show everything … the left side needs
 * to change depending on the slide you're in but make it subtle … I don't
 * like that it's all stacked"):
 *
 *   case    the client names (the one in view lit) and the case's two labels
 *   step    a thin bar, a segment a figure, then ONE card: the step of the
 *           figure in the middle of the screen, its number, its name, its two
 *           lines. It changes quietly as the figures pass (a short fade).
 *   saved   what the case saved, before and now, as the job panels drew it;
 *           it holds for the whole case.
 *
 * The step's number is its figure's (`FIG. 03` ↔ `03`); a segment is a link
 * to its figure. Under 960px the column steps aside: the case and what it
 * saved open the case, each figure carries its step card above it, and the
 * clients ride a bar at the top of the dossier.
 */
export function CaseRun({
  run,
  clients,
  next,
  still,
}: {
  run: Run;
  /** The client switch, drawn by the dossier (it owns which case is shown). */
  clients: ReactNode;
  /** The next case, offered at the foot of this one. */
  next?: { run: Run; go: () => void };
  still: boolean;
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
    /* past the last figure, the way on keeps the last step */
    if (tail.current) io.observe(tail.current);
    return () => io.disconnect();
  }, []);

  const go = (i: number) => {
    const el = panels.current[i];
    if (!el) return;
    const calm = still || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
  };

  const total = run.words.length;

  return (
    <article
      id={run.id}
      className="csd-run"
      data-cs-at={at}
      aria-label={`${run.client}: ${run.project}`}
    >
      <div className="csd-run__words">
        <div className="csd-run__stick">
          <div className="csd-group">
            <header className="csd-head">
              {clients}
              <Labels run={run} />
            </header>
            <div className="csd-step">
              <div className="csd-step__bar">
                <ol className="csd-steps" aria-label={`${run.client}, ${total} steps`}>
                  {run.words.map((w, i) => (
                    <li
                      key={w.id}
                      data-on={i === at ? "" : undefined}
                      data-past={i < at ? "" : undefined}
                    >
                      <button
                        type="button"
                        aria-label={`Step ${two(w.n)}, ${w.kick}`}
                        aria-current={i === at ? "step" : undefined}
                        onClick={() => go(i)}
                      />
                    </li>
                  ))}
                </ol>
                <span className="csd-step__count">
                  {two(run.words[at]?.n ?? 1)} of {two(total)}
                </span>
              </div>
              <div className="csd-step__stack">
                {run.words.map((w, i) => (
                  <StepCard key={w.id} w={w} on={i === at} />
                ))}
              </div>
            </div>
            <SavedCard saved={run.saved} />
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
            {i === 0 ? (
              <div className="csd-run__head-flow">
                <Labels run={run} />
                <SavedCard saved={run.saved} />
              </div>
            ) : null}
            <div className="csd-run__card-flow">
              <StepCard w={run.words[i]} on />
            </div>
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
            <span className="csd-next__client">
              <span className="csd-next__n">{next.run.ordinal}</span>
              {next.run.client}
            </span>
            <Labels run={next.run} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

/** What the case is, and what kind of work: two labels, nothing more. */
function Labels({ run }: { run: Run }) {
  return (
    <p className="csd-labels">
      <span className="csd-label">
        <Glyph name={run.glyph} />
        {run.project}
      </span>
      <span className="csd-label">
        <Glyph name={workstreamGlyph(run.workstream)} />
        {run.workstream}
      </span>
    </p>
  );
}

/** The step in view, after the job panels' numbered steps: a gold tab in the
 *  top-left corner, two short lines inside a double hairline. */
function StepCard({ w, on }: { w: Words; on: boolean }) {
  return (
    <div className="csd-card" data-on={on ? "" : undefined} aria-hidden={on ? undefined : true}>
      <span className="csd-card__tab">
        {two(w.n)} · {w.kick}
      </span>
      <span className="csd-card__text">
        <span>{w.title[0]}</span> <span className="csd-card__em">{w.title[1]}</span>
      </span>
    </div>
  );
}

/** What it saved: the old way as a long, quiet bar, the new way as a short gold
 *  one, the job panels' result drawn small. */
function SavedCard({ saved }: { saved: Saved }) {
  return (
    <section className="csd-saved" aria-label={saved.label}>
      <p className="csd-saved__k">
        <Glyph name="clock" />
        {saved.label}
        {saved.estimated ? <span>Estimated</span> : null}
      </p>
      {saved.before ? (
        <p className="csd-saved__row" data-row="before">
          <span className="csd-saved__when">Before</span>
          <i aria-hidden="true" />
          <span className="csd-saved__what">{saved.before}</span>
        </p>
      ) : null}
      <p className="csd-saved__row" data-row="now">
        <span className="csd-saved__when">Now</span>
        <i aria-hidden="true" />
        <span className="csd-saved__what">{saved.now}</span>
      </p>
    </section>
  );
}
