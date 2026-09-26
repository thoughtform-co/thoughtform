"use client";

import { useState, type KeyboardEvent } from "react";

import type { ArcBenchInput, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import {
  BENCH_BANDS,
  BENCH_EXPECTS,
  BENCH_INPUTS_LABEL,
  BENCH_PANES,
  BENCH_STATE_LABEL,
  BENCH_TABLIST_LABEL,
  BENCH_TABS,
  type BenchTab,
} from "./bench/benchChrome";
import { arcTitleText } from "./chrome";

interface ArcBenchProps {
  section: ArcSectionOf<"bench">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcBench — one Skill and its evals, running (ADR-128 B2).
 *
 * Moira's workshop module ported BY HAND (ADR-106: grammar is copied onto this
 * surface's ramp, never imported across repos). Three tabs on one rail: RUN
 * shows what goes in and what comes out, with the checks marked on the
 * picture; SKILL shows the folder at a glance; EVALS shows how strictly each
 * rule holds and the cases on file. The rail of named checks stays beside all
 * three, because it is what joins them: pick a check and everything that is
 * not part of it dims.
 *
 * ⚠ A CHECK RETURNS A STATE, NEVER A SCORE, and the three are told apart by
 * SHAPE inside the one accent: an outline holds, a dashed outline wants a
 * person, a filled chip stops the work. No traffic light, and never green,
 * which on this surface is the board's word for the human.
 *
 * ⚠ THE FIRST RENDER IS THE FINISHED RUN of the first input — what the server
 * sends, what no-JS and reduced motion read, what paper prints. There is no
 * run button and no idle state: the workshop's "press run" is a room's beat,
 * and a proposal shows the result. State changes only in callbacks.
 *
 * ⚠ THE CHROME IS THE RENDERER'S (`bench/benchChrome.ts`), walked by its own
 * test; the record authors only what its own checker does.
 *
 * ⚠ ATTRIBUTES ARE `data-bench-*`, NEVER `data-arc-*` — the reveal/terminal
 * seam is measured on the latter (`arc-terminal-markup`).
 */

/** Dimmed when a check is picked and this is not part of it. */
const dim = (focus: string, checks: readonly string[]) =>
  focus !== "" && !checks.includes(focus) ? "true" : undefined;

function Marked({ input, focus }: { input: ArcBenchInput; focus: string }) {
  const o = input.output;
  if (o.kind === "image") {
    return (
      <span
        className="arc-bench__picture"
        style={{ aspectRatio: `${o.image.width} / ${o.image.height}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- the arc plates' rule: a plain img, the file already web weight */}
        <img src={o.image.src} alt={o.image.alt} width={o.image.width} height={o.image.height} />
        {o.regions.map((r) => (
          <span
            key={r.label}
            className="arc-bench__region"
            data-dim={dim(focus, [r.check])}
            style={{
              left: `${r.left}%`,
              top: `${r.top}%`,
              width: `${r.width}%`,
              height: `${r.height}%`,
            }}
          >
            <span className="arc-bench__region-label">{r.label}</span>
          </span>
        ))}
      </span>
    );
  }
  /* Cut the text at its marks, in the order they occur. */
  const cuts = o.marks
    .map((m) => ({ m, at: o.text.indexOf(m.span) }))
    .filter((c) => c.at >= 0)
    .sort((a, b) => a.at - b.at);
  const parts: React.ReactNode[] = [];
  let from = 0;
  for (const { m, at } of cuts) {
    if (at < from) continue;
    parts.push(o.text.slice(from, at));
    parts.push(
      <mark
        key={m.span}
        className="arc-bench__mark"
        data-bench-state={m.state}
        data-dim={dim(focus, [m.check])}
      >
        {m.span}
      </mark>
    );
    from = at + m.span.length;
  }
  parts.push(o.text.slice(from));
  return <span className="arc-bench__text">{parts}</span>;
}

export function ArcBench({ section, index, motion = "reveal" }: ArcBenchProps) {
  const ex = section.example;
  const [tab, setTab] = useState<BenchTab>("run");
  const [k, setK] = useState(0);
  const [focus, setFocus] = useState("");
  const input = ex.inputs[Math.min(k, ex.inputs.length - 1)] ?? ex.inputs[0]!;
  const tabId = (t: BenchTab) => `${section.id}-tab-${t}`;
  const panelId = (t: BenchTab) => `${section.id}-panel-${t}`;

  /* Arrow keys walk the tablist; Enter and Space are the button's own. */
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const i = BENCH_TABS.findIndex((t) => t.id === tab);
    const n = BENCH_TABS.length;
    const next = BENCH_TABS[(i + (event.key === "ArrowRight" ? 1 : n - 1)) % n];
    if (!next) return;
    event.preventDefault();
    setTab(next.id);
    event.currentTarget.querySelector<HTMLButtonElement>(`#${tabId(next.id)}`)?.focus();
  };

  return (
    <ArcBeat
      id={section.id}
      kind="bench"
      className="arc-section arc-sec arc-sec--bench"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="bench"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <figure
          className="arc-bench arc-reveal"
          data-bench-tab={tab}
          data-bench-input={k}
          {...(focus ? { "data-bench-focus": focus } : null)}
          {...rung(motion, 0.12, 0)}
        >
          <div className="arc-bench__bar">
            <div
              className="arc-bench__tabs"
              role="tablist"
              aria-label={BENCH_TABLIST_LABEL}
              onKeyDown={onTabKey}
            >
              {BENCH_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={tabId(t.id)}
                  className="arc-bench__tab"
                  aria-selected={t.id === tab}
                  aria-controls={panelId(t.id)}
                  tabIndex={t.id === tab ? 0 : -1}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="arc-bench__task">{ex.task}</p>
          </div>

          <div className="arc-bench__body">
            <div className="arc-bench__main">
              {/* RUN: what goes in, and what comes back. */}
              <div
                className="arc-bench__panel"
                data-panel="run"
                role="tabpanel"
                id={panelId("run")}
                aria-labelledby={tabId("run")}
                hidden={tab !== "run"}
              >
                <div className="arc-bench__pane" data-pane="input">
                  <span className="arc-bench__flag">{BENCH_PANES.input}</span>
                  {ex.inputs.length > 1 ? (
                    <div className="arc-bench__inputs" role="group" aria-label={BENCH_INPUTS_LABEL}>
                      {ex.inputs.map((inp, i) => (
                        <button
                          key={inp.id}
                          type="button"
                          className="arc-bench__input"
                          aria-pressed={i === k}
                          onClick={() => {
                            setK(i);
                            setFocus("");
                          }}
                        >
                          {inp.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <p className="arc-bench__brief">{input.brief}</p>
                </div>
                <div className="arc-bench__pane" data-pane="output">
                  <span className="arc-bench__flag">{BENCH_PANES.output}</span>
                  {/* Every input's output is in the page, so a picture is never
                      first asked for on a click; the figure says which shows. */}
                  {ex.inputs.map((inp, i) => (
                    <div key={inp.id} className="arc-bench__out" hidden={i !== k}>
                      <Marked input={inp} focus={i === k ? focus : ""} />
                      {inp.output.kind === "text" && inp.output.marks.length > 0 ? (
                        <ul className="arc-bench__notes">
                          {inp.output.marks.map((m) => (
                            <li
                              key={m.span}
                              className="arc-bench__noteline"
                              data-bench-state={m.state}
                              data-dim={dim(i === k ? focus : "", [m.check])}
                            >
                              {m.note}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* SKILL: the folder, at a glance. */}
              <div
                className="arc-bench__panel"
                data-panel="skill"
                role="tabpanel"
                id={panelId("skill")}
                aria-labelledby={tabId("skill")}
                hidden={tab !== "skill"}
              >
                <div className="arc-bench__skill">
                  <span className="arc-bench__flag">{BENCH_PANES.folder}</span>
                  <span className="arc-bench__folder">{ex.skill.folder}</span>
                  <ul className="arc-bench__tree">
                    {ex.skill.files.map((f) => (
                      <li
                        key={f.name}
                        className="arc-bench__file"
                        {...(f.missing ? { "data-bench-missing": "true" } : null)}
                      >
                        <span className="arc-bench__filename">{f.name}</span>
                        <span className="arc-bench__fileline">{f.line}</span>
                        {f.image ? (
                          <span
                            className="arc-bench__thumb"
                            style={{ aspectRatio: `${f.image.width} / ${f.image.height}` }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- same rule as the picture */}
                            <img
                              src={f.image.src}
                              alt={f.image.alt}
                              width={f.image.width}
                              height={f.image.height}
                            />
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* EVALS: how strictly each rule holds, and the cases on file. */}
              <div
                className="arc-bench__panel"
                data-panel="evals"
                role="tabpanel"
                id={panelId("evals")}
                aria-labelledby={tabId("evals")}
                hidden={tab !== "evals"}
              >
                <div className="arc-bench__strict">
                  <span className="arc-bench__flag">{BENCH_PANES.strict}</span>
                  {(["fixed", "adapt", "free"] as const).map((band) => {
                    const rules = ex.rules.filter((r) => r.band === band);
                    if (rules.length === 0) return null;
                    return (
                      <div key={band} className="arc-bench__band" data-bench-band={band}>
                        <span className="arc-bench__bandhead">
                          <span className="arc-bench__bandlabel">{BENCH_BANDS[band].label}</span>
                          <span className="arc-bench__bandline">{BENCH_BANDS[band].line}</span>
                        </span>
                        <ul className="arc-bench__rules">
                          {rules.map((r) => (
                            <li
                              key={r.line}
                              className="arc-bench__rule"
                              data-dim={dim(focus, r.check ? [r.check] : [])}
                            >
                              <span className="arc-bench__ruleline">{r.line}</span>
                              {r.check ? (
                                <span className="arc-bench__usedby">
                                  {ex.checks.find((c) => c.id === r.check)?.label}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
                <div className="arc-bench__cases">
                  <span className="arc-bench__flag">{BENCH_PANES.cases}</span>
                  {ex.cases.map((c) => (
                    <div key={c.id} className="arc-bench__case" data-dim={dim(focus, c.checks)}>
                      {c.expect ? (
                        <span className="arc-bench__expect" data-bench-state={c.expect}>
                          {BENCH_EXPECTS[c.expect]}
                        </span>
                      ) : null}
                      <span className="arc-bench__casehead">{c.label}</span>
                      {c.quote ? <span className="arc-bench__quote">{c.quote}</span> : null}
                      <span className="arc-bench__caseline">{c.line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* THE RAIL: the named checks, their states, the verdict. */}
            <div className="arc-bench__rail">
              <span className="arc-bench__flag">{BENCH_PANES.rail}</span>
              <ul className="arc-bench__checks">
                {ex.checks.map((c) => {
                  const r = input.results.find((x) => x.check === c.id);
                  return (
                    <li key={c.id} className="arc-bench__check" data-bench-state={r?.state}>
                      <button
                        type="button"
                        className="arc-bench__checkbtn"
                        aria-pressed={focus === c.id}
                        onClick={() => setFocus((now) => (now === c.id ? "" : c.id))}
                      >
                        <span className="arc-bench__checklabel">{c.label}</span>
                        {r ? (
                          <span className="arc-bench__chip" data-bench-state={r.state}>
                            {BENCH_STATE_LABEL[r.state]}
                          </span>
                        ) : null}
                        <span className="arc-bench__checknote">{r?.note ?? c.line}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="arc-bench__verdict" data-bench-state={input.verdict.state}>
                <span className="arc-bench__verdictlabel">{input.verdict.label}</span>
                <span className="arc-bench__verdictline">{input.verdict.line}</span>
                {input.actions.length > 0 ? (
                  <>
                    <span className="arc-bench__flag arc-bench__flag--actions">
                      {BENCH_PANES.actions}
                    </span>
                    <ul className="arc-bench__actions">
                      {input.actions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <figcaption className="arc-bench__record">{ex.record}</figcaption>
        </figure>
      </div>
    </ArcBeat>
  );
}
