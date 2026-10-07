import type { ReactNode } from "react";

import type { ArcGuide as ArcGuideBody, ArcGuidePanel, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcGuideProps {
  section: ArcSectionOf<"guide">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcGuide — one beat of a setup guide (ADR-151), in one of four views on
 * ONE system (U5): every figure is a PANEL, a hairline frame with its label
 * set into the top edge, the way Linear's enterprise diagram is drawn; one
 * panel per figure is lit; a diagram's contents are mono, the words beside
 * it sans.
 *
 *   system    the words on the left, the flow down the page on the right,
 *             panel inside panel, the return path drawn back up
 *   tools     the setup clustered per tool, every step a link to its page
 *   matrix    every key against every place it could live
 *   pipeline  the stations a remark passes, a person's green, a machine's gold
 *
 * ⚠ SERVER, NO STATE, DOM ONLY. `data-guide-*`; every line is DOM (ADR-068
 * U6), and every view reads whole without JS.
 */
export function ArcGuide({ section, index, motion = "reveal" }: ArcGuideProps) {
  const { guide } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="guide"
      className={`arc-section arc-sec arc-sec--guide arc-sec--guide-${guide.view}`}
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="guide"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-guide arc-reveal" data-guide-view={guide.view} {...rung(motion, 0.14)}>
          <GuideBody guide={guide} />
        </div>
      </div>
    </ArcBeat>
  );
}

function GuideBody({ guide }: { guide: ArcGuideBody }) {
  switch (guide.view) {
    case "system":
      return <GuideSystem guide={guide} />;
    case "tools":
      return <GuideTools guide={guide} />;
    case "matrix":
      return <GuideMatrix guide={guide} />;
    case "pipeline":
      return <GuidePipeline guide={guide} />;
    default: {
      const exhaustive: never = guide;
      return exhaustive;
    }
  }
}

/* ── The panel: the one frame every figure is drawn with ──────────── */

function Panel({
  label,
  lit,
  state,
  className,
  children,
}: {
  label: string;
  lit?: boolean;
  state?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`arc-guide-panel${lit ? " arc-guide-panel--lit" : ""}${className ? ` ${className}` : ""}`}
      data-guide-pending={state ? "" : undefined}
    >
      <span className="arc-guide-panel__label">{label}</span>
      {state ? <span className="arc-guide-panel__state">{state}</span> : null}
      {children}
    </div>
  );
}

/* ── The system ───────────────────────────────────────────────────── */

