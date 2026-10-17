"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Glyph, type GlyphName, workstreamGlyph } from "./Glyph";

/** One card of the held column: one figure's number, name and two lines. */
export interface Words {
  /** The anchor of this figure's panel. */
  id: string;
  /** The card's number and its figure's (01 = the piece). */
  n: number;
  kick: string;
  title: readonly [string, string];
  /** The model's thinking at this step, in one line (the lit card only). */
  lead?: string;
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
  words: readonly Words[];
  figures: readonly ReactNode[];
}

const two = (n: number) => String(n).padStart(2, "0");

/** More cards than this and the dim ones show their tab only. */
const DENSE = 8;

/**
 * One case: one group of words held on the left, the figures scrolling on the
 * right. The group is the job panels' numbered cards made into the case's
 * index (owner, 2026-10-17: "Use the static cards we had on the former swarm
 * page with the numbers … there's too much text. This should be super
 * clear"):
 *
 *   clients   the client names, the one in view lit; the title and the switch
 *   labels    the project and the type of work, each with a particle icon
 *   cards     one numbered card a figure, joined by centre lines; the card of
 *             the figure in the middle of the screen is lit and carries one
 *             line of the model's thinking; the others stay dim on one line.
 *             Each card is a link to its figure.
 *
 * The card's number is its figure's (`FIG. 03` ↔ `03`). Under 960px the group
 * steps aside: each figure carries its own card above it, and the clients ride
 * a bar at the top of the dossier.
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
    /* past the last figure, the way on keeps the last card lit */
    if (tail.current) io.observe(tail.current);
    return () => io.disconnect();
  }, []);

  const go = (i: number) => {
    const el = panels.current[i];
    if (!el) return;
    const calm = still || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
  };

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
            <ol
              className="csd-cards"
              data-dense={run.words.length > DENSE ? "" : undefined}
              aria-label={`${run.client}, step by step`}
            >
              {run.words.map((w, i) => (
                <li key={w.id}>
                  <Card w={w} on={i === at} onGo={() => go(i)} />
                </li>
              ))}
            </ol>
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
              </div>
            ) : null}
            <div className="csd-run__card-flow">
              <Card w={run.words[i]} on />
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

/**
 * A numbered card, after the job panels' steps: a gold tab in the top-left
 * corner, two short lines inside a double hairline. Lit, it carries one line
 * of the model's thinking; dim, it holds one line and links to its figure.
 */
function Card({ w, on, onGo }: { w: Words; on: boolean; onGo?: () => void }) {
  const body = (
    <>
      <span className="csd-card__tab">
        {two(w.n)} · {w.kick}
      </span>
      <span className="csd-card__text">
        <span>{w.title[0]}</span> <span className="csd-card__em">{w.title[1]}</span>
      </span>
      {w.lead ? (
        <span className="csd-card__lead">
          <Glyph name="model" />
          {w.lead}
        </span>
      ) : null}
    </>
  );
  if (!onGo) {
    return (
      <div className="csd-card" data-on="">
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      className="csd-card"
      data-on={on ? "" : undefined}
      aria-current={on ? "step" : undefined}
      onClick={onGo}
    >
      {body}
    </button>
  );
}
