import type { ArcGuide as ArcGuideBody, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

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
 * ArcGuide — one beat of a setup guide (ADR-151 U1), in one of four views,
 * each its own drawing so no two beats on the page read alike:
 *
 *   overview   one drawing (U3): the spine from the repository through the
 *              lit Claude node to the surfaces, the loop back under it
 *              through the connector, and the words under the drawing
 *   checklist  the phases side by side; every step a link to where it is done
 *   matrix     every key against every place it could live
 *   pipeline   the stations a remark passes, a person's green, a machine's gold
 *
 * ⚠ SERVER, NO STATE, DOM ONLY. `data-guide-*`; the arrows are 1px DOM with
 * CSS heads (ADR-068 U6), and every view reads whole without JS.
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
        <div
          className="arc-guide arc-reveal"
          data-guide-view={guide.view}
          {...rung(motion, 0.14)}
        >
          <GuideBody guide={guide} />
        </div>
      </div>
    </ArcBeat>
  );
}

function GuideBody({ guide }: { guide: ArcGuideBody }) {
  switch (guide.view) {
    case "overview":
      return <GuideOverview guide={guide} />;
    case "checklist":
      return <GuideChecklist guide={guide} />;
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

/* ── The overview (U3): one drawing, the words under it ──────────── */

function GuideOverview({ guide }: { guide: Extract<ArcGuideBody, { view: "overview" }> }) {
  const { repo, org, surfaces, service, columns, foot, alt } = guide;
  return (
    <div className="arc-guide-ov">
      <figure className="arc-guide-flow" role="img" aria-label={alt}>
        {/* The spine, its word, and the fan: lines are DOM (ADR-068 U6). */}
        <span className="arc-guide-flow__spine" data-guide-seg="in" aria-hidden="true">
          <i>{org.sync}</i>
        </span>
        <span className="arc-guide-flow__spine" data-guide-seg="out" aria-hidden="true" />
        <span className="arc-guide-flow__bus" aria-hidden="true" />
        <span className="arc-guide-flow__loop" aria-hidden="true" />

        <div className="arc-guide-flow__repo">
          <span className="arc-guide-flow__label">{repo.label}</span>
          <ol className="arc-guide-flow__strata">
            {repo.strata.map((st) => (
              <li key={st.tag}>
                <span className="arc-guide-flow__tag">{st.tag}</span>
                <span className="arc-guide-flow__sname">{st.name}</span>
              </li>
            ))}
          </ol>
          <span className="arc-guide-flow__name">{repo.name}</span>
        </div>

        <div className="arc-guide-flow__org">
          <span className="arc-guide-flow__label">{org.label}</span>
          <span className="arc-guide-flow__chip">{org.name}</span>
        </div>

        <div className="arc-guide-flow__surfaces">
          <span className="arc-guide-flow__label">{surfaces.label}</span>
          <ul>
            {surfaces.items.map((it) => (
              <li key={it.name}>
                <span className="arc-guide-flow__stub" aria-hidden="true" />
                <span className="arc-guide-flow__glyph" aria-hidden="true">
                  {it.glyph}
                </span>
                {it.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="arc-guide-flow__service" data-guide-pending={service.state ? "" : undefined}>
          <span className="arc-guide-flow__label">{service.label}</span>
          <span className="arc-guide-flow__sv">{service.name}</span>
          <span className="arc-guide-flow__sline">{service.line}</span>
          {service.state ? <span className="arc-guide__state">{service.state}</span> : null}
        </div>
      </figure>

      <ol className="arc-guide-ov__cols">
        {columns.map((c) => (
          <li key={c.tab}>
            <span className="arc-guide-ov__tab">{c.tab}</span>
            <h3 className="arc-guide-ov__title">{c.title}</h3>
            <p className="arc-guide-ov__line">{c.line}</p>
          </li>
        ))}
      </ol>
      {foot?.length ? (
        <ul className="arc-guide-ov__foot">
          {foot.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ── The checklist ────────────────────────────────────────────────── */

function GuideChecklist({ guide }: { guide: Extract<ArcGuideBody, { view: "checklist" }> }) {
  return (
    <div className="arc-guide-list" style={{ ["--guide-phases" as string]: guide.phases.length }}>
      {guide.phases.map((phase, p) => (
        <section key={phase.id} className="arc-guide-list__phase" data-guide-phase={phase.id}>
          <header className="arc-guide-list__phead">
            <span className="arc-guide-list__plabel">
              {p + 1} · {phase.label}
            </span>
            <span className="arc-guide-list__pwhen">{phase.when}</span>
          </header>
          <ol className="arc-guide-list__rows">
            {phase.steps.map((step) => (
              <li
                key={step.id}
                className="arc-guide-list__row"
                data-guide-done={step.done ? "" : undefined}
              >
                <span className="arc-guide-list__box" aria-hidden="true" />
                <div className="arc-guide-list__what">
                  {step.href ? (
                    <a
                      className="arc-guide-list__title"
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {step.title}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  ) : (
                    <span className="arc-guide-list__title">{step.title}</span>
                  )}
                  <p className="arc-guide-list__line">
                    {step.who ? <span className="arc-guide-list__who">{step.who} · </span> : null}
                    {step.line}
                    {step.done ? (
                      <span className="arc-guide-list__done">
                        {" "}
                        {guide.labels.done} {step.done}
                      </span>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/* ── The matrix ───────────────────────────────────────────────────── */

function GuideMatrix({ guide }: { guide: Extract<ArcGuideBody, { view: "matrix" }> }) {
  const { places, keys, labels } = guide;
  return (
    <div className="arc-guide-mx" style={{ ["--guide-cols" as string]: places.length }}>
      <div className="arc-guide-mx__head" aria-hidden="true">
        <span className="arc-guide-mx__corner">{labels.key}</span>
        {places.map((pl) => (
          <span key={pl.id} className="arc-guide-mx__place" data-guide-never={pl.never ? "" : undefined}>
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
  );
}

/* ── The pipeline ─────────────────────────────────────────────────── */

function GuidePipeline({ guide }: { guide: Extract<ArcGuideBody, { view: "pipeline" }> }) {
  const { stations, close, labels, state } = guide;
  return (
    <div className="arc-guide-pipe">
      <div className="arc-guide-pipe__key">
        <span data-guide-by="person">{labels.person}</span>
        <span data-guide-by="machine">{labels.machine}</span>
        {state ? <span className="arc-guide__state">{state}</span> : null}
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
    </div>
  );
}
