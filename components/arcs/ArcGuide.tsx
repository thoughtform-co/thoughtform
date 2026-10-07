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
 *   map        the system as nested frames, numbered pins, and a legend where
 *              the TERM is the large type and its meaning the small
 *   checklist  phases of ruled rows: number, step, who, the menu path
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
    case "map":
      return <GuideMap guide={guide} />;
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

const Pin = ({ n }: { n: number }) => (
  <span className="arc-guide__pin" aria-hidden="true">
    {n}
  </span>
);

/* ── The map ──────────────────────────────────────────────────────── */

function GuideMap({ guide }: { guide: Extract<ArcGuideBody, { view: "map" }> }) {
  const { repo, org, team, service, arrows, terms, alt } = guide;
  const mk = repo.marketplace;
  return (
    <div className="arc-guide-map">
      <figure className="arc-guide-map__fig" role="img" aria-label={alt}>
        <div className="arc-guide-map__row">
          <div className="arc-guide-map__frame" data-guide-frame="repo">
            <FrameHead frame={repo} />
            <div className="arc-guide-map__frame" data-guide-frame="marketplace">
              <FrameHead frame={mk} />
              {mk.plugins.map((p) => (
                <div key={p.name} className="arc-guide-map__frame" data-guide-frame="plugin">
                  <FrameHead frame={p} />
                  <div className="arc-guide-map__skills">
                    <Pin n={p.skills.pin} />
                    <ul>
                      {p.skills.names.map((s) => (
                        <li key={s}>
                          <code>{s}</code>
                        </li>
                      ))}
                      {p.skills.more ? <li className="arc-guide-map__more">{p.skills.more}</li> : null}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Arrow word={arrows.sync} />

          <div className="arc-guide-map__frame" data-guide-frame="org">
            <FrameHead frame={org} />
            <p className="arc-guide-map__line">{org.line}</p>
          </div>

          <Arrow word={arrows.reach} />

          <div className="arc-guide-map__frame" data-guide-frame="team">
            <div className="arc-guide-map__fhead">
              <span className="arc-guide-map__label">{team.label}</span>
              <span className="arc-guide-map__name">{team.name}</span>
            </div>
            <ul className="arc-guide-map__surfaces">
              {team.surfaces.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="arc-guide-map__return">
          <span className="arc-guide-map__rword" data-guide-arrow="issue">
            {arrows.issue}
          </span>
          <div className="arc-guide-map__frame" data-guide-frame="service">
            <FrameHead frame={service} />
            <p className="arc-guide-map__line">{service.line}</p>
            {service.state ? <span className="arc-guide__state">{service.state}</span> : null}
          </div>
          <span className="arc-guide-map__rword" data-guide-arrow="remark">
            {arrows.remark}
          </span>
        </div>
      </figure>

      <ol className="arc-guide-map__legend">
        {terms.map((t) => (
          <li key={t.n}>
            <Pin n={t.n} />
            <div>
              <h3 className="arc-guide-map__term">{t.term}</h3>
              <p className="arc-guide-map__def">{t.line}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FrameHead({ frame }: { frame: { pin: number; label: string; name: string } }) {
  return (
    <div className="arc-guide-map__fhead">
      <Pin n={frame.pin} />
      <span className="arc-guide-map__label">{frame.label}</span>
      <span className="arc-guide-map__name">{frame.name}</span>
    </div>
  );
}

function Arrow({ word }: { word: string }) {
  return (
    <div className="arc-guide-map__arrow" aria-hidden="true">
      <span>{word}</span>
      <i />
    </div>
  );
}

/* ── The checklist ────────────────────────────────────────────────── */

function GuideChecklist({ guide }: { guide: Extract<ArcGuideBody, { view: "checklist" }> }) {
  return (
    <div className="arc-guide-list">
      {guide.phases.map((phase, p) => (
        <section key={phase.id} className="arc-guide-list__phase" data-guide-phase={phase.id}>
          <header className="arc-guide-list__phead">
            <span className="arc-guide-list__plabel">{phase.label}</span>
            <span className="arc-guide-list__pwhen">{phase.when}</span>
          </header>
          <ol className="arc-guide-list__rows">
            {phase.steps.map((step, s) => (
              <li key={step.id} className="arc-guide-list__row" data-guide-done={step.done ? "" : undefined}>
                <span className="arc-guide-list__n">
                  {p + 1}.{s + 1}
                </span>
                <div className="arc-guide-list__what">
                  <h3 className="arc-guide-list__title">{step.title}</h3>
                  <p className="arc-guide-list__line">{step.line}</p>
                </div>
                <dl className="arc-guide-list__meta">
                  <div>
                    <dt>{guide.labels.who}</dt>
                    <dd className="arc-guide-list__who">{step.who}</dd>
                  </div>
                  {step.where ? (
                    <div>
                      <dt>{guide.labels.where}</dt>
                      <dd>
                        <span className="arc-guide-list__path">
                          {step.where.map((crumb, c) => (
                            <span key={crumb + c}>{crumb}</span>
                          ))}
                        </span>
                      </dd>
                    </div>
                  ) : null}
                  {step.done ? (
                    <div>
                      <dt>{guide.labels.done}</dt>
                      <dd className="arc-guide-list__done">{step.done}</dd>
                    </div>
                  ) : null}
                </dl>
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