function SystemPanel({ panel }: { panel: ArcGuidePanel }) {
  return (
    <Panel label={panel.label} lit={panel.lit} state={panel.state}>
      {panel.name ? <span className="arc-guide-panel__name">{panel.name}</span> : null}
      {panel.line ? <span className="arc-guide-panel__line">{panel.line}</span> : null}
      {panel.items?.length ? (
        <ul className="arc-guide-panel__items">
          {panel.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      ) : null}
      {panel.child ? <SystemPanel panel={panel.child} /> : null}
    </Panel>
  );
}

function GuideSystem({ guide }: { guide: Extract<ArcGuideBody, { view: "system" }> }) {
  const { paragraphs, stack, between, back, alt } = guide;
  return (
    <div className="arc-guide-sys">
      <div className="arc-guide-sys__text">
        {paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <figure className="arc-guide-sys__fig" role="img" aria-label={alt}>
        {back ? (
          <span className="arc-guide-sys__back" aria-hidden="true">
            <i>{back}</i>
          </span>
        ) : null}
        {stack.map((panel, i) => (
          <div key={panel.label} className="arc-guide-sys__node">
            <SystemPanel panel={panel} />
            {i < stack.length - 1 ? (
              <span className="arc-guide-sys__arrow" aria-hidden="true">
                <i>{between[i]}</i>
              </span>
            ) : null}
          </div>
        ))}
      </figure>
    </div>
  );
}

/* ── The tools ────────────────────────────────────────────────────── */

function GuideTools({ guide }: { guide: Extract<ArcGuideBody, { view: "tools" }> }) {
  return (
    <div className="arc-guide-tools" style={{ ["--guide-n" as string]: guide.tools.length }}>
      {guide.tools.map((tool) => (
        <Panel key={tool.id} label={tool.label} state={tool.state} className="arc-guide-tool">
          <span className="arc-guide-tool__role">{tool.role}</span>
          <p className="arc-guide-tool__what">{tool.what}</p>
          <ol className="arc-guide-tool__steps">
            {tool.steps.map((step) => (
              <li
                key={step.id}
                className="arc-guide-step"
                data-guide-done={step.done ? "" : undefined}
              >
                <span className="arc-guide-step__box" aria-hidden="true" />
                <div>
                  {step.href ? (
                    <a
                      className="arc-guide-step__title"
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {step.title}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  ) : (
                    <span className="arc-guide-step__title">{step.title}</span>
                  )}
                  {step.line || step.done ? (
                    <p className="arc-guide-step__line">
                      {step.line}
                      {step.done ? (
                        <span className="arc-guide-step__done">
                          {step.line ? " " : ""}
                          {guide.labels.done} {step.done}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      ))}
    </div>
  );
}

/* ── The matrix ───────────────────────────────────────────────────── */

function GuideMatrix({ guide }: { guide: Extract<ArcGuideBody, { view: "matrix" }> }) {
  const { places, keys, labels } = guide;
  return (
    <Panel label={guide.label} className="arc-guide-mx">
      <div className="arc-guide-mx__grid" style={{ ["--guide-cols" as string]: places.length }}>
        <div className="arc-guide-mx__head" aria-hidden="true">
          <span className="arc-guide-mx__corner">{labels.key}</span>
          {places.map((pl) => (
            <span
              key={pl.id}
              className="arc-guide-mx__place"
              data-guide-never={pl.never ? "" : undefined}
            >
              {pl.name}
            </span>
          ))}
        </div>
        <ul className="arc-guide-mx__rows">
          {keys.map((k) => (
            <li key={k.id} className="arc-guide-mx__row">
              <div className="arc-guide-mx__key">
                <h3 className="arc-guide-mx__name">{k.name}</h3>
                <p className="arc-guide-mx__line">{k.line}</p>
                <p className="arc-guide-mx__who">{k.who}</p>
              </div>
              {places.map((pl, i) => {
                const lives = i === k.at;
                return (
                  <span
                    key={pl.id}
                    className="arc-guide-mx__cell"
                    data-guide-cell={lives ? "lives" : pl.never ? "never" : "empty"}
                  >
                    <span className="arc-guide-mx__mark" aria-hidden="true" />
                    <span className="arc-guide-mx__sr">
                      {pl.name}: {lives ? labels.lives : pl.never ? labels.never : "–"}
                    </span>
                  </span>
                );
              })}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/* ── The pipeline ─────────────────────────────────────────────────── */

function GuidePipeline({ guide }: { guide: Extract<ArcGuideBody, { view: "pipeline" }> }) {
  const { stations, close, labels, state } = guide;
  return (
    <Panel label={guide.label} state={state} className="arc-guide-pipe">
      <div className="arc-guide-pipe__key">
        <span data-guide-by="person">{labels.person}</span>
        <span data-guide-by="machine">{labels.machine}</span>
      </div>
      <ol className="arc-guide-pipe__rail" style={{ ["--guide-n" as string]: stations.length }}>
        {stations.map((st, i) => (
          <li key={st.id} className="arc-guide-pipe__stn" data-guide-by={st.by}>
            <span className="arc-guide-pipe__node" aria-hidden="true">
              {i + 1}
            </span>
            <span className="arc-guide-pipe__actor">{st.actor}</span>
            <h3 className="arc-guide-pipe__title">{st.title}</h3>
            <p className="arc-guide-pipe__line">{st.line}</p>
          </li>
        ))}
      </ol>
      <p className="arc-guide-pipe__close">
        <span aria-hidden="true">↺</span> {close}
      </p>
    </Panel>
  );
}
