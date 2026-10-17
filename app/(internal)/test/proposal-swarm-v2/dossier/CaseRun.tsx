"use client";

import {
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Call } from "./types";

/** What the held column says while one figure is in the middle. */
export interface Words {
  /** The anchor of this figure's panel. */
  id: string;
  /** The FIG number (0 = the piece). */
  n: number;
  kick: string;
  title: readonly [string, string];
  sub: string;
  thought: readonly string[];
  call?: Call;
}

/**
 * One case: the words held on the left, the figures scrolling on the right
 * (the principle of the Loop story, owner 2026-10-12, made generic). The
 * words change as each figure reaches the middle of the screen: one
 * IntersectionObserver on a line across the middle. Under 960px the words sit
 * above their own figure and nothing is held.
 *
 *   head      the client, the workstream, the piece and one number; held
 *   chapter   [04] · kick · a two-line title · one sentence; crossfades
 *   thinking  what the model reasoned at this step, drawn on as it arrives
 *   call      where a person decided: a green diamond, the role, their words
 *   ladder    one tick per figure, the one in the middle at datum weight
 */
export function CaseRun({
  id,
  ordinal,
  client,
  workstream,
  piece,
  date,
  number,
  words,
  figures,
  still,
}: {
  id: string;
  ordinal: string;
  client: string;
  workstream: string;
  piece: string;
  date: string;
  number: { value: string; label: string };
  words: readonly Words[];
  figures: readonly ReactNode[];
  still: boolean;
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

  const go = (i: number) => (e: MouseEvent) => {
    const el = panels.current[i];
    if (!el) return;
    e.preventDefault();
    const calm = still || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
  };

  return (
    <article
      id={id}
      className="csd-run"
      data-cs-at={at}
      data-still={still ? "" : undefined}
      aria-label={`${client}: ${piece}`}
    >
      <div className="csd-run__words">
        <div className="csd-run__stick">
          <Head
            ordinal={ordinal}
            client={client}
            workstream={workstream}
            piece={piece}
            date={date}
            number={number}
          />
          <div className="csd-run__stack">
            {words.map((w, i) => (
              <Chapter key={w.id} w={w} on={i === at} />
            ))}
          </div>
          <ol className="csd-ladder" aria-label="Chapters">
            {words.map((w, i) => (
              <li key={w.id} data-on={i === at ? "" : undefined}>
                <a href={`#${w.id}`} onClick={go(i)} aria-label={`${w.kick}, figure ${w.n}`}>
                  <i aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="csd-run__figs">
        {figures.map((fig, i) => (
          <div
            key={words[i].id}
            id={words[i].id}
            className="csd-panel"
            data-cs-i={i}
            ref={(el) => {
              panels.current[i] = el;
            }}
          >
            {i === 0 ? (
              <div className="csd-run__head-flow">
                <Head
                  ordinal={ordinal}
                  client={client}
                  workstream={workstream}
                  piece={piece}
                  date={date}
                  number={number}
                />
              </div>
            ) : null}
            <Chapter w={words[i]} on flow />
            {fig}
          </div>
        ))}
      </div>
    </article>
  );
}

function Head({
  ordinal,
  client,
  workstream,
  piece,
  date,
  number,
}: {
  ordinal: string;
  client: string;
  workstream: string;
  piece: string;
  date: string;
  number: { value: string; label: string };
}) {
  return (
    <header className="csd-head">
      <p className="csd-head__k">
        <span className="csd-head__n">{ordinal}</span>
        <span className="csd-head__client">{client}</span>
        <span className="csd-head__ws">{workstream}</span>
      </p>
      <p className="csd-head__piece">{piece}</p>
      <p className="csd-head__num">
        <b>{number.value}</b>
        <span>{number.label}</span>
        <span className="csd-head__date">{date}</span>
      </p>
    </header>
  );
}

function Chapter({ w, on, flow = false }: { w: Words; on: boolean; flow?: boolean }) {
  return (
    <div
      className={flow ? "csd-ch csd-ch--flow" : "csd-ch"}
      data-on={on ? "" : undefined}
      aria-hidden={flow || on ? undefined : true}
    >
      <p className="csd-ch__kick">
        <span>[{String(w.n).padStart(2, "0")}]</span>
        {w.kick}
      </p>
      <h3 className="csd-ch__title">
        <span>{w.title[0]}</span>
        <span className="csd-ch__em">{w.title[1]}</span>
      </h3>
      <p className="csd-ch__sub">{w.sub}</p>
      {w.thought.length ? (
        <div className="csd-think">
          <p className="csd-think__k">The model</p>
          <ol>
            {w.thought.map((t, i) => (
              <li key={t} style={{ "--i": i } as CSSProperties}>
                <span aria-hidden="true">›</span>
                {t}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {w.call ? (
        <div className="csd-call">
          <p className="csd-call__who">
            <i className="csd-dia" aria-hidden="true" />
            {w.call.who}
          </p>
          <p className="csd-call__said">{w.call.said}</p>
        </div>
      ) : null}
    </div>
  );
}
